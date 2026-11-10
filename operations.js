(() => {
  const DURATION = 5000;
  const token = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function offer(kind, item, actorId, now = Date.now()) {
    item.undoToken = token();
    item.createdById = actorId;
    return { kind, id: item.id, actorId, token: item.undoToken, expiresAt: now + DURATION };
  }
  function annulCreation(db, actor, operation, now = Date.now()) {
    const permission = operation?.kind === 'record' ? 'records:create' : 'plans:create';
    const canonical = window.NOTARE_BUSINESS.profiles(db).find(profile => profile.id === actor?.id);
    if (!canonical?.permissions.includes(permission) || operation.actorId !== actor.id) throw new Error('Esta criação só pode ser desfeita pelo perfil que a realizou.');
    if (!Number.isFinite(operation.expiresAt) || now >= operation.expiresAt) throw new Error('O prazo para desfazer esta criação terminou.');
    if (!['record', 'plan'].includes(operation.kind)) throw new Error('Operação não disponível para desfazer.');
    const item = (operation.kind === 'record' ? db.records : db.plans).find(row => row.id === operation.id);
    if (!item || item.voidedAt || item.createdById !== actor.id || !item.undoToken || item.undoToken !== operation.token) throw new Error('Esta criação não está mais disponível para desfazer.');
    if (!window.NOTARE_BUSINESS.scopedStudents(db, canonical).some(student => student.id === item.studentId)) throw new Error('Estudante fora do escopo deste perfil.');
    if (operation.kind === 'plan' && (item.status !== 'active' || item.completedAt)) throw new Error('O plano já teve continuidade. A criação não pode mais ser desfeita.');
    const messages = operation.kind === 'plan' ? db.business.messages.filter(message => message.sourcePlanId === item.id) : [];
    if (messages.some(message => message.readAt || message.reply || message.repliedAt)) throw new Error('O comunicado do plano já foi lido ou respondido. O histórico foi preservado e a criação não pode mais ser desfeita.');
    // Todas as condições são verificadas antes de alterar qualquer objeto.
    const at = new Date(now).toISOString();
    const metadata = { voidedAt: at, voidedById: actor.id, voidReason: 'Criação desfeita pelo autor.' };
    Object.assign(item, metadata);
    if (operation.kind === 'plan') {
      item.status = 'cancelled';
      db.agenda.filter(entry => entry.sourcePlanId === item.id).forEach(entry => Object.assign(entry, metadata, { status: 'cancelled' }));
      messages.forEach(message => Object.assign(message, { cancelledAt: at, cancelledById: actor.id }));
    }
    const label = operation.kind === 'plan' ? 'Plano de ação' : 'Registro';
    const student = db.students.find(student => student.id === item.studentId);
    student.timeline.unshift([new Intl.DateTimeFormat('pt-BR').format(new Date(now)), `${label}: criação anulada por ${actor.name}.${messages.length ? ' Comunicado vinculado retirado antes da leitura.' : ''}`]);
    db.business.history.unshift({ id: token(), actorId: actor.id, at, targetId: item.id, action: 'annul-creation', description: `${label}: criação anulada por ${actor.name}. Conteúdo original preservado.` });
    return item;
  }
  function reviewOffer(db, actor, offerId, approved, reason = '', now = Date.now()) {
    const item=db.business.offers.find(offer=>offer.id===offerId);
    if(!item)throw new Error('Oferta não encontrada.');
    const before=JSON.parse(JSON.stringify(item));
    const redemptionIds=db.business.redemptions.filter(r=>r.offerId===offerId).map(r=>r.id);
    window.NOTARE_BUSINESS.reviewOffer(db,actor,offerId,approved,reason);
    item.reviewUndoToken=token();
    return {kind:'offer-review',id:offerId,actorId:actor.id,token:item.reviewUndoToken,before,after:JSON.parse(JSON.stringify(item)),redemptionIds,reviewEventId:db.business.history[0].id,expiresAt:now+DURATION};
  }
  function undoOfferReview(db, actor, operation, now = Date.now()) {
    const canonical=window.NOTARE_BUSINESS.profiles(db).find(profile=>profile.id===actor?.id);
    if(!canonical?.permissions.includes('partners:review')||operation?.actorId!==canonical.id||operation.kind!=='offer-review')throw new Error('Esta revisão só pode ser desfeita pelo perfil que a realizou.');
    if(!Number.isFinite(operation.expiresAt)||now>=operation.expiresAt)throw new Error('O prazo para desfazer esta revisão terminou.');
    const item=db.business.offers.find(offer=>offer.id===operation.id);
    if(!item||item.reviewUndoToken!==operation.token||JSON.stringify(item)!==JSON.stringify(operation.after))throw new Error('A oferta mudou após a revisão. O histórico foi preservado.');
    if(db.business.partners.find(p=>p.id===item.partnerId)?.status==='ended')throw new Error('A parceria foi encerrada após a revisão. O histórico foi preservado.');
    if(db.business.redemptions.some(r=>r.offerId===item.id&&!operation.redemptionIds.includes(r.id)))throw new Error('Um voucher foi emitido após a aprovação. Esta revisão não pode mais ser desfeita.');
    const reviewedStatus=item.status,reviewedReason=item.reviewReason||'';
    Object.keys(item).forEach(key=>delete item[key]);Object.assign(item,JSON.parse(JSON.stringify(operation.before)));
    db.business.history.unshift({id:token(),actorId:canonical.id,at:new Date(now).toISOString(),action:'undo-offer-review',targetId:item.id,reviewEventId:operation.reviewEventId,reviewedStatus,reviewedReason,restoredStatus:item.status,description:'Revisão de oferta desfeita pelo autor. Decisão original e justificativa preservadas no histórico.'});
    return item;
  }
  const partnerRelatedState = (db, partnerId) => ({
    offers: db.business.offers.filter(item=>item.partnerId===partnerId),
    redemptions: db.business.redemptions.filter(item=>item.partnerId===partnerId)
  });
  function endPartner(db, actor, partnerId, reason, now = Date.now()) {
    const partner=db.business.partners.find(item=>item.id===partnerId);
    if(!partner)throw new Error('Parceiro não encontrado.');
    const before=JSON.parse(JSON.stringify(partner));
    window.NOTARE_BUSINESS.endPartner(db,actor,partnerId,reason);
    partner.endUndoToken=token();
    return {kind:'partner-end',id:partnerId,actorId:actor.id,token:partner.endUndoToken,before,after:JSON.parse(JSON.stringify(partner)),related:JSON.stringify(partnerRelatedState(db,partnerId)),endEvent:JSON.parse(JSON.stringify(db.business.history[0])),expiresAt:now+DURATION};
  }
  function undoPartnerEnd(db, actor, operation, now = Date.now()) {
    const canonical=window.NOTARE_BUSINESS.profiles(db).find(profile=>profile.id===actor?.id);
    if(!canonical?.permissions.includes('partners:review')||operation?.kind!=='partner-end'||operation.actorId!==canonical.id)throw new Error('Este encerramento só pode ser desfeito pelo perfil que o realizou.');
    if(!Number.isFinite(operation.expiresAt)||now>=operation.expiresAt)throw new Error('O prazo para desfazer este encerramento terminou.');
    const partner=db.business.partners.find(item=>item.id===operation.id);
    if(!partner||partner.status!=='ended'||!partner.endUndoToken||partner.endUndoToken!==operation.token||operation.before?.id!==partner.id||JSON.stringify(partner)!==JSON.stringify(operation.after))throw new Error('A parceria mudou após o encerramento ou a reversão já foi executada. Nenhuma alteração foi realizada.');
    if(JSON.stringify(partnerRelatedState(db,partner.id))!==operation.related)throw new Error('As ofertas ou os vouchers desta parceria mudaram. O encerramento não pode mais ser desfeito com segurança.');
    const latestEvent=db.business.history.find(event=>event.targetId===partner.id);
    if(!operation.endEvent||JSON.stringify(latestEvent)!==JSON.stringify(operation.endEvent))throw new Error('O histórico desta parceria mudou após o encerramento. Nenhuma alteração foi realizada.');
    // Todas as verificações precedem a restauração; ofertas, vouchers e outras parcerias ficam intactos.
    const reason=partner.endedReason;
    Object.keys(partner).forEach(key=>delete partner[key]);Object.assign(partner,JSON.parse(JSON.stringify(operation.before)));
    db.business.history.unshift({id:token(),actorId:canonical.id,at:new Date(now).toISOString(),action:'undo-end-partner',targetId:partner.id,endEventId:operation.endEvent.id,reason,restoredStatus:partner.status??null,description:`Encerramento da parceria com ${partner.name} desfeito. Estado anterior restaurado; justificativa original preservada no histórico.`});
    return partner;
  }
  window.NOTARE_OPERATIONS = Object.freeze({ DURATION, offer, annulCreation, reviewOffer, undoOfferReview, endPartner, undoPartnerEnd });
})();
