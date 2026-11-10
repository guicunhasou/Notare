import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from './runtime.mjs';

function harness() {
  const r=runtime(),events={},field=r.element('#reject-offer-reason'),dialog=r.element('#reject-offer-dialog');
  let value='',selections=0,active=null;
  // Modelo do caret/rolagem observado no navegador: atribuir value move para o fim;
  // focar um campo longo nesse estado revela o fim. Não substitui a prova visual.
  Object.defineProperty(field,'value',{get:()=>value,set:next=>{value=String(next);field.selectionStart=field.selectionEnd=value.length;field.scrollTop=0;}});
  field.focus=()=>{active=field;field.focused=true;field.scrollTop=value&&field.selectionStart===value.length?122:0;};
  const select=field.setSelectionRange;
  field.setSelectionRange=(start,end)=>{selections++;select.call(field,start,end);};
  dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;};
  const form=r.setForm('#reject-offer-form',{reason:''});form.elements.reason=field;form.dataset.businessForm='reject-offer';
  r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});
  const option=r.element('#reject-auto-suggestion');option.checked=true;
  r.context.document.addEventListener=(type,fn)=>{events[type]=fn;};
  r.run(readFileSync(new URL('../business-ui.js',import.meta.url),'utf8'));
  r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>r.run('saveDatabase()'),refresh:()=>{},navigate:()=>{},notify:()=>{},escape:r.context.window.NOTARE_CORE.escapeHtml});
  const invoker={dataset:{business:'open-rejection',id:'oferta-criatividade'},isConnected:true,focus(){active=this;}};
  const open=()=>events.click({target:{closest:selector=>selector==='[data-business]'?invoker:null}});
  const toggle=checked=>{option.checked=checked;active=option;option.listeners.change({currentTarget:option});};
  return {r,field,dialog,option,invoker,open,toggle,active:()=>active,selections:()=>selections};
}

test('A04: sugestão inicial abre no começo e mantém foco sem executar recusa',()=>{
  const h=harness(),before=h.r.run('JSON.stringify(db)');h.open();
  assert.match(h.field.value,/^Para a proposta/);assert.ok(h.field.value.length>100);
  assert.equal(h.field.selectionStart,0);assert.equal(h.field.selectionEnd,0);assert.equal(h.field.scrollTop,0);
  assert.equal(h.active(),h.field);assert.equal(h.dialog.open,true);assert.equal(h.r.run('JSON.stringify(db)'),before);
});

test('A04: reativar no campo vazio prepara início sem tirar foco da checkbox',()=>{
  const h=harness();h.open();h.toggle(false);assert.equal(h.field.value,'');
  h.toggle(true);assert.match(h.field.value,/^Para a proposta/);
  assert.equal(h.field.selectionStart,0);assert.equal(h.field.selectionEnd,0);assert.equal(h.field.scrollTop,0);
  assert.equal(h.active(),h.option);h.field.focus();assert.equal(h.field.scrollTop,0);
});

test('A04: edição manual preserva conteúdo, cursor e rolagem ao interagir com sugestão já preenchida',()=>{
  const h=harness();h.open();h.toggle(false);h.field.value='Justificativa escrita e revisada manualmente.';
  h.field.setSelectionRange(12,12);h.field.scrollTop=28;const count=h.selections();
  h.toggle(true);
  assert.equal(h.field.value,'Justificativa escrita e revisada manualmente.');
  assert.equal(h.field.selectionStart,12);assert.equal(h.field.selectionEnd,12);assert.equal(h.field.scrollTop,28);
  assert.equal(h.selections(),count,'não reposiciona cursor quando não insere texto');
});

test('A04: cancelar e reabrir reinicia somente o novo rascunho; Escape devolve foco sem gravar',()=>{
  const h=harness(),before=h.r.run('JSON.stringify(db)');h.open();
  h.field.setSelectionRange(h.field.value.length,h.field.value.length);h.field.scrollTop=122;
  h.r.element('#reject-offer-cancel').listeners.click();assert.equal(h.dialog.open,false);assert.equal(h.active(),h.invoker);
  h.open();assert.equal(h.field.scrollTop,0);assert.equal(h.field.selectionStart,0);
  h.dialog.listeners.cancel({preventDefault(){}});assert.equal(h.dialog.open,false);assert.equal(h.active(),h.invoker);
  assert.equal(h.r.run('JSON.stringify(db)'),before);
});

test('A04: opção desativada abre campo vazio sem seleção programática adicional',()=>{
  const h=harness();h.option.checked=false;h.open();
  assert.equal(h.field.value,'');assert.equal(h.field.scrollTop,0);assert.equal(h.selections(),0);assert.equal(h.active(),h.field);
});
