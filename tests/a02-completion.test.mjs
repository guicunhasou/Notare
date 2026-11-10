import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from './runtime.mjs';

const summary = r => JSON.parse(r.run('JSON.stringify(completionSummary(visibleStudents(),visiblePlans()))'));
const complete = (r, id = 'plan-007') => r.run(`withDatabaseWrite(() => window.NOTARE_BUSINESS.completePlan(db,getProfile(),${JSON.stringify(id)},'Resultado revisado pela equipe e registrado para encerramento.'))`);
const persisted = r => r.storage.get('notare-database-v7');
const current = r => JSON.parse(r.run('JSON.stringify(db)'));

test('A02: reproduz 31 e atualiza ações, casos com retorno e painel ao concluir plano', () => {
  const r=runtime();
  assert.deepEqual(summary(r),{completed:31,casesWithReturn:18});
  r.run('renderDashboard()');
  assert.match(r.element('.status-bars').attributes['aria-label'],/31 ações concluídas/);
  assert.equal(r.element('.outcome-ring strong').textContent,'19%');
  complete(r);
  r.run('renderDashboard()');
  assert.deepEqual(summary(r),{completed:32,casesWithReturn:19});
  assert.match(r.element('.status-bars').attributes['aria-label'],/32 ações concluídas/);
  assert.equal(r.element('.outcome-ring strong').textContent,'20%');
  assert.match(r.element('#overview-summary').textContent,/20% dos casos/);
});

test('A02: concluir plano ativo reduz abertos e preserva agenda, devolutiva e históricos', () => {
  const r=runtime(), before=current(r);
  r.run(`db.agenda.push({id:'agenda-a02',studentId:'luana',sourcePlanId:'plan-007',status:'active'});db.plans.find(p=>p.id==='plan-007').status='active';db.plans.find(p=>p.id==='plan-007').date='2099-12-31'`);
  assert.equal(r.run(`visiblePlans().filter(p=>planEffectiveStatus(p,new Date())==='active').length`),2);
  complete(r);
  const after=current(r), plan=after.plans.find(p=>p.id==='plan-007');
  assert.equal(plan.status,'done');assert.ok(plan.completedAt);assert.ok(plan.conclusion);
  assert.equal(r.run(`visiblePlans().filter(p=>planEffectiveStatus(p,new Date())==='active').length`),1);
  assert.equal(after.agenda.find(a=>a.id==='agenda-a02').status,'done');
  assert.deepEqual(after.agenda.filter(a=>a.id!=='agenda-a02'),before.agenda);
  assert.deepEqual(after.records.slice(1),before.records);
  assert.equal(after.records[0].sourcePlanId,plan.id);assert.equal(after.records[0].kind,'Devolutiva');
  assert.equal(after.business.history.length,before.business.history.length+1);
  assert.deepEqual(after.business.history.slice(1),before.business.history);
  const oldStudent=before.students.find(s=>s.id==='luana'), student=after.students.find(s=>s.id==='luana');
  assert.deepEqual(student.timeline.slice(1),oldStudent.timeline);
  assert.deepEqual({...student,timeline:oldStudent.timeline},oldStudent,'não altera saldo histórico, frequência ou prioridade');
  assert.deepEqual(after.students.filter(s=>s.id!=='luana'),before.students.filter(s=>s.id!=='luana'));
});

test('A02: várias ações do mesmo estudante somam ações, mas somente um caso com retorno', () => {
  const r=runtime();
  complete(r);
  r.run(`db.plans.push({...db.plans.find(p=>p.id==='plan-007'),id:'plan-a02-second',status:'active',completedAt:undefined})`);
  complete(r,'plan-a02-second');
  assert.deepEqual(summary(r),{completed:33,casesWithReturn:19});
  complete(r,'plan-001');
  assert.deepEqual(summary(r),{completed:34,casesWithReturn:19},'estudante com saldo anterior não duplica casos');
});

test('A02: nova recarga e tentativa duplicada não recontam conclusão', () => {
  const r=runtime();complete(r);
  const raw=persisted(r);
  assert.throws(()=>complete(r),/não está disponível/);
  assert.equal(persisted(r),raw);
  for(let i=0;i<3;i++) {
    const reload=runtime({sharedStorage:r.storage});
    assert.deepEqual(summary(reload),{completed:32,casesWithReturn:19});
    reload.run('renderDashboard()');
    assert.equal(persisted(reload),raw,'cálculo e carregamento não gravam contadores');
  }
});

