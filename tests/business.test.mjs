import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
const context = vm.createContext({ window: { crypto: { randomUUID } }, Intl, Date });
for (const file of ['data.js', 'business.js']) vm.runInContext(readFileSync(new URL('../'+file, import.meta.url),'utf8'), context);
const B = context.window.NOTARE_BUSINESS;
const fresh = () => B.initialize(JSON.parse(JSON.stringify(context.window.NOTARE_SEED)));
const actor = (db,id) => B.profiles(db).find(p=>p.id===id);
const future = `${new Date().getFullYear()+1}-12-31`;
function offer(db) { return B.createOffer(db,actor(db,'parceiro-papelaria'),{title:'Benefício escolar local',description:'Oferta fictícia de material para a comunidade.',price:10001,stock:2,expires:future}); }

test('migração acrescenta comunidade sem apagar registros ou preferências existentes',()=>{
 const db=JSON.parse(JSON.stringify(context.window.NOTARE_SEED));db.records[0].description='Edição preservada';db.localPreference='manter';
 B.initialize(db);const n=db.business.offers.length;B.initialize(db);
 assert.equal(db.records[0].description,'Edição preservada');assert.equal(db.localPreference,'manter');assert.equal(db.business.offers.length,n);
 const copy=JSON.parse(JSON.stringify(db));B.initialize(copy);assert.equal(copy.records.length,db.records.length);
 db.business.version=2;assert.throws(()=>B.initialize(db));assert.equal(db.records[0].description,'Edição preservada');
});
test('comunicados respeitam turma do professor e vínculo de cada família',()=>{
 const db=fresh(),staff=actor(db,'docencia'),family=actor(db,'familia-ana');
 const beforeAna=B.familyMessages(db,family).length,beforeLucas=B.familyMessages(db,actor(db,'familia-lucas')).length;
 B.sendMessage(db,staff,'ana','Vamos combinar um encontro para conversar.');
 assert.throws(()=>B.sendMessage(db,staff,'lucas','Mensagem fora do escopo.'));
 assert.equal(B.familyMessages(db,family).length,beforeAna+1);assert.equal(B.familyMessages(db,actor(db,'familia-lucas')).length,beforeLucas);
 assert.throws(()=>B.respondMessage(db,actor(db,'familia-lucas'),db.business.messages[0].id));
 assert.throws(()=>B.sendMessage(db,family,'ana','Tentativa de acesso institucional.'));
});
test('leitura é idempotente e resposta familiar gera devolutiva e histórico',()=>{
 const db=fresh(),family=actor(db,'familia-ana');const message=B.sendMessage(db,actor(db,'direcao'),'ana','Podemos combinar uma conversa?');const total=db.records.length;
 B.respondMessage(db,family,message.id);const first=message.readAt;B.respondMessage(db,family,message.id);
 assert.equal(message.readAt,first);assert.equal(db.records.length,total);
 B.respondMessage(db,family,message.id,'Recebido, podemos conversar amanhã.');
 assert.equal(db.records.length,total+1);assert.equal(db.records[0].ownerId,family.id);assert.equal(db.records[0].kind,'Devolutiva');
 assert.throws(()=>B.respondMessage(db,family,message.id,'Outra resposta para duplicar.'));
 const copy=JSON.parse(JSON.stringify(db));B.initialize(copy);assert.match(B.familyMessages(copy,family)[0].reply,/amanhã/);
});
test('conclusão preserva plano e histórico e encerra somente sua agenda',()=>{
 const db=fresh(),plan=db.plans[0];db.agenda.push({id:'linked',sourcePlanId:plan.id,studentId:plan.studentId});
 const count=db.plans.length;B.completePlan(db,actor(db,'direcao'),plan.id,'Acompanhamento revisado com retorno combinado.');
 assert.equal(plan.status,'done');assert.equal(db.plans.length,count);assert.equal(db.agenda.find(a=>a.id==='linked').status,'done');
 assert.equal(db.records[0].followup,false);assert.throws(()=>B.completePlan(db,actor(db,'direcao'),plan.id,'Tentar concluir novamente.'));
 assert.throws(()=>B.completePlan(db,actor(db,'familia-ana'),db.plans[1].id,'Tentativa fora do papel.'));
});
test('assinatura exige revisão e aceite, não confirma proposta duas vezes',()=>{
 const db=fresh(),admin=actor(db,'direcao'),old=db.business.subscription.plan;
 assert.throws(()=>B.proposeSubscription(db,actor(db,'secretaria'),'rede','Ensino Médio'));
 const p=B.proposeSubscription(db,admin,'rede','Ensino Médio');assert.equal(db.business.subscription.plan,old);
 assert.throws(()=>B.activateSubscription(db,admin,p.id,false));assert.equal(db.business.subscription.plan,old);
 B.cancelProposal(db,admin);assert.equal(db.business.subscription.plan,old);
 const q=B.proposeSubscription(db,admin,'rede','Ensino Médio');B.activateSubscription(db,admin,q.id,true);
 assert.equal(db.business.subscription.plan,'rede');assert.equal(db.business.subscription.revision,1);assert.equal(db.business.pendingSubscription,null);
 assert.throws(()=>B.activateSubscription(db,admin,q.id,true));assert.match(db.business.history[0].description,/Nenhuma cobrança/);
});
test('oferta vai à revisão, rejeita datas inválidas e impede autoaprovação',()=>{
 const db=fresh(),partner=actor(db,'parceiro-papelaria'),o=offer(db);
 assert.equal(o.status,'pending');assert.throws(()=>B.reviewOffer(db,partner,o.id,true));
 assert.equal(B.availableOffers(db,actor(db,'familia-ana')).some(x=>x.id===o.id),false);
 assert.throws(()=>B.createOffer(db,partner,{title:'Validade inválida',description:'Oferta demonstrativa inválida.',price:1000,stock:1,expires:'2027-02-31'}));
 B.reviewOffer(db,actor(db,'direcao'),o.id,true);assert.equal(o.status,'approved');
 const rejected=offer(db);assert.throws(()=>B.reviewOffer(db,actor(db,'direcao'),rejected.id,false,''));
 B.reviewOffer(db,actor(db,'direcao'),rejected.id,false,'Condição precisa ser esclarecida.');assert.equal(rejected.status,'rejected');
});
test('voucher reserva estoque, não gera comissão e impede duplicidade',()=>{
 const db=fresh(),family=actor(db,'familia-ana'),o=db.business.offers[0],stock=o.stock;
 const r=B.reserve(db,family,o.id);assert.equal(o.stock,stock-1);assert.equal(r.commission,0);
 assert.throws(()=>B.reserve(db,family,o.id));assert.equal(o.stock,stock-1);
 B.cancelRedemption(db,family,r.id);assert.equal(o.stock,stock);assert.throws(()=>B.cancelRedemption(db,family,r.id));assert.equal(o.stock,stock);
 assert.throws(()=>B.reserve(db,actor(db,'parceiro-papelaria'),o.id));
});
test('clube e disponibilidade bloqueiam resgate sem apagar vouchers anteriores',()=>{
 const db=fresh(),family=actor(db,'familia-ana'),o=db.business.offers[0];B.reserve(db,family,o.id);
 B.setClub(db,actor(db,'direcao'),false);assert.equal(B.availableOffers(db,family).length,0);assert.throws(()=>B.reserve(db,family,db.business.offers[1].id));assert.equal(db.business.redemptions.length,1);
 B.setClub(db,actor(db,'direcao'),true);B.toggleOffer(db,actor(db,'parceiro-papelaria'),o.id);assert.throws(()=>B.reserve(db,actor(db,'familia-lucas'),o.id));
 B.toggleOffer(db,actor(db,'parceiro-papelaria'),o.id);o.stock=0;assert.throws(()=>B.reserve(db,actor(db,'familia-lucas'),o.id));
 o.stock=1;o.expires='2020-01-01';assert.throws(()=>B.reserve(db,actor(db,'familia-lucas'),o.id));
});
test('conversão exige parceiro correto e gera comissão arredondada uma única vez',()=>{
 const db=fresh(),o=offer(db);B.reviewOffer(db,actor(db,'direcao'),o.id,true);const r=B.reserve(db,actor(db,'familia-ana'),o.id);
 assert.throws(()=>B.confirmConversion(db,actor(db,'parceiro-cultura'),r.id));
 o.price=99000;B.confirmConversion(db,actor(db,'parceiro-papelaria'),r.id);assert.equal(r.commission,500);assert.equal(r.price,10001);
 assert.throws(()=>B.confirmConversion(db,actor(db,'parceiro-papelaria'),r.id));assert.equal(r.commission,500);
 assert.throws(()=>B.cancelRedemption(db,actor(db,'familia-ana'),r.id));
});
test('extrato do parceiro exclui identidade familiar, estudante e registros internos',()=>{
 const db=fresh();B.reserve(db,actor(db,'familia-ana'),db.business.offers[0].id);
 const statement=B.partnerStatement(db,actor(db,'parceiro-papelaria'));assert.equal(statement.length,1);
 assert.equal('familyId' in statement[0],false);assert.equal('studentId' in statement[0],false);assert.equal(B.partnerStatement(db,actor(db,'parceiro-cultura')).length,0);
 assert.equal(B.scopedStudents(db,actor(db,'parceiro-papelaria')).length,0);
 assert.throws(()=>B.familyMessages(db,actor(db,'parceiro-papelaria')));
});

test('comunicação atual acompanha envio, leitura, resposta e novo contato sem reutilizar estado antigo',()=>{
 const db=fresh(),staff=actor(db,'direcao'),family=actor(db,'familia-ana');
 db.business.messages=[]; // Exercita também uma base sem histórico prévio.
 assert.equal(B.communicationStatus(db,'ana'),null);
 const first=B.sendMessage(db,staff,'ana','Vamos conversar sobre o acompanhamento.');
 assert.equal(B.communicationStatus(db,'ana').label,'aguardando retorno');
 B.respondMessage(db,family,first.id);assert.match(B.communicationStatus(db,'ana').label,/leitura confirmada/);
 B.respondMessage(db,family,first.id,'Podemos conversar, recebi o comunicado.');
 assert.equal(B.communicationStatus(db,'ana').at,first.repliedAt);assert.equal(B.communicationStatus(db,'ana').label,'retorno recebido');
 B.sendMessage(db,staff,'ana','Novo contato com próximos passos combinados.');
 assert.equal(B.communicationStatus(db,'ana').label,'aguardando retorno');assert.equal(B.communicationStatus(db,'ana').count,2);
});
