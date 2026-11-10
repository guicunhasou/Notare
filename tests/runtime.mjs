import fs from 'node:fs';
import vm from 'node:vm';
// Executa os controladores reais com um DOM mínimo e armazenamento isolado.
// A navegação visual e o teclado também são verificados no navegador real.
export function runtime({ sharedStorage, locks, browser = Boolean(locks) } = {}) {
  const elements = new Map();
  function element(selector) {
    if (elements.has(selector)) return elements.get(selector);
    const classes = new Set();
    const node = {
      id: selector.replace(/^#/, ''), value: '', textContent: '', innerHTML: '', hidden: false, inert: false,
      style: {setProperty(){}}, dataset: {}, elements: {}, listeners: {}, attributes: {},
      classList: { add: (...items) => items.forEach(x => classes.add(x)), remove: (...items) => items.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { const active = force ?? !classes.has(x); active ? classes.add(x) : classes.delete(x); return active; } },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(key, value) { this.attributes[key] = value; }, removeAttribute(key) { delete this.attributes[key]; },
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      focus() { this.focused = true; }, replaceChildren() { this.innerHTML = ''; },
      querySelector: child => element(`${selector} ${child}`), querySelectorAll: () => [],
      getClientRects: () => [1], getBoundingClientRect: () => ({left:0,top:0,width:100,height:20}), reset() { Object.values(this.elements).forEach(field => { field.value = field.defaultValue || ''; }); }
    };
    elements.set(selector, node);
    return node;
  }
  const storage = sharedStorage || new Map();
  let failStorage = false;
  const contactRows = [element('contact-0'), element('contact-1'), element('contact-2')];
  const document = { querySelector: element, querySelectorAll: selector => selector === '.contact-card dd' ? contactRows : [], addEventListener() {} };
  class FormData {
    constructor(form) { this.entries = Object.entries(form.elements).filter(([, field]) => field.value !== null).map(([key, field]) => [key, field.value]); }
    has(key) { return this.entries.some(([name]) => name === key); }
    get(key) { return this.entries.find(([name]) => name === key)?.[1] ?? null; }
    [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
  }
  const noOp = () => {};
  const context = vm.createContext({ ...(browser ? { navigator: { locks } } : {}), document, console, URLSearchParams, FormData, location: {search:'',hash:'#painel'}, localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { if (failStorage) throw new Error('Armazenamento indisponível'); storage.set(key, value); }
  }, history: { replaceState:noOp, pushState:noOp }, window: {
    matchMedia: () => ({matches:false}), confirm: () => true,
    addEventListener:noOp, setTimeout: () => 1, clearTimeout:noOp, scrollTo:noOp, requestAnimationFrame:noOp,
    NOTARE_UI: { createToastNotice: options => ({show:text=>{options.root.textContent=text;},clear:noOp}), createModalDrawer: () => ({close:noOp}), createNotificationCenter: () => ({}), createUndoNotice: options => { context.window.undoOptions = options; return {clear:noOp, show:(text,operation)=>{context.window.lastUndo=operation;}}; } }
  }});
  const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const file of ['core.js', 'data.js', 'community-media.js', 'business.js', 'operations.js']) vm.runInContext(read(file), context);
  vm.runInContext(read('app.js').split('const businessUI =')[0], context);
  const run = code => vm.runInContext(code, context);
  function setForm(selector, values) {
    const form = element(selector);
    form.elements = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, {value, defaultValue:value, focus:noOp}]));
    if (selector === '#record-form') {
      elements.set('#record-form textarea[name="description"]', form.elements.description);
      elements.set('#record-description', form.elements.description);
      elements.set('#record-form input[name="date"]', form.elements.date);
    }
    if (selector === '#plan-form') elements.set('#plan-form input[name="date"]', form.elements.date);
    return form;
  }
  const form = setForm('#record-form', { student:'ana', className:'8º A', kind:'Ausência', date:'2026-11-03', description:'', template:'', followup:null });
  return { context, element, run, storage, form, setForm, failStorage: () => {failStorage = true;}, submit: selector => element(selector).listeners.submit({ preventDefault:noOp, currentTarget:element(selector) }) };
}

