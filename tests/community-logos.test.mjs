import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from './runtime.mjs';
const ids=['alimentabem','culturaviva','saude-em-foco','transporte-solidario'];
function reviewRuntime(){
 const r=runtime();r.setForm('#subscription-wizard',{plan:'acompanhamento',segment:'Ensino Fundamental'});r.run(readFileSync(new URL('../business-ui.js',import.meta.url),'utf8'));
 const ui=r.context.window.NOTARE_BUSINESS_UI.create({database:()=>r.run('db'),actor:()=>r.run('getProfile()'),save:()=>{},refresh:()=>{},navigate:()=>{},notify:()=>{},escape:r.context.window.NOTARE_CORE.escapeHtml});
 const active=()=>{ui.render();return r.element('[data-business-content="parcerias"]').innerHTML.split('<h2>Parceiros cadastrados</h2>')[1];};
 return {r,active};
}
test('Logos: quatro parceiros aprovados têm exemplos de ofertas sem resgates ou comissões',()=>{
 const r=runtime();for(const id of ids){assert.equal(r.run(`db.business.partners.find(p=>p.id===${JSON.stringify(id)}).status`),'approved');assert.equal(r.run(`db.business.offers.some(o=>o.partnerId===${JSON.stringify(id)})`),true);}
 assert.equal(r.run('db.business.partners.length'),9);assert.equal(r.run('db.business.offers.length'),12);assert.equal(r.run('db.business.offers.filter(o=>o.status==="pending").length'),6);assert.equal(r.run('db.business.redemptions.length'),0);assert.equal(r.run('db.business.families.length'),2);
});
test('Logos: atualização de instalação existente preserva decisões e persiste somente uma vez',()=>{
 const r=runtime();r.run(`db.business.partners=db.business.partners.filter(p=>!['alimentabem','culturaviva','saude-em-foco','transporte-solidario'].includes(p.id));db.business.exampleRevision=1;db.records[0].voidedAt='2026-11-09T10:00:00Z';db.business.offers[2].status='rejected';db.business.offers[2].reviewReason='Decisão anterior';saveDatabase()`);
 const records=r.run('JSON.stringify(db.records)'),offers=r.run('JSON.stringify(db.business.offers)'),families=r.run('JSON.stringify(db.business.families)');
 r.run('db=loadDatabase();db=loadDatabase()');assert.equal(r.run('db.business.partners.length'),9);assert.equal(JSON.parse(r.storage.get('notare-database-v7')).business.exampleRevision,2);assert.equal(r.run('JSON.stringify(db.records)'),records);assert.equal(r.run('JSON.stringify(db.business.offers)'),offers);assert.equal(r.run('JSON.stringify(db.business.families)'),families);
 r.run('db.business.partners=db.business.partners.filter(p=>p.id!=="alimentabem");saveDatabase();db=loadDatabase()');assert.equal(r.run('db.business.partners.some(p=>p.id==="alimentabem")'),false);
});
test('Logos: cadastro pré-existente com mesmo ID ou perfil não é sobrescrito nem duplicado',()=>{
 const r=runtime();r.run(`db.business.exampleRevision=1;db.business.partners.find(p=>p.id==='alimentabem').name='Nome local preservado';db.business.partners.find(p=>p.id==='culturaviva').id='id-local';window.NOTARE_BUSINESS.initialize(db)`);
 assert.equal(r.run('db.business.partners.find(p=>p.id==="alimentabem").name'),'Nome local preservado');assert.equal(r.run('db.business.partners.filter(p=>p.actor==="parceiro-culturaviva").length'),1);
});
test('Logos atualizado: quatro marcas preservadas e ativos excluem empresas em revisão',()=>{
 const {r,active}=reviewRuntime();const html=active();const content=r.element('[data-business-content="parcerias"]').innerHTML;for(const id of ids)assert.ok(content.includes(`assets/community/parceiro-${id}.png`));assert.ok(html.includes('parceiro-saude-em-foco.png'));for(const id of ['alimentabem','culturaviva','transporte-solidario'])assert.ok(!html.includes(`data-active-partner="${id}"`));for(const name of ['Oficina Vagalume','Estúdio Trilha','Casa Pontes'])assert.ok(!html.includes(name));assert.ok(html.includes('Papelaria Horizonte'));assert.ok(html.includes('Espaço Cultura'));
 const all=r.element('[data-business-content="parcerias"]').innerHTML;assert.equal((all.match(/data-business="open-rejection"/g)||[]).length,6);
});
test('Logos atualizado: revisão tem precedência visual sem desfazer aprovação persistida',()=>{
 const {r,active}=reviewRuntime();r.run(`db.business.offers.push({id:'oferta-anterior',partnerId:'vagalume',status:'approved'});db.business.partners.find(p=>p.id==='vagalume').status='approved'`);const before=r.run('JSON.stringify(db)');assert.doesNotMatch(active(),/Oficina Vagalume/);assert.equal(r.run('JSON.stringify(db)'),before);assert.equal(r.run('window.NOTARE_BUSINESS.availableOffers(db,getProfile("familia-ana")).some(o=>o.id==="oferta-criatividade")'),false);r.run('window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-criatividade",true)');const html=active();assert.equal((html.match(/src="assets\/community\/parceiro-vagalume\.png"/g)||[]).length,1);
});

test('Logos: perfis novos mantêm escopo de parceiro e imagens acessíveis, sem acesso escolar',()=>{
 const r=runtime();for(const id of ids){const actor='parceiro-'+id;assert.equal(r.run(`window.NOTARE_BUSINESS.scopedStudents(db,getProfile(${JSON.stringify(actor)})).length`),0);assert.match(r.run(`personPhoto(getProfile(${JSON.stringify(actor)}))`),/alt="Logo da empresa fictícia/);assert.equal(r.run(`window.NOTARE_BUSINESS.partnerStatement(db,getProfile(${JSON.stringify(actor)})).length`),0);}
});
