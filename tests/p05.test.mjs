import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runtime} from './runtime.mjs';
const rule=r=>r.context.window.NOTARE_BUSINESS;
function uiHarness() {
 const r=runtime(),handlers={},notices=[];let refreshes=0; let afterRefresh=()=>{};
 r.context.document.addEventListener=(type,fn)=>{handlers[type]=fn;};
 r.run(readFileSync(new URL('../business-ui.js',import.meta.url),'utf8'));
 const ui=r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>r.run('saveDatabase()'),refresh:()=>{refreshes++;afterRefresh();},navigate:()=>{},notify:text=>notices.push(text),escape:r.context.window.NOTARE_CORE.escapeHtml});
 function form(type,context='ana') {
  const field=type==='message'?'body':'conclusion';
  const node=r.setForm('#test-'+type,{[type==='message'?'student':'plan']:context,[field]:''});
  node.dataset.businessForm=type;
  const textarea=node.querySelector('textarea');textarea.value='';node.elements[field]=textarea;
  return node;
 }
 function click(form,action,generation=false) {
  if(generation){const option=form.querySelector('[data-auto-suggestion]');option.dataset.autoSuggestion=action;option.checked=true;option.closest=()=>form;option.matches=()=>true;handlers.change({target:option});return;}
  const control={dataset:generation?{businessSuggestion:action}:{business:action},closest:()=>form};
  handlers.click({target:{closest:selector=>selector===(generation?'[data-business-suggestion]':'[data-business]')?control:null}});
 }
 return {r,ui,handlers,notices,form,click,refreshes:()=>refreshes,onRefresh:fn=>{afterRefresh=fn;}};
}

test('P05.1: sugestão familiar usa contexto disponível sem enviar nem alterar dados',()=>{
 const r=runtime(),before=r.run('JSON.stringify(db)'),B=rule(r);
 const text=B.familySuggestion(r.run('db'),r.run('getProfile()'),'ana');
 assert.match(text,/família de Ana Souza/);assert.match(text,/frequência/);assert.doesNotMatch(text,/diagnóstico|melhorou|foi realizado/i);assert.ok(text.length<=600);
 assert.equal(r.run('JSON.stringify(db)'),before);
});
test('P05.1: retorno recebido orienta a abertura sem copiar mensagens internas',()=>{
 const r=runtime();r.run('window.m=window.NOTARE_BUSINESS.sendMessage(db,getProfile(),"ana","Convite da escola para conversar.");window.NOTARE_BUSINESS.respondMessage(db,getProfile("familia-ana"),window.m.id,"Resposta fictícia da família.")');
 assert.match(r.run('window.NOTARE_BUSINESS.familySuggestion(db,getProfile(),"ana")'),/^Agradecemos seu retorno/);
});
test('P05.1: sugestões respeitam vínculo e escopo do perfil',()=>{
 const r=runtime();assert.throws(()=>r.run('window.NOTARE_BUSINESS.familySuggestion(db,getProfile("docencia"),"lucas")'),/escopo/);
 assert.throws(()=>r.run('window.NOTARE_BUSINESS.familySuggestion(db,getProfile("familia-ana"),"ana")'));
 assert.throws(()=>r.run('window.NOTARE_BUSINESS.familySuggestion(db,getProfile(),"beatriz")'),/responsável/);
});
test('P05.2: continuidade informa plano, responsável e prazo sem presumir desfecho',()=>{
 const r=runtime(),before=r.run('JSON.stringify(db)');const text=r.run('window.NOTARE_BUSINESS.continuitySuggestion(db,getProfile(),"plan-001")');
 assert.match(text,/Plano de retorno/);assert.match(text,/Beatriz Santos/);assert.match(text,/Lívia Moura/);assert.match(text,/30\/09\/2026/);assert.match(text,/resultado desta ação ainda não consta/);assert.doesNotMatch(text,/Antes de concluir|Revisar o plano|Combine com a equipe/);assert.ok(text.length<=600);
 assert.equal(r.run('JSON.stringify(db)'),before);
});
test('P05.2 atualizado: plano anulado ou concluído não gera sugestão e resultado anulado não conta',()=>{
 const r=runtime();r.run('db.records.push({id:"resultado-anulado",studentId:"beatriz",sourcePlanId:"plan-001",kind:"Devolutiva",description:"RESULTADO_ANULADO",voidedAt:"2026-11-05"})');assert.doesNotMatch(r.run('window.NOTARE_BUSINESS.continuitySuggestion(db,getProfile(),"plan-001")'),/RESULTADO_ANULADO/);r.run('db.plans[0].voidedAt="2026-11-05"');assert.throws(()=>r.run('window.NOTARE_BUSINESS.continuitySuggestion(db,getProfile(),"plan-001")'),/disponível/);
});

