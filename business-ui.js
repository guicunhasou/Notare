(() => {
  function create({ database, actor, save, refresh, navigate, notify, escape }) {
    const B = window.NOTARE_BUSINESS;
    const e = escape;
    const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    const when = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
    const expired = voucher => voucher.status === 'issued' && new Date(voucher.expires + 'T23:59:59') < new Date();
    const voucherStatus = voucher => expired(voucher) ? 'Expirado' : status(voucher.status);
    const status = value => ({ pending: 'Em avaliação', approved: 'Aprovada', rejected: 'Recusada', paused: 'Pausada', issued: 'Disponível', confirmed: 'Conversão simulada confirmada', cancelled: 'Cancelado' })[value] || value;
    const button = (action, label, id = '', variant = 'secondary') => `<button type="button" class="button button-${variant}" data-business="${action}" data-id="${e(id)}">${label}</button>`;
    const card = (title, body) => `<article class="card ecosystem-card"><h2>${e(title)}</h2>${body}</article>`;
    const empty = message => `<p class="ecosystem-empty">${e(message)}</p>`;
    const permission = name => actor().permissions.includes(name);
    function schoolContacts(db, a) {
      const students = B.scopedStudents(db, a);
      const ids = new Set(students.map(s => s.id));
      const linked = students.filter(s => db.business.families.some(f => f.students.includes(s.id)));
      const messages = db.business.messages.filter(m => ids.has(m.studentId));
      const select = linked.map(s => `<option value="${e(s.id)}">${e(s.name)} · ${e(s.className)}</option>`).join('');
      const form = `<form class="data-form" data-business-form="message"><p>Compartilhe somente o comunicado destinado à família. Notas internas, ocorrências e sinais de risco não são enviados automaticamente.</p><label>Estudante com responsável demonstrativo<select name="student" required>${select}</select></label><label>Comunicado<textarea name="body" minlength="5" maxlength="600" required rows="3"></textarea></label><button class="button button-primary" ${linked.length ? '' : 'disabled'}>Enviar comunicado demonstrativo</button></form>`;
      const list = messages.map(m => `<article class="ecosystem-item"><div class="ecosystem-item-heading"><h3>${e(db.students.find(s => s.id === m.studentId)?.name)}</h3><span class="status-badge">${m.reply ? 'Respondido' : m.readAt ? 'Leitura confirmada' : 'Enviado'}</span></div><p>${e(m.body)}</p><small>${when(m.at)}</small>${m.reply ? `<blockquote><strong>Resposta do responsável</strong><p>${e(m.reply)}</p></blockquote>` : ''}</article>`).join('');
      const plans = db.plans.filter(p => ids.has(p.studentId) && p.status !== 'done');
      const completion = permission('plans:create') ? card('Finalizar um acompanhamento', `<p>Registre a conclusão. O histórico será preservado e o compromisso deixará a agenda de ações pendentes.</p><form class="data-form" data-business-form="complete-plan"><label>Plano<select name="plan" required>${plans.map(p => `<option value="${e(p.id)}">${e(db.students.find(s => s.id === p.studentId)?.name)} · ${e(p.type)}</option>`).join('')}</select></label><label>Resultado e continuidade<textarea name="conclusion" required minlength="10" maxlength="600" rows="3"></textarea></label><button class="button button-primary" ${plans.length ? '' : 'disabled'}>Concluir acompanhamento</button></form>`) : '';
      return `<div class="ecosystem-columns">${card('Novo contato com a família', form)}${card('Comunicados e retornos', list || empty('Nenhum comunicado compartilhado ainda.'))}</div>${completion}`;
    }
    function family(db, a) {
      const students = B.scopedStudents(db, a);
      const messages = B.familyMessages(db, a);
      return card('Seu vínculo com a escola', `<p>${students.map(s => `${e(s.name)} · ${e(s.className)}`).join('<br>')}</p><p>Você recebe apenas os comunicados compartilhados pela escola. Os registros internos da equipe não aparecem aqui.</p><p>O Clube é gratuito para a família e seu uso é opcional.</p>${button('open-club', 'Conhecer benefícios')}`) + card('Comunicados da escola', messages.map(m => `<article class="ecosystem-item"><div class="ecosystem-item-heading"><h3>${e(students.find(s => s.id === m.studentId)?.name)}</h3><span class="status-badge">${m.reply ? 'Respondido' : m.readAt ? 'Leitura confirmada' : 'Novo comunicado'}</span></div><p>${e(m.body)}</p><small>${when(m.at)}</small>${!m.readAt ? button('ack', 'Confirmar leitura', m.id) : ''}${m.reply ? `<blockquote><strong>Sua resposta</strong><p>${e(m.reply)}</p></blockquote>` : `<form class="data-form" data-business-form="reply" data-id="${e(m.id)}"><label>Resposta à escola<textarea name="reply" rows="2" required minlength="5" maxlength="600"></textarea></label><button class="button button-primary">Enviar resposta demonstrativa</button></form>`}</article>`).join('') || empty('Nenhum comunicado para sua família.'));
    }
    function club(db, a) {
      const offers = B.availableOffers(db, a);
      const vouchers = db.business.redemptions.filter(r => r.familyId === a.id);
      return `<p class="ecosystem-intro">Benefícios opcionais, sem mensalidade para a família. Valores e vouchers são fictícios. Nenhuma compra, inscrição externa ou pagamento será realizado.</p><div class="ecosystem-columns">${offers.map(o => card(o.title, `<p class="ecosystem-eyebrow">${e(o.partnerName)}</p><p>${e(o.description)}</p><p><strong>${money(o.price)}</strong> · valor ilustrativo após benefício</p><small>Disponíveis: ${o.stock} · validade ${e(o.expires.split('-').reverse().join('/'))}</small><p>Um resgate por família. Ao confirmar, o parceiro verá apenas o código do voucher, sem dados escolares.</p>${vouchers.some(r => r.offerId === o.id && r.status !== 'cancelled') ? '<p class="ecosystem-empty">Sua família já resgatou esta oferta. Consulte o voucher abaixo.</p>' : `<form class="data-form" data-business-form="reserve" data-id="${e(o.id)}"><label class="check-field"><input type="checkbox" name="accepted" required><span>Quero emitir este voucher demonstrativo</span></label><button class="button button-primary">Emitir voucher demonstrativo</button></form>`}`)).join('') || empty(db.business.subscription.club ? 'Nenhuma oferta disponível no momento.' : 'O Clube está desabilitado para novos resgates. Seus vouchers continuam no histórico.')}</div>${card('Meus vouchers', vouchers.map(r => `<article class="ecosystem-item"><h3>${e(r.title)}</h3><p><strong>${e(r.code)}</strong> · ${voucherStatus(r)}</p><p>${money(r.price)} · validade ${e(r.expires.split('-').reverse().join('/'))}</p>${r.status === 'issued' ? button('cancel-voucher', 'Cancelar voucher', r.id) : ''}<small>Somente a confirmação demonstrativa do parceiro registra uma conversão. Nenhum valor é debitado.</small></article>`).join('') || empty('Você ainda não emitiu vouchers.'))}`;
    }
    function partner(db, a) {
      const partnerId = a.scope.slice(8);
      const offers = db.business.offers.filter(o => o.partnerId === partnerId);
      const statement = B.partnerStatement(db, a);
      const commission = statement.reduce((sum, r) => sum + r.commission, 0);
      const fields = `<label>Título da oferta<input name="title" required minlength="5" maxlength="100"></label><label>Condição do benefício<textarea name="description" required minlength="10" maxlength="600" rows="3"></textarea></label><div class="two-fields"><label>Valor ilustrativo após benefício (R$)<input name="price" type="number" min="1" max="10000" step="0.01" required></label><label>Quantidade<input name="stock" type="number" min="1" max="500" step="1" required></label></div><label>Válida até<input name="expires" type="date" min="${new Date().toLocaleDateString('sv-SE')}" required></label><p>Comissão demonstrativa: 5% por conversão confirmada. A emissão do voucher não gera comissão. A escola revisará a oferta antes de exibi-la.</p><button class="button button-primary">Submeter oferta</button>`;
      return `<div class="ecosystem-columns">${card('Nova oferta', `<form class="data-form" data-business-form="offer">${fields}</form>`)}${card('Minhas ofertas', offers.map(o => `<article class="ecosystem-item"><h3>${e(o.title)}</h3><p>${status(o.status)} · ${o.stock} disponíveis · ${money(o.price)}</p>${o.reviewReason ? `<p>Revisão: ${e(o.reviewReason)}</p>` : ''}${['approved', 'paused'].includes(o.status) ? button('toggle-offer', o.status === 'paused' ? 'Retomar oferta' : 'Pausar oferta', o.id) : ''}</article>`).join('') || empty('Nenhuma oferta cadastrada.'))}</div>${card('Conversões e comissões', `<p class="ecosystem-value">${money(commission)}</p><p>Comissão simulada acumulada. Não há cobrança ou repasse financeiro. Você não tem acesso a estudantes, contatos ou registros escolares.</p>${statement.map(r => `<article class="ecosystem-item"><h3>${e(r.title)}</h3><p><strong>${e(r.code)}</strong> · ${voucherStatus(r)}</p><p>Valor: ${money(r.price)} · comissão: ${money(r.commission)}</p>${r.status === 'issued' && !expired(r) ? `<form class="data-form" data-business-form="conversion" data-id="${e(r.id)}"><label class="check-field"><input type="checkbox" required name="accepted"><span>Confirmo apenas uma utilização fictícia deste voucher</span></label><button class="button button-primary">Confirmar conversão simulada</button></form>` : ''}</article>`).join('') || empty('Nenhum voucher emitido para suas ofertas.')}`)}`;
    }
    function subscription(db) {
      const sub = db.business.subscription;
      const proposal = db.business.pendingSubscription;
      const current = B.PLANS[sub.plan];
      const commissions = db.business.redemptions.reduce((sum, r) => sum + r.commission, 0);
      const next = proposal ? `<section class="ecosystem-proposal" role="status"><h3>Revise a proposta demonstrativa</h3><p>${e(B.PLANS[proposal.plan].name)} · ${e(proposal.segment)}</p><p>Mensalidade: ${money(proposal.monthly)} · implantação simulada: ${money(proposal.setup)}</p><form class="data-form" data-business-form="activate" data-id="${e(proposal.id)}"><label class="check-field"><input type="checkbox" name="accepted" required><span>Confirmar somente a adesão simulada, sem contrato ou cobrança real</span></label><button class="button button-primary">Confirmar adesão simulada</button>${button('cancel-proposal', 'Descartar proposta')}</form></section>` : '';
      return `<div class="ecosystem-columns">${card('Plano institucional', `<span class="status-badge">Ativo na demonstração</span><h3>${e(current.name)}</h3><p>${e(sub.segment)} · ${db.classes.length} turmas · ${db.students.length} estudantes</p><p class="ecosystem-value">${money(current.monthly)}<small>/mês · hipótese acadêmica</small></p><p>Implantação, assinatura e integrações representam fontes de receita propostas. Esta tela não processa contrato, pagamento ou integração externa.</p><form class="data-form" data-business-form="club-setting"><label class="check-field"><input type="checkbox" name="enabled" ${sub.club ? 'checked' : ''}><span>Habilitar novos resgates no Clube</span></label><button class="button button-secondary">Salvar configuração do Clube</button></form><p>Comissões de conversões simuladas: <strong>${money(commissions)}</strong></p>`)}${card('Adesão e mudança de plano', `<ol class="ecosystem-steps"><li>Escolher escopo</li><li>Revisar proposta</li><li>Confirmar adesão simulada</li><li>Consultar plano ativo</li></ol><form class="data-form" data-business-form="proposal"><label>Plano<select name="plan" aria-label="Plano">${Object.entries(B.PLANS).map(([k,p]) => `<option value="${k}" ${k === sub.plan ? 'selected' : ''}>${e(p.name)} · ${money(p.monthly)}/mês</option>`).join('')}</select></label><label>Segmento<select name="segment" aria-label="Segmento">${['Ensino Fundamental','Ensino Médio','Educação Profissional e Tecnológica'].map(segment => `<option ${segment === sub.segment ? 'selected' : ''}>${e(segment)}</option>`).join('')}</select></label><button class="button button-primary">Revisar proposta</button></form>${next}`)}</div>${card('Histórico institucional', db.business.history.filter(h => db.profiles.some(p => p.id === h.actorId)).slice(0,20).map(h => `<p><small>${when(h.at)}</small><br>${e(h.description)}</p>`).join('') || empty('Nenhuma alteração institucional registrada.'))}`;
    }
    function partnerships(db) {
      const pending = db.business.offers.filter(o => o.status === 'pending');
      return card('Ofertas para revisão', pending.map(o => `<article class="ecosystem-item"><h3>${e(o.title)}</h3><p>${e(db.business.partners.find(p => p.id === o.partnerId)?.name)}</p><p>${e(o.description)}</p><p>${money(o.price)} · ${o.stock} vouchers · comissão proposta 5%</p>${button('approve-offer', 'Aprovar para o Clube', o.id, 'primary')}<form class="data-form" data-business-form="reject-offer" data-id="${e(o.id)}"><label>Justificativa para recusar<input name="reason" minlength="5" maxlength="300" required></label><button class="button button-secondary">Recusar oferta</button></form></article>`).join('') || empty('Nenhuma oferta pendente.')) + card('Parceiros da demonstração', db.business.partners.map(p => `<p><strong>${e(p.name)}</strong><br>${db.business.offers.filter(o => o.partnerId === p.id).length} ofertas cadastradas</p>`).join(''));
    }
    function render() {
      const db = database(), a = actor();
      const areas = { familias: ['families:manage', schoolContacts], familia: ['family:view', family], clube: ['club:view', club], parceiro: ['partner:manage', partner], assinatura: ['subscription:manage', subscription], parcerias: ['partners:review', partnerships] };
      for (const [route, [perm, renderer]] of Object.entries(areas)) {
        const root = document.querySelector(`[data-business-content="${route}"]`);
        root.innerHTML = permission(perm) ? renderer(db, a) : '';
      }
      const sub = db.business.subscription;
      document.querySelector('.institution-plan-status strong').textContent = B.PLANS[sub.plan].name;
      document.querySelector('.institution-plan-status small').textContent = `${db.school.name} · ${sub.segment}`;
    }
    function mutate(fn, message) {
      const db = database();
      const before = JSON.stringify(db);
      try { fn(db, actor()); save(); }
      catch (error) { Object.keys(db).forEach(k => delete db[k]); Object.assign(db, JSON.parse(before)); notify(error.message); return; }
      refresh(); notify(message);
    }
    document.addEventListener('click', event => {
      const control = event.target.closest('[data-business]'); if (!control) return;
      const action = control.dataset.business, key = control.dataset.id;
      if (action === 'open-club') return navigate('clube');
      const actions = {
        ack: (db,a) => B.respondMessage(db,a,key),
        'cancel-voucher': (db,a) => B.cancelRedemption(db,a,key),
        'toggle-offer': (db,a) => B.toggleOffer(db,a,key),
        'cancel-proposal': (db,a) => B.cancelProposal(db,a),
        'approve-offer': (db,a) => B.reviewOffer(db,a,key,true)
      };
      if (actions[action]) mutate(actions[action], { ack: 'Leitura confirmada para a escola.', 'cancel-voucher': 'Voucher cancelado e disponibilidade devolvida.', 'approve-offer': 'Oferta aprovada para o Clube.', 'cancel-proposal': 'Proposta descartada. O plano ativo foi preservado.', 'toggle-offer': 'Disponibilidade da oferta atualizada.' }[action]);
    });
    document.addEventListener('submit', event => {
      const form = event.target.closest('[data-business-form]'); if (!form) return;
      event.preventDefault(); const data = new FormData(form), key = form.dataset.id;
      const actions = {
        message: (db,a) => B.sendMessage(db,a,data.get('student'),data.get('body')),
        reply: (db,a) => B.respondMessage(db,a,key,data.get('reply')),
        reserve: (db,a) => { if (!data.has('accepted')) throw new Error('Confirme a emissão demonstrativa.'); B.reserve(db,a,key); },
        offer: (db,a) => B.createOffer(db,a,{ title:data.get('title'), description:data.get('description'), price:Math.round(Number(data.get('price'))*100), stock:data.get('stock'), expires:data.get('expires') }),
        conversion: (db,a) => { if (!data.has('accepted')) throw new Error('Confirme a utilização fictícia.'); B.confirmConversion(db,a,key); },
        proposal: (db,a) => B.proposeSubscription(db,a,data.get('plan'),data.get('segment')),
        activate: (db,a) => B.activateSubscription(db,a,key,data.has('accepted')),
        'club-setting': (db,a) => B.setClub(db,a,data.has('enabled')),
        'reject-offer': (db,a) => B.reviewOffer(db,a,key,false,data.get('reason')),
        'complete-plan': (db,a) => B.completePlan(db,a,data.get('plan'),data.get('conclusion'))
      };
      if (actions[form.dataset.businessForm]) mutate(actions[form.dataset.businessForm], { message:'Comunicado compartilhado no ambiente demonstrativo.', reply:'Resposta registrada no acompanhamento da escola.', reserve:'Voucher demonstrativo emitido. Nenhuma compra realizada.', offer:'Oferta enviada para revisão da direção.', conversion:'Conversão fictícia confirmada. Comissão simulada registrada uma única vez.', proposal:'Revise os valores antes de confirmar.', activate:'Adesão simulada concluída. Plano atualizado e registrado no histórico.', 'club-setting':'Configuração do Clube salva.', 'reject-offer':'Oferta recusada com justificativa.', 'complete-plan':'Plano concluído. Histórico preservado e agenda atualizada.' }[form.dataset.businessForm]);
    });
    return { render };
  }
  window.NOTARE_BUSINESS_UI = Object.freeze({ create });
})();
