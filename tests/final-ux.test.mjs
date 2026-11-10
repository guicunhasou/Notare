import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from './runtime.mjs';
function uiRuntime() {
 const r=runtime(),events={},messages=[];
 r.context.document.addEventListener=(type,fn)=>{events[type]=fn;};
 const dialog=r.element('#reject-offer-dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;};
 r.setForm('#reject-offer-form',{reason:''}).dataset.businessForm='reject-offer';
 r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});
 r.run(readFileSync(new URL('../business-ui.js',import.meta.url),'utf8'));
 const ui=r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>r.run('saveDatabase()'),refresh:()=>{},navigate:()=>{},notify:text=>messages.push(text),escape:r.context.window.NOTARE_CORE.escapeHtml});
 const invoke=(action,id='oferta-criatividade')=>{const control={dataset:{business:action,id},isConnected:true,focus(){this.focused=true;}};events.click({target:{closest:s=>s==='[data-business]'?control:null}});return control;};
 return {r,ui,events,dialog,invoke,messages};
}
test('Final: códigos visíveis por turma são únicos e não alteram IDs, códigos persistidos ou relações',()=>{
 const r=runtime(),before=r.run('JSON.stringify(db)');
 assert.equal(r.run('studentDisplayCode(getStudent("ana"),db.students)'),'8A02');
 assert.equal(r.run('new Set(db.students.map(student=>studentDisplayCode(student,db.students))).size'),96);
 assert.equal(r.run('db.students.every(student=>/^[6-9][AB]\\d{2}$/.test(studentDisplayCode(student,db.students)))'),true);
 assert.equal(r.run('JSON.stringify(db)'),before);assert.equal(r.run('db.business.families.length'),2);
});
test('Final: posição do código usa a turma completa mesmo em perfil de escopo restrito',()=>{
 const r=runtime();const before=r.run('studentDisplayCode(getStudent("ana"),db.students)');r.run('state.profileId="orientacao"');assert.equal(r.run('studentDisplayCode(getStudent("ana"),db.students)'),before);
 assert.equal(r.run('studentDisplayCode({id:"x",className:"Turma externa",code:"legado"},db.students)'),'legado');
});
test('Final: busca aceita código novo e mantém consulta por código anterior',()=>{
 const r=runtime();r.run('state.registrationClassFilter="todas";state.registrationQuery="8A02";renderRegistrations()');assert.match(r.element('#registration-table').innerHTML,/Ana Souza/);assert.match(r.element('#registration-table').innerHTML,/8A02/);
 r.run('state.registrationQuery="EST-014";renderRegistrations()');assert.match(r.element('#registration-table').innerHTML,/Ana Souza/);
});
test('Final: rotas individuais conservam o ID interno e o formulário mostra nome e código',()=>{
 const r=runtime();r.run('state.currentStudent="lucas";syncStudentContext()');assert.match(r.element('#record-student-context').innerHTML,/Lucas Lima/);
 assert.equal(r.run('routeHash("novo-registro")'),'#novo-registro?estudante=lucas');assert.equal(r.run('routeHash("plano")'),'#plano?estudante=lucas');
});
test('Final atualizado: os quatro indicadores iniciam recolhidos e os detalhes permanecem abertos',()=>{
 const r=runtime();r.run('renderDashboard()');for(const key of ['priority','followup','actions','attendance'])assert.equal(r.element('#dashboard-'+key+'-details').inert,true);
 for(const key of ['agenda','evolution','overview'])assert.equal(r.element('#dashboard-'+key+'-details').inert,false);assert.match(r.element('#dashboard-students').innerHTML,/Ana Souza/);
});

test('Final atualizado: preferência antiga não aplica compactação aos detalhes e escolhas novas persistem',()=>{
 const r=runtime();r.storage.set('notare-dashboard-v2:direcao',JSON.stringify({priority:true,agenda:false}));r.run('ensureDashboardPreferences()');assert.equal(r.run('state.dashboardExpansion.priority'),false);r.run('toggleDashboardPanel("priority")');assert.equal(JSON.parse(r.storage.get('notare-dashboard-v3:direcao')).priority,true);
});

