import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { runtime } from './runtime.mjs';

const KEY = 'notare-database-v7';

for (const version of [999, 1, 'legada']) {
  test(`W102 F02: esquema ${version} permanece intocado após tentar transação`, () => {
    const raw = JSON.stringify({ schemaVersion: version, records: [{ id: 'registro-unico-preservar' }] });
    const storage = new Map([[KEY, raw]]);
    const tab = runtime({ sharedStorage: storage });
    assert.equal(tab.run('persistedSnapshot'), undefined);
    assert.match(tab.run('databaseLoadIssue'), /incompatível/);
    assert.throws(() => tab.run('withDatabaseWrite(() => { db.records.push({ id: "novo" }); })'), /incompatível/);
    assert.equal(storage.get(KEY), raw);
    assert.equal(tab.run('db.records.some(record => record.id === "novo")'), false);
  });
}

test('W102 F02: base inválida não é restaurada por transação ou gravação direta', () => {
  const storage = new Map([[KEY, '{incompleto']]);
  const tab = runtime({ sharedStorage: storage });
  assert.equal(tab.run('persistedSnapshot'), undefined);
  assert.match(tab.run('databaseLoadIssue'), /Não foi possível ler/);
  assert.throws(() => tab.run('withDatabaseWrite(() => {})'), /bloqueadas/);
  assert.throws(() => tab.run('saveDatabase()'), /bloqueadas/);
  assert.equal(storage.get(KEY), '{incompleto');
});

test('W102 F02: armazenamento realmente vazio continua pronto para primeira gravação', () => {
  const storage = new Map();
  const tab = runtime({ sharedStorage: storage });
  assert.equal(tab.run('persistedSnapshot'), null);
  assert.equal(tab.run('databaseLoadIssue'), null);
  tab.run('withDatabaseWrite(() => {})');
  assert.equal(JSON.parse(storage.get(KEY)).schemaVersion, tab.run('db.schemaVersion'));
});

test('W102 F06: leitura e escrita bloqueadas permitem preferências em sessão mas nunca a escrita da base', () => {
  const storage = new Map([[KEY, '{"registro":"original"}']]);
  const tab = runtime({ sharedStorage: storage, storageBlocked: true });
  assert.equal(tab.run('state.profileId'), 'direcao');
  assert.match(tab.run('databaseLoadIssue'), /Não foi possível ler/);
  assert.equal(tab.run('persistedSnapshot'), undefined);
  assert.equal(tab.run('writePreference(PROFILE_KEY, "secretaria")'), false);
  assert.equal(tab.run('readPreference(PROFILE_KEY)'), 'secretaria');
  assert.equal(tab.run('writePreference(SIDEBAR_KEY, "true")'), false);
  assert.equal(tab.run('readPreference(SIDEBAR_KEY)'), 'true');
  assert.throws(() => tab.run('withDatabaseWrite(() => {})'), /bloqueadas/);
  assert.equal(storage.get(KEY), '{"registro":"original"}');
});

test('W102 F06: preferência persistida normalmente sem bloquear leitura em armazenamento acessível', () => {
  const storage = new Map();
  const tab = runtime({ sharedStorage: storage });
  assert.equal(tab.run('writePreference(PROFILE_KEY, "docencia")'), true);
  assert.equal(tab.run('readPreference(PROFILE_KEY)'), 'docencia');
  assert.equal(storage.get('notare-profile-v4'), 'docencia');
});

function drawerHarness(mobile = true) {
  const attrs = () => ({
    values: {}, setAttribute(k, v) { this.values[k] = String(v); },
    removeAttribute(k) { delete this.values[k]; }, getAttribute(k) { return this.values[k]; }
  });
  const doc = { activeElement: null };
  const element = () => {
    const el = Object.assign(attrs(), {
      inert: false, hidden: false, classes: new Set(),
      focus() { doc.activeElement = this; },
      querySelectorAll() { return []; },
      contains(child) { return child === this.child; }
    });
    el.classList = { add(c) { el.classes.add(c); }, remove(c) { el.classes.delete(c); }, contains(c) { return el.classes.has(c); } };
    return el;
  };
  const drawer = element(), trigger = element(), closeButton = element(), scrim = element(), background = element();
  drawer.child = closeButton;
  const media = { matches: mobile, addEventListener(name, cb) { this.update = cb; } };
  const window = { matchMedia: () => media, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(new URL('../ui.js', import.meta.url), 'utf8'), { window, document: doc });
  const control = window.NOTARE_UI.createModalDrawer({ drawer, trigger, closeButton, scrim, background });
  return { control, drawer, trigger, closeButton, scrim, background, media, doc };
}

