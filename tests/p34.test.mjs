import assert from 'node:assert/strict';
import test from 'node:test';
import { runtime } from './runtime.mjs';

const seedOnlyLegacy = r => r.run(`
  db.business.partners = db.business.partners.filter(partner => ['papelaria','cultura'].includes(partner.id));
  db.business.offers = db.business.offers.filter(offer => ['oferta-material','oferta-leitura'].includes(offer.id));
  delete db.business.exampleRevision;
  delete db.business.presentationRevision;
  delete db.business.reviewExamplesRevision;
`);

test('P03: cards compactos guardam valores e detalhes ficam inertes', () => {
  const r=runtime();r.run('renderDashboard()');
  assert.equal(r.element('#metric-priority').textContent,'6');
  assert.equal(r.element('#metric-followup').textContent,'12');
  assert.match(r.element('#priority-summary').textContent,/96 estudantes/);
  assert.equal(r.element('#dashboard-priority-details').inert,true);
  assert.equal(r.element('#dashboard-agenda-details').inert,false);
  assert.equal(r.element('#dashboard-evolution-details').inert,false);
  assert.match(r.element('#evolution-summary').textContent,/23\/09\/2026/);
});

test('P03: expansão individual persiste por perfil fora dos dados escolares', () => {
  const r=runtime();const before=r.run('JSON.stringify(db)');
  r.run('toggleDashboardPanel("priority")');
  assert.equal(r.element('[data-dashboard-toggle="priority"]').attributes['aria-expanded'],'true');
  assert.equal(r.element('#dashboard-agenda-details').inert,false);
  assert.equal(JSON.parse(r.storage.get('notare-dashboard-v3:direcao')).priority,true);
  assert.equal(r.run('JSON.stringify(db)'),before);
  r.run('state.profileId="orientacao";ensureDashboardPreferences();applyDashboardPanels()');
  assert.equal(r.element('#dashboard-priority-details').inert,true);
  r.run('state.profileId="direcao";ensureDashboardPreferences();applyDashboardPanels()');
  assert.equal(r.element('#dashboard-priority-details').inert,false);
});

test('P03 atualizado: preferência inválida ou indisponível não afeta a base',()=>{
 const r=runtime();r.storage.set('notare-dashboard-v3:direcao','{quebrado');r.run('ensureDashboardPreferences()');const before=r.run('JSON.stringify(db)');r.failStorage();r.run('toggleDashboardPanel("attendance")');assert.equal(r.element('#dashboard-attendance-details').inert,false);assert.match(r.element('#toast').textContent,/nesta sessão/);assert.equal(r.run('JSON.stringify(db)'),before);
});

test('P03 atualizado: indicadores não recolhem o gráfico detalhado nem apagam seu conteúdo',()=>{
 const r=runtime();r.run('renderDashboard()');const chart=r.element('#attendance-chart').innerHTML;r.run('toggleDashboardPanel("attendance");toggleDashboardPanel("evolution")');assert.equal(r.element('#dashboard-evolution-details').inert,false);assert.equal(r.element('#attendance-chart').innerHTML,chart);
});

test('P03: calendário conta as mesmas ações da agenda e respeita o perfil', () => {
  const r=runtime();
  assert.equal(r.run('activeAgenda(new Date(2026,10,5,12)).length'),3);
  assert.equal(r.run('calendarEventCounts(new Date(2026,10,5,12)).get("2026-11-06")'),1);
  r.run('state.profileId="orientacao"');
  assert.equal(r.run('activeAgenda(new Date(2026,10,5,12)).length'),4);
  assert.equal(r.run('[...calendarEventCounts(new Date(2026,10,5,12)).values()].reduce((sum,n)=>sum+n,0)'),4);
});

test('P03: calendário ignora ações concluídas, anuladas e de outro perfil', () => {
  const r=runtime();r.run(`db.agenda.push(
    {studentId:'ana',ownerId:'direcao',date:'2026-11-05',status:'done'},
    {studentId:'ana',ownerId:'direcao',date:'2026-11-05',status:'cancelled',voidedAt:'2026-11-05T12:00:00Z'},
    {studentId:'ana',ownerId:'orientacao',date:'2026-11-05'}
  )`);
  assert.equal(r.run('activeAgenda(new Date(2026,10,5,12)).length'),3);
});