test('P05.3: gerar preenche campo vazio editável sem salvar ou enviar',()=>{
 const h=uiHarness(),f=h.form('message'),before=h.r.run('JSON.stringify(db)');h.click(f,'body',true);
 assert.match(f.elements.body.value,/Ana Souza/);assert.notEqual(f.elements.body.focused,true);assert.equal(f.querySelector('[data-suggestion-status]').hidden,true);assert.equal(h.refreshes(),0);assert.equal(h.r.run('JSON.stringify(db)'),before);
});
test('P05.3 atualizado: ativar sugestão preserva integralmente um texto preenchido',()=>{
 const h=uiHarness(),f=h.form('message');f.elements.body.value='Meu texto em revisão.';const before=h.r.run('JSON.stringify(db)');h.click(f,'body',true);assert.equal(f.elements.body.value,'Meu texto em revisão.');assert.equal(h.r.run('JSON.stringify(db)'),before);
});

test('P05.3 atualizado: sugestão de outro contexto só preenche após o usuário limpar o texto',()=>{
 const h=uiHarness(),f=h.form('message');f.elements.body.value='Texto preservado.';f.elements.student.value='lucas';h.click(f,'body',true);assert.equal(f.elements.body.value,'Texto preservado.');f.elements.body.value='';h.click(f,'body',true);assert.match(f.elements.body.value,/Lucas Lima/);assert.doesNotMatch(f.elements.body.value,/Ana Souza/);
});

