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
  assert.match(html, /styles\.css\?v=14/);
  assert.match(html, /data\.js\?v=11/);
  assert.match(html, /core\.js\?v=3/);
  assert.match(html, /ui\.js\?v=1/);
  assert.match(html, /app\.js\?v=18/);
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
    profiles: [{ id: "docencia", role: "Docência · 8º B", description: "Texto anterior", scope: "class:8º B", preference: "preservada" }],
    records: [{ id: "registro-local" }]
  };
  const seed = {
    profiles: [{ id: "docencia", role: "Docência · 8º A e 8º B", description: "Duas turmas", scope: "classes:8º A|8º B" }]
  };

  const reconciled = api.reconcileProfileConfiguration(saved, seed);

  assert.equal(reconciled.profiles[0].scope, "classes:8º A|8º B");
  assert.equal(reconciled.profiles[0].role, "Docência · 8º A e 8º B");
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

test("a jornada guiada representa o fluxo real sem fingir integrações", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /data-view="jornada"/);
  assert.equal((html.match(/data-journey-step=/g) || []).length, 4);
  assert.match(html, /Pular apresentação/);
  assert.match(html, /assets\/brand\/notare-logo\.svg/);
  assert.match(html, /assets\/brand\/notare-favicon\.svg/);
  assert.match(html, /Este MVP não autentica uma escola em servidor/);
  assert.match(html, /Não há cobrança, assinatura ou processamento comercial/);
  assert.match(html, /data-demo-text="Escola Horizonte Vivo"/);
  assert.match(html, /Importação concluída/);
  assert.match(source, /async function typeJourneyText/);
  assert.match(source, /async function playJourneyStep/);
  assert.match(source, /character === " " \? 48 : 58/);
  assert.doesNotMatch(source, /}, 6000\)/);
  assert.match(source, /location\.hash\.slice\(1\) \|\| "jornada"/);
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
});

test("as listagens de estudantes são ordenadas por nome", () => {
  const source = read("app.js");
  assert.match(source, /function sortStudentsByName/);
  assert.match(source, /const scopedStudents = sortStudentsByName\(visibleStudents\(\)\)/);
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

test("as notificações comuns aguardam a leitura inicial do painel", () => {
  const source = read("app.js");
  assert.match(source, /notificationTestMode \? \[500, 2500\] : \[90000, 180000\]/);
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

test("a escola oferece saída para o acesso institucional", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /id="school-menu-button"/);
  assert.match(html, /id="school-logout"/);
  assert.match(source, /showRoute\("jornada"\)/);
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
