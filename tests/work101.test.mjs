import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from './runtime.mjs';

// Recria os formulários após cada refresh, como o innerHTML real faz no navegador.
// Regras, handlers, transações e proteção de navegação são os controladores reais.
function harness({profile='familia-ana', deferred=false} = {}) {
  const r=runtime({now:'2026-11-17T12:00:00-03:00'}), events={}, notices=[];
  r.run(`window.NOTARE_BUSINESS.sendMessage(db,getProfile('direcao'),'ana','Comunicado fictício para verificar rascunhos independentes.');state.profileId=${JSON.stringify(profile)};state.currentRoute=${JSON.stringify(profile==='familia-ana'?'familia':'familias')}`);
  const select=r.context.document.querySelector, selectAll=r.context.document.querySelectorAll;
  const dialog=r.element('#complete-plan-dialog');dialog.open=false;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;};
  r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});
  let generation=0, forms=[], api, finish, pending;
  const message=()=>forms.find(f=>f.dataset.businessForm==='message');
  const completion=()=>forms.find(f=>f.dataset.businessForm==='complete-plan');
  const reply=id=>forms.find(f=>f.dataset.businessForm==='reply'&&f.dataset.id===id);
  const activeForms=()=>r.run('state.currentRoute')==='familia'?forms.filter(f=>f.dataset.businessForm==='reply'):
    r.run('state.currentRoute')==='familias'?forms.filter(f=>f.dataset.businessForm==='message'):[];
  const openForms=()=>dialog.open&&completion()?[completion()]:[];
  function make(type,id,values,options={}) {
    const form=r.setForm(`#work101-${generation}-${type}-${id}`,values);form.dataset={businessForm:type,...(id?{id}:{})};
    for(const [name,field] of Object.entries(form.elements)) Object.assign(field,{name,tagName:options[name]?'SELECT':'TEXTAREA',...(options[name]?{options:options[name].map(value=>({value}))}:{})});
    const text=form.elements.body||form.elements.conclusion||form.elements.reply;
    const status=type==='reply'?null:{hidden:true,textContent:''};
    const option={checked:true,dataset:{autoSuggestion:type==='message'?'body':'conclusion'}};
    form.querySelector=selector=>selector==='textarea'?text:selector==='[data-auto-suggestion]'?option:selector==='[data-suggestion-status]'?status:null;
    form.querySelectorAll=selector=>selector==='select,textarea'?Object.values(form.elements):[];
    forms.push(form);return form;
  }
  function rebuild() {
    generation++;forms=[];
    const actor=r.run('getProfile()'), db=r.run('db');
    if(actor.permissions.includes('family:view')) {
      for(const m of db.business.messages.filter(m=>m.familyId===actor.id&&!m.reply&&!m.cancelledAt))make('reply',m.id,{reply:''});
    }
    if(actor.permissions.includes('families:manage'))make('message','',{student:'ana',body:''},{student:['ana','lucas']});
    if(actor.permissions.includes('plans:create')) {
      const ids=JSON.parse(r.run('JSON.stringify(visiblePlans().filter(p=>!p.voidedAt&&p.status!=="done").map(p=>p.id))'));
      make('complete-plan','',{plan:ids[0]||'',conclusion:''},{plan:ids});
    }
  }
  r.context.document.querySelector=selector=>{
    if(selector==='[data-business-form="message"] select[name="student"]')return message()?.elements.student||null;
    if(selector==='#complete-plan-content select[name="plan"]')return completion()?.elements.plan||null;
    if(selector==='#complete-plan-content form')return completion()||null;
    if(selector==='#family-selected-context')return message()?r.element(selector):null;
    if(selector==='#completion-selected-context')return completion()?r.element(selector):null;
    return select(selector);
  };
  r.context.document.querySelectorAll=selector=>{
    if(selector==='.view.active [data-business-form]')return activeForms();
    if(selector==='#complete-plan-dialog[open] [data-business-form]')return openForms();
    if(selector==='.view.active [data-business-form], dialog[open] [data-business-form]')return [...activeForms(),...openForms()];
    if(selector==='[data-business-form]')return forms;
    if(selector==='[data-business-content="familias"] form[data-business-form]')return message()?[message()]:[];
    if(selector==='#complete-plan-content form[data-business-form]')return completion()?[completion()]:[];
    return selectAll(selector);
  };
  r.context.document.addEventListener=(type,fn)=>{events[type]=fn;};
  const baseline=form=>{r.context.baselineForm=form;r.run('businessFormBaselines.set(baselineForm,formSnapshot(baselineForm))');};
  const refresh=()=>{rebuild();api.render();r.run('captureBusinessFormBaselines()');};
  r.run(readFileSync(new URL('../business-ui.js',import.meta.url),'utf8'));
  api=r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>r.run('saveDatabase()'),
    ...(deferred?{transaction:fn=>{pending=new Promise((resolve,reject)=>{finish=()=>{try{r.context.pendingMutation=fn;resolve(r.run('withDatabaseWrite(()=>pendingMutation(db,getProfile()))'));}catch(error){reject(error);}};});return pending;}}:{}),
    refresh,navigate:route=>r.run(`showRoute(${JSON.stringify(route)})`),notify:(text)=>notices.push(text),draftReady:baseline,
    selectedStudent:()=>r.run('state.currentStudent'),escape:r.context.window.NOTARE_CORE.escapeHtml,
    studentIdentity:(student,prefix)=>{r.context.identityStudent=student;r.context.identityPrefix=prefix;r.run('window.identityMarkup=studentContextMarkup(identityStudent,identityPrefix)');return r.context.window.identityMarkup;}});
  r.context.refreshForTest=refresh;
  r.run('renderAll=refreshForTest;resetProfileNotifications=()=>{};startProfileNotifications=()=>{}');
  for(const route of ['familia','familias','clube','painel']) {r.context.testView=r.element('#view-'+route);r.context.testView.dataset.view=route;r.run('views.push(testView)');}
  refresh();
  const click=(action,id='')=>events.click({target:{closest:selector=>selector==='[data-business]'?{dataset:{business:action,id}}:null}});
  const submit=form=>events.submit({target:{closest:()=>form},preventDefault(){}});
  const changeStudent=(form,id)=>{form.elements.student.value=id;const target=form.elements.student;target.closest=()=>form;target.matches=()=>false;events.change({target});};
  return {r,api,events,notices,message,completion,reply,dialog,click,submit,changeStudent,
    ids:()=>forms.filter(f=>f.dataset.businessForm==='reply').map(f=>f.dataset.id),
    context:()=>r.element('#family-selected-context').innerHTML,
    dirty:()=>r.run('hasUnsavedBusinessForm()'),
    release:async()=>{finish();await pending;await Promise.resolve();}};
}