test('P05.1: comunicado salva o texto revisado e persiste para a família correta',()=>{
 const h=uiHarness(),f=h.form('message');h.click(f,'body',true);f.elements.body.value='Comunicado fictício revisado pela equipe antes de confirmar.';
 h.handlers.submit({target:{closest:()=>f},preventDefault(){}});h.r.run('db=loadDatabase()');
 assert.equal(h.r.run('db.business.messages[0].body'),f.elements.body.value);assert.equal(h.r.run('db.business.messages[0].familyId'),'familia-ana');
});
test('P05.2: devolutiva revisada conclui somente após confirmação e mantém histórico',()=>{
 const h=uiHarness(),f=h.form('complete-plan','plan-001');h.click(f,'conclusion',true);assert.equal(h.r.run('db.plans[0].status'),'active');
 f.elements.conclusion.value='Resultado fictício revisado. Continuidade a avaliar pela equipe.';h.handlers.submit({target:{closest:()=>f},preventDefault(){}});h.r.run('db=loadDatabase()');
 assert.equal(h.r.run('db.plans[0].status'),'done');assert.equal(h.r.run('db.plans[0].conclusion'),f.elements.conclusion.value);assert.match(h.r.run('db.records[0].description'),/Resultado fictício revisado/);
});
test('P05.6: quinze combinações de segmento e plano usam cálculo inteiro e implantação existente',()=>{
 const r=runtime(),B=rule(r),db=r.run('db');
 for(const [plan,value]of Object.entries(B.PLANS))for(const [segment,factor]of Object.entries(B.SEGMENTS)){const quote=B.quoteSubscription(db,plan,segment);assert.equal(quote.monthly,Math.round(value.monthly*factor/10000));assert.equal(quote.setup,500000);}
 assert.throws(()=>B.quoteSubscription(db,'essencial','Segmento desconhecido'));assert.throws(()=>B.quoteSubscription(db,'__proto__','Ensino Médio'));
});
test('P05.6: proposta e plano legados permanecem com os valores persistidos',()=>{
 const r=runtime();r.run('db.business.subscription.monthly=234567;db.business.pendingSubscription={id:"legada",plan:"rede",segment:"Ensino Médio",monthly:398765,setup:12345};saveDatabase();db=loadDatabase()');
 assert.equal(r.run('db.business.pendingSubscription.monthly'),398765);assert.equal(r.run('db.business.subscription.monthly'),234567);
 r.run('window.NOTARE_BUSINESS.activateSubscription(db,getProfile(),"legada",true);saveDatabase();db=loadDatabase()');assert.equal(r.run('db.business.subscription.monthly'),398765);
});
test('P05.5–6: revisar não altera plano ativo; cancelar preserva; confirmar fixa valores e dispensa nova implantação',()=>{
 const r=runtime();r.run('window.p=window.NOTARE_BUSINESS.proposeSubscription(db,getProfile(),"essencial","Educação Infantil")');assert.equal(r.context.window.p.monthly,120000);assert.equal(r.run('db.business.subscription.plan'),'acompanhamento');
 r.run('window.NOTARE_BUSINESS.cancelProposal(db,getProfile())');assert.equal(r.run('db.business.subscription.plan'),'acompanhamento');
 r.run('window.q=window.NOTARE_BUSINESS.proposeSubscription(db,getProfile(),"rede","Ensino Médio");window.NOTARE_BUSINESS.activateSubscription(db,getProfile(),window.q.id,true);saveDatabase();db=loadDatabase()');assert.equal(r.run('db.business.subscription.monthly'),440000);assert.equal(r.run('window.NOTARE_BUSINESS.quoteSubscription(db,"rede","Ensino Médio").setup'),0);
});
test('P05.4: histórico sai da interface de assinatura mas permanece nos dados',()=>{
 const h=uiHarness();h.r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});h.r.run('db.business.history.push({id:"preservado",actorId:"direcao",description:"Ação anterior",at:new Date().toISOString()})');h.ui.render();
 const html=h.r.element('[data-business-content="assinatura"]').innerHTML;assert.doesNotMatch(html,/Histórico institucional/);assert.match(html,/data-subscription-step="3"/);assert.equal(h.r.run('db.business.history.some(item=>item.id==="preservado")'),true);
});
test('Imagens: recortes locais têm texto alternativo e assinatura PNG válida',()=>{
 const r=runtime();for(const media of Object.values(r.context.window.NOTARE_COMMUNITY_MEDIA)){const file=new URL('../'+media.src,import.meta.url);assert.ok(existsSync(file));const bytes=readFileSync(file);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.length<200000);assert.ok(media.alt.length>20);}
});

test('P05: concluir um formulário preserva o rascunho ainda não confirmado do outro',()=>{
 const h=uiHarness(),message=h.form('message'),completion=h.form('complete-plan','plan-001');
 message.elements.body.value='Rascunho da família ainda não confirmado.';completion.elements.conclusion.value='Conclusão fictícia revisada antes de confirmar.';
 for(const f of [message,completion]) {for(const [name,field]of Object.entries(f.elements)) field.name=name;f.querySelectorAll=()=>Object.values(f.elements);}
 h.r.context.document.querySelectorAll=selector=>selector==='.view.active [data-business-form]'?[message,completion]:[];
 const original=h.r.context.document.querySelector;
 h.r.context.document.querySelector=selector=>selector==='.view.active [data-business-form="message"]'?message:original(selector);
 h.onRefresh(()=>{message.elements.body.value='';});
 h.handlers.submit({target:{closest:()=>completion},preventDefault(){}});
 assert.equal(message.elements.body.value,'Rascunho da família ainda não confirmado.');assert.equal(h.r.run('db.business.messages.length'),4);assert.equal(h.r.run('db.plans[0].status'),'done');
});