test('Final: calendário não altera conteúdo, expansão nem preferência da Minha agenda',()=>{
 const r=runtime();r.run('renderDashboard();toggleDashboardPanel("agenda")');const agenda=r.element('#agenda-list').innerHTML,prefs=r.storage.get('notare-dashboard-v3:direcao'),before=r.run('JSON.stringify(db)');
 const selectedDate=r.run('dateKey(activeAgenda()[0].scheduledDate)'),expectedTitle=r.run('escapeHtml(activeAgenda()[0].title)');
 r.run(`selectCalendarDate(${JSON.stringify(selectedDate)})`);assert.ok(r.element('#calendar-events').innerHTML.includes(expectedTitle));assert.equal(r.run('state.calendarDate'),selectedDate);assert.equal(r.element('#agenda-list').innerHTML,agenda);assert.equal(r.element('#dashboard-agenda-details').inert,false);assert.equal(r.storage.get('notare-dashboard-v3:direcao'),prefs);assert.equal(r.run('JSON.stringify(db)'),before);
 r.run('selectCalendarDate(dateKey(addDays(activeAgenda().at(-1).scheduledDate,5)))');assert.match(r.element('#calendar-events').innerHTML,/Nenhum compromisso/);assert.equal(r.element('#agenda-list').innerHTML,agenda);assert.equal(r.storage.get('notare-dashboard-v3:direcao'),prefs);assert.equal(r.run('JSON.stringify(db)'),before);
});
test('Final atualizado: expansão individual dos quatro indicadores preserva os dados escolares',()=>{
 const r=runtime();r.run('renderDashboard()');const before=r.run('JSON.stringify(db)');r.run('DASHBOARD_PANELS.forEach(toggleDashboardPanel)');assert.equal(r.run('DASHBOARD_PANELS.every(key=>state.dashboardExpansion[key])'),true);r.run('DASHBOARD_PANELS.forEach(toggleDashboardPanel)');assert.equal(r.run('DASHBOARD_PANELS.every(key=>!state.dashboardExpansion[key])'),true);assert.equal(r.run('JSON.stringify(db)'),before);assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/dashboard-toggle-all/);
});

