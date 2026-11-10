(() => {
  function create({ database, actor, save, transaction, refresh, navigate, notify, escape, studentIdentity = student => `<strong>${escape(student.name)}</strong><small>${escape(student.className)}</small>`, selectedStudent = () => null, draftReady = () => {}, showUndo = () => {} }) {
    const B = window.NOTARE_BUSINESS;
    const e = escape;
    const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    const when = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
    const expired = voucher => voucher.status === 'issued' && new Date(voucher.expires + 'T23:59:59') < new Date();
    const voucherStatus = voucher => expired(voucher) ? 'Expirado' : status(voucher.status);
    const status = value => ({ pending: 'Em avaliação', approved: 'Aprovada', rejected: 'Recusada', paused: 'Pausada', issued: 'Disponível', confirmed: 'Conversão confirmada', cancelled: 'Cancelado' })[value] || value;
    const button = (action, label, id = '', variant = 'secondary') => `<button type="button" class="button button-${variant}" data-business="${action}" data-id="${e(id)}">${label}</button>`;
    const card = (title, body) => `<article class="card ecosystem-card"><h2>${e(title)}</h2>${body}</article>`;
    const partnerIdentity = (partner, {logoOnly=false} = {}) => {
      if (!partner) return '<span>Parceiro não disponível</span>';
      const media = window.NOTARE_COMMUNITY_MEDIA?.[partner.actor];
      return `<span class="partner-identity">${media?.src ? `<img class="partner-logo" src="${e(media.src)}" alt="${e(media.alt)}" loading="lazy">` : ''}${logoOnly && media?.src ? '' : `<strong>${e(partner.name)}</strong>`}</span>`;
    };
    const offerDetails = offer => `<p><strong>Categoria:</strong> ${e(offer.category || 'Benefício educacional')}</p>${offer.conditions ? `<p><strong>Condições:</strong> ${e(offer.conditions)}</p>` : ''}<p><small>Validade: ${e(offer.expires.split('-').reverse().join('/'))}</small></p>`;
    const itemList = content => `<div class="ecosystem-list">${content}</div>`;
    const empty = message => `<p class="ecosystem-empty">${e(message)}</p>`;
    const permission = name => actor().permissions.includes(name);
    let subscriptionDraft = null;
    const automaticTexts = new WeakMap();
    const automaticPreferences = {body:true,conclusion:true};
    let rejectionInvoker = null, rejectionOffer = null, lastMutationError = '';
    const rejectionDialog = document.querySelector('#reject-offer-dialog');
    const suggestionField = (name, label, id, enabled) => `<div class="suggestion-field"><span class="field-heading"><label for="${id}">${label}</label><label class="ai-simulation-button suggestion-switch"><input type="checkbox" data-auto-suggestion="${name}" ${automaticPreferences[name] ? 'checked' : ''} ${enabled ? '' : 'disabled'}><svg aria-hidden="true"><use href="#i-sparkles"></use></svg><span>Usar sugestões automáticas</span></label></span><textarea id="${id}" name="${name}" required minlength="${name === 'body' ? 5 : 10}" maxlength="600" rows="4"></textarea><p class="form-text-status" data-suggestion-status role="status" hidden></p></div>`;

    const communityIdentity = a => {
      const media = window.NOTARE_COMMUNITY_MEDIA?.[a.id];
      return media?.src ? `<div class="community-identity"><img class="${a.scope.startsWith('partner:') ? 'community-brand' : 'community-portrait'}" src="${e(media.src)}" alt="${e(media.alt)}"><div><strong>${e(a.name)}</strong><small>${e(a.role)}</small></div></div>` : '';
    };
    function schoolContacts(db, a) {
      const students = B.scopedStudents(db, a);
      const ids = new Set(students.map(s => s.id));
      const linked = students.filter(s => db.business.families.some(f => f.students.includes(s.id)));
      const messages = db.business.messages.filter(m => ids.has(m.studentId));
      const select = linked.map(s => `<option value="${e(s.id)}">${e(s.name)} · ${e(s.className)}</option>`).join('');
      const form = `<form class="data-form" data-business-form="message"><p>Compartilhe somente o comunicado destinado à família. Notas internas, ocorrências e sinais de risco não são enviados automaticamente.</p><label>Estudante com responsável cadastrado<select name="student" required aria-describedby="family-selected-context">${select}</select></label><div id="family-selected-context" class="student-context"></div>${suggestionField('body','Comunicado','family-message-body',linked.length)}<button class="button button-primary" ${linked.length ? '' : 'disabled'}>Enviar comunicado</button></form>`;
      const list = messages.map(m => `<article class="ecosystem-item"><div class="ecosystem-item-heading"><h3>${e(db.students.find(s => s.id === m.studentId)?.name)}</h3><span class="status-badge">${m.cancelledAt ? 'Anulado' : m.reply ? 'Respondido' : m.readAt ? 'Leitura confirmada' : 'Enviado'}</span></div><p>${e(m.body)}</p><small>${when(m.at)}</small>${m.reply ? `<blockquote><strong>Resposta do responsável</strong><p>${e(m.reply)}</p></blockquote>` : ''}</article>`).join('');
      return `<div class="ecosystem-columns">${card('Novo contato com a família', form)}${card('Comunicados e retornos', `<div class="ecosystem-list">${list || empty('Nenhum comunicado compartilhado ainda.')}</div>`)}</div>`;
    }
    function completionForm(db,a) {
      const ids=new Set(B.scopedStudents(db,a).map(student=>student.id));
      const plans=db.plans.filter(plan=>ids.has(plan.studentId)&&!plan.voidedAt&&plan.status!=='done');
      return `<form class="data-form" data-business-form="complete-plan"><label>Plano<select name="plan" required aria-describedby="completion-selected-context">${plans.map(plan=>`<option value="${e(plan.id)}">${e(db.students.find(student=>student.id===plan.studentId)?.name)} · ${e(plan.type)}</option>`).join('')}</select></label><div id="completion-selected-context" class="student-context"></div>${suggestionField('conclusion','Resultado e continuidade','plan-conclusion-body',plans.length)}<p id="complete-plan-error" role="alert" hidden></p><div class="form-actions"><button class="button button-secondary" type="button" data-business="cancel-completion">Cancelar</button><button class="button button-primary" ${plans.length?'':'disabled'}>Concluir acompanhamento</button></div></form>`;
    }

    function family(db, a) {
      const students = B.scopedStudents(db, a);
      const messages = B.familyMessages(db, a);
      return card('Seu vínculo com a escola', `${communityIdentity(a)}<p>${students.map(s => `${e(s.name)} · ${e(s.className)}`).join('<br>')}</p><p>Você recebe apenas os comunicados compartilhados pela escola. Os registros internos da equipe não aparecem aqui.</p><p>O Clube é gratuito para a família e seu uso é opcional.</p>${button('open-club', 'Conhecer benefícios')}`) + card('Comunicados da escola', itemList(messages.map(m => `<article class="ecosystem-item"><div class="ecosystem-item-heading"><h3>${e(students.find(s => s.id === m.studentId)?.name)}</h3><span class="status-badge">${m.cancelledAt ? 'Anulado pela escola' : m.reply ? 'Respondido' : m.readAt ? 'Leitura confirmada' : 'Novo comunicado'}</span></div><p>${e(m.body)}</p><small>${when(m.at)}</small>${!m.cancelledAt && !m.readAt ? button('ack', 'Confirmar leitura', m.id) : ''}${m.cancelledAt ? `<p>O plano vinculado foi anulado. Este comunicado permanece apenas no histórico.</p>` : m.reply ? `<blockquote><strong>Sua resposta</strong><p>${e(m.reply)}</p></blockquote>` : `<form class="data-form" data-business-form="reply" data-id="${e(m.id)}"><label>Resposta à escola<textarea name="reply" rows="2" required minlength="5" maxlength="600"></textarea></label><button class="button button-primary">Enviar resposta</button></form>`}</article>`).join('') || empty('Nenhum comunicado para sua família.')));
    }
    function club(db, a) {
      const offers = B.availableOffers(db, a);
      const vouchers = db.business.redemptions.filter(r => r.familyId === a.id);
      return `<p class="ecosystem-intro">Benefícios opcionais, sem mensalidade para a família. Valores e vouchers são fictícios. Nenhuma compra, inscrição externa ou pagamento será realizado.</p><div class="ecosystem-columns">${offers.map(o => card(o.title, `<p class="ecosystem-eyebrow">${partnerIdentity(db.business.partners.find(p => p.id === o.partnerId))}</p><p>${e(o.description)}</p>${offerDetails(o)}<p><strong>${money(o.price)}</strong> · valor ilustrativo após benefício</p><small>Disponíveis: ${o.stock} · validade ${e(o.expires.split('-').reverse().join('/'))}</small><p>Um resgate por família. Ao confirmar, o parceiro verá apenas o código do voucher, sem dados escolares.</p>${vouchers.some(r => r.offerId === o.id && r.status !== 'cancelled') ? '<p class="ecosystem-empty">Sua família já resgatou esta oferta. Consulte o voucher abaixo.</p>' : `<form class="data-form" data-business-form="reserve" data-id="${e(o.id)}"><label class="check-field"><input type="checkbox" name="accepted" required><span>Quero emitir este voucher, sem realizar compra ou pagamento</span></label><button class="button button-primary">Emitir voucher</button></form>`}`)).join('') || empty(db.business.subscription.club ? 'Nenhuma oferta disponível no momento.' : 'O Clube está desabilitado para novos resgates. Seus vouchers continuam no histórico.')}</div>${card('Meus vouchers', vouchers.map(r => `<article class="ecosystem-item"><h3>${e(r.title)}</h3><p><strong>${e(r.code)}</strong> · ${voucherStatus(r)}</p><p>${money(r.price)} · validade ${e(r.expires.split('-').reverse().join('/'))}</p>${r.status === 'issued' ? button('cancel-voucher', 'Cancelar voucher', r.id) : ''}<small>A confirmação do parceiro registra a utilização do voucher. Nenhum valor é debitado.</small></article>`).join('') || empty('Você ainda não emitiu vouchers.'))}`;
    }
    function partner(db, a) {
      const partnerId = a.scope.slice(8);
      const ended=db.business.partners.find(p=>p.id===partnerId)?.status==='ended';
      const endedPartner=db.business.partners.find(p=>p.id===partnerId);
      const offers = db.business.offers.filter(o => o.partnerId === partnerId);
      const statement = B.partnerStatement(db, a);
      const commission = statement.reduce((sum, r) => sum + r.commission, 0);
      const fields = `<label>Título da oferta<input name="title" required minlength="5" maxlength="100"></label><label>Condição do benefício<textarea name="description" required minlength="10" maxlength="600" rows="3"></textarea></label><div class="two-fields"><label>Valor ilustrativo após benefício (R$)<input name="price" type="number" min="1" max="10000" step="0.01" required></label><label>Quantidade<input name="stock" type="number" min="1" max="500" step="1" required></label></div><label>Válida até<input name="expires" type="date" min="${new Date().toLocaleDateString('sv-SE')}" required></label><p>Comissão prevista: 5% por conversão confirmada. A emissão do voucher não gera comissão. A escola revisará a oferta antes de exibi-la.</p><button class="button button-primary">Submeter oferta</button>`;
      return `${communityIdentity(a)}<div class="ecosystem-columns">${ended ? card('Parceria encerrada',`<p>Novas ofertas e resgates estão indisponíveis. O histórico anterior foi preservado.</p><p>${e(endedPartner.endedReason)}</p><small>${when(endedPartner.endedAt)}</small>`) : card('Nova oferta', `<form class="data-form" data-business-form="offer">${fields}</form>`)}${card('Minhas ofertas', offers.map(o => `<article class="ecosystem-item"><h3>${e(o.title)}</h3>${offerDetails(o)}<p>${status(o.status)} · ${o.stock} disponíveis · ${money(o.price)}</p>${o.reviewReason ? `<p>Revisão: ${e(o.reviewReason)}</p>` : ''}${!ended && ['approved', 'paused'].includes(o.status) ? button('toggle-offer', o.status === 'paused' ? 'Retomar oferta' : 'Pausar oferta', o.id) : ''}</article>`).join('') || empty('Nenhuma oferta cadastrada.'))}</div>${card('Conversões e comissões', `<p class="ecosystem-value">${money(commission)}</p><p>Comissão registrada neste ambiente local. Não há cobrança ou repasse financeiro. Você não tem acesso a estudantes, contatos ou registros escolares.</p>${statement.map(r => `<article class="ecosystem-item"><h3>${e(r.title)}</h3><p><strong>${e(r.code)}</strong> · ${voucherStatus(r)}</p><p>Valor: ${money(r.price)} · comissão: ${money(r.commission)}</p>${r.status === 'issued' && !expired(r) ? `<form class="data-form" data-business-form="conversion" data-id="${e(r.id)}"><label class="check-field"><input type="checkbox" required name="accepted"><span>Confirmo a utilização neste ambiente local, sem transação financeira</span></label><button class="button button-primary">Confirmar conversão</button></form>` : ''}</article>`).join('') || empty('Nenhum voucher emitido para suas ofertas.')}`)}`;
    }
    function subscription(db) {
      const sub = db.business.subscription, proposal = db.business.pendingSubscription;
      if (!subscriptionDraft || subscriptionDraft.profileId !== actor().id) {
        subscriptionDraft = { profileId:actor().id, plan:proposal?.plan || sub.plan, segment:proposal?.segment || sub.segment, step:proposal ? 4 : 1 };
      }
      const d = subscriptionDraft, step = d.step;
      const current = B.PLANS[sub.plan];
      const commissions = db.business.redemptions.reduce((sum, r) => sum + r.commission, 0);
      const stages = ['Segmento','Plano','Revisão','Confirmação'];
      const segments = Object.keys(B.SEGMENTS);
      if (!segments.includes(d.segment)) segments.unshift(d.segment);
      const next = proposal ? `<section id="subscription-confirmation" class="ecosystem-proposal" ${step === 4 ? '' : 'hidden inert'} aria-labelledby="subscription-confirm-title"><h3 id="subscription-confirm-title" tabindex="-1">Confirme a proposta revisada</h3><p>${e(B.PLANS[proposal.plan].name)} · ${e(proposal.segment)}</p><p>Mensalidade: ${money(proposal.monthly)} · implantação prevista: ${money(proposal.setup)}</p><p>Valores acadêmicos, sem validação comercial. Nenhum contrato, cobrança ou pagamento será realizado.</p><form class="data-form" data-business-form="activate" data-id="${e(proposal.id)}"><label class="check-field"><input type="checkbox" name="accepted" required><span>Confirmar a adesão neste navegador, sem contrato ou cobrança</span></label><div class="form-actions">${button('wizard-back','Voltar')}<button class="button button-primary">Confirmar proposta</button>${button('cancel-proposal','Descartar proposta')}</div></form></section>` : '';
      const wizard = `<ol class="subscription-progress" aria-label="Etapas da proposta">${stages.map((name,i)=>`<li data-subscription-progress="${i+1}" ${step === i+1 ? 'aria-current="step"' : ''}><span>${i+1}</span>${name}</li>`).join('')}</ol><p id="subscription-step-status" role="status">Etapa ${step} de 4 · ${stages[step-1]}</p><form id="subscription-wizard" class="data-form" data-business-form="proposal" ${step === 4 ? 'hidden inert' : ''}>
        <fieldset data-subscription-step="1" ${step === 1 ? '' : 'hidden inert'}><legend tabindex="-1">Escolha o segmento institucional</legend><label>Segmento<select name="segment" required>${segments.map(segment=>`<option ${segment === d.segment ? 'selected' : ''}>${e(segment)}</option>`).join('')}</select></label><p>O segmento ajusta a hipótese de mensalidade. Os valores não representam pesquisa comercial nem contrato real.</p></fieldset>
        <fieldset data-subscription-step="2" ${step === 2 ? '' : 'hidden inert'}><legend tabindex="-1">Escolha o plano</legend><label>Plano<select name="plan" required>${Object.entries(B.PLANS).map(([key,plan])=>`<option value="${key}" ${key === d.plan ? 'selected' : ''}>${e(plan.name)}</option>`).join('')}</select></label><p data-subscription-price role="status"></p></fieldset>
        <fieldset data-subscription-step="3" ${step === 3 ? '' : 'hidden inert'}><legend tabindex="-1">Revise valores e condições</legend><div id="subscription-review"></div><p>Clube e comissão por conversão seguem as regras atuais. Confirme as escolhas antes de preparar a proposta.</p></fieldset>
        <div class="form-actions">${button('wizard-back','Voltar')}<button class="button button-primary" type="button" data-business="wizard-next" ${step === 3 ? 'hidden' : ''}>Avançar</button><button class="button button-primary" data-subscription-review-submit ${step === 3 ? '' : 'hidden'}>Preparar confirmação</button>${button('cancel-choices','Cancelar escolhas')}</div>
      </form>${next}`;
      return `<div class="ecosystem-columns">${card('Plano institucional', `<span class="status-badge">Ativo</span><h3>${e(current.name)}</h3><p>${e(sub.segment)} · ${db.classes.length} turmas · ${db.students.length} estudantes</p><p class="ecosystem-value">${money(sub.monthly ?? current.monthly)}<small>/mês · hipótese acadêmica</small></p><p>Implantação, assinatura e integrações representam fontes de receita propostas. Esta tela não processa contrato, pagamento ou integração externa.</p><form class="data-form" data-business-form="club-setting"><label class="check-field"><input type="checkbox" name="enabled" ${sub.club ? 'checked' : ''}><span>Habilitar novos resgates no Clube</span></label><button class="button button-secondary">Salvar configuração do Clube</button></form><p>Comissões registradas neste navegador: <strong>${money(commissions)}</strong></p>`)}${card('Adesão e mudança de plano', wizard)}</div>`;
    }
    function updateWizard({focus = false} = {}) {
      const form = document.querySelector('#subscription-wizard');
      if (!form || !subscriptionDraft) return;
      const d = subscriptionDraft;
      d.plan = form.elements.plan.value; d.segment = form.elements.segment.value;
      const step = d.step;
      form.hidden = step === 4; form.inert = step === 4;
      form.querySelectorAll('[data-subscription-step]').forEach(panel => {panel.hidden = Number(panel.dataset.subscriptionStep) !== step; panel.inert = panel.hidden;});
      const confirmation = document.querySelector('#subscription-confirmation');
      if (confirmation) {confirmation.hidden = step !== 4; confirmation.inert = confirmation.hidden;}
      document.querySelectorAll('[data-subscription-progress]').forEach(item => {if (Number(item.dataset.subscriptionProgress) === step) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current');});
      document.querySelector('#subscription-step-status').textContent = `Etapa ${step} de 4 · ${['Segmento','Plano','Revisão','Confirmação'][step-1]}`;
      form.querySelector('[data-business="wizard-back"]').hidden = step === 1;
      form.querySelector('[data-business="wizard-next"]').hidden = step === 3;
      form.querySelector('[data-subscription-review-submit]').hidden = step !== 3;
      try {
        const quote = B.quoteSubscription(database(),d.plan,d.segment);
        form.querySelector('[data-subscription-price]').textContent = `${money(quote.monthly)}/mês para ${d.segment}. Valor acadêmico, sem validação comercial.`;
        document.querySelector('#subscription-review').innerHTML = `<p><strong>${e(B.PLANS[d.plan].name)}</strong> · ${e(d.segment)}</p><p>Mensalidade: <strong>${money(quote.monthly)}</strong></p><p>Implantação prevista: ${money(quote.setup)}</p><p>Fator do segmento: ${B.SEGMENTS[d.segment]/10000} × valor-base do plano. Implantação somente na primeira adesão registrada.</p><p>Não haverá contrato, cobrança, compra ou repasse financeiro.</p>`;
      } catch (error) { form.querySelector('[data-subscription-price]').textContent = error.message; document.querySelector('#subscription-review').textContent = error.message; }
      if (focus) (step === 4 ? document.querySelector('#subscription-confirm-title') : form.querySelector(`[data-subscription-step="${step}"] legend`))?.focus();
    }
    function partnerships(db) {
      const pending = db.business.offers.filter(o => o.status === 'pending' && db.business.partners.some(p=>p.id===o.partnerId&&p.status!=='ended'));
      // Uma empresa em revisão tem precedência visual, sem alterar suas ofertas já aprovadas.
      const pendingPartnerIds=new Set(pending.map(offer=>offer.partnerId));
      const activePartners = db.business.partners.filter(partner => partner.status !== 'ended' && !pendingPartnerIds.has(partner.id) && (partner.status === 'approved' || db.business.offers.some(offer => offer.partnerId === partner.id && ['approved','paused'].includes(offer.status))));
      const review = `<article class="card ecosystem-card"><h2 id="partnerships-review-title" tabindex="-1">Ofertas para revisão</h2><p class="card-caption">${pending.length} ${pending.length===1?'proposta pendente':'propostas pendentes'}</p><div class="ecosystem-list">${pending.map(o => `<article class="ecosystem-item" data-review-partner="${e(o.partnerId)}"><h3>${e(o.title)}</h3><p>${partnerIdentity(db.business.partners.find(p => p.id === o.partnerId))}</p><p>${e(o.description)}</p>${offerDetails(o)}<p>${money(o.price)} · ${o.stock} vouchers · comissão proposta 5%</p><div class="offer-review-actions">${button('approve-offer','Aprovar para o Clube',o.id,'primary')}${button('open-rejection','Recusar oferta',o.id)}</div></article>`).join('') || empty('Nenhuma oferta pendente.')}</div></article>`;
      return review + card('Parceiros cadastrados', `<ul class="active-partner-list">${activePartners.map(partner => `<li data-active-partner="${e(partner.id)}"><button class="icon-button partner-end-action" type="button" data-business="open-end-partner" data-id="${e(partner.id)}" aria-label="Encerrar parceria com ${e(partner.name)}" title="Encerrar parceria">×</button>${partnerIdentity(partner,{logoOnly:true})}</li>`).join('') || '<li>Nenhuma parceria aprovada.</li>'}</ul>`);
    }
    function render() {
      const db = database(), a = actor();
      const areas = { familias: ['families:manage', schoolContacts], familia: ['family:view', family], clube: ['club:view', club], parceiro: ['partner:manage', partner], assinatura: ['subscription:manage', subscription], parcerias: ['partners:review', partnerships] };
      for (const [route, [perm, renderer]] of Object.entries(areas)) {
        const root = document.querySelector(`[data-business-content="${route}"]`);
        root.innerHTML = permission(perm) ? renderer(db, a) : '';
      }
      document.querySelector('#complete-plan-content').innerHTML=permission('plans:create')?completionForm(db,a):'';
      updateWizard();
      const sub = db.business.subscription;
      document.querySelector('.institution-plan-status strong').textContent = B.PLANS[sub.plan].name;
      document.querySelector('.institution-plan-status small').textContent = `${db.school.name} · ${sub.segment}`;
    }
    let mutationPending = false;
    function mutate(fn, message, onSuccess = () => {}, submittedForm = null, undoable = false) {
      if (mutationPending) {notify('Aguarde a conclusão da gravação anterior.',{tone:'warning'});return false;}
      // Os dois formulários da tela Famílias e retornos podem ter rascunhos simultâneos.
      const drafts = [...document.querySelectorAll('.view.active [data-business-form]'), ...document.querySelectorAll('#complete-plan-dialog[open] [data-business-form]')]
        .filter(form => form !== submittedForm && ['message','complete-plan'].includes(form.dataset.businessForm))
        .map(form => ({type:form.dataset.businessForm, fields:[...form.querySelectorAll('select,textarea')].map(field=>({name:field.name,value:field.value}))}));
      const databaseBefore = database();
      const before = transaction ? null : JSON.stringify(databaseBefore);
      const done = operation => {
        mutationPending = false;
        onSuccess(); refresh();
        for (const draft of drafts) {
          const form = document.querySelector(`.view.active [data-business-form="${draft.type}"]`);
          if (form) for (const field of draft.fields) {
            const target = form.elements[field.name];
            if (target && (target.tagName !== 'SELECT' || [...target.options].some(option=>option.value===field.value))) target.value=field.value;
          }
        }
        if(undoable)showUndo(message,operation);else notify(message,{tone:'success'});
        return true;
      };
      const fail = error => {
        mutationPending = false;
        if (!transaction) {Object.keys(databaseBefore).forEach(k => delete databaseBefore[k]);Object.assign(databaseBefore, JSON.parse(before));}
        lastMutationError = error.message;
        notify(error.message,{tone:'error'});
        return false;
      };
      mutationPending = true;
      try {
        const result = transaction ? transaction(fn) : (() => {const operation=fn(databaseBefore, actor());save();return operation;})();
        return result && typeof result.then === 'function' ? result.then(done, fail) : done(result);
      } catch (error) {return fail(error);}
    }
    function afterMutation(result, done) {
      if (result && typeof result.then === 'function') result.then(done);
      else done(result);
    }
    function suggestionContext(form) {return form.elements.student?.value || form.elements.plan?.value;}
    function insertSuggestion(form, text, {automatic=false,focus=true} = {}) {
      const field = form.querySelector('textarea'); field.value = text; if (focus) field.focus();
      if (automatic) {automaticTexts.set(form,text);draftReady(form);} else automaticTexts.delete(form);
      const status = form.querySelector('[data-suggestion-status]');status.hidden=true;status.textContent='';
    }
    function fillAutomaticSuggestion(form) {
      const option = form.querySelector('[data-auto-suggestion]');
      if (!option || option.checked === false || form.querySelector('textarea').value.trim()) return;
      try {
        const context = suggestionContext(form);
        const text = form.dataset.businessForm === 'message' ? B.familySuggestion(database(),actor(),context) : B.continuitySuggestion(database(),actor(),context);
        insertSuggestion(form,text,{automatic:true,focus:false});
      } catch(error) { const status=form.querySelector('[data-suggestion-status]');status.hidden=false;status.textContent=error.message; }
    }
    function prepareSuggestions(studentId = null) {
      if (!permission('families:manage')) return;
      const forms = [...document.querySelectorAll('[data-business-content="familias"] form[data-business-form]'), ...document.querySelectorAll('#complete-plan-content form[data-business-form]')];
      for (const form of forms) {
        if (!['message','complete-plan'].includes(form.dataset.businessForm)) continue;
        const field=form.querySelector('textarea');
        if (studentId && (!field.value.trim() || field.value === automaticTexts.get(form))) {
          const select = form.elements.student || form.elements.plan;
          const option = [...select.options].find(option => form.elements.student ? option.value === studentId : database().plans.some(plan=>plan.id===option.value && plan.studentId===studentId));
          if (option && option.value !== select.value) {field.value='';automaticTexts.delete(form);select.value=option.value;}
        }
        fillAutomaticSuggestion(form);
      }
      updateFamilyContext();
    }
    function updateFamilyContext() {
      const select = document.querySelector('[data-business-form="message"] select[name="student"]');
      const student = database().students.find(s => s.id === select?.value);
      const summary = document.querySelector('#family-selected-context');
      if (summary) summary.innerHTML = student ? studentIdentity(student,'Comunicado para') : 'Nenhum vínculo familiar disponível neste escopo.';
      const planSelect=document.querySelector('#complete-plan-content select[name="plan"]');
      const plan=database().plans.find(plan=>plan.id===planSelect?.value);
      const planStudent=database().students.find(student=>student.id===plan?.studentId);
      const context=document.querySelector('#completion-selected-context');
      if(context)context.innerHTML=planStudent?studentIdentity(planStudent):'Nenhum plano disponível neste escopo.';
    }
    const completionDialog=document.querySelector('#complete-plan-dialog');let completionInvoker=null;
    function closeCompletion() {if(completionDialog.open)completionDialog.close();if(completionInvoker?.isConnected)completionInvoker.focus();}
    function openCompletion(invoker) {
      if(!permission('plans:create'))return notify('Este perfil não pode concluir acompanhamentos.');
      completionInvoker=invoker;completionDialog.showModal();prepareSuggestions(selectedStudent());
      const form=document.querySelector('#complete-plan-content form');draftReady(form);document.querySelector('#complete-plan-error').hidden=true;
      form.elements.plan.focus();
    }
    document.querySelector('#complete-plan-close').addEventListener('click',closeCompletion);
    completionDialog.addEventListener('cancel',event=>{event.preventDefault();closeCompletion();});
    function fillRejectionSuggestion() {
      const field=document.querySelector('#reject-offer-reason');
      if(document.querySelector('#reject-auto-suggestion').checked===false||field.value.trim()||!rejectionOffer)return;
      field.value=B.rejectionSuggestion(database(),actor(),rejectionOffer);
      field.setSelectionRange(0,0);
      field.scrollTop=0;
    }
    document.querySelector('#reject-auto-suggestion').addEventListener('change',event=>{if(!event.currentTarget.checked){document.querySelector('#reject-offer-reason').value='';return;}fillRejectionSuggestion();});
    function closeRejection({restoreFocus=true} = {}) {
      if (typeof rejectionDialog.close === 'function' && rejectionDialog.open) rejectionDialog.close();
      else {rejectionDialog.removeAttribute('open');rejectionDialog.open=false;}
      rejectionOffer=null;
      if (restoreFocus && rejectionInvoker?.isConnected) rejectionInvoker.focus();
    }
    function openRejection(id, invoker) {
      if (!permission('partners:review')) return notify('Revisão reservada à direção.');
      const offer=database().business.offers.find(o=>o.id===id && o.status==='pending');
      if (!offer) return notify('Esta oferta não está mais pendente.');
      rejectionInvoker=invoker;rejectionOffer=id;
      const form=document.querySelector('#reject-offer-form'); form.dataset.id=id;
      form.elements.reason.value='';
      document.querySelector('#reject-offer-context').textContent=offer.title;
      document.querySelector('#reject-offer-error').hidden=true;
      fillRejectionSuggestion();
      if (typeof rejectionDialog.showModal === 'function') rejectionDialog.showModal();
      else {rejectionDialog.setAttribute('open','');rejectionDialog.open=true;}
      document.querySelector('#reject-offer-reason').focus();
    }
    rejectionDialog.addEventListener('cancel',event=>{event.preventDefault();closeRejection();});
    document.querySelector('#reject-offer-cancel').addEventListener('click',()=>closeRejection());
    document.querySelector('#reject-offer-close').addEventListener('click',()=>closeRejection());
    const endingDialog=document.querySelector('#end-partner-dialog');let endingPartner=null,endingInvoker=null;
    function fillEndingSuggestion() {
      const field=document.querySelector('#end-partner-reason');
      if(document.querySelector('#end-auto-suggestion').checked===false||field.value.trim()||!endingPartner)return;
      field.value=B.endingSuggestion(database(),actor(),endingPartner);
    }
    document.querySelector('#end-auto-suggestion').addEventListener('change',event=>{
      if(!event.currentTarget.checked){document.querySelector('#end-partner-reason').value='';return;}
      fillEndingSuggestion();
    });
    function closeEnding({restoreFocus=true}={}) {if(endingDialog.open)endingDialog.close();endingPartner=null;if(restoreFocus&&endingInvoker?.isConnected)endingInvoker.focus();}
    function openEnding(id,invoker) {
      if(!permission('partners:review'))return notify('Encerramento reservado à direção.',{tone:'warning'});
      const partner=database().business.partners.find(p=>p.id===id&&p.status!=='ended');if(!partner)return notify('Esta parceria não está mais ativa.',{tone:'warning'});
      endingPartner=id;endingInvoker=invoker;const form=document.querySelector('#end-partner-form');form.dataset.id=id;form.elements.reason.value='';
      document.querySelector('#end-partner-context').textContent=partner.name;document.querySelector('#end-partner-error').hidden=true;fillEndingSuggestion();endingDialog.showModal();form.elements.reason.focus();
    }
    // Mantém Tab dentro dos modais também nos navegadores que passam o foco à barra de endereço.
    for(const dialog of [completionDialog,rejectionDialog,endingDialog])dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab'||!dialog.open)return;
      const controls=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')].filter(element=>!element.hidden&&element.getClientRects().length);
      const first=controls[0],last=controls.at(-1);if(!first)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    endingDialog.addEventListener('cancel',event=>{event.preventDefault();closeEnding();});
    document.querySelector('#end-partner-close').addEventListener('click',()=>closeEnding());document.querySelector('#end-partner-cancel').addEventListener('click',()=>closeEnding());
    document.addEventListener('change', event => {
      if (event.target.closest('#subscription-wizard')) updateWizard();
      const form = event.target.closest('[data-business-form]');
      if (!form || !['message','complete-plan'].includes(form.dataset.businessForm)) return;
      const field=form.querySelector('textarea');
      if (event.target.matches?.('[data-auto-suggestion]')) {
        automaticPreferences[event.target.dataset.autoSuggestion]=event.target.checked;
        if (event.target.checked) fillAutomaticSuggestion(form);
        else {field.value='';automaticTexts.delete(form);const status=form.querySelector('[data-suggestion-status]');status.hidden=true;status.textContent='';}
        return;
      }
      if (event.target.tagName === 'SELECT') {
        if (automaticPreferences[form.dataset.businessForm==='message'?'body':'conclusion'] && field.value === automaticTexts.get(form)) {field.value='';automaticTexts.delete(form);}
        const status = form.querySelector('[data-suggestion-status]'); status.hidden = false;
        status.hidden=!field.value.trim();status.textContent=field.value.trim()?'Contexto alterado. Confira se o texto corresponde ao estudante selecionado.':'';
        fillAutomaticSuggestion(form);updateFamilyContext();
      }
    });
    document.addEventListener('click', event => {
      const control = event.target.closest('[data-business]'); if (!control) return;
      const action = control.dataset.business, key = control.dataset.id;
      if (action === 'open-club') return navigate('clube');
      if (action === 'open-completion') return openCompletion(control);
      if (action === 'cancel-completion') return closeCompletion();
      if(action==='open-end-partner')return openEnding(key,control);
      if(action==='approve-offer')return mutate((db,a)=>window.NOTARE_OPERATIONS.reviewOffer(db,a,key,true),'Oferta aprovada para o Clube.',()=>{},null,true);
      if (action === 'open-rejection') return openRejection(key,control);
      if (action === 'wizard-next' || action === 'wizard-back') {
        if (action === 'wizard-next') {
          try {B.quoteSubscription(database(),subscriptionDraft.plan,subscriptionDraft.segment);} catch(error) {notify(error.message);return;}
        }
        subscriptionDraft.step = Math.max(1,Math.min(4,subscriptionDraft.step + (action === 'wizard-next' ? 1 : -1)));
        updateWizard({focus:true}); return;
      }
      if (action === 'cancel-choices') {subscriptionDraft=null;refresh();notify('Escolhas descartadas. O plano ativo foi preservado.');return;}
      if (action === 'cancel-proposal') return mutate((db,a)=>B.cancelProposal(db,a),'Proposta descartada. O plano ativo foi preservado.',()=>{subscriptionDraft=null;});
      const actions = {
        ack: (db,a) => B.respondMessage(db,a,key),
        'cancel-voucher': (db,a) => B.cancelRedemption(db,a,key),
        'toggle-offer': (db,a) => B.toggleOffer(db,a,key)
      };
      if (actions[action]) mutate(actions[action], { ack: 'Leitura confirmada para a escola.', 'cancel-voucher': 'Voucher cancelado e disponibilidade devolvida.', 'approve-offer': 'Oferta aprovada para o Clube.', 'cancel-proposal': 'Proposta descartada. O plano ativo foi preservado.', 'toggle-offer': 'Disponibilidade da oferta atualizada.' }[action]);
    });
    document.addEventListener('submit', event => {
      const form = event.target.closest('[data-business-form]'); if (!form) return;
      event.preventDefault(); const data = new FormData(form), key = form.dataset.id;
      if (form.dataset.businessForm === 'reject-offer') {
        if (key !== rejectionOffer) return notify('Abra novamente a oferta para revisar.');
        const success = mutate((db,a)=>window.NOTARE_OPERATIONS.reviewOffer(db,a,key,false,data.get('reason')),'Oferta recusada com justificativa.',()=>closeRejection({restoreFocus:false}),form,true);
        afterMutation(success, saved => {if (!saved) {const error=document.querySelector('#reject-offer-error');error.hidden=false;error.textContent=lastMutationError;}});
        return;
      }
      if(form.dataset.businessForm==='end-partner') {
        if(key!==endingPartner)return notify('Abra novamente a parceria para encerrar.',{tone:'warning'});
        const success=mutate((db,a)=>window.NOTARE_OPERATIONS.endPartner(db,a,key,data.get('reason')),'Parceria encerrada. Histórico preservado.',()=>closeEnding({restoreFocus:false}),form,true);
        afterMutation(success, saved => {if(!saved){const error=document.querySelector('#end-partner-error');error.hidden=false;error.textContent=lastMutationError;}});
        return;
      }
      if(form.dataset.businessForm==='complete-plan') {
        const success=mutate((db,a)=>B.completePlan(db,a,data.get('plan'),data.get('conclusion')),'Acompanhamento concluído. Histórico preservado.',()=>{},form);
        afterMutation(success, saved => {if(saved)closeCompletion();else {const error=document.querySelector('#complete-plan-error');error.hidden=false;error.textContent=lastMutationError;}});
        return;
      }
      const actions = {
        message: (db,a) => B.sendMessage(db,a,data.get('student'),data.get('body')),
        reply: (db,a) => B.respondMessage(db,a,key,data.get('reply')),
        reserve: (db,a) => { if (!data.has('accepted')) throw new Error('Confirme a emissão do voucher.'); B.reserve(db,a,key); },
        offer: (db,a) => B.createOffer(db,a,{ title:data.get('title'), description:data.get('description'), price:Math.round(Number(data.get('price'))*100), stock:data.get('stock'), expires:data.get('expires') }),
        conversion: (db,a) => { if (!data.has('accepted')) throw new Error('Confirme a utilização neste ambiente local.'); B.confirmConversion(db,a,key); },
        proposal: (db,a) => B.proposeSubscription(db,a,data.get('plan'),data.get('segment')),
        activate: (db,a) => B.activateSubscription(db,a,key,data.has('accepted')),
        'club-setting': (db,a) => B.setClub(db,a,data.has('enabled')),
        'complete-plan': (db,a) => B.completePlan(db,a,data.get('plan'),data.get('conclusion'))
      };
      if (form.dataset.businessForm === 'proposal' && subscriptionDraft.step !== 3) {subscriptionDraft.step=Math.min(3,subscriptionDraft.step+1);updateWizard({focus:true});return;}
      if (actions[form.dataset.businessForm]) {
        const result = mutate(actions[form.dataset.businessForm], { message:'Comunicado disponível no acesso local da família. Nenhum envio externo realizado.', reply:'Resposta registrada no acompanhamento da escola.', reserve:'Voucher emitido. Nenhuma compra realizada.', offer:'Oferta enviada para revisão da direção.', conversion:'Conversão registrada neste navegador. Nenhum repasse realizado.', proposal:'Revise os valores antes de confirmar.', activate:'Adesão registrada neste navegador. Nenhum contrato ou cobrança gerado.', 'club-setting':'Configuração do Clube salva.', 'reject-offer':'Oferta recusada com justificativa.', 'complete-plan':'Plano concluído. Histórico preservado e agenda atualizada.' }[form.dataset.businessForm],()=>{if(form.dataset.businessForm==='proposal') subscriptionDraft.step=4; if(form.dataset.businessForm==='activate') subscriptionDraft=null;},form);
        if (['proposal','activate'].includes(form.dataset.businessForm)) afterMutation(result, saved => {if (saved) updateWizard({focus:true});});
      }
    });
    return { render, prepareSuggestions };
  }
  window.NOTARE_BUSINESS_UI = Object.freeze({ create });
})();