test('W102 F04: menu fechado no celular não participa do teclado nem da árvore acessível', () => {
  const h = drawerHarness(true);
  assert.equal(h.drawer.inert, true);
  assert.equal(h.drawer.getAttribute('aria-hidden'), 'true');
  h.control.open();
  assert.equal(h.drawer.inert, false);
  assert.equal(h.drawer.getAttribute('aria-hidden'), undefined);
  assert.equal(h.doc.activeElement, h.closeButton);
  assert.equal(h.background.inert, true);
  h.control.close({ restoreFocus: true });
  assert.equal(h.doc.activeElement, h.trigger);
  assert.equal(h.drawer.inert, true);
  assert.equal(h.background.inert, false);
});

test('W102 F04: sair do breakpoint móvel recolhe o drawer e devolve navegação desktop', () => {
  const h = drawerHarness(true);
  h.control.open();
  h.media.matches = false;
  h.media.update();
  assert.equal(h.drawer.inert, false);
  assert.equal(h.drawer.getAttribute('aria-hidden'), undefined);
  assert.equal(h.drawer.classList.contains('open'), false);
  assert.equal(h.scrim.hidden, true);
  assert.equal(h.background.inert, false);
  h.media.matches = true;
  h.media.update();
  assert.equal(h.drawer.inert, true);
});

test('W102 F04: menu desktop começa navegável e fechamento móvel retira foco interno', () => {
  const h = drawerHarness(false);
  assert.equal(h.drawer.inert, false);
  h.media.matches = true;
  h.media.update();
  h.control.open();
  h.control.close();
  assert.equal(h.doc.activeElement, h.trigger);
  assert.equal(h.drawer.inert, true);
});

function luminance(hex) {
  const components = hex.match(/[a-f\d]{2}/ig).map(s => parseInt(s, 16) / 255);
  const linear = components.map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (values[1] + .05) / (values[0] + .05);
}
test('W102 F05: correções localizadas mantêm >=4,5:1 nos fundos auditados', () => {
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /--muted-readable:\s*#536568/);
  assert.match(css, /\.agenda-copy span,\s*#plan-student-caption small,\s*\.choice-cards label small,\s*\.journey-limits\s*\{\s*color:\s*var\(--muted-readable\)/);
  for (const background of ['#F5F9F6', '#F7F5F0', '#E7EFEA', '#F2F5F2']) {
    assert.ok(contrast('#536568', background) >= 4.5, `Contraste insuficiente sobre ${background}`);
  }
});

// Resolve as declarações efetivas destes seletores na folha, inclusive variáveis.
// A medição no navegador complementa esta proteção contra regressões na cascata.
function cssDeclaration(css, selector, property) {
  let result;
  for (const [, selectors, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some(item => item.trim() === selector)) continue;
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (declaration.slice(0, colon).trim() === property) result = declaration.slice(colon + 1).trim();
    }
  }
  assert.ok(result, `Declaração ausente: ${selector} / ${property}`);
  return result;
}
function resolvedCssColor(css, selector) {
  let color = cssDeclaration(css, selector, 'color');
  const visited = new Set();
  while (color.startsWith('var(')) {
    assert.ok(!visited.has(color), `Variável circular: ${color}`);
    visited.add(color);
    const match = /^var\((--[\w-]+)\)$/.exec(color);
    assert.ok(match, `Cor não suportada: ${color}`);
    color = cssDeclaration(css, ':root', match[1]);
  }
  assert.match(color, /^#[a-f\d]{6}$/i);
  return color;
}
for (const selector of ['.journey-header p', '.journey-copy > p', '.journey-autoplay', '.journey-meta strong']) {
  test(`W102 F05: ${selector} possui contraste >=4,5:1 no fundo real da implantação`, () => {
    const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    const background = cssDeclaration(css, '.journey-mode main', 'background');
    const color = resolvedCssColor(css, selector);
    const ratio = contrast(color, background);
    assert.ok(ratio >= 4.5, `${selector}: ${color} sobre ${background} = ${ratio.toFixed(2)}:1`);
    if (selector === '.journey-autoplay') {
      const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
      assert.match(html, /<p\b(?=[^>]*class="journey-autoplay")(?=[^>]*id="journey-autoplay")[^>]*>/);
    }
  });
}