test('A02: conclusões anteriores ao patch são lidas sem migração nem novo evento', () => {
  const r=runtime();complete(r);
  const legacy=current(r), raw=JSON.stringify(legacy), oldHistory=legacy.business.history;
  // Mesmo formato persistido pelo completePlan anterior: sem campo de migração A02.
  const restored=runtime({sharedStorage:new Map([['notare-database-v7',raw]])});
  assert.deepEqual(summary(restored),{completed:32,casesWithReturn:19});
  assert.deepEqual(current(restored).business.history,oldHistory);
  assert.equal(persisted(restored),raw);
});

test('A02: anulados, cancelados e planos abertos não contam, mesmo com data antiga de conclusão', () => {
  const r=runtime();
  r.run(`db.plans.push(
    {id:'voided',studentId:'luana',status:'done',completedAt:'2026-11-01',voidedAt:'2026-11-02'},
    {id:'cancelled',studentId:'luana',status:'cancelled',completedAt:'2026-11-01'},
    {id:'open',studentId:'luana',status:'active',completedAt:'2026-11-01'})`);
  assert.deepEqual(summary(r),{completed:31,casesWithReturn:18});
  assert.throws(()=>complete(r,'voided'),/não está disponível/);
});

test('A02: uma mesma conclusão por ID não duplica; vínculo fora do escopo não contribui', () => {
  const r=runtime();complete(r);
  r.run(`db.plans.push({...db.plans.find(p=>p.id==='plan-007')},{id:'orphan',studentId:'inexistente',status:'done'})`);
  assert.deepEqual(summary(r),{completed:32,casesWithReturn:19});
});

test('A02: registros, mensagens e planos criados/anulados não são conclusões adicionais', () => {
  const r=runtime();
  r.run(`window.NOTARE_BUSINESS.sendMessage(db,getProfile(),'ana','Mensagem sobre os combinados com a família.');db.records.push({id:'only-record',studentId:'luana',kind:'Devolutiva'});db.plans.push({id:'only-plan',studentId:'luana',status:'active',ownerId:getProfile().id})`);
  assert.deepEqual(summary(r),{completed:31,casesWithReturn:18});
  r.run(`window.NOTARE_OPERATIONS.annulCreation(db,getProfile(),window.NOTARE_OPERATIONS.offer('plan',db.plans.find(p=>p.id==='only-plan'),getProfile().id))`);
  assert.deepEqual(summary(r),{completed:31,casesWithReturn:18});
});

for (const profile of ['direcao','coordenacao','orientacao','docencia','secretaria','familia-ana','parceiro-papelaria']) {
  test(`A02: indicadores respeitam estudantes visíveis para ${profile}`, () => {
    const r=runtime();complete(r);complete(r,'pitch-plan-ana');
    r.run(`state.profileId=${JSON.stringify(profile)}`);
    const students=JSON.parse(r.run('JSON.stringify(visibleStudents())'));
    const ids=new Set(students.map(s=>s.id));
    assert.deepEqual(summary(r),{
      completed:students.reduce((n,s)=>n+s.actionsCompleted,0)+Number(ids.has('luana'))+Number(ids.has('ana')),
      casesWithReturn:students.filter(s=>s.actionsCompleted>0 || s.id==='luana').length
    });
  });
}

test('A02: falha ao persistir conclusão reverte plano, agenda, histórico e indicadores juntos', () => {
  const r=runtime();
  r.run('withDatabaseWrite(()=>{})');
  const before=persisted(r), indicators=summary(r);
  r.failStorage();
  assert.throws(()=>complete(r),/Armazenamento indisponível/);
  assert.equal(persisted(r),before);assert.equal(JSON.stringify(current(r)),before);
  assert.deepEqual(summary(r),indicators);
});

test('A02: transação A01 bloqueia conclusão desatualizada sem perder a primeira e seus indicadores', async () => {
  let tail=Promise.resolve();
  const locks={request(_name,_options,fn){const next=tail.then(()=>fn());tail=next.catch(()=>{});return next;}};
  const storage=new Map(), a=runtime({sharedStorage:storage,locks}), b=runtime({sharedStorage:storage,locks});
  await complete(a);
  const raw=persisted(a);
  await assert.rejects(complete(b,'plan-001'),/outra aba/);
  assert.equal(persisted(b),raw);
  assert.equal(b.run(`db.plans.find(p=>p.id==='plan-001').status`),'active');
  b.run('db=loadDatabase()');
  assert.deepEqual(summary(b),{completed:32,casesWithReturn:19});
  await complete(b,'plan-001');
  const restored=runtime({sharedStorage:storage,locks});
  assert.deepEqual(summary(restored),{completed:33,casesWithReturn:19});
  assert.equal(restored.run(`db.plans.filter(p=>p.status==='done').length`),2);
});
