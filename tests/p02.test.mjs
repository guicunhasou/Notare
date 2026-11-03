import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { runtime } from './runtime.mjs';

function prepare(r) {
  r.run('renderAll=()=>{}; showRoute=()=>true; renderRecordTemplates=()=>{}; state.currentRoute="registros"');
}
function saveRecord(r) {
  prepare(r);
  r.form.elements.description.value = 'Texto original e revisado para preservar no histórico.';
  r.form.elements.followup.value = 'on';
  r.submit('#record-form');
  return r.context.window.lastUndo;
}
function savePlan(r) {
  prepare(r);
  const date = r.run('dateKey(addBusinessDays(startOfAgenda(new Date()),2))');
  r.setForm('#plan-form',{type:'Conversa de acolhimento',owner:'direcao',date,notes:'Objetivo de exemplo para validar reversão íntegra.',family:'on'});
  r.submit('#plan-form');
  return r.context.window.lastUndo;
}

test('P02 A1: o container completo só é oculto na consulta individual', () => {
  const r = runtime();
  r.run('state.recordsStudentId="ana"; renderRecords()');
  assert.equal(r.element('#records-filters').hidden,true);
  assert.match(r.element('#registros-title').textContent,/Ana Souza/);
  assert.equal(r.element('#records-back').hidden,false);
  r.run('state.recordsStudentId=null; renderRecords()');
  assert.equal(r.element('#records-filters').hidden,false);
});

test('P02 A2: desfazer registro mantém original, autoria e anulação após recarregar', () => {
  const r=runtime(); const op=saveRecord(r);
  const original=r.run('db.records[0].description');
  r.context.window.undoOptions.undo(op);
  const loaded=r.run('loadDatabase()');
  assert.equal(loaded.records[0].description,original);
  assert.equal(loaded.records[0].ownerId,'direcao');
  assert.equal(loaded.records[0].voidedById,'direcao');
  assert.ok(loaded.records[0].voidedAt);
  assert.equal(loaded.business.history[0].action,'annul-creation');
  assert.throws(()=>r.context.window.undoOptions.undo(op),/não está mais disponível/);
});

test('P02 A2: desfazer plano anula agenda e comunicado sem excluir conteúdo', () => {
  const r=runtime(); const op=savePlan(r);
  r.context.window.undoOptions.undo(op);
  assert.equal(r.run('db.plans[0].status'),'cancelled');
  assert.equal(r.run('db.agenda[0].status'),'cancelled');
  assert.ok(r.run('db.business.messages[0].cancelledAt'));
  assert.match(r.run('db.business.messages[0].body'),/A escola organizou/);
  assert.equal(r.run('window.NOTARE_BUSINESS.communicationStatus(db,"ana")'),null);
  assert.throws(()=>r.run('window.NOTARE_BUSINESS.completePlan(db,getProfile(),db.plans[0].id,"Conclusão que não deve ocorrer.")'),/não está disponível/);
  assert.throws(()=>r.run('window.NOTARE_BUSINESS.respondMessage(db,getProfile("familia-ana"),db.business.messages[0].id,"Resposta que não deve ocorrer.")'),/não disponível/);
  assert.equal(r.run('createdPlanForScope(db.plans, db.plans[0].id, ["ana"])'),null);
});

test('P02 A2: comunicado lido impede a reversão integral sem alterar a base', () => {
  const r=runtime(); const op=savePlan(r);
  r.run('db.business.messages[0].readAt=new Date().toISOString(); saveDatabase()');
  const before=r.run('JSON.stringify(db)');
  assert.throws(()=>r.context.window.undoOptions.undo(op),/já foi lido ou respondido/);
  assert.equal(r.run('JSON.stringify(db)'),before);
});

test('P02 A2: plano concluído e comunicado respondido impedem desfazer', () => {
  for (const continuation of ['db.plans[0].status="done"','db.business.messages[0].reply="Resposta familiar"']) {
    const r=runtime(); const op=savePlan(r);
    r.run(`${continuation}; saveDatabase()`);
    const before=r.run('JSON.stringify(db)');
    assert.throws(()=>r.context.window.undoOptions.undo(op),/continuidade|lido ou respondido/);
    assert.equal(r.run('JSON.stringify(db)'),before);
  }
});

test('P02 A2: expiração, troca de autor e token incorreto não alteram dados', () => {
  for (const change of [op=>({...op,expiresAt:Date.now()-1}),op=>({...op,actorId:'orientacao'}),op=>({...op,token:'outro-token'})]) {
    const r=runtime(); const op=saveRecord(r); const before=r.run('JSON.stringify(db)');
    assert.throws(()=>r.context.window.undoOptions.undo(change(op)));
    assert.equal(r.run('JSON.stringify(db)'),before);
  }
});

test('P02 A2: falha ao persistir o desfazer mantém a operação e o armazenamento íntegros', () => {
  const r=runtime(); const op=savePlan(r);
  const before=r.run('JSON.stringify(db)');
  const stored=r.storage.get('notare-database-v7');
  r.failStorage();
  assert.throws(()=>r.context.window.undoOptions.undo(op),/Não foi possível desfazer/);
  assert.equal(r.run('JSON.stringify(db)'),before);
  assert.equal(r.storage.get('notare-database-v7'),stored);
});

