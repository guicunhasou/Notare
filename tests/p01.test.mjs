import assert from 'node:assert/strict';
import test from 'node:test';

import { runtime } from './runtime.mjs';

test('P01: registros combinam estudante, turma e categoria sem modificar a base', () => {
  const r = runtime();
  const original = r.run('JSON.stringify(db)');
  r.run('state.recordsStudentId="ana"; renderRecords()');
  assert.match(r.element('#records-list').innerHTML, /Ana Souza/);
  assert.doesNotMatch(r.element('#records-list').innerHTML, /Alice Monteiro|João Oliveira/);
  r.run('state.recordsClassFilter="6º A"; renderRecords()');
  assert.equal(r.element('#records-list').innerHTML, '');
  r.run('state.recordsStudentId=null; state.recordsClassFilter="todas"; state.recordFilter="Contato"; renderRecords()');
  assert.match(r.element('#records-list').innerHTML, /Alice Monteiro/);
  assert.doesNotMatch(r.element('#records-list').innerHTML, /record-kind-absence/);
  assert.equal(r.run('JSON.stringify(db)'), original);
});

test('P01: acompanhamento combina turma, prioridade e busca sem filtrar os dados originais', () => {
  const r = runtime();
  r.run('state.followupClassFilter="8º A"; state.query="Ana Souza"; state.filter="alta"; renderStudents()');
  assert.equal((r.element('#student-table').innerHTML.match(/data-student=/g) || []).length, 1);
  assert.match(r.element('#student-table').innerHTML, /Ana Souza/);
  assert.equal(r.run('db.students.length'), 96);
});

test('P01: cadastro filtra turma com paginação e oculta o filtro nas outras abas', () => {
  const r = runtime();
  r.run('state.registrationClassFilter="8º B"; renderRegistrations()');
  assert.match(r.element('#registration-summary').textContent, /de 12 estudantes/);
  r.run('state.registrationPage=2; renderRegistrations()');
  assert.equal((r.element('#registration-table').innerHTML.match(/<tr>/g) || []).length, 5); // cabeçalho + 4
  r.run('state.registrationTab="staff"; renderRegistrations()');
  assert.equal(r.element('#registration-class-field').hidden, true);
  r.run('state.registrationTab="classes"; renderRegistrations()');
  assert.equal(r.element('#registration-class-field').hidden, true);
});

test('P01: sugestão recusa substituição e permite editar antes de persistir', () => {
  const r = runtime();
  r.form.elements.description.value = 'Texto autoral';
  r.run('window.confirm=()=>false');
  r.element('#record-auto-suggestion').checked=true;r.element('#record-auto-suggestion').listeners.change({currentTarget:r.element('#record-auto-suggestion')});
  assert.equal(r.form.elements.description.value, 'Texto autoral');
  r.form.elements.description.value='';
  r.run('window.confirm=()=>true');
  r.element('#record-auto-suggestion').checked=true;r.element('#record-auto-suggestion').listeners.change({currentTarget:r.element('#record-auto-suggestion')});
  assert.match(r.form.elements.description.value, /Ana Souza/);
  assert.match(r.form.elements.description.value, /Ana Souza/);
  r.form.elements.description.value += ' Revisão fictícia.';
  const edited = r.form.elements.description.value;
  r.run('renderAll=()=>{}; renderRecordTemplates=()=>{}; showRoute=route=>{window.savedRoute=route}');
  r.submit('#record-form');
  const saved = JSON.parse(r.storage.get('notare-database-v7')).records[0];
  assert.equal(saved.description, edited);
  assert.equal(saved.studentId, 'ana');
  assert.equal(saved.ownerId, 'direcao');
  assert.equal(saved.date, '03/11/2026');
  assert.equal(r.run('loadDatabase().records[0].description'), edited);
});

test('P01: falha ao salvar registro preserva o texto e não deixa gravação fantasma', () => {
  const r = runtime();
  r.form.elements.description.value = 'Descrição revisada que precisa ser mantida';
  const before = r.run('db.records.length');
  r.failStorage();
  r.submit('#record-form');
  assert.equal(r.run('db.records.length'), before);
  assert.equal(r.form.elements.description.value, 'Descrição revisada que precisa ser mantida');
  assert.match(r.element('#toast').textContent, /descrição foi preservada/);
});

test('P01: novo registro aparece no perfil com ano e eventos da base mantêm 2026', () => {
  const r = runtime();
  r.run('db.records.unshift({id:"teste",studentId:"ana",kind:"Contato",description:"Novo texto revisado",date:"03/11/2026",ownerId:"direcao"}); state.currentStudent="ana"; renderStudentProfile()');
  const html = r.element('#student-timeline').innerHTML;
  assert.match(html, /Novo texto revisado/);
  assert.match(html, /25\/09\/2026/);
  assert.doesNotMatch(html, />25\/09</);
});