test('W101 F01: confirmar leitura preserva respostas por ID após reconstruir o DOM',()=>{
  const h=harness(),[a,b]=h.ids();h.reply(a).elements.reply.value='Resposta A ainda em revisão.';h.reply(b).elements.reply.value='Resposta B ainda em revisão.';
  const old=h.reply(a);h.click('ack',b);
  assert.notEqual(h.reply(a),old,'o teste realmente reconstrói os formulários');
  assert.equal(h.reply(a).elements.reply.value,'Resposta A ainda em revisão.');assert.equal(h.reply(b).elements.reply.value,'Resposta B ainda em revisão.');
  assert.equal(h.r.run(`db.business.messages.find(m=>m.id===${JSON.stringify(a)}).reply`),null);
  assert.ok(h.r.run(`db.business.messages.find(m=>m.id===${JSON.stringify(b)}).readAt`));assert.equal(h.dirty(),true);
});
test('W101 F01: enviar B preserva o texto de A sem atribuir a resposta ao comunicado errado',()=>{
  const h=harness(),[a,b]=h.ids();h.reply(a).elements.reply.value='Rascunho A reservado ao primeiro comunicado.';h.reply(b).elements.reply.value='Resposta B revisada para envio.';h.submit(h.reply(b));
  assert.equal(h.reply(a).elements.reply.value,'Rascunho A reservado ao primeiro comunicado.');assert.equal(h.reply(b),undefined);
  assert.equal(h.r.run(`db.business.messages.find(m=>m.id===${JSON.stringify(b)}).reply`),'Resposta B revisada para envio.');
  assert.equal(h.r.run(`db.business.messages.find(m=>m.id===${JSON.stringify(a)}).reply`),null);assert.equal(h.dirty(),true);
});
test('W101 F01: falha de gravação mantém resposta, rascunho vizinho e estado anterior',()=>{
  const h=harness(),[a,b]=h.ids();h.reply(a).elements.reply.value='Rascunho A preservado.';h.reply(b).elements.reply.value='Resposta B não pode sumir.';
  const before=h.r.run('JSON.stringify(db)');h.r.failStorage();h.submit(h.reply(b));
  assert.equal(h.reply(a).elements.reply.value,'Rascunho A preservado.');assert.equal(h.reply(b).elements.reply.value,'Resposta B não pode sumir.');assert.equal(h.r.run('JSON.stringify(db)'),before);
});
test('W101 F01: escrita assíncrona preserva a última edição feita enquanto aguarda',async()=>{
  const h=harness({deferred:true}),[a,b]=h.ids();h.reply(a).elements.reply.value='Primeira versão do rascunho.';h.click('ack',b);
  h.reply(a).elements.reply.value='Última edição enquanto a gravação aguardava.';await h.release();
  assert.equal(h.reply(a).elements.reply.value,'Última edição enquanto a gravação aguardava.');assert.equal(h.dirty(),true);
});
test('W101 F01: cancelar troca de perfil mantém autor e resposta não enviada',()=>{
  const h=harness(),[a]=h.ids();h.reply(a).elements.reply.value='Texto reservado à família de Ana.';h.r.run('window.confirm=()=>false;switchProfile("familia-lucas")');
  assert.equal(h.r.run('state.profileId'),'familia-ana');assert.equal(h.reply(a).elements.reply.value,'Texto reservado à família de Ana.');assert.equal(h.dirty(),true);
});
test('W101 F01: descarte explícito troca perfil sem transferir rascunho a outra família',()=>{
  const h=harness(),[a]=h.ids();const old=h.reply(a);old.elements.reply.value='Texto privado do perfil anterior.';
  h.r.run('window.confirm=()=>true;switchProfile("familia-lucas")');
  assert.equal(h.r.run('state.profileId'),'familia-lucas');assert.equal(old.elements.reply.value,'');
  for(const id of h.ids())assert.equal(h.reply(id).elements.reply.value,'');assert.equal(h.dirty(),false);
});
test('W101 F01: navegação cancelada preserva rota e resposta; descarte confirmado não ressuscita texto',()=>{
  const h=harness(),[a]=h.ids();h.reply(a).elements.reply.value='Resposta que ainda precisa de revisão.';h.r.run('window.confirm=()=>false');
  assert.equal(h.r.run('showRoute("clube")'),false);assert.equal(h.r.run('state.currentRoute'),'familia');assert.equal(h.reply(a).elements.reply.value,'Resposta que ainda precisa de revisão.');
  h.r.run('window.confirm=()=>true');assert.equal(h.r.run('showRoute("clube")'),true);assert.equal(h.reply(a).elements.reply.value,'');
  assert.equal(h.r.run('showRoute("familia")'),true);assert.equal(h.reply(a).elements.reply.value,'');assert.equal(h.dirty(),false);
});
test('W101 F07: renderização já preenche identidade com nome, mídia e turma',()=>{
  const h=harness({profile:'direcao'});assert.match(h.context(),/Ana Souza/);assert.match(h.context(),/8º A/);assert.match(h.context(),/ana-souza-oficial\.png/);
});
test('W101 F07: enviar para Lucas mantém seleção e identidade sem reenviar o texto',()=>{
  const h=harness({profile:'direcao'});h.message().elements.student.value='lucas';h.message().elements.body.value='Comunicado manual específico para Lucas.';h.submit(h.message());
  assert.equal(h.message().elements.student.value,'lucas');assert.equal(h.message().elements.body.value,'');assert.match(h.context(),/Lucas Lima/);assert.match(h.context(),/9º A/);assert.doesNotMatch(h.context(),/Ana Souza/);
  assert.equal(h.r.run('db.business.messages[0].studentId'),'lucas');assert.equal(h.r.run('db.business.messages[0].body'),'Comunicado manual específico para Lucas.');assert.equal(h.dirty(),false,'envio concluído não deixa um falso rascunho pela seleção preservada');
});
test('W101 F07: concluir plano mantém comunicado manual e identidade do estudante selecionado',()=>{
  const h=harness({profile:'direcao'});h.message().elements.student.value='lucas';h.message().elements.body.value='Texto manual para Lucas que não pode virar sugestão.';
  const form=h.completion();h.dialog.open=true;form.elements.plan.value='pitch-plan-ana';form.elements.conclusion.value='Conclusão fictícia revisada para Ana.';h.submit(form);
  assert.equal(h.r.run('db.plans.find(p=>p.id==="pitch-plan-ana").status'),'done');assert.equal(h.message().elements.student.value,'lucas');assert.equal(h.message().elements.body.value,'Texto manual para Lucas que não pode virar sugestão.');assert.match(h.context(),/Lucas Lima/);assert.match(h.context(),/9º A/);assert.equal(h.dirty(),true);
  h.api.prepareSuggestions('ana');assert.equal(h.message().elements.body.value,'Texto manual para Lucas que não pode virar sugestão.');assert.equal(h.message().elements.student.value,'lucas');
});
test('W101 F07: sugestão preservada continua automática e não gera falso rascunho após atualizar',()=>{
  const h=harness({profile:'direcao'});h.api.prepareSuggestions('lucas');const body=h.message().elements.body.value;assert.match(body,/Lucas Lima/);
  const form=h.completion();h.dialog.open=true;form.elements.plan.value='pitch-plan-ana';form.elements.conclusion.value='Conclusão fictícia revisada para Ana.';h.submit(form);
  assert.equal(h.message().elements.body.value,body);assert.equal(h.dirty(),false);
  h.changeStudent(h.message(),'ana');assert.match(h.message().elements.body.value,/Ana Souza/);assert.doesNotMatch(h.message().elements.body.value,/Lucas Lima/);assert.match(h.context(),/Ana Souza/);
});
test('W101 F07: aviso de contexto alterado acompanha o rascunho após atualização',()=>{
  const h=harness({profile:'direcao'});h.message().elements.body.value='Texto manual escrito sobre Ana.';h.changeStudent(h.message(),'lucas');
  const form=h.completion();h.dialog.open=true;form.elements.plan.value='pitch-plan-ana';form.elements.conclusion.value='Conclusão fictícia revisada para Ana.';h.submit(form);
  assert.equal(h.message().elements.body.value,'Texto manual escrito sobre Ana.');assert.equal(h.message().querySelector('[data-suggestion-status]').hidden,false);assert.match(h.message().querySelector('[data-suggestion-status]').textContent,/Contexto alterado/);assert.match(h.context(),/Lucas Lima/);
});

for(const now of ['2026-11-10T12:00:00-03:00','2026-11-17T12:00:00-03:00','2027-01-04T12:00:00-03:00'])test(`W101 F03: calendário reagenda vencidos em ${now.slice(0,10)} sem mudar prazo original`,()=>{
  const r=runtime({now});const expected=r.run('dateKey(startOfAgenda(new Date()))');
  r.run('db.agenda.find(a=>a.id==="pitch-agenda-ana").date="2026-11-09";renderDashboard()');
  assert.equal(r.run('dateKey(activeAgenda().find(a=>a.id==="pitch-agenda-ana").scheduledDate)'),expected);
  r.run(`selectCalendarDate(${JSON.stringify(expected)})`);assert.match(r.element('#calendar-events').innerHTML,/Revisar combinados de Ana/);
  assert.equal(r.run('db.agenda.find(a=>a.id==="pitch-agenda-ana").date'),'2026-11-09');assert.match(r.element('#agenda-list').innerHTML,/Prazo original 09\/11\/2026/);
});
