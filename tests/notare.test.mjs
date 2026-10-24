import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8");

function loadSeed() {
  const window = {};
  vm.runInNewContext(read("data.js"), { window });
  return window.NOTARE_SEED;
}

function loadDateApi() {
  const context = { window: {} };
  vm.runInNewContext(read("core.js"), context);
  return context.window.NOTARE_CORE;
}

test("a base mantém 96 estudantes em oito turmas de 12", () => {
  const seed = loadSeed();
  const classes = new Map();
  seed.students.forEach((student) => classes.set(student.className, (classes.get(student.className) || 0) + 1));

  assert.equal(seed.students.length, 96);
  assert.equal(classes.size, 8);
  assert.deepEqual([...classes.values()].sort((a, b) => a - b), Array(8).fill(12));
  assert.equal(new Set(seed.students.map((student) => student.id)).size, seed.students.length);
  assert.equal(new Set(seed.students.map((student) => student.code)).size, seed.students.length);
});

test("registros, planos e agenda apontam para estudantes e responsáveis existentes", () => {
  const seed = loadSeed();
  const studentIds = new Set(seed.students.map((student) => student.id));
  const profileIds = new Set(seed.profiles.map((profile) => profile.id));

  [...seed.records, ...seed.plans, ...seed.agenda].forEach((item) => {
    assert.ok(studentIds.has(item.studentId), `Estudante inexistente: ${item.studentId}`);
    if (item.ownerId) assert.ok(profileIds.has(item.ownerId), `Responsável inexistente: ${item.ownerId}`);
  });
});

test("registros e planos demonstrativos incluem horário válido", () => {
  const seed = loadSeed();
  seed.records.forEach((record) => assert.match(record.time, /^([01]\d|2[0-3]):[0-5]\d$/));
  seed.plans.forEach((plan) => assert.match(plan.createdTime, /^([01]\d|2[0-3]):[0-5]\d$/));
});

test("dados de estudantes respeitam os limites e estados previstos", () => {
  const seed = loadSeed();
  const priorities = new Set(["alta", "media", "evolucao", "estavel"]);

  seed.students.forEach((student) => {
    assert.ok(student.name && student.className && student.code);
    assert.ok(priorities.has(student.priority), `Prioridade inválida: ${student.priority}`);
    assert.ok(student.attendance >= 0 && student.attendance <= 100, `Frequência inválida: ${student.id}`);
  });
});

test("todas as pranchas WebP existem e permanecem leves", () => {
  const seed = loadSeed();
  const sheets = new Set(seed.students.map((student) => student.photoSheet));

  assert.equal(sheets.size, 4);
  sheets.forEach((sheet) => {
    assert.match(sheet, /\.webp$/);
    const file = path.join(repoRoot, sheet);
    assert.ok(fs.existsSync(file), `Ativo ausente: ${sheet}`);
    assert.ok(fs.statSync(file).size < 200 * 1024, `Ativo acima de 200 KB: ${sheet}`);
  });
});

test("datas aceitam valores reais e rejeitam datas impossíveis", () => {
  const api = loadDateApi();
  assert.equal(api.dateKey(api.parseDisplayDate("26/09/2026")), "2026-09-26");
  assert.equal(api.dateKey(api.parseDisplayDate("2026-09-26")), "2026-09-26");
  assert.equal(api.parseDisplayDate("31/02/2026"), null);
  assert.equal(api.relativeDateLabel(new Date(2026, 8, 25, 12), new Date(2026, 8, 26, 12)), "ontem");
  assert.equal(api.planEffectiveStatus({ status: "active", date: "2026-09-25" }, new Date(2026, 8, 26, 12)), "overdue");
});

