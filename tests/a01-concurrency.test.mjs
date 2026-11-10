import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from './runtime.mjs';

function locksForOrigin() {
  const queue = new Map();
  return { request(name, _options, callback) {
    const previous = queue.get(name) || Promise.resolve();
    const next = previous.then(() => callback({ name, mode: 'exclusive' }));
    queue.set(name, next.catch(() => {}));
    return next;
  } };
}

function tabs() {
  const sharedStorage = new Map();
  const locks = locksForOrigin();
  return { a: runtime({ sharedStorage, locks }), b: runtime({ sharedStorage, locks }), sharedStorage };
}
const raw = storage => storage.get('notare-database-v7');
const approve = (tab, id) => tab.run(`withDatabaseWrite(() => window.NOTARE_OPERATIONS.reviewOffer(db,getProfile(),${JSON.stringify(id)},true))`);

test('A01: duas aprovações em abas desatualizadas não apagam a primeira decisão/histórico', async () => {
  const { a, b, sharedStorage } = tabs();
  await approve(a, 'oferta-movimento');
  const before = raw(sharedStorage);
  await assert.rejects(approve(b, 'oferta-criatividade'), /outra aba/);
  assert.equal(raw(sharedStorage), before, 'o armazenamento permaneceu idêntico após conflito');
  assert.equal(a.run('db.business.offers.find(o=>o.id==="oferta-movimento").status'), 'approved');
  assert.equal(b.run('db.business.offers.find(o=>o.id==="oferta-criatividade").status'), 'pending');
  assert.equal(JSON.parse(raw(sharedStorage)).business.offers.find(o => o.id==='oferta-movimento').status, 'approved');
  b.run('db = loadDatabase()');
  await approve(b, 'oferta-criatividade');
  const persisted = JSON.parse(raw(sharedStorage));
  assert.equal(persisted.business.offers.find(o => o.id==='oferta-movimento').status, 'approved');
  assert.equal(persisted.business.offers.find(o => o.id==='oferta-criatividade').status, 'approved');
  assert.ok(persisted.business.history.filter(e=>e.action==='review-offer').length >= 2);
});

test('A01: requisições simultâneas ficam serializadas por lock; escrita antiga é recusada', async () => {
  const { a, b, sharedStorage } = tabs();
  const outcomes = await Promise.allSettled([approve(a,'oferta-movimento'),approve(b,'oferta-criatividade')]);
  assert.equal(outcomes.filter(x=>x.status==='fulfilled').length, 1);
  assert.equal(outcomes.filter(x=>x.status==='rejected').length, 1);
  const persisted = JSON.parse(raw(sharedStorage));
  assert.equal(persisted.business.offers.filter(o=>o.status==='approved').length, a.run('db.business.offers.filter(o=>o.status==="approved").length'));
});

test('A01: registro em aba desatualizada não elimina decisões de outra aba', async () => {
  const { a, b, sharedStorage } = tabs();
  await approve(a,'oferta-movimento');
  const before = raw(sharedStorage);
  await assert.rejects(b.run(`withDatabaseWrite(() => {db.records.unshift({id:'record-concorrencia',studentId:'ana',description:'Teste de concorrência'});})`),/outra aba/);
  assert.equal(raw(sharedStorage),before);
  assert.equal(b.run(`db.records.some(r=>r.id==='record-concorrencia')`), false);
});

test('A01: erro de armazenamento reverte somente a tentativa e mantém dados persistidos', async () => {
  const { a, sharedStorage } = tabs();
  await approve(a,'oferta-movimento');
  const before=raw(sharedStorage);
  a.failStorage();
  await assert.rejects(approve(a,'oferta-criatividade'),/Armazenamento indisponível/);
  assert.equal(raw(sharedStorage),before);
  assert.equal(a.run('db.business.offers.find(o=>o.id==="oferta-criatividade").status'), 'pending');
});

test('A01: navegador sem Web Locks bloqueia escrita em vez de arriscar perda', async () => {
  const sharedStorage=new Map();
  const tab=runtime({sharedStorage, browser:true});
  await assert.rejects(approve(tab,'oferta-movimento'),/Web Locks/);
  assert.equal(raw(sharedStorage),undefined);
});