test('P01: desistência protege o rascunho e descarte confirmado permite cancelar', () => {
  const r = runtime();
  r.run('state.currentRoute="novo-registro"; formBaselines.set("record-form", formSnapshot(document.querySelector("#record-form")))');
  r.form.elements.description.value = 'Ainda não salvo';
  r.run('window.confirm=()=>false');
  assert.equal(r.run('confirmFormExit()'), false);
  assert.equal(r.form.elements.description.value, 'Ainda não salvo');
  r.run('window.confirm=()=>true');
  assert.equal(r.run('confirmFormExit()'), true);
  assert.equal(r.form.elements.description.value, '');
  assert.match(r.element('#toast').textContent, /Nenhuma alteração foi salva/);
});

test('P01: falha de armazenamento do plano reverte plano, agenda e comunicado juntos', () => {
  const r = runtime();
  const date = r.run('dateKey(addBusinessDays(startOfAgenda(new Date()), 2))');
  const form = r.setForm('#plan-form', {type:'Conversa de acolhimento', owner:'direcao', date, notes:'Objetivo fictício revisado', family:'on'});
  const before = r.run('JSON.stringify(db)');
  r.failStorage();
  r.submit('#plan-form');
  assert.equal(r.run('JSON.stringify(db)'), before);
  assert.equal(r.run('state.lastPlanId'), null);
  assert.equal(form.elements.notes.value, 'Objetivo fictício revisado');
  assert.match(r.element('#toast').textContent, /formulário foi preservado/);
});

test('P01: cancelar confirmação do plano mantém o formulário e a base', () => {
  const r = runtime();
  const date = r.run('dateKey(addBusinessDays(startOfAgenda(new Date()), 2))');
  const form = r.setForm('#plan-form', {type:'Conversa de acolhimento', owner:'direcao', date, notes:'Objetivo fictício revisado', family:'on'});
  const before = r.run('JSON.stringify(db)');
  r.run('window.confirm=()=>false');
  r.submit('#plan-form');
  assert.equal(r.run('JSON.stringify(db)'), before);
  assert.equal(form.elements.notes.value, 'Objetivo fictício revisado');
  assert.match(r.element('#toast').textContent, /Salvamento cancelado/);
});

test('P01: cancelar animação resolve a espera pendente e permite novo avanço', async () => {
  const r = runtime();
  const pending = r.run('state.currentRoute="jornada"; journeyWait(1500)');
  r.run('stopJourney()');
  assert.equal(await pending, false);
  assert.equal(r.run('journeyRunning'), false);
  r.run('renderJourney=()=>{}; scheduleJourney=()=>{}; journeyStep=0; advanceJourney()');
  assert.equal(r.run('journeyStep'), 1);
  r.element('#journey-back').listeners.click();
  assert.equal(r.run('journeyStep'), 0);
});

test('P01: datas civis não mudam de dia com o fuso horário', () => {
  const r = runtime();
  const previous = process.env.TZ;
  try {
    for (const zone of ['America/Recife','Pacific/Kiritimati','America/Los_Angeles']) {
      process.env.TZ = zone;
      assert.equal(r.run('formatDate("2026-11-03")'), '03/11/2026');
      assert.equal(r.run('dateKey(parseDisplayDate("03/11/2026"))'), '2026-11-03');
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});


test('P01: histórico mantém registros distintos com descrição e data iguais', () => {
  const r = runtime();
  r.run('for (const id of ["repetido-1", "repetido-2"]) db.records.unshift({id,studentId:"ana",kind:"Contato",description:"Contato repetido e rastreável",date:"03/11/2026",ownerId:"direcao"}); state.currentStudent="ana"; renderStudentProfile()');
  assert.equal((r.element('#student-timeline').innerHTML.match(/Contato repetido e rastreável/g) || []).length, 2);
});


test('P01: filtros contextuais continuam limitados às turmas do perfil docente', () => {
  const r = runtime();
  r.run('state.profileId=db.profiles.find(profile => profile.scope.startsWith("classes:")).id; state.recordsStudentId=null; renderRecords()');
  const html = r.element('#records-list').innerHTML;
  const classes = r.run('profileClassNames()');
  for (const name of ['6º A','6º B','7º A','7º B','8º A','8º B','9º A','9º B']) {
    if (!classes.includes(name)) assert.doesNotMatch(html, new RegExp(name));
  }
  assert.ok(classes.length > 0);
});


test('P01: restaurar contexto antigo não reabre estudante fora do perfil atual', () => {
  const r = runtime();
  r.run('state.profileId=db.profiles.find(profile => profile.scope.startsWith("classes:")).id; const outside = db.students.find(student => !visibleStudents().some(visible => visible.id === student.id)); showRoute("estudante", {context:{currentStudent:outside.id}})');
  assert.equal(r.run('visibleStudents().some(student => student.id === state.currentStudent)'), true);
});
