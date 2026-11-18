import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from './runtime.mjs';

const kinds = ['body', 'conclusion', 'record', 'rejection', 'ending'];
const preferenceKey = (profile, kind) => `notare-suggestion-v1:${profile}:${kind}`;
const databaseKey = 'notare-database-v7';

for (const kind of kinds) {
  test(`W105 F11: ${kind} mantém escolhas independentes após recarregar`, () => {
    const initial = runtime();
    const before = initial.run('JSON.stringify(db)');
    initial.storage.set(databaseKey, before);
    const r = runtime({ sharedStorage: initial.storage });
    const enabled = r.run('suggestionEnabled');
    const save = r.run('saveSuggestionPreference');

    assert.equal(enabled(kind), true);
    save(kind, false);
    for (const other of kinds.filter(other => other !== kind)) assert.equal(enabled(other), true);
    r.run('state.profileId = "coordenacao"');
    assert.equal(enabled(kind), true);
    save(kind, true);

    const reloaded = runtime({ sharedStorage: r.storage });
    assert.equal(reloaded.run('suggestionEnabled')(kind), false);
    reloaded.run('state.profileId = "coordenacao"');
    assert.equal(reloaded.run('suggestionEnabled')(kind), true);
    assert.equal(reloaded.storage.get(preferenceKey('direcao', kind)), 'false');
    assert.equal(reloaded.storage.get(preferenceKey('coordenacao', kind)), 'true');
    assert.equal(reloaded.storage.get(databaseKey), before);
    assert.deepEqual([...reloaded.storage.keys()].sort(),
      [databaseKey, preferenceKey('direcao', kind), preferenceKey('coordenacao', kind)].sort());
  });
}

test('W105 F11: valores inválidos retornam ao padrão habilitado sem regravar', () => {
  const invalid = ['0', 'null', 'FALSE', '{"enabled":false}', ''];
  const entries = kinds.map((kind, index) => [preferenceKey('direcao', kind), invalid[index]]);
  const r = runtime({ sharedStorage: new Map(entries) });
  for (const kind of kinds) assert.equal(r.run('suggestionEnabled')(kind), true);
  assert.deepEqual([...r.storage.entries()], entries);
});

test('W105 F11: armazenamento bloqueado mantém escolhas temporárias por perfil e tipo', () => {
  const backing = new Map([[databaseKey, '{"schemaVersion":999}']]);
  const r = runtime({ sharedStorage: backing, storageBlocked: true });
  r.run('saveSuggestionPreference("body", false)');
  assert.equal(r.run('suggestionEnabled("body")'), false);
  assert.equal(r.run('suggestionEnabled("conclusion")'), true);
  r.run('state.profileId="coordenacao"');
  assert.equal(r.run('suggestionEnabled("body")'), true);
  r.run('state.profileId="direcao"');
  assert.equal(r.run('suggestionEnabled("body")'), false);
  assert.deepEqual([...backing.entries()], [[databaseKey, '{"schemaVersion":999}']]);
  assert.equal(runtime({ sharedStorage: backing, storageBlocked: true }).run('suggestionEnabled("body")'), true);
});

test('W105 F11: falha somente de escrita usa a escolha recente sem alterar o valor salvo', () => {
  const key = preferenceKey('direcao', 'record');
  const r = runtime({ sharedStorage: new Map([[key, 'false']]) });
  r.failStorage();
  r.run('saveSuggestionPreference("record", true); syncRecordSuggestionPreference()');
  assert.equal(r.element('#record-auto-suggestion').checked, true);
  assert.equal(r.storage.get(key), 'false');
  assert.equal(runtime({ sharedStorage: r.storage }).run('suggestionEnabled("record")'), false);
});

test('W105 F11: registro sincroniza opção e padrão do formulário com o perfil atual', () => {
  const r = runtime({ sharedStorage: new Map([[preferenceKey('direcao', 'record'), 'false']]) });
  const option = r.element('#record-auto-suggestion');
  r.run('syncRecordSuggestionPreference(); autoFillRecordSuggestion()');
  assert.equal(option.checked, false);
  assert.equal(option.defaultChecked, false);
  assert.equal(r.form.elements.description.value, '');
  r.run('state.profileId="coordenacao"; syncRecordSuggestionPreference(); autoFillRecordSuggestion()');
  assert.equal(option.checked, true);
  assert.equal(option.defaultChecked, true);
  assert.match(r.form.elements.description.value, /Ana Souza/);
  r.form.elements.description.value = 'Texto fictício escrito manualmente.';
  option.checked = false;
  option.listeners.change({ currentTarget: option });
  assert.equal(r.form.elements.description.value, 'Texto fictício escrito manualmente.');
  assert.equal(r.storage.get(preferenceKey('coordenacao', 'record')), 'false');
});

test('W105 F11: controles de comunicado e conclusão são renderizados com a escolha de cada perfil', () => {
  const r = runtime({ sharedStorage: new Map([
    [preferenceKey('direcao', 'body'), 'false'],
    [preferenceKey('coordenacao', 'conclusion'), 'false']
  ]) });
  r.setForm('#subscription-wizard', { plan: 'acompanhamento', segment: 'Ensino Fundamental' });
  r.run(readFileSync(new URL('../business-ui.js', import.meta.url), 'utf8'));
  const ui = r.run(`window.NOTARE_BUSINESS_UI.create({
    database: () => db, actor: () => getProfile(), suggestionEnabled, saveSuggestionPreference,
    escape: escapeHtml
  })`);
  const message = r.element('[data-business-content="familias"]');
  const conclusion = r.element('#complete-plan-content');
  ui.render();
  assert.doesNotMatch(message.innerHTML, /data-auto-suggestion="body"\s+checked/);
  assert.match(conclusion.innerHTML, /data-auto-suggestion="conclusion"\s+checked/);
  r.run('state.profileId="coordenacao"');
  ui.render();
  assert.match(message.innerHTML, /data-auto-suggestion="body"\s+checked/);
  assert.doesNotMatch(conclusion.innerHTML, /data-auto-suggestion="conclusion"\s+checked/);
});
