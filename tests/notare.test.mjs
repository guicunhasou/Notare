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
  assert.match(html, /styles\.css\?v=11/);
  assert.match(html, /data\.js\?v=10/);
  assert.match(html, /core\.js\?v=1/);
  assert.match(html, /ui\.js\?v=1/);
  assert.match(html, /app\.js\?v=14/);
});

test("o indicador representa todas as ações agendadas", () => {
  const html = read("index.html");
  const source = read("app.js");

  assert.match(html, /Ações agendadas/);
  assert.doesNotMatch(html, /Retornos pendentes/);
  assert.match(source, /const scheduledActions = agenda\.length/);
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

test("a ativação institucional está disponível apenas para a direção", () => {
  const seed = loadSeed();
  const html = read("index.html");
  const source = read("app.js");
  const allowed = seed.profiles.filter((profile) => profile.permissions.includes("school:view"));

  assert.equal(allowed.map((profile) => profile.id).join(","), "direcao");
  assert.match(html, /data-view="ativacao"/);
  assert.match(html, /data-route="ativacao" data-permission="school:view"/);
  assert.match(source, /ativacao: "school:view"/);
});