test("o HTML preserva datas dinâmicas e os contratos básicos de acessibilidade", () => {
  const html = read("index.html");
  assert.match(html, /<main id="main-content" tabindex="-1">/);
  assert.match(html, /id="notification-popover" role="dialog"/);
  assert.match(html, /data-filter="todos" aria-pressed="true"/);
  assert.doesNotMatch(html, /name="date" value="2026-/);
  assert.match(html, /styles\.css\?v=\d+/);
  assert.match(html, /data\.js\?v=13/);
  assert.match(html, /core\.js\?v=4/);
  assert.match(html, /ui\.js\?v=2/);
  assert.match(html, /app\.js\?v=\d+/);
});

test("a base salva recebe as referências atuais das fotos sem perder alterações", () => {
  const api = loadDateApi();
  const saved = {
    students: [{ id: "ana", name: "Nome preservado", photo: "arquivo-antigo" }],
    records: [{ id: "registro-local" }],
    plans: [{ id: "plano-local" }]
  };
  const seed = {
    students: [{ id: "ana", name: "Ana Souza", photoSheet: "assets/rosters/estudantes-8-ano.webp", photoIndex: 12 }]
  };

  const reconciled = api.reconcileStudentMedia(saved, seed);

  assert.equal(reconciled.students[0].name, "Nome preservado");
  assert.equal(reconciled.students[0].photo, undefined);
  assert.equal(reconciled.students[0].photoSheet, seed.students[0].photoSheet);
  assert.equal(reconciled.students[0].photoIndex, 12);
  assert.deepEqual(reconciled.records, saved.records);
  assert.deepEqual(reconciled.plans, saved.plans);
});

test("a configuração atual dos perfis é aplicada sem apagar dados locais", () => {
  const api = loadDateApi();
  const saved = {
    profiles: [{ id: "docencia", role: "Docência · 8º B", description: "Texto anterior", scope: "class:8º B", permissions: ["legada:view"], preference: "preservada" }],
    records: [{ id: "registro-local" }]
  };
  const seed = {
    profiles: [{ id: "docencia", role: "Docência · 8º A e 8º B", description: "Duas turmas", scope: "classes:8º A|8º B", permissions: ["students:view"] }]
  };

  const reconciled = api.reconcileProfileConfiguration(saved, seed);

  assert.equal(reconciled.profiles[0].scope, "classes:8º A|8º B");
  assert.equal(reconciled.profiles[0].role, "Docência · 8º A e 8º B");
  assert.equal([...reconciled.profiles[0].permissions].join("|"), "students:view");
  assert.equal(reconciled.profiles[0].preference, "preservada");
  assert.deepEqual(reconciled.records, saved.records);
});

test("o indicador representa as ações agendadas do perfil conectado", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /Ações agendadas/);
  assert.doesNotMatch(html, /Retornos pendentes/);
  assert.match(source, /const scheduledActions = agenda\.length/);
  assert.match(source, /item\.ownerId === state\.profileId/);
});

test("o menu móvel isola o conteúdo e contém a navegação por teclado", () => {
  const source = read("ui.js");
  const app = read("app.js");

  assert.match(source, /background\.inert = true/);
  assert.match(source, /drawer\.setAttribute\("aria-modal", "true"\)/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /element\.getClientRects\(\)\.length > 0/);
  assert.match(app, /sidebarDrawer\.trapFocus\(event\)/);
});

test("a navegação usa histórico real e responde a Voltar e Avançar", () => {
  const source = read("app.js");
  assert.match(source, /history\.pushState\(/);
  assert.match(source, /options\.skipHistory && location\.hash !== nextHash/);
  assert.match(source, /addEventListener\("popstate"/);
  assert.match(source, /if \(nextRoute === "conclusao"\) renderPlanSuccess\(\)/);
  assert.doesNotMatch(source, /addEventListener\("hashchange"/);
});

test("a entrada destaca o painel e mantém a implantação como jornada opcional", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /data-view="entrada"/);
  assert.match(html, /Acessar visão geral/);
  assert.match(html, /Conhecer a implantação do Notare/);
  assert.match(source, /#entry-dashboard"\)\.addEventListener\("click", \(\) => \{[\s\S]*switchProfile\("direcao", \{ announce: false \}\)/);
  assert.match(html, /data-view="jornada"/);
  assert.equal((html.match(/data-journey-step=/g) || []).length, 4);
  assert.match(html, /Ir à visão geral/);
  assert.match(html, /assets\/brand\/notare-logo\.svg/);
  assert.match(html, /assets\/brand\/notare-favicon\.svg/);
  assert.match(html, /neste MVP, a validação usa apenas dados fictícios no navegador/);
  assert.match(html, /sem cobrança ou assinatura real nesta demonstração/);
  assert.match(html, /data-demo-text="Escola Horizonte Vivo"/);
  assert.match(html, /Importação concluída/);
  assert.match(source, /async function typeJourneyText/);
  assert.match(source, /async function playJourneyStep/);
  assert.match(source, /character === " " \? 48 : 58/);
  assert.doesNotMatch(source, /}, 6000\)/);
  assert.match(source, /location\.hash\.slice\(1\) \|\| "entrada"/);
});