test('Final: sugestões automáticas preenchidas continuam editáveis e a checkbox desabilita novas inserções',()=>{
 const r=runtime();r.element('#record-auto-suggestion').checked=false;r.run('autoFillRecordSuggestion()');assert.equal(r.form.elements.description.value,'');
 r.element('#record-auto-suggestion').checked=true;r.run('autoFillRecordSuggestion()');assert.match(r.form.elements.description.value,/Ana Souza/);r.form.elements.description.value='Texto revisado manualmente.';r.run('autoFillRecordSuggestion()');assert.equal(r.form.elements.description.value,'Texto revisado manualmente.');assert.equal(r.run('db.records.length'),34);
});
test('Final: mudança de contexto distingue sugestão automática intacta de edição manual',()=>{
 const r=runtime();r.run('autoFillRecordSuggestion()');r.context.window.confirm=()=>false;assert.equal(r.run('confirmRecordContextChange()'),true);
 r.form.elements.description.value='Conteúdo que escrevi.';assert.equal(r.run('confirmRecordContextChange()'),false);assert.equal(r.form.elements.description.value,'Conteúdo que escrevi.');
});
test('Final: descrição da frequência distingue queda, aumento, singular e estabilidade',()=>{
 const r=runtime();assert.equal(r.run('frequencyChangeDescription(-2)'),'queda de 2 pontos percentuais');assert.equal(r.run('frequencyChangeDescription(1)'),'aumento de 1 ponto percentual');assert.equal(r.run('frequencyChangeDescription(0)'),'sem variação');r.run('renderDashboard()');assert.match(r.element('#evolution-summary').textContent,/queda de 2 pontos percentuais desde 05\/08\/2026/);
});
test('Final: parcerias ativas não incluem as três propostas pendentes; aprovação atualiza a lista sem duplicar',()=>{
 const h=uiRuntime();h.ui.render();const active=()=>h.r.element('[data-business-content="parcerias"]').innerHTML.split('<h2>Parceiros cadastrados</h2>')[1];
 assert.match(active(),/Papelaria Horizonte/);assert.doesNotMatch(active(),/Oficina Vagalume/);h.r.run('window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-criatividade",true)');h.ui.render();assert.match(active(),/Oficina Vagalume/);
 const history=h.r.run('db.business.history.length');assert.throws(()=>h.r.run('window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-criatividade",true)'));assert.equal(h.r.run('db.business.history.length'),history);
});
test('Final: cancelar ou pressionar Escape no modal de recusa não altera a oferta',()=>{
 const h=uiRuntime(),before=h.r.run('JSON.stringify(db)'),trigger=h.invoke('open-rejection');assert.equal(h.dialog.open,true);h.r.element('#reject-offer-cancel').listeners.click();assert.equal(h.dialog.open,false);assert.equal(trigger.focused,true);assert.equal(h.r.run('JSON.stringify(db)'),before);
 h.invoke('open-rejection');h.dialog.listeners.cancel({preventDefault(){}});assert.equal(h.dialog.open,false);assert.equal(h.r.run('JSON.stringify(db)'),before);
});
test('Final: recusa exige justificativa e persiste sem ativar a parceria',()=>{
 const h=uiRuntime();h.invoke('open-rejection');const form=h.r.element('#reject-offer-form');form.dataset.id='oferta-criatividade';
 h.events.submit({target:{closest:()=>form},preventDefault(){}});assert.equal(h.r.run('db.business.offers.find(o=>o.id==="oferta-criatividade").status'),'pending');assert.equal(h.dialog.open,true);
 form.elements.reason.value='Condições da oferta precisam ser revistas.';h.events.submit({target:{closest:()=>form},preventDefault(){}});h.r.run('db=loadDatabase()');assert.equal(h.r.run('db.business.offers.find(o=>o.id==="oferta-criatividade").status'),'rejected');assert.match(h.r.run('db.business.offers.find(o=>o.id==="oferta-criatividade").reviewReason'),/precisam/);assert.equal(h.dialog.open,false);
});
test('Final: falha ao salvar recusa preserva oferta, justificativa e modal aberto',()=>{
 const h=uiRuntime();h.invoke('open-rejection');const form=h.r.element('#reject-offer-form');form.dataset.id='oferta-criatividade';form.elements.reason.value='Justificativa fictícia preservada.';h.r.failStorage();h.events.submit({target:{closest:()=>form},preventDefault(){}});assert.equal(h.r.run('db.business.offers.find(o=>o.id==="oferta-criatividade").status'),'pending');assert.equal(h.dialog.open,true);assert.equal(form.elements.reason.value,'Justificativa fictícia preservada.');assert.equal(h.r.element('#reject-offer-error').hidden,false);
});
test('Final: sugestão automática intacta é refeita ao entrar em outro estudante, sem texto cruzado',()=>{
 const r=runtime();r.run('autoFillRecordSuggestion()');assert.match(r.form.elements.description.value,/Ana Souza/);r.run('state.currentStudent="lucas"');r.form.elements.student.value='lucas';r.run('autoFillRecordSuggestion()');assert.match(r.form.elements.description.value,/Lucas Lima/);assert.doesNotMatch(r.form.elements.description.value,/Ana Souza/);
});
test('Final: checkbox de comunicado controla automação e troca de contexto não mistura estudantes',()=>{
 const h=uiRuntime(),form=h.r.setForm('#family-test',{student:'ana',body:''});form.dataset.businessForm='message';const text=form.querySelector('textarea');text.value='';form.elements.body=text;
 const option=form.querySelector('[data-auto-suggestion]');option.checked=false;
 const select=form.elements.student;select.tagName='SELECT';select.closest=()=>form;select.matches=()=>false;
 h.r.context.document.querySelectorAll=selector=>selector==='[data-business-content="familias"] form[data-business-form]'?[form]:[];
 h.ui.prepareSuggestions();assert.equal(text.value,'');option.checked=true;h.ui.prepareSuggestions();assert.match(text.value,/Ana Souza/);
 select.value='lucas';h.events.change({target:select});assert.match(text.value,/Lucas Lima/);assert.doesNotMatch(text.value,/Ana Souza/);
 option.checked=false;option.dataset.autoSuggestion='body';option.closest=()=>form;option.matches=()=>true;h.events.change({target:option});text.value='';select.value='ana';h.events.change({target:select});assert.equal(text.value,'');
});
