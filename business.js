(() => {
  const PLANS = Object.freeze({
    essencial: { name: 'Notare Essencial', monthly: 150000, setup: 500000 },
    acompanhamento: { name: 'Notare Acompanhamento', monthly: 250000, setup: 500000 },
    rede: { name: 'Notare Rede', monthly: 400000, setup: 500000 }
  });
  // Hipótese acadêmica local: fatores em pontos-base, sem pesquisa comercial.
  const SEGMENTS = Object.freeze({
    'Educação Infantil': 8000,
    'Ensino Fundamental': 10000,
    'Ensino Médio': 11000,
    'Educação de Jovens e Adultos': 8500,
    'Educação Profissional e Tecnológica': 12000
  });
  function quoteSubscription(db, plan, segment) {
    if (!Object.hasOwn(PLANS, plan)) throw new Error('Plano inválido.');
    if (!Object.hasOwn(SEGMENTS, segment)) throw new Error('Selecione um segmento válido.');
    return { monthly: Math.round(PLANS[plan].monthly * SEGMENTS[segment] / 10000), setup: db.business.subscription.revision === 0 ? PLANS[plan].setup : 0, pricingRevision: 1 };
  }
  const id = () => window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const stamp = () => new Date().toISOString();
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
  const date = () => new Intl.DateTimeFormat('pt-BR').format(new Date());
  function text(value, min = 1, max = 600) {
    const result = String(value || '').trim();
    if (result.length < min || result.length > max) throw new Error(`Preencha um texto entre ${min} e ${max} caracteres.`);
    return result;
  }
  function integer(value, min, max) {
    const result = Number(value);
    if (!Number.isInteger(result) || result < min || result > max) throw new Error('Informe um valor válido dentro dos limites do formulário.');
    return result;
  }
  const EXTRA_PARTNERS = [
    { id: 'vagalume', name: 'Oficina Vagalume de Papel', actor: 'parceiro-vagalume' },
    { id: 'trilha', name: 'Estúdio Trilha do Movimento', actor: 'parceiro-trilha' },
    { id: 'pontes', name: 'Casa Pontes da Leitura', actor: 'parceiro-pontes' }
  ];
  const EXTRA_OFFERS = [
    { id: 'oferta-criatividade', partnerId: 'vagalume', title: 'Encontro de criatividade em papel', category: 'Arte e aprendizagem', description: 'Encontro de 90 minutos para estudantes e um responsável, com materiais incluídos. Valor por dupla; reserva sujeita à disponibilidade. Dados de exemplo, sem inscrição externa.', conditions: 'Uma participação por família; acompanhamento de um responsável; materiais incluídos.', price: 6500, commissionRate: 500, stock: 12, expires: '2027-12-31', status: 'pending' },
    { id: 'oferta-movimento', partnerId: 'trilha', title: 'Vivência de movimento em família', category: 'Esporte e bem-estar', description: 'Atividade recreativa de 60 minutos para um estudante e um responsável. Sem avaliação ou tratamento de saúde. Dados de exemplo, sem agendamento externo.', conditions: 'Uma vivência por família; traje confortável; participação acompanhada de responsável.', price: 5000, commissionRate: 500, stock: 16, expires: '2027-12-31', status: 'pending' },
    { id: 'oferta-leitura-pontes', partnerId: 'pontes', title: 'Roda de leitura e criação de histórias', category: 'Cultura e leitura', description: 'Encontro de leitura de 75 minutos para estudantes e responsáveis, com um caderno de atividades incluído. Dados de exemplo, sem inscrição externa.', conditions: 'Um encontro por família; um estudante e um responsável; caderno incluído.', price: 4500, commissionRate: 500, stock: 14, expires: '2027-12-31', status: 'pending' }
  ];
  function addCommunityExamples(business) {
    if (business.exampleRevision >= 1) return;
    // IDs fixos e marcador único: decisões e valores existentes nunca são substituídos.
    EXTRA_PARTNERS.forEach(partner => {
      if (!business.partners.some(existing => existing.id === partner.id || existing.actor === partner.actor)) business.partners.push({ ...partner });
    });
    EXTRA_OFFERS.forEach(offer => {
      if (business.partners.some(partner => partner.id === offer.partnerId) && !business.offers.some(existing => existing.id === offer.id)) business.offers.push({ ...offer });
    });
    business.exampleRevision = 1;
  }
  function initialize(db) {
    if (db.business?.version > 1) throw new Error('Esta versão não pode alterar uma base local mais recente.');
    if (!db.business) db.business = {
      version: 1,
      subscription: { plan: 'acompanhamento', segment: 'Ensino Fundamental', status: 'active', club: true, revision: 0, activatedAt: stamp() },
      families: [{ id: 'familia-ana', name: 'Marina Souza', students: ['ana'] }, { id: 'familia-lucas', name: 'Paulo Lima', students: ['lucas'] }],
      partners: [{ id: 'papelaria', name: 'Papelaria Horizonte', actor: 'parceiro-papelaria' }, { id: 'cultura', name: 'Espaço Cultura', actor: 'parceiro-cultura' }],
      offers: [
        { id: 'oferta-material', partnerId: 'papelaria', title: 'Kit de materiais com benefício', description: 'Condição para material escolar, com valores de exemplo. Não gera atendimento externo.', price: 8000, commissionRate: 500, stock: 20, expires: '2027-12-31', status: 'approved' },
        { id: 'oferta-leitura', partnerId: 'cultura', title: 'Oficina de leitura em família', description: 'Oficina de leitura com valores de exemplo. Não gera inscrição externa.', price: 5000, commissionRate: 500, stock: 15, expires: '2027-12-31', status: 'approved' }
      ], redemptions: [], messages: [], history: [], pendingSubscription: null
    };
    addCommunityExamples(db.business);
    return db;
  }
  function profiles(db) {
    const school = db.profiles.map(profile => ({ ...profile, permissions: [...profile.permissions,
      ...(profile.permissions.includes('records:create') ? ['families:manage'] : []),
      ...(profile.id === 'direcao' ? ['subscription:manage', 'partners:review'] : [])] }));
    const family = db.business.families.map(f => ({ id: f.id, name: f.name, initials: f.name.split(' ').map(x => x[0]).join(''), role: 'Responsável familiar', description: 'Somente comunicados destinados à sua família e Clube gratuito.', scope: `family:${f.id}`, permissions: ['family:view', 'club:view'] }));
    const partner = db.business.partners.map(p => ({ id: p.actor, name: p.name, initials: p.name.split(' ').slice(0, 2).map(x => x[0]).join(''), role: 'Parceiro do Clube', description: 'Ofertas próprias e conversões, sem dados escolares.', scope: `partner:${p.id}`, permissions: ['partner:manage'] }));
    return [...school, ...family, ...partner];
  }
  function requireActor(db, actor, permission) {
    const canonical = profiles(db).find(p => p.id === actor?.id);
    if (!canonical?.permissions.includes(permission)) throw new Error('Este perfil não tem permissão para esta ação.');
    return canonical;
  }
  function scopedStudents(db, actor) {
    const p = profiles(db).find(x => x.id === actor?.id);
    if (!p) return [];
    if (p.scope.startsWith('family:')) return db.students.filter(s => db.business.families.find(f => f.id === p.id)?.students.includes(s.id));
    if (p.scope.startsWith('partner:')) return [];
    if (p.scope.startsWith('classes:') || p.scope.startsWith('class:')) {
      const classes = p.scope.slice(p.scope.indexOf(':') + 1).split('|');
      return db.students.filter(s => classes.includes(s.className));
    }
    return p.scope === 'followup' ? db.students.filter(s => s.priority !== 'estavel') : db.students;
  }
  function requireStudent(db, actor, studentId) {
    requireActor(db, actor, 'families:manage');
    const student = scopedStudents(db, actor).find(s => s.id === studentId);
    if (!student) throw new Error('Estudante fora do escopo deste perfil.');
    return student;
  }
  function event(db, actor, description) { db.business.history.unshift({ id: id(), actorId: actor.id, description, at: stamp() }); }
  function sendMessage(db, actor, studentId, body) {
    const student = requireStudent(db, actor, studentId);
    const family = db.business.families.find(f => f.students.includes(studentId));
    if (!family) throw new Error('Não há responsável configurado para este estudante.');
    const message = { id: id(), studentId, familyId: family.id, senderId: actor.id, body: text(body, 5, 600), at: stamp(), readAt: null, reply: null, repliedAt: null };
    db.business.messages.unshift(message);
    student.timeline.unshift([date(), 'Comunicado compartilhado com a família no acesso local.']);
    event(db, actor, 'Comunicado destinado ao responsável.');
    return message;
  }
  function communicationStatus(db, studentId) {
    const messages = db.business.messages.filter(m => m.studentId === studentId && !m.cancelledAt);
    const latest = messages[0];
    if (!latest) return null;
    return { count: messages.length, at: latest.repliedAt || latest.readAt || latest.at,
      label: latest.reply ? 'retorno recebido' : latest.readAt ? 'leitura confirmada; aguardando resposta' : 'aguardando retorno' };
  }
  function familyMessages(db, actor) {
    requireActor(db, actor, 'family:view');
    return db.business.messages.filter(m => m.familyId === actor.id).map(m => ({ ...m }));
  }
  function respondMessage(db, actor, messageId, reply = null) {
    requireActor(db, actor, 'family:view');
    const message = db.business.messages.find(m => m.id === messageId && m.familyId === actor.id);
    if (!message || message.cancelledAt) throw new Error('Comunicado não disponível para resposta.');
    if (reply !== null && message.reply) throw new Error('Este comunicado já recebeu uma resposta.');
    const response = reply === null ? null : text(reply, 5, 600);
    if (!message.readAt) message.readAt = stamp();
    if (response !== null) { message.reply = response; message.repliedAt = stamp(); }
    const student = db.students.find(s => s.id === message.studentId);
    if (response !== null) {
      student.contact = 'hoje · retorno recebido';
      student.timeline.unshift([date(), 'Responsável respondeu ao comunicado da escola.']);
      db.records.unshift({ id: id(), kind: 'Devolutiva', studentId: student.id, description: `Resposta familiar: ${response}`, date: date(), time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()), ownerId: actor.id, followup: true });
      event(db, actor, 'Resposta familiar registrada.');
    }
    return message;
  }
  function familySuggestion(db, actor, studentId) {
    const student = requireStudent(db, actor, studentId);
    if (!db.business.families.some(f => f.students.includes(studentId))) throw new Error('Não há responsável configurado para este estudante.');
    const communication = communicationStatus(db, studentId);
    const opening = communication?.label === 'retorno recebido' ? 'Agradecemos seu retorno. ' : '';
    const subject = Number.isFinite(student.attendance) && student.attendance < 90 ? 'o acompanhamento da frequência' : 'o acompanhamento escolar';
    return `${opening}Olá, família de ${student.name}. Gostaríamos de conversar sobre ${subject} e ouvir como podemos apoiar a rotina de estudos. Podemos combinar um horário para dialogar e definir juntos os próximos passos? Compartilhe apenas as informações necessárias por este canal. Equipe escolar.`;
  }
  function continuitySuggestion(db, actor, planId) {
    requireActor(db, actor, 'plans:create');
    const plan = db.plans.find(p => p.id === planId && !p.voidedAt && p.status !== 'done');
    if (!plan) throw new Error('Selecione um acompanhamento disponível.');
    const student = requireStudent(db, actor, plan.studentId);
    const count = db.records.filter(record => record.studentId === student.id && !record.voidedAt).length;
    const owner = profiles(db).find(p => p.id === plan.ownerId)?.name;
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(plan.date || '') ? plan.date.split('-').reverse().join('/') : plan.date;
    return `Revisar o plano “${plan.type}” de ${student.name}.${owner ? ` Responsável registrado: ${owner}.` : ''}${deadline ? ` Prazo registrado: ${deadline}.` : ''} ${count ? `Consultar os ${count} registros anteriores não anulados. ` : ''}Antes de concluir, descreva o que foi verificado, eventuais retornos e o que ainda precisa de atenção. Combine com a equipe se haverá continuidade, responsável e prazo. Não presumir melhora ou encerramento sem avaliação.`;
  }
  function proposeSubscription(db, actor, plan, segment) {
    requireActor(db, actor, 'subscription:manage');
    const quote = quoteSubscription(db, plan, segment);
    const proposal = { id: id(), plan, segment, ...quote, at: stamp() };
    db.business.pendingSubscription = proposal;
    return proposal;
  }
  function activateSubscription(db, actor, proposalId, accepted) {
    requireActor(db, actor, 'subscription:manage');
    const proposal = db.business.pendingSubscription;
    if (!accepted || !proposal || proposal.id !== proposalId) throw new Error('Revise e confirme a proposta antes de continuar.');
    Object.assign(db.business.subscription, { plan: proposal.plan, segment: proposal.segment, monthly: proposal.monthly, setup: proposal.setup, pricingRevision: proposal.pricingRevision || 0, status: 'active', revision: db.business.subscription.revision + 1, activatedAt: stamp() });
    db.business.pendingSubscription = null;
    event(db, actor, `Adesão registrada localmente: ${PLANS[proposal.plan].name}; mensalidade ${money(proposal.monthly)}; implantação ${money(proposal.setup)}. Nenhuma cobrança.`);
  }
  function cancelProposal(db, actor) { requireActor(db, actor, 'subscription:manage'); db.business.pendingSubscription = null; }
  function setClub(db, actor, enabled) { requireActor(db, actor, 'subscription:manage'); db.business.subscription.club = Boolean(enabled); event(db, actor, enabled ? 'Clube habilitado neste navegador.' : 'Clube desabilitado para novos resgates.'); }
  function createOffer(db, actor, data) {
    const profile = requireActor(db, actor, 'partner:manage');
    const expires = String(data.expires || '');
    const expiresAt = new Date(expires + 'T23:59:59');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expires) || !Number.isFinite(expiresAt.getTime()) || expiresAt < new Date() || new Date(expires + 'T12:00:00').toLocaleDateString('sv-SE') !== expires) throw new Error('Informe uma validade futura válida.');
    const offer = { id: id(), partnerId: profile.scope.slice(8), title: text(data.title, 5, 100), description: text(data.description, 10, 600), price: integer(data.price, 100, 1000000), stock: integer(data.stock, 1, 500), commissionRate: 500, expires, status: 'pending' };
    db.business.offers.unshift(offer); event(db, actor, 'Oferta submetida à avaliação institucional.'); return offer;
  }
  function reviewOffer(db, actor, offerId, approved, reason = '') {
    requireActor(db, actor, 'partners:review');
    const offer = db.business.offers.find(o => o.id === offerId);
    if (offer?.status !== 'pending') throw new Error('Somente ofertas pendentes podem ser avaliadas.');
    const rejection = approved ? '' : text(reason, 5, 300);
    offer.status = approved ? 'approved' : 'rejected'; offer.reviewReason = rejection;
    event(db, actor, approved ? 'Oferta aprovada para o Clube.' : 'Oferta recusada com justificativa.');
  }
  function toggleOffer(db, actor, offerId) {
    const profile = requireActor(db, actor, 'partner:manage');
    const offer = db.business.offers.find(o => o.id === offerId && o.partnerId === profile.scope.slice(8));
    if (!offer || !['approved', 'paused'].includes(offer.status)) throw new Error('Esta oferta não pode ser pausada ou retomada.');
    offer.status = offer.status === 'approved' ? 'paused' : 'approved';
  }
  function availableOffers(db, actor, now = new Date()) {
    requireActor(db, actor, 'club:view');
    if (db.business.subscription.status !== 'active' || !db.business.subscription.club) return [];
    return db.business.offers.filter(o => o.status === 'approved' && o.stock > 0 && new Date(o.expires + 'T23:59:59') >= now).map(o => ({ ...o, partnerName: db.business.partners.find(p => p.id === o.partnerId)?.name }));
  }
  function reserve(db, actor, offerId) {
    requireActor(db, actor, 'club:view');
    const available = availableOffers(db, actor).find(o => o.id === offerId);
    if (!available) throw new Error('Oferta indisponível, sem vagas ou expirada.');
    if (db.business.redemptions.some(r => r.familyId === actor.id && r.offerId === offerId && r.status !== 'cancelled')) throw new Error('Sua família já possui um resgate desta oferta.');
    const offer = db.business.offers.find(o => o.id === offerId);
    const redemption = { id: id(), code: 'NT-' + id().replace(/[^a-z0-9]/gi, '').slice(-10).toUpperCase(), offerId, familyId: actor.id, partnerId: offer.partnerId, title: offer.title, price: offer.price, rate: offer.commissionRate, expires: offer.expires, status: 'issued', issuedAt: stamp(), commission: 0 };
    db.business.redemptions.unshift(redemption); offer.stock -= 1; event(db, actor, 'Voucher emitido neste navegador; nenhuma compra ou comissão realizada.'); return redemption;
  }
  function cancelRedemption(db, actor, redemptionId) {
    requireActor(db, actor, 'club:view');
    const r = db.business.redemptions.find(x => x.id === redemptionId && x.familyId === actor.id);
    if (r?.status !== 'issued') throw new Error('Somente um voucher disponível pode ser cancelado.');
    r.status = 'cancelled'; r.cancelledAt = stamp();
    const offer = db.business.offers.find(o => o.id === r.offerId); if (offer) offer.stock += 1;
  }
  function partnerStatement(db, actor) {
    const p = requireActor(db, actor, 'partner:manage');
    return db.business.redemptions.filter(r => r.partnerId === p.scope.slice(8)).map(r => ({ id: r.id, code: r.code, title: r.title, price: r.price, commission: r.commission, status: r.status, expires: r.expires }));
  }
  function confirmConversion(db, actor, redemptionId) {
    const p = requireActor(db, actor, 'partner:manage');
    const r = db.business.redemptions.find(x => x.id === redemptionId && x.partnerId === p.scope.slice(8));
    if (r?.status !== 'issued' || new Date(r.expires + 'T23:59:59') < new Date()) throw new Error('Voucher inválido, cancelado, expirado ou já utilizado.');
    r.status = 'confirmed'; r.confirmedAt = stamp(); r.commission = Math.round(r.price * r.rate / 10000);
    event(db, actor, 'Conversão registrada uma única vez neste navegador; sem transação financeira.'); return r;
  }
  function completePlan(db, actor, planId, conclusion) {
    requireActor(db, actor, 'plans:create');
    const plan = db.plans.find(p => p.id === planId);
    if (!plan || plan.voidedAt || plan.status === 'done') throw new Error('Este plano não está disponível para conclusão.');
    requireStudent(db, actor, plan.studentId);
    const body = text(conclusion, 10, 600);
    plan.status = 'done'; plan.completedAt = stamp(); plan.conclusion = body;
    db.agenda.filter(a => a.sourcePlanId === planId).forEach(a => { a.status = 'done'; });
    const student = db.students.find(s => s.id === plan.studentId);
    student.timeline.unshift([date(), `Plano concluído por ${actor.name}: ${body}`]);
    db.records.unshift({ id: id(), studentId: student.id, kind: 'Devolutiva', sourcePlanId: plan.id, description: `Conclusão do plano ${plan.type}: ${body}`, date: date(), time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()), ownerId: actor.id, followup: false });
    event(db, actor, 'Acompanhamento concluído com registro e histórico preservados.');
  }
  window.NOTARE_BUSINESS = Object.freeze({ PLANS, SEGMENTS, quoteSubscription, familySuggestion, continuitySuggestion, initialize, profiles, scopedStudents, sendMessage, communicationStatus, familyMessages, respondMessage, proposeSubscription, activateSubscription, cancelProposal, setClub, createOffer, reviewOffer, toggleOffer, availableOffers, reserve, cancelRedemption, partnerStatement, confirmConversion, completePlan });
})();