test("as quatro etapas simulam validação, contratação, anexos e acesso", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /Código INEP simulado/);
  assert.match(html, /data-demo-text="26000000"/);
  assert.match(html, /Importado da validação anterior/);
  assert.match(html, /data-demo-select="Ensino Fundamental"/);
  assert.match(html, /Educação de Jovens e Adultos/);
  assert.match(html, /Notare Essencial/);
  assert.match(html, /Notare Acompanhamento/);
  assert.match(html, /Notare Rede/);
  assert.match(html, /fotos-de-perfil\.zip/);
  assert.match(html, /camila@horizontevivo\.edu/);
  assert.match(source, /\[data-demo-select\]/);
  assert.match(source, /element\.value = element\.dataset\.demoSelect/);
});

test("a navegação interna separa a introdução da consulta ao plano institucional", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.doesNotMatch(html, /<span>Jornada do produto<\/span>/);
  assert.match(html, /id="school-plan"/);
  assert.match(html, /id="institution-plan-dialog"/);
  assert.match(source, /openInstitutionPlanDialog/);
});

test("a agenda pessoal mostra estudante e turma sem repetir o responsável", () => {
  const source = read("app.js");
  assert.match(source, /student\.name\)} \(\$\{escapeHtml\(student\.className\)\}\)/);
  assert.doesNotMatch(source, /owner\?\.name\.split/);
});

test("o gráfico expõe o valor de cada ponto no hover e no foco", () => {
  const source = read("app.js");
  const css = read("styles.css");
  assert.match(source, /class="chart-point" tabindex="0"/);
  assert.match(source, /class="chart-tooltip"/);
  assert.match(css, /\.chart-point:hover \.chart-tooltip, \.chart-point:focus \.chart-tooltip/);
  assert.match(css, /\.chart-point-hit \{[^}]*stroke: transparent/);
});

test("as listagens de estudantes permitem ordenar por nome ou prioridade", () => {
  const html = read("index.html");
  const source = read("app.js");
  assert.match(html, /id="student-sort"/);
  assert.match(html, /value="name">Nome \(A–Z\)/);
  assert.match(html, /value="priority">Prioridade/);
  assert.match(source, /function sortStudentsByName/);
  assert.match(source, /function sortStudents\(students, mode = "name"\)/);
  assert.match(source, /const scopedStudents = sortStudentsByName\(visibleStudents\(\)\)/);
  assert.match(source, /const visible = sortStudents\(scopedStudents\.filter/);
  assert.match(source, /\}\), "priority"\);/);
  assert.match(source, /const classStudents = sortStudentsByName/);
});