test('P03 atualizado: data consulta o calendário e preserva a agenda', () => {
  const r=runtime();r.run('renderDashboard()');
  const before=r.element('#agenda-list').innerHTML,databaseBefore=r.run('JSON.stringify(db)'),prefs=r.storage.get('notare-dashboard-v3:direcao');
  const selectedDate=r.run('dateKey(activeAgenda()[0].scheduledDate)'),expectedTitle=r.run('escapeHtml(activeAgenda()[0].title)');
  r.run(`selectCalendarDate(${JSON.stringify(selectedDate)})`);
  assert.ok(r.element('#calendar-events').innerHTML.includes(expectedTitle));
  assert.equal(r.run('state.calendarDate'),selectedDate);
  assert.equal(r.element('#calendar-selection').hidden,false);
  assert.equal(r.element('#agenda-list').innerHTML,before);
  r.run('selectCalendarDate(dateKey(addDays(activeAgenda().at(-1).scheduledDate,7)))');
  assert.match(r.element('#calendar-events').innerHTML,/Nenhum compromisso nesta data/);
  assert.equal(r.element('#agenda-list').innerHTML,before);
  const date=r.run('state.calendarDate');r.run('selectCalendarDate("data inválida")');
  assert.equal(r.run('state.calendarDate'),date);
  assert.equal(r.storage.get('notare-dashboard-v3:direcao'),prefs);
  assert.equal(r.run('JSON.stringify(db)'),databaseBefore);
});

test('P03: semana do calendário muda sem criar ou editar compromissos', () => {
  const r=runtime();const before=r.run('JSON.stringify(db)');
  r.element('#calendar-next').listeners.click();
  assert.equal(r.run('state.calendarWeekOffset'),1);
  r.element('#calendar-previous').listeners.click();
  assert.equal(r.run('state.calendarWeekOffset'),0);
  assert.equal(r.run('JSON.stringify(db)'),before);
});

test('P03: indicadores chamam destinos coerentes com filtros existentes', () => {
  const r=runtime();r.run('showRoute=route=>{window.destination=route};state.query="Outra busca";state.followupClassFilter="8º A";openDashboardIndicator("priorities")');
  assert.equal(r.context.window.destination,'busca-ativa');assert.equal(r.run('state.filter'),'alta');assert.equal(r.run('state.query'),'');
  r.run('openDashboardIndicator("plans")');assert.equal(r.context.window.destination,'registros');assert.equal(r.run('state.recordFilter'),'Plano');
  r.run('openDashboardIndicator("students")');assert.equal(r.context.window.destination,'estudantes');assert.equal(r.run('state.classFilter'),'todas');
});

test('P04: base inicial acrescenta três parceiros e três ofertas pendentes válidas', () => {
  const r=runtime();
  assert.equal(r.run('db.business.partners.length'),9);
  assert.equal(r.run('db.business.offers.length'),12);
  assert.equal(r.run('db.business.offers.filter(offer=>offer.status==="pending").length'),6);
  assert.equal(r.run('db.business.offers.every(offer=>db.business.partners.some(partner=>partner.id===offer.partnerId)&&offer.stock>0&&offer.commissionRate===500)'),true);
  assert.equal(r.run('db.business.redemptions.length'),0);
});

test('P04: migração aditiva preserva registros, anulações, estoque e preferências', () => {
  const r=runtime();seedOnlyLegacy(r);
  r.run(`db.records[0].description='Edição local preservada';db.records[0].voidedAt='2026-11-05T12:00:00Z';db.records[0].voidedById='direcao';db.plans[0].voidedAt='2026-11-05T12:00:00Z';db.plans[0].status='cancelled';db.business.offers[0].stock=7;db.preference='manter';saveDatabase();db=loadDatabase()`);
  assert.equal(r.run('db.records[0].description'),'Edição local preservada');
  assert.ok(r.run('db.records[0].voidedAt'));
  assert.equal(r.run('db.plans[0].status'),'cancelled');
  assert.equal(r.run('db.business.offers[0].stock'),7);
  assert.equal(r.run('db.preference'),'manter');
  assert.equal(r.run('db.business.partners.length'),9);
  assert.equal(JSON.parse(r.storage.get('notare-database-v7')).business.exampleRevision,2);
});

