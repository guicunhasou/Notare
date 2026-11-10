import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {runtime} from './runtime.mjs';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function businessUI(){
 const r=runtime(),events={};r.context.document.addEventListener=(type,fn)=>events[type]=fn;
 r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});
 const dialog=r.element('#complete-plan-dialog');dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;
 const form=r.setForm('#complete-plan-content form',{plan:'pitch-plan-ana',conclusion:''});form.dataset.businessForm='complete-plan';form.elements.plan.options=[];
 const text=form.querySelector('textarea');text.value='';form.elements.conclusion=text;
 r.run(source('business-ui.js'));
 const ui=r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>r.run('saveDatabase()'),refresh:()=>{},navigate:()=>{},notify:()=>{},escape:r.context.window.NOTARE_CORE.escapeHtml});
 const invoke=action=>{const button={dataset:{business:action},isConnected:true,focus(){this.focused=true;}};events.click({target:{closest:selector=>selector==='[data-business]'?button:null}});return button;};
 return {r,ui,events,dialog,form,invoke};
}
function notices(){
 let now=0,tick=()=>{};const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{hidden:true,textContent:'',listeners:{},attributes:{},setAttribute(key,value){this.attributes[key]=value;},addEventListener(type,fn){this.listeners[type]=fn;},contains(item){return [...nodes.values()].includes(item);},focus(){this.focused=true;}});return nodes.get(key);};
 const root=node('root');root.querySelector=node;const doc={hidden:false,activeElement:null,listeners:{},querySelector:node,addEventListener(type,fn){this.listeners[type]=fn;}};
 const context=vm.createContext({window:{setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=()=>{};}},document:doc});vm.runInContext(source('ui.js'),context);
 return {root,node,doc,api:context.window.NOTARE_UI,advance:ms=>{now+=ms;tick();},clock:()=>now};
}
test('Segunda atualizado: indicadores independentes nunca recolhem os cards detalhados',()=>{
 const r=runtime();r.run('renderDashboard()');const details=r.element('#dashboard-students').innerHTML;assert.equal(r.run('DASHBOARD_PANELS.length'),4);r.run('toggleDashboardPanel("priority")');assert.equal(r.element('#dashboard-priority-details').inert,false);assert.equal(r.element('#dashboard-followup-details').inert,true);r.run('toggleDashboardPanel("priority")');assert.equal(r.element('#dashboard-students').innerHTML,details);for(const key of ['agenda','evolution','overview'])assert.equal(r.element('#dashboard-'+key+'-details').inert,false);
});