test("o perfil docente reúne duas turmas e migra bases salvas", () => {
  const seed = loadSeed();
  const source = read("app.js");
  const teacher = seed.profiles.find((profile) => profile.id === "docencia");
  assert.equal(teacher.scope, "classes:8º A|8º B");
  assert.match(source, /function profileClassNames/);
  assert.match(source, /reconcileProfileConfiguration\(reconcileStudentMedia/);
});

test("as notificações começam no painel, respeitam o perfil e reiniciam na troca", () => {
  const source = read("app.js");
  const ui = read("ui.js");
  assert.match(source, /notificationTestMode \? \[500, 2500\] : \[120000, 300000\]/);
  assert.match(source, /function profileNotificationTemplates/);
  assert.match(source, /state\.currentRoute !== "painel"/);
  assert.match(source, /resetProfileNotifications\(\);[\s\S]*state\.profileId = profileId/);
  assert.match(ui, /function reset\(\)/);
  assert.match(ui, /scheduledTimers\.forEach/);
});

test("a entrada abre com a marca e a implantação usa avanço manual por padrão", () => {
  const html = read("index.html");
  const source = read("app.js");
  const css = read("styles.css");
  assert.match(html, /id="entry-opening"/);
  assert.match(html, /class="opening-amber"/);
  assert.match(html, /class="opening-green"/);
  assert.match(html, /class="opening-blue"/);
  assert.match(html, /class="opening-lettering"/);
  assert.match(html, /data-journey-mode="automatic"/);
  assert.match(html, /class="active" type="button" data-journey-mode="manual" aria-pressed="true"/);
  assert.match(html, /id="journey-next"/);
  assert.match(source, /journeyWait\(1500, runId\)/);
  assert.match(source, /journeyWait\(3500, runId\)/);
  assert.match(source, /let journeyMode = "manual"/);
  assert.match(source, /function setJourneyMode/);
  assert.match(source, /function finishJourney\(\) \{[\s\S]*switchProfile\("direcao", \{ announce: false \}\)/);
  assert.match(source, /#journey-skip"\)\.addEventListener\("click", finishJourney\)/);
  assert.equal((html.match(/demo-identity-reveal/g) || []).length, 2);
  assert.match(css, /\.demo-identity-reveal \{[^}]*max-height: 0/);
  assert.match(css, /\.demo-identity-reveal\.is-visible \{[^}]*max-height: 6\.5rem/);
  assert.match(css, /@keyframes opening-amber-in/);
  assert.match(css, /@keyframes opening-lettering-in/);
  assert.match(css, /@keyframes entry-opening-out/);
});

test("os registros identificam o tipo com ícone, texto e cor", () => {
  const html = read("index.html");
  const source = read("app.js");
  const css = read("styles.css");
  assert.match(html, /id="i-absence"/);
  assert.match(html, /id="i-contact"/);
  assert.match(html, /id="i-occurrence"/);
  assert.match(html, /id="i-feedback"/);
  assert.match(source, /function recordKindPresentation/);
  assert.match(source, /record-kind-\$\{presentation\.tone\}/);
  assert.match(source, /\(\$\{escapeHtml\(student\.className\)\}\)/);
  assert.match(source, /time: currentTimeLabel\(\)/);
  assert.match(source, /Horário não informado/);
  assert.match(source, /function reconcileRecordTimes/);
  assert.match(css, /\.record-kind-absence/);
  assert.match(css, /\.record-kind-contact/);
  assert.match(css, /\.record-kind-occurrence/);
  assert.match(css, /\.record-kind-feedback/);
});

test("o novo registro escolhe turma antes do estudante", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.ok(html.indexOf('id="record-class"') < html.indexOf('id="record-student"'));
  assert.match(source, /student\.className === state\.recordClass/);
  assert.match(source, /#record-class/);
});

test("a autoria do registro fica vinculada ao perfil conectado", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.doesNotMatch(html, /id="record-owner"/);
  assert.match(html, /id="record-owner-display"/);
  assert.match(source, /ownerId: state\.profileId/);
});

test("a sugestão de texto declara e implementa uma simulação local", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /Gerar sugestão simulada/);
  assert.match(html, /não usa inteligência artificial real/);
  assert.match(source, /const suggestions = \{/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(read("styles.css"), /\.ai-simulation-button \{[^}]*background: var\(--amber-soft\)/);
});

test("os textos pré-elaborados acompanham o tipo e permanecem editáveis", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /id="record-template"/);
  assert.match(html, /O texto inserido poderá ser editado livremente/);
  assert.doesNotMatch(html, /textarea[^>]*readonly/);
  assert.match(source, /const recordTextTemplates = \{/);
  ["Ausência", "Contato", "Ocorrência", "Devolutiva"].forEach((kind) => assert.match(source, new RegExp(`"${kind}": \\[`)));
  assert.match(source, /input\[name="kind"\][^\n]*addEventListener\("change", \(event\) =>/);
  assert.match(source, /insertRecordText\(template\.text\(student\)/);
  assert.match(source, /insertRecordText\(suggestions\[kind\]/);
});

test("a área de cadastros consulta a base local sem oferecer gravação falsa", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /data-route="cadastros"/);
  assert.match(html, /data-view="cadastros"/);
  assert.match(html, /data-registration-tab="students"/);
  assert.match(html, /data-registration-tab="staff"/);
  assert.match(html, /data-registration-tab="classes"/);
  assert.match(html, /id="registration-search"/);
  assert.match(html, /id="registration-create"[^>]*disabled/);
  assert.doesNotMatch(html, /id="registration-form"/);
  assert.match(source, /cadastros: "Cadastros"/);
  assert.match(source, /function renderRegistrations\(\)/);
  assert.match(source, /#registration-search"\)\.addEventListener\("input"/);
  assert.match(source, /state\.registrationTab = button\.dataset\.registrationTab/);
});

test("cadastros respeita permissão, escopo e paginação", () => {
  const seed = loadSeed();
  const html = read("index.html");
  const source = read("app.js");
  const accessByProfile = Object.fromEntries(seed.profiles.map((profile) => [profile.id, profile.permissions.includes("registrations:view")]));

  assert.deepEqual(JSON.parse(JSON.stringify(accessByProfile)), {
    direcao: true,
    coordenacao: false,
    orientacao: false,
    docencia: false,
    secretaria: true
  });
  assert.match(html, /data-route="cadastros" data-permission="registrations:view"/);
  assert.match(source, /cadastros: "registrations:view"/);
  assert.match(source, /sortStudentsByName\(visibleStudents\(\)\)/);
  assert.match(source, /const pageSize = 8/);
  assert.match(html, /id="registration-previous"/);
  assert.match(html, /id="registration-next"/);
  assert.match(source, /Mostrando \$\{firstVisible\}–\$\{lastVisible\} de \$\{records\.length\}/);
});

test("as abas de cadastros expõem relações e navegação por teclado", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /id="registration-tab-students"[^>]*aria-controls="registration-table"/);
  assert.match(html, /id="registration-table" role="tabpanel" aria-labelledby="registration-tab-students" tabindex="0"/);
  assert.match(source, /\["ArrowLeft", "ArrowRight", "Home", "End"\]/);
  assert.match(source, /button\.tabIndex = active \? 0 : -1/);
  assert.match(source, /table\.setAttribute\("aria-labelledby", button\.id\)/);
});

test("a troca de contexto protege a descrição já preenchida", () => {
  const source = read("app.js");

  assert.match(source, /function confirmRecordContextChange\(\)/);
  assert.match(source, /Trocar o estudante ou o tipo de registro limpará a descrição atual/);
  assert.match(source, /if \(!confirmRecordContextChange\(\)\)/);
  assert.match(source, /state\.recordKind = event\.currentTarget\.value/);
});

test("textos prontos não substituem uma descrição editada sem confirmação", () => {
  const source = read("app.js");

  assert.match(source, /function confirmRecordTextReplacement\(\)/);
  assert.match(source, /Substituir a descrição atual pelo novo texto/);
  assert.equal((source.match(/if \(!confirmRecordTextReplacement\(\)\)/g) || []).length, 2);
});

test("cadastros não renderiza conteúdo sem permissão", () => {
  const source = read("app.js");

  assert.match(source, /function renderRegistrations\(\) \{\s+if \(!hasPermission\("registrations:view"\)\)/);
  assert.match(source, /document\.querySelector\("#registration-table"\)\.replaceChildren\(\)/);
});

test("a introdução anuncia estados sem narrar cada caractere", () => {
  const html = read("index.html");

  assert.match(html, /id="journey-autoplay" role="status" aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(html, /class="journey-stage" aria-live=/);
});

test("a escala tipográfica aumenta sem ampliar o subtítulo da entrada", () => {
  const css = read("styles.css");
  assert.match(css, /html \{ font-size: 18px;/);
  assert.match(css, /\.entry-content h1 \{[^}]*font-size: 42px/);
  assert.match(css, /\.table-student strong \{ font-size: \.92rem/);
  assert.match(css, /\.table-student span, \.table-muted, \.table-signals \{ font-size: \.82rem/);
  assert.match(css, /\.data-form input\[type="date"\][^\n]*font-size: \.9rem/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.entry-content h1 \{[^}]*font-size: 30px/);
});

test("a escola oferece saída para o acesso institucional", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /id="school-menu-button"/);
  assert.match(html, /id="school-logout"/);
  assert.match(source, /showRoute\("entrada"\)/);
});

test("a navegação remove redundâncias solicitadas", () => {
  const html = read("index.html");
  const source = read("app.js");
  const recordsView = html.match(/<section class="view placeholder-view" data-view="registros"[\s\S]*?<\/section>/)?.[0] || "";

  assert.doesNotMatch(html, /nav-priority-count|class="nav-count"/);
  assert.match(html, /id="topbar-new-record"/);
  assert.match(source, /#topbar-new-record"\)\.hidden = nextRoute !== "painel"/);
  assert.doesNotMatch(recordsView, /data-back|>Voltar</);
});

test("os seletores reservam espaço para a seta", () => {
  const css = read("styles.css");
  assert.match(css, /select \{ appearance: none; padding-right: 2\.8rem/);
  assert.match(css, /background-position: right \.9rem center/);
});

test("a troca de perfis é identificada como recurso exclusivo do MVP", () => {
  const html = read("index.html");
  assert.match(html, /Perfis de demonstração/);
  assert.match(html, /No produto real, cada funcionário acessa sua própria conta/);
});