test('P04: recargas não duplicam dados nem restauram decisões já feitas', () => {
  const r=runtime();r.run('window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-criatividade",true);window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-movimento",false,"Condições a revisar.");saveDatabase();db=loadDatabase();db=loadDatabase()');
  assert.equal(r.run('db.business.offers.length'),12);
  assert.equal(r.run('db.business.offers.find(offer=>offer.id==="oferta-criatividade").status'),'approved');
  assert.equal(r.run('db.business.offers.find(offer=>offer.id==="oferta-movimento").status'),'rejected');
  assert.equal(r.run('db.business.offers.filter(offer=>offer.status==="pending").length'),4);
});

test('P04: oferta ou parceiro existente com mesmo ID nunca é sobrescrito', () => {
  const r=runtime();seedOnlyLegacy(r);
  r.run('db.business.partners.push({id:"vagalume",actor:"meu-parceiro",name:"Nome local mantido"});db.business.offers.push({id:"oferta-criatividade",partnerId:"vagalume",status:"rejected",stock:3,price:12345});window.NOTARE_BUSINESS.initialize(db)');
  assert.equal(r.run('db.business.partners.find(partner=>partner.id==="vagalume").name'),'Nome local mantido');
  assert.equal(r.run('db.business.offers.find(offer=>offer.id==="oferta-criatividade").price'),12345);
  assert.equal(r.run('db.business.offers.find(offer=>offer.id==="oferta-criatividade").status'),'rejected');
});

test('P04: falha na persistência dos exemplos mantém os dados locais em memória e no disco', () => {
  const r=runtime();seedOnlyLegacy(r);r.run('db.records[0].description="Registro local antes da atualização";saveDatabase()');
  const stored=r.storage.get('notare-database-v7');r.failStorage();r.context.console={warn(){}};
  r.run('db=loadDatabase()');
  assert.equal(r.run('db.records[0].description'),'Registro local antes da atualização');
  assert.equal(r.storage.get('notare-database-v7'),stored);
  assert.equal(r.run('db.business.partners.length'),9);
});

test('P04: aprovação habilita voucher e recusa mantém oferta indisponível', () => {
  const r=runtime();
  r.run('window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-criatividade",true);window.NOTARE_BUSINESS.reviewOffer(db,getProfile(),"oferta-movimento",false,"Revisar as condições informadas.")');
  assert.equal(r.run('window.NOTARE_BUSINESS.availableOffers(db,getProfile("familia-ana")).some(offer=>offer.id==="oferta-criatividade")'),true);
  assert.equal(r.run('window.NOTARE_BUSINESS.availableOffers(db,getProfile("familia-ana")).some(offer=>offer.id==="oferta-movimento")'),false);
  r.run('window.reserved=window.NOTARE_BUSINESS.reserve(db,getProfile("familia-ana"),"oferta-criatividade")');
  assert.equal(r.context.window.reserved.commission,0);
  assert.equal(r.run('db.business.offers.find(offer=>offer.id==="oferta-criatividade").stock'),11);
  assert.throws(()=>r.run('window.NOTARE_BUSINESS.confirmConversion(db,getProfile("parceiro-trilha"),window.reserved.id)'),/inválido/);
  r.run('window.NOTARE_BUSINESS.confirmConversion(db,getProfile("parceiro-vagalume"),window.reserved.id);saveDatabase();db=loadDatabase()');
  assert.equal(r.run('db.business.redemptions[0].commission'),325);
  assert.equal(r.run('db.business.redemptions[0].status'),'confirmed');
});

test('P04 + logos finais: onze assets fornecidos ficam mapeados com textos alternativos', () => {
  const r=runtime();
  assert.equal(r.run('Object.keys(window.NOTARE_COMMUNITY_MEDIA).length'),11);
  assert.equal(r.run('Object.values(window.NOTARE_COMMUNITY_MEDIA).every(media=>media.src===media.expectedFile&&media.alt)'),true);
  assert.match(r.run('personPhoto(getProfile("familia-ana"))'),/<img/);
  assert.match(r.run('personPhoto(getProfile("parceiro-vagalume"))'),/community-logo/);
  r.run('window.NOTARE_COMMUNITY_MEDIA["familia-ana"].src="assets/community/familia-ana.png"');
  assert.match(r.run('personPhoto(getProfile("familia-ana"))'),/alt="Retrato de Marina Souza/);
});