test('Segunda: cadastro abre página dinâmica e preserva busca, categoria, filtro e página de retorno',()=>{
 const r=runtime();r.run('state.currentRoute="cadastros";state.registrationQuery="Ana";state.registrationClassFilter="8º A";state.registrationPage=2;state.registrationTab="students";showRoute=(route,options)=>{window.target={route,options}};openStudent("ana")');
 assert.equal(r.context.window.target.route,'estudante');assert.equal(r.context.window.target.options.studentId,'ana');assert.equal(r.run('state.studentReturnContext.registrationQuery'),'Ana');assert.equal(r.run('state.studentReturnContext.registrationPage'),2);
 r.run('renderRegistrations()');assert.match(r.element('#registration-table').innerHTML,/data-student="ana"/);
});
test('Segunda: identidade de contexto usa imagem disponível e avatar de fallback sem buscar foto real',()=>{
 const r=runtime();assert.match(r.run('studentContextMarkup(getStudent("ana"))'),/avatar-sheet/);assert.match(r.run('studentContextMarkup({id:"local",name:"Nome Fictício",className:"6º A",initials:"NF",code:"legado"})'),/student-avatar-fallback/);assert.doesNotMatch(r.run('studentContextMarkup({id:"local",name:"Nome Fictício",className:"6º A",code:"legado"})'),/<img/);
});
test('Segunda: sugestão de recusa não altera dados, exige papel correto e só usa oferta pendente',()=>{
 const r=runtime(),before=r.run('JSON.stringify(db)');assert.match(r.run('window.NOTARE_BUSINESS.rejectionSuggestion(db,getProfile(),"oferta-movimento")'),/Vivência de movimento em família/);assert.equal(r.run('JSON.stringify(db)'),before);assert.throws(()=>r.run('window.NOTARE_BUSINESS.rejectionSuggestion(db,getProfile("parceiro-trilha"),"oferta-movimento")'));assert.throws(()=>r.run('window.NOTARE_BUSINESS.rejectionSuggestion(db,getProfile(),"oferta-material")'));
});
test('Segunda: abrir e cancelar finalização mantém plano e histórico e restaura foco',()=>{
 const h=businessUI(),before=h.r.run('JSON.stringify(db)'),trigger=h.invoke('open-completion');assert.equal(h.dialog.open,true);h.invoke('cancel-completion');assert.equal(h.dialog.open,false);assert.equal(trigger.focused,true);assert.equal(h.r.run('JSON.stringify(db)'),before);
 h.invoke('open-completion');h.dialog.listeners.cancel({preventDefault(){}});assert.equal(h.r.run('JSON.stringify(db)'),before);
});
test('Segunda: confirmar conclusão registra devolutiva e encerra somente a agenda vinculada',()=>{
 const h=businessUI();h.invoke('open-completion');h.form.elements.conclusion.value='Retorno fictício revisado. A equipe concluiu esta etapa e registrou os próximos cuidados.';h.events.submit({target:{closest:()=>h.form},preventDefault(){}});h.r.run('db=loadDatabase()');assert.equal(h.r.run('db.plans.find(p=>p.id==="pitch-plan-ana").status'),'done');assert.equal(h.r.run('db.agenda.find(p=>p.sourcePlanId==="pitch-plan-ana").status'),'done');assert.equal(h.r.run('db.plans.find(p=>p.id==="pitch-plan-lucas").status'),'review');assert.equal(h.dialog.open,false);
});
test('Segunda: falha ao concluir mantém o plano e o texto para correção',()=>{
 const h=businessUI();h.invoke('open-completion');h.form.elements.conclusion.value='Rascunho fictício revisado e preservado.';h.r.failStorage();h.events.submit({target:{closest:()=>h.form},preventDefault(){}});assert.equal(h.r.run('db.plans.find(p=>p.id==="pitch-plan-ana").status'),'active');assert.equal(h.form.elements.conclusion.value,'Rascunho fictício revisado e preservado.');assert.equal(h.dialog.open,true);assert.equal(h.r.element('#complete-plan-error').hidden,false);
});
test('Segunda: aviso comum dura cinco segundos e fechar não oferece desfazer fictício',()=>{
 const n=notices(),ui=n.api.createToastNotice({root:n.root,clock:n.clock});ui.show('Mensagem concluída');n.advance(4999);assert.equal(n.root.hidden,false);n.advance(1);assert.equal(n.root.hidden,true);ui.show('Outra mensagem');n.doc.activeElement=n.node('[data-toast-close]');n.node('[data-toast-close]').listeners.click();assert.equal(n.root.hidden,true);assert.equal(n.node('#main-content').focused,true);
});
test('Segunda: foco e aba oculta dão tempo de leitura ao toast e retomam o prazo restante',()=>{
 const n=notices(),ui=n.api.createToastNotice({root:n.root,clock:n.clock});ui.show('Mensagem');n.advance(1000);n.root.listeners.focusin();n.advance(60000);assert.equal(n.root.hidden,false);n.root.listeners.focusout({relatedTarget:null});n.advance(3999);assert.equal(n.root.hidden,false);n.advance(1);assert.equal(n.root.hidden,true);
 ui.show('Mensagem');n.doc.hidden=true;n.doc.listeners.visibilitychange();n.advance(60000);assert.equal(n.root.hidden,false);n.doc.hidden=false;n.doc.listeners.visibilitychange();n.advance(5000);assert.equal(n.root.hidden,true);
});
test('Segunda: Desfazer tem prazo de cinco segundos e fechar mantém a operação sem outra ação',()=>{
 const r=runtime();assert.equal(r.context.window.NOTARE_OPERATIONS.DURATION,5000);const n=notices(),calls=[];const ui=n.api.createUndoNotice({root:n.root,clock:n.clock,undo:()=>calls.push('undo'),notify:()=>calls.push('notice')});ui.show('Criado',{expiresAt:5000});assert.equal(n.node('[data-undo-action]').focused,true);n.node('[data-undo-close]').listeners.click();assert.equal(n.root.hidden,true);assert.equal(calls.length,0);
});
test('Segunda: exemplos mantêm duas famílias, vínculos válidos e estados de contato diversos',()=>{
 const r=runtime();assert.equal(r.run('db.business.families.length'),2);assert.equal(r.run('db.business.messages.length'),4);assert.equal(r.run('db.business.messages.every(m=>db.business.families.some(f=>f.id===m.familyId&&f.students.includes(m.studentId)))'),true);assert.equal(r.run('db.business.messages.some(m=>!m.readAt)&&db.business.messages.some(m=>m.readAt&&!m.reply)&&db.business.messages.some(m=>m.reply)'),true);assert.equal(r.run('db.business.redemptions.length'),0);
 assert.equal(r.run('db.agenda.filter(a=>a.id?.startsWith("pitch-")).every(a=>db.plans.some(p=>p.id===a.sourcePlanId&&p.studentId===a.studentId&&p.date===a.date&&p.ownerId===a.ownerId))'),true);
});
test('Segunda: atualização aditiva não substitui decisões, anulações, mensagens ou ofertas locais',()=>{
 const r=runtime();r.run(`delete db.business.presentationRevision;db.records[0].voidedAt='2026-11-09T10:00:00Z';db.business.messages[0].body='Edição fictícia preservada';db.business.offers.find(o=>o.id==='pitch-oferta-alimentabem').status='paused';saveDatabase();db=loadDatabase();db=loadDatabase()`);assert.ok(r.run('db.records[0].voidedAt'));assert.equal(r.run('db.business.messages.find(m=>m.id==="pitch-msg-ana-2").body'),'Edição fictícia preservada');assert.equal(r.run('db.business.offers.find(o=>o.id==="pitch-oferta-alimentabem").status'),'paused');assert.equal(r.run('new Set(db.business.messages.map(m=>m.id)).size'),4);assert.equal(JSON.parse(r.storage.get('notare-database-v7')).business.presentationRevision,1);
 r.run('db.business.messages=db.business.messages.filter(m=>m.id!=="pitch-msg-ana-2");db.records=db.records.filter(r=>r.id!=="pitch-record-ana");saveDatabase();db=loadDatabase()');assert.equal(r.run('db.business.messages.some(m=>m.id==="pitch-msg-ana-2")'),false);assert.equal(r.run('db.records.some(r=>r.id==="pitch-record-ana")'),false);
});
test('Segunda: HTML mantém navegação antes do conteúdo e controles de sugestão únicos e nativos',()=>{
 const html=source('index.html');assert.ok(html.indexOf('<div class="journey-meta">')<html.indexOf('<div class="journey-stage">'));assert.doesNotMatch(html,/id="record-suggestion" type="button"/);assert.match(html,/id="record-auto-suggestion" type="checkbox" checked/);assert.doesNotMatch(html,/Dados de exemplo, armazenados neste navegador/);assert.match(html,/id="complete-plan-dialog"/);
});