test('P02 A2: alteração em outra aba impede sobreposição de dados', () => {
  const r=runtime(); const op=saveRecord(r);
  const stored=JSON.parse(r.storage.get('notare-database-v7')); stored.business.history.push({id:'outra-aba'});
  r.storage.set('notare-database-v7',JSON.stringify(stored));
  assert.throws(()=>r.context.window.undoOptions.undo(op),/mudaram em outra aba/);
  assert.equal(JSON.parse(r.storage.get('notare-database-v7')).business.history.at(-1).id,'outra-aba');
});

function notice() {
  let now=0, tick=()=>{}, calls=[];
  const nodes=new Map();
  const node=key=>{
    if(!nodes.has(key)) nodes.set(key,{hidden:true,textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},contains(other){return [...nodes.values()].includes(other);},focus(){}});
    return nodes.get(key);
  };
  const root=node('root'); root.querySelector=node;
  const document={hidden:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},querySelector:node};
  const context=vm.createContext({window:{setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=()=>{};}},document});
  vm.runInContext(fs.readFileSync(new URL('../ui.js',import.meta.url),'utf8'),context);
  let fail=false;
  const ui=context.window.NOTARE_UI.createUndoNotice({root,clock:()=>now,undo:op=>{if(fail)throw new Error('Falha de gravação');calls.push(op);},notify:message=>calls.push(message)});
  return {ui,node,root,document,calls,advance:ms=>{now+=ms;tick();},fail:()=>{fail=true;}};
}

test('P02 A2: aviso expira em 60 segundos e não permite ação posterior', () => {
  const n=notice();n.ui.show('Registro salvo',{expiresAt:60000});
  n.advance(59999);assert.equal(n.root.hidden,false);
  n.advance(1);assert.equal(n.root.hidden,true);
  n.node('[data-undo-action]').listeners.click();
  assert.equal(n.calls.filter(x=>typeof x==='object').length,0);
});

test('P02 A2: foco pausa o prazo e permite desfazer sem limite de leitura', () => {
  const n=notice();n.ui.show('Registro salvo',{expiresAt:60000});
  n.advance(55000);n.root.listeners.focusin();n.advance(120000);
  assert.equal(n.root.hidden,false);
  assert.match(n.node('[data-undo-time]').textContent,/pausado/);
  n.node('[data-undo-action]').listeners.click();
  assert.equal(n.calls[0].expiresAt,180000);
  assert.equal(n.root.hidden,true);
});

test('P02 A2: aviso pausa na aba oculta e retoma com o tempo restante', () => {
  const n=notice();n.ui.show('Registro salvo',{expiresAt:60000});n.advance(10000);
  n.document.hidden=true;n.document.listeners.visibilitychange();n.advance(180000);
  assert.equal(n.root.hidden,false);
  n.document.hidden=false;n.document.listeners.visibilitychange();n.advance(49999);
  assert.equal(n.root.hidden,false);n.advance(1);assert.equal(n.root.hidden,true);
});

test('P02 A2: falha em desfazer mantém o aviso para uma nova tentativa', () => {
  const n=notice();n.ui.show('Plano salvo',{expiresAt:60000});n.fail();
  n.node('[data-undo-action]').listeners.click();
  assert.equal(n.root.hidden,false);assert.equal(n.calls[0],'Falha de gravação');
});

test('P02 D: preferência por movimento reduzido conclui a etapa sem digitação', async () => {
  const r=runtime();
  r.run('state.currentRoute="jornada"; journeyReducedMotion=true; renderJourney=()=>{}; window.finished=0; completeJourneyPreview=()=>{window.finished++}');
  await r.run('playJourneyStep()');
  assert.equal(r.context.window.finished,1);
  assert.equal(r.run('journeyRunning'),false);
  assert.equal(r.run('journeyStepComplete'),true);
});


test('P02 A2: aviso de acompanhamento ignora plano anulado', () => {
  const r=runtime(); const op=savePlan(r); r.context.window.undoOptions.undo(op);
  const result=r.run('profileNotificationTemplates()');
  assert.ok(!result.some(notification => notification.id.endsWith(op.id)));
});


test('P02 A2: desfazer não apaga um comunicado ainda em edição', () => {
  const r=runtime(); const op=saveRecord(r);
  const form=r.setForm('#business-message',{body:''});
  r.context.window.editingBusinessForm=form;
  r.run('document.querySelectorAll=selector => selector.includes("data-business-form") ? [window.editingBusinessForm] : []; captureBusinessFormBaselines()');
  form.elements.body.value='Comunicado que ainda está em edição.';
  const before=r.run('JSON.stringify(db)');
  assert.throws(()=>r.context.window.undoOptions.undo(op),/Conclua ou cancele/);
  assert.equal(r.run('JSON.stringify(db)'),before);
  assert.equal(form.elements.body.value,'Comunicado que ainda está em edição.');
});
