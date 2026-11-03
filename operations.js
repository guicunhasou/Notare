(() => {
  const DURATION = 60000;
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
  window.NOTARE_OPERATIONS = Object.freeze({ DURATION, offer, annulCreation });
})();
