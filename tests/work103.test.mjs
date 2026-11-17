import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { runtime } from './runtime.mjs';
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('W103 F08: foto oficial continua PNG quadrada, nítida para avatar e abaixo de 300 KB', () => {
  const image = fs.readFileSync(new URL('../assets/profiles/ana-souza-oficial.png', import.meta.url));
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(image.readUInt32BE(16), image.readUInt32BE(20));
  assert.ok(image.readUInt32BE(16) >= 216, 'Resolução suficiente para o avatar de 72 px em 3x');
  assert.ok(image.length < 300000, 'Otimização não pode voltar ao custo de 2,5 MB');
  const r = runtime();
  assert.match(r.run('personPhoto(getStudent("ana"))'), /assets\/profiles\/ana-souza-oficial\.png/);
  assert.match(r.run('studentContextMarkup({id:"teste",name:"Pessoa Fictícia",className:"6º A",initials:"PF"})'), /student-avatar-fallback/);
});

const config = JSON.parse(read('vercel.json'));
const headers = Object.fromEntries(config.headers?.find(rule => rule.source === '/(.*)')?.headers.map(h => [h.key, h.value]) || []);
const policy = Object.fromEntries((headers['Content-Security-Policy'] || '').split(';').filter(s => s.trim()).map(s => { const [key, ...values] = s.trim().split(/\s+/); return [key, values]; }));
test('W103 F09: headers abrangem todos os caminhos sem ativar publicação automática', () => {
  assert.equal(config.git.deploymentEnabled, false);
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  for (const directive of ['frame-ancestors', 'frame-src', 'object-src', 'base-uri', 'connect-src']) assert.deepEqual(policy[directive], ["'none'"]);
});
test('W103 F09: CSP permite assets locais e estilos existentes sem liberar scripts inline ou eval', () => {
  for (const directive of ['default-src', 'script-src', 'font-src', 'form-action']) assert.deepEqual(policy[directive], ["'self'"]);
  assert.deepEqual(policy['style-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(policy['img-src'], ["'self'", 'data:']);
  const html = read('index.html');
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(script[1], /\bsrc="(?!https?:|\/\/)[^"]+"/);
    assert.equal(script[2].trim(), '');
  }
  assert.doesNotMatch(html, /\son(?:click|load|error)\s*=|javascript:/i);
  assert.match(read('styles.css'), /data:image\/svg\+xml/);
});
test('W103 H102-02: avisos ocupam região antes do conteúdo sem ancoragem flutuante', () => {
  const html = read('index.html'), start = html.indexOf('<div class="notification-stack">'), main = html.indexOf('<main id="main-content"');
  assert.ok(start > html.indexOf('<header class="topbar">') && start < main);
  assert.ok(html.indexOf('id="creation-notice"', start) < main);
  assert.ok(html.indexOf('id="toast"', start) < main);
  const css = read('styles.css');
  assert.match(css, /\.notification-stack\s*\{\s*position:\s*static;/);
  for (const [, rule] of css.matchAll(/\.notification-stack\s*\{([^}]*)\}/g)) assert.doesNotMatch(rule, /(?:^|;)\s*(?:position:\s*(?:fixed|absolute|sticky)|(?:top|right):)/);
  assert.doesNotMatch(read('app.js'), /--notice-top|positionNotifications/);
});

function drawerHarness() {
  const doc = { activeElement: null }, classes = new Set(), media = { matches: true, addEventListener(type, fn) { this.change = fn; } };
  function node({ current = false, visible = true } = {}) {
    const attrs = new Map(current ? [['aria-current', 'page']] : []);
    return { hidden: false, visible, focusCount: 0, getClientRects() { return this.visible ? [1] : []; },
      focus() { this.focusCount++; doc.activeElement = this; },
      setAttribute(k, v) { attrs.set(k, v); }, removeAttribute(k) { attrs.delete(k); }, getAttribute(k) { return attrs.get(k); } };
  }
  const trigger = node(), closeButton = node(), first = node(), current = node({ current: true }), other = node(), hidden = node({ visible: false });
  const list = [closeButton, hidden, first, current, other];
  const drawer = Object.assign(node(), { inert: true, classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c) },
    contains: el => list.includes(el), querySelectorAll: () => list });
  const scrim = { hidden: true }, background = { inert: false };
  const window = { matchMedia: () => media, addEventListener() {} };
  vm.runInNewContext(read('ui.js'), { window, document: doc });
  const control = window.NOTARE_UI.createModalDrawer({ drawer, trigger, closeButton, scrim, background });
  return { control, media, doc, trigger, closeButton, first, current, other, hidden, drawer, scrim, background,
    desktop() { closeButton.visible = false; trigger.visible = false; media.matches = false; media.change(); } };
}
test('W103 foco: menu aberto passa ao link atual visível ao entrar no desktop', () => {
  const h = drawerHarness(); h.control.open(); h.desktop();
  assert.equal(h.doc.activeElement, h.current);
  assert.equal(h.trigger.focusCount, 0);
  assert.equal(h.drawer.inert, false); assert.equal(h.background.inert, false); assert.equal(h.scrim.hidden, true);
  assert.equal(h.drawer.classList.contains('open'), false);
});
test('W103 foco: link já focado e ainda visível é preservado na transição', () => {
  const h = drawerHarness(); h.control.open(); h.other.focus(); h.desktop();
  assert.equal(h.doc.activeElement, h.other); assert.equal(h.trigger.focusCount, 0);
});
test('W103 foco: sem link atual visível usa primeiro destino visível, ignorando ocultos', () => {
  const h = drawerHarness(); h.control.open(); h.current.visible = false; h.desktop();
  assert.equal(h.doc.activeElement, h.first); assert.equal(h.hidden.focusCount, 0);
});
test('W103 foco: mudança de largura com menu fechado não captura foco do conteúdo', () => {
  const h = drawerHarness(), outside = {}; h.doc.activeElement = outside; h.desktop();
  assert.equal(h.doc.activeElement, outside);
});
test('W103 foco: fechamento móvel continua devolvendo foco ao acionador', () => {
  const h = drawerHarness(); h.control.open(); h.control.close({ restoreFocus: true });
  assert.equal(h.doc.activeElement, h.trigger); assert.equal(h.drawer.inert, true);
});
test('W103 foco: Tab e Shift+Tab continuam circulando somente pelos destinos visíveis', () => {
  const h = drawerHarness(); h.control.open(); let prevented = 0;
  h.other.focus(); h.control.trapFocus({ key: 'Tab', shiftKey: false, preventDefault() { prevented++; } });
  assert.equal(h.doc.activeElement, h.closeButton);
  h.control.trapFocus({ key: 'Tab', shiftKey: true, preventDefault() { prevented++; } });
  assert.equal(h.doc.activeElement, h.other); assert.equal(prevented, 2); assert.equal(h.hidden.focusCount, 0);
});
