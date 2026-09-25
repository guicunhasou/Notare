const STORAGE_KEY = "notare-database-v5";
const PROFILE_KEY = "notare-profile-v4";
const SIDEBAR_KEY = "notare-sidebar-collapsed";

function cloneSeed() {
  return JSON.parse(JSON.stringify(window.NOTARE_SEED));
}

function loadDatabase() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.schemaVersion === window.NOTARE_SEED.schemaVersion) return saved;
  } catch (error) {
    console.warn("A base local não pôde ser carregada; usando a base inicial.", error);
  }
  return cloneSeed();
}

let db = loadDatabase();

const state = {
  profileId: localStorage.getItem(PROFILE_KEY) || "direcao",
  currentStudent: "ana",
  currentRoute: "painel",
  previousRoute: "painel",
  filter: "todos",
  recordFilter: "todos",
  query: ""
};

const views = [...document.querySelectorAll("[data-view]")];
const announcement = document.querySelector("#announcement");
const toast = document.querySelector("#toast");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#sidebar-scrim");
const profileDialog = document.querySelector("#profile-dialog");
const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function saveDatabase() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getProfile(id = state.profileId) {
  return db.profiles.find((profile) => profile.id === id) || db.profiles[0];
}

function hasPermission(permission) {
  return getProfile().permissions.includes(permission);
}

function visibleStudents() {
  const profile = getProfile();
  if (profile.scope.startsWith("class:")) {
    const className = profile.scope.replace("class:", "");
    return db.students.filter((student) => student.className === className);
  }
  if (profile.scope === "followup") return db.students.filter((student) => student.priority !== "evolucao" || student.actionsCompleted > 0);
  return db.students;
}

function visibleRecords() {
  const visibleIds = new Set(visibleStudents().map((student) => student.id));
  const profile = getProfile();
  return db.records.filter((record) => {
    if (!visibleIds.has(record.studentId)) return false;
    if (!profile.permissions.includes("occurrences:view") && record.kind === "Ocorrência") return false;
    return true;
  });
}

function visiblePlans() {
  const visibleIds = new Set(visibleStudents().map((student) => student.id));
  return db.plans.filter((plan) => visibleIds.has(plan.studentId));
}

function getStudent(id = state.currentStudent) {
  return db.students.find((student) => student.id === id) || visibleStudents()[0] || db.students[0];
}

function getOwner(id) {
  return db.profiles.find((profile) => profile.id === id);
}

function statusClass(priority) {
  return priority === "alta" ? "status-high" : priority === "media" ? "status-medium" : "status-evolution";
}

function formatDate(value) {
  if (!value) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

function todayLabel() {
  return "25/09/2026";
}

function studentButton(student) {
  return `
    <button class="student-row" type="button" data-student="${escapeHtml(student.id)}">
      <span class="mini-avatar">${escapeHtml(student.initials)}</span>
      <span class="student-identity"><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)}</span></span>
      <span class="signal-copy">${escapeHtml(student.signals)}</span>
      <span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span>
      <svg><use href="#i-arrow"></use></svg>
    </button>`;
}

function renderSchool() {
  const school = db.school;
  document.querySelector("#topbar-school-name").textContent = school.name;
  document.querySelector("#topbar-school-meta").textContent = school.address;
}

function renderChart() {
  const profile = getProfile();
  const labels = db.analytics.labels;
  const className = profile.scope.startsWith("class:") ? profile.scope.replace("class:", "") : null;
  const attendance = className && db.analytics.byClass[className] ? db.analytics.byClass[className] : db.analytics.attendance;
  const cases = db.analytics.newCases;
  const width = 760;
  const height = 250;
  const left = 42;
  const right = 20;
  const top = 18;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const x = (index) => left + (chartWidth / (labels.length - 1)) * index;
  const y = (value) => top + ((100 - value) / 35) * chartHeight;
  const baseline = height - bottom;
  const maxCases = Math.max(...cases, 1);
  const points = attendance.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const linePath = attendance.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");
  const area = `M ${x(0)} ${baseline} L ${x(0)} ${y(attendance[0])} ${attendance.slice(1).map((value, index) => `L ${x(index + 1)} ${y(value)}`).join(" ")} L ${x(labels.length - 1)} ${baseline} Z`;
  const gridValues = [70, 80, 90, 100];

  const svg = document.querySelector("#attendance-chart");
  svg.innerHTML = `
    <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a89ff" stop-opacity=".34"/><stop offset="1" stop-color="#9a89ff" stop-opacity="0"/></linearGradient></defs>
    ${gridValues.map((value) => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="rgba(255,255,255,.1)"/><text x="${left - 10}" y="${y(value) + 4}" fill="#9fa0b8" font-size="11" text-anchor="end">${value}%</text>`).join("")}
    ${cases.map((value, index) => { const barHeight = (value / maxCases) * 54; return `<rect x="${x(index) - 12}" y="${baseline - barHeight}" width="24" height="${barHeight}" rx="5" fill="rgba(57,201,213,.24)"/>`; }).join("")}
    <path d="${area}" fill="url(#chart-fill)"/>
    <polyline points="${points}" fill="none" stroke="#a99dfd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${attendance.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="5" fill="#312c59" stroke="#c4bbff" stroke-width="3"><title>${labels[index]}: ${value}% de frequência</title></circle>`).join("")}
    ${labels.map((label, index) => `<text x="${x(index)}" y="${height - 12}" fill="#a9aabd" font-size="10" text-anchor="middle">${escapeHtml(label)}</text>`).join("")}`;
  document.querySelector("#chart-average").textContent = `${attendance.at(-1)}%`;
  document.querySelector("#chart-cases").textContent = String(cases.at(-1));
  svg.setAttribute("aria-label", `Frequência de ${attendance.at(-1)} por cento na semana atual e ${cases.at(-1)} novos casos`);
}

function renderProfileIdentity() {
  const profile = getProfile();
  document.querySelector("#user-avatar").textContent = profile.initials;
  document.querySelector("#user-name").textContent = profile.name;
  document.querySelector("#user-role").textContent = profile.role;
  document.querySelector("#painel-title").textContent = `Bom dia, ${profile.name.split(" ")[0]}`;
  document.querySelector("#dashboard-subtitle").textContent = profile.scope.startsWith("class:")
    ? `Você está vendo apenas estudantes da turma ${profile.scope.replace("class:", "")}.`
    : "Veja quem precisa de atenção e organize as próximas ações.";

  document.querySelectorAll("[data-permission]").forEach((element) => {
    element.hidden = !hasPermission(element.dataset.permission);
  });

  document.querySelector("#role-list").innerHTML = db.profiles.map((item) => `
    <button class="role-option ${item.id === profile.id ? "active" : ""}" type="button" data-profile="${escapeHtml(item.id)}" aria-pressed="${item.id === profile.id}">
      <span class="user-avatar">${escapeHtml(item.initials)}</span>
      <span><strong>${escapeHtml(item.role)}</strong><small>${escapeHtml(item.name)} · ${escapeHtml(item.description)}</small></span>
      <span class="role-check" aria-hidden="true">${item.id === profile.id ? "✓" : ""}</span>
    </button>`).join("");
  applySidebarState(appShell.classList.contains("sidebar-collapsed"));
}

function renderOwnerOptions() {
  const recordOwners = db.profiles.filter((profile) => profile.permissions.includes("records:create"));
  const planOwners = db.profiles.filter((profile) => profile.permissions.includes("plans:create"));
  const option = (profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)} · ${escapeHtml(profile.role)}</option>`;
  document.querySelector("#record-owner").innerHTML = recordOwners.map(option).join("");
  document.querySelector("#plan-owner").innerHTML = planOwners.map(option).join("");
  if (recordOwners.some((profile) => profile.id === state.profileId)) document.querySelector("#record-owner").value = state.profileId;
  if (planOwners.some((profile) => profile.id === state.profileId)) document.querySelector("#plan-owner").value = state.profileId;
}

function renderDashboard() {
  const students = visibleStudents();
  const priorities = students.filter((student) => student.priority === "alta");
  const plans = visiblePlans();
  const visibleIds = new Set(students.map((student) => student.id));
  const agenda = db.agenda.filter((item) => visibleIds.has(item.studentId));
  const pendingReturns = agenda.length;
  const averageAttendance = students.length ? Math.round(students.reduce((total, student) => total + student.attendance, 0) / students.length) : 0;

  document.querySelector("#metric-priority").textContent = String(priorities.length);
  document.querySelector("#metric-followup").textContent = String(plans.filter((plan) => plan.status !== "done").length);
  document.querySelector("#metric-return").textContent = String(pendingReturns);
  document.querySelector(".metric:nth-child(4) strong").textContent = `${averageAttendance}%`;
  document.querySelector("#nav-priority-count").textContent = String(priorities.length);
  document.querySelector(".metric:nth-child(1) .metric-trend").textContent = `${priorities.length} para revisar`;
  document.querySelector(".metric:nth-child(2) .metric-trend").textContent = `${students.filter((student) => student.priority === "evolucao").length} evoluindo`;
  document.querySelector(".metric:nth-child(3) .metric-trend").textContent = `${agenda.filter((item) => item.time.includes(":" )).length} para hoje`;

  const order = { alta: 0, media: 1, evolucao: 2 };
  const ordered = [...students].sort((a, b) => order[a.priority] - order[b.priority]);
  document.querySelector("#dashboard-students").innerHTML = ordered.slice(0, 5).map(studentButton).join("");

  document.querySelector("#agenda-list").innerHTML = agenda.slice(0, 4).map((item) => {
    const student = getStudent(item.studentId);
    const owner = getOwner(item.ownerId);
    return `<li><span class="agenda-time">${escapeHtml(item.time)}</span><span class="agenda-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(student.name)} · ${escapeHtml(owner?.name.split(" ")[0] || "Equipe")}</span></span></li>`;
  }).join("");

  const active = plans.filter((plan) => plan.status === "active").length;
  const review = plans.filter((plan) => plan.status === "review" || plan.status === "overdue").length;
  const completed = students.reduce((total, student) => total + student.actionsCompleted, 0);
  const maximum = Math.max(active, review, completed, 1);
  const bars = document.querySelectorAll(".status-bars > div");
  const values = [active, review, completed];
  bars.forEach((bar, index) => {
    bar.querySelector("i").style.width = `${Math.round((values[index] / maximum) * 100)}%`;
    bar.querySelector("strong").textContent = String(values[index]);
  });
  document.querySelector(".status-bars").setAttribute("aria-label", `${active} em acompanhamento, ${review} aguardando revisão e ${completed} ações concluídas`);
  const casesWithReturn = students.filter((student) => student.actionsCompleted > 0).length;
  const returnRate = students.length ? Math.round((casesWithReturn / students.length) * 100) : 0;
  document.querySelector(".outcome-ring strong").textContent = `${returnRate}%`;
  document.querySelector(".outcome-ring").style.background = `radial-gradient(circle, white 55%, transparent 57%), conic-gradient(var(--green) 0 ${returnRate}%, #e6e9e8 ${returnRate}% 100%)`;
  renderChart();
}

function renderStudents() {
  const scopedStudents = visibleStudents();
  const visible = scopedStudents.filter((student) => {
    const matchesFilter = state.filter === "todos" || student.priority === state.filter;
    const haystack = `${student.name} ${student.className} ${student.code}`.toLocaleLowerCase("pt-BR");
    return matchesFilter && haystack.includes(state.query.toLocaleLowerCase("pt-BR"));
  });

  document.querySelector("#student-table").innerHTML = visible.map((student) => `
    <tr>
      <td><div class="table-student"><span class="mini-avatar">${escapeHtml(student.initials)}</span><div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)}</span></div></div></td>
      <td class="table-signals">${escapeHtml(student.signals)}</td>
      <td class="table-muted">${escapeHtml(student.updated)}</td>
      <td><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></td>
      <td><button class="row-open" data-student="${escapeHtml(student.id)}" aria-label="Abrir perfil de ${escapeHtml(student.name)}"><svg><use href="#i-arrow"></use></svg></button></td>
    </tr>`).join("");
  document.querySelector("#student-empty").hidden = visible.length > 0;
  document.querySelector("#student-directory").innerHTML = scopedStudents.map((student) => `
    <button class="directory-card" data-student="${escapeHtml(student.id)}">
      <span class="mini-avatar">${escapeHtml(student.initials)}</span>
      <div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)} · ${escapeHtml(student.code)}</span><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></div>
    </button>`).join("");
}

function renderStudentSelect() {
  const select = document.querySelector("#record-student");
  select.innerHTML = visibleStudents().map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} · ${escapeHtml(student.className)}</option>`).join("");
  const currentIsVisible = visibleStudents().some((student) => student.id === state.currentStudent);
  if (currentIsVisible) select.value = state.currentStudent;
}

function renderStudentProfile() {
  const student = getStudent();
  state.currentStudent = student.id;
  document.querySelector("#student-initials").textContent = student.initials;
  document.querySelector("#student-name").textContent = student.name;
  document.querySelector("#student-meta").textContent = `${student.className} · cadastro ${student.code}`;
  const badge = document.querySelector("#student-status");
  badge.textContent = student.status;
  badge.className = `status-badge ${statusClass(student.priority)}`;
  document.querySelector("#priority-reason").textContent = student.reason;
  document.querySelector("#last-contact").textContent = student.contact;
  const contactRows = document.querySelectorAll(".contact-card dd");
  contactRows[0].textContent = student.guardian;
  contactRows[1].textContent = student.preferredChannel;
  document.querySelector("#signal-grid").innerHTML = student.metrics.map(([value, label, note]) => `<article class="signal-tile"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(note)}</small></article>`).join("");

  const planEntries = db.plans.filter((plan) => plan.studentId === student.id).map((plan) => [plan.created, `Plano criado: ${plan.type}. Responsável: ${plan.owner}.`]);
  document.querySelector("#student-timeline").innerHTML = [...planEntries, ...student.timeline].map(([date, copy]) => `<div class="timeline-entry"><span class="timeline-dot"></span><time>${escapeHtml(date)}</time><p>${escapeHtml(copy)}</p></div>`).join("");
  document.querySelector("#plan-student-caption").textContent = `${student.name} · ${student.className}`;
  renderStudentSelect();
}

function renderRecords() {
  const plans = visiblePlans().map((plan) => ({ id: plan.id, kind: "Plano", studentId: plan.studentId, description: `${plan.type} · ${plan.owner} · prazo ${formatDate(plan.date)}`, date: plan.created }));
  const items = [...visibleRecords(), ...plans]
    .filter((record) => state.recordFilter === "todos" || record.kind === state.recordFilter)
    .sort((a, b) => b.date.split("/").reverse().join("").localeCompare(a.date.split("/").reverse().join("")));

  document.querySelector("#records-list").innerHTML = items.map((record) => {
    const student = getStudent(record.studentId);
    const owner = getOwner(record.ownerId);
    const ownerLabel = owner ? ` · por ${owner.name}` : "";
    return `<article class="record-item"><span class="record-kind">${escapeHtml(record.kind.slice(0, 2).toUpperCase())}</span><div class="record-copy"><strong>${escapeHtml(record.kind)} · ${escapeHtml(student.name)}</strong><p>${escapeHtml(record.description)}${escapeHtml(ownerLabel)}</p></div><time>${escapeHtml(record.date)}</time></article>`;
  }).join("");
  document.querySelector("#records-empty").hidden = items.length > 0;
}

function renderAll() {
  renderSchool();
  renderProfileIdentity();
  renderOwnerOptions();
  renderDashboard();
  renderStudents();
  renderStudentProfile();
  renderRecords();
}

function routeTitle(route) {
  const labels = { painel: "Visão geral", "busca-ativa": "Busca ativa escolar", estudante: "Perfil do estudante", registros: "Registros", estudantes: "Estudantes", "novo-registro": "Novo registro", plano: "Plano de ação", conclusao: "Plano criado" };
  return labels[route] || "Notare";
}

const routePermissions = {
  painel: "dashboard:view",
  "busca-ativa": "followup:view",
  estudante: "students:view",
  estudantes: "students:view",
  registros: "records:view",
  "novo-registro": "records:create",
  plano: "plans:create"
};

function showRoute(route, options = {}) {
  const exists = views.some((view) => view.dataset.view === route);
  let nextRoute = exists ? route : "painel";
  const permission = routePermissions[nextRoute];
  if (permission && !hasPermission(permission)) {
    showToast(`O perfil ${getProfile().role} não tem acesso a esta ação.`);
    nextRoute = "painel";
  }

  if (state.currentRoute !== nextRoute) state.previousRoute = state.currentRoute;
  state.currentRoute = nextRoute;
  if (nextRoute === "estudante" || nextRoute === "plano" || nextRoute === "novo-registro") renderStudentProfile();
  if (nextRoute === "registros") renderRecords();
  if (nextRoute === "painel") renderDashboard();

  views.forEach((view) => {
    const active = view.dataset.view === nextRoute;
    view.classList.toggle("active", active);
    view.setAttribute("aria-hidden", String(!active));
  });
  document.querySelectorAll(".main-nav a").forEach((link) => link.classList.toggle("active", link.dataset.route === nextRoute || (nextRoute === "estudante" && link.dataset.route === "busca-ativa")));
  if (!options.skipHistory) history.replaceState(null, "", `#${nextRoute}`);
  document.title = `${routeTitle(nextRoute)} — Notare`;
  announcement.textContent = `Tela ${routeTitle(nextRoute)}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeSidebar();
}

function openStudent(id) {
  const allowed = visibleStudents().some((student) => student.id === id);
  if (!allowed) {
    showToast("Este estudante está fora do escopo do perfil selecionado.");
    return;
  }
  state.currentStudent = id;
  renderStudentProfile();
  showRoute("estudante");
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3500);
}

function openSidebar() {
  sidebar.classList.add("open");
  scrim.hidden = false;
  document.querySelector("#sidebar-close").focus();
}

function closeSidebar() {
  sidebar.classList.remove("open");
  scrim.hidden = true;
}

function applySidebarState(collapsed) {
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Expandir menu lateral" : "Recolher menu lateral");
  sidebarToggle.title = collapsed ? "Expandir menu" : "Recolher menu";
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const label = link.querySelector("span")?.textContent?.trim();
    if (label) link.title = collapsed ? label : "";
  });
  document.querySelector("#profile-button").title = collapsed ? `${getProfile().name} · ${getProfile().role}` : "";
}

function toggleSidebar() {
  const collapsed = !appShell.classList.contains("sidebar-collapsed");
  localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  applySidebarState(collapsed);
}

function openProfileDialog() {
  renderProfileIdentity();
  if (typeof profileDialog.showModal === "function") profileDialog.showModal();
  else profileDialog.setAttribute("open", "");
}

function closeProfileDialog() {
  if (typeof profileDialog.close === "function" && profileDialog.open) profileDialog.close();
  else profileDialog.removeAttribute("open");
}

function switchProfile(profileId) {
  if (!db.profiles.some((profile) => profile.id === profileId)) return;
  state.profileId = profileId;
  state.query = "";
  state.filter = "todos";
  state.recordFilter = "todos";
  localStorage.setItem(PROFILE_KEY, profileId);
  document.querySelector("#student-search").value = "";
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item.dataset.filter === "todos"));
  document.querySelectorAll("[data-record-filter]").forEach((item) => item.classList.toggle("active", item.dataset.recordFilter === "todos"));
  if (!hasPermission("occurrences:create")) document.querySelector('input[name="kind"][value="Ausência"]').checked = true;
  const scoped = visibleStudents();
  if (!scoped.some((student) => student.id === state.currentStudent)) state.currentStudent = scoped[0]?.id || db.students[0].id;
  renderAll();
  if (routePermissions[state.currentRoute] && !hasPermission(routePermissions[state.currentRoute])) showRoute("painel");
  showToast(`Perfil alterado para ${getProfile().role}.`);
}

document.addEventListener("click", (event) => {
  const routeControl = event.target.closest("[data-route]");
  if (routeControl) {
    event.preventDefault();
    showRoute(routeControl.dataset.route);
    return;
  }
  const studentControl = event.target.closest("[data-student]");
  if (studentControl) {
    openStudent(studentControl.dataset.student);
    return;
  }
  const profileControl = event.target.closest("[data-profile]");
  if (profileControl) {
    switchProfile(profileControl.dataset.profile);
    return;
  }
  const backControl = event.target.closest("[data-back]");
  if (backControl) showRoute(state.previousRoute || "painel");
});

document.querySelector("#student-search").addEventListener("input", (event) => {
  state.query = event.currentTarget.value;
  renderStudents();
});

document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderStudents();
}));

document.querySelectorAll("[data-record-filter]").forEach((button) => button.addEventListener("click", () => {
  state.recordFilter = button.dataset.recordFilter;
  document.querySelectorAll("[data-record-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderRecords();
}));

document.querySelector("#plan-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("plans:create")) return showToast("Este perfil não pode criar planos de ação.");
  const data = new FormData(event.currentTarget);
  const student = getStudent();
  const owner = getProfile(data.get("owner"));
  const plan = {
    id: `plan-${Date.now()}`,
    studentId: student.id,
    type: data.get("type"),
    ownerId: owner.id,
    owner: `${owner.name} · ${owner.role}`,
    date: data.get("date"),
    status: "active",
    notes: data.get("notes"),
    family: data.get("family") === "on",
    created: todayLabel()
  };
  db.plans.unshift(plan);
  saveDatabase();
  document.querySelector("#summary-student").textContent = student.name;
  document.querySelector("#summary-action").textContent = plan.type;
  document.querySelector("#summary-owner").textContent = plan.owner;
  document.querySelector("#summary-date").textContent = formatDate(plan.date);
  renderAll();
  showRoute("conclusao");
});

document.querySelector("#record-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("records:create")) return showToast("Este perfil não pode criar registros.");
  const data = new FormData(event.currentTarget);
  if (data.get("kind") === "Ocorrência" && !hasPermission("occurrences:create")) return showToast("Este perfil não pode criar registros de ocorrência.");
  const student = getStudent(data.get("student"));
  db.records.unshift({
    id: `rec-${Date.now()}`,
    kind: data.get("kind"),
    studentId: student.id,
    description: data.get("description"),
    date: formatDate(data.get("date")),
    ownerId: data.get("owner"),
    followup: data.get("followup") === "on"
  });
  saveDatabase();
  event.currentTarget.reset();
  renderAll();
  showToast("Registro salvo no histórico.");
  showRoute("registros");
});

document.querySelector("#menu-button").addEventListener("click", openSidebar);
sidebarToggle.addEventListener("click", toggleSidebar);
document.querySelector("#sidebar-close").addEventListener("click", closeSidebar);
scrim.addEventListener("click", closeSidebar);
document.querySelector("#notification-button").addEventListener("click", () => showToast("Há retornos e revisões previstos na agenda da equipe."));
document.querySelector("#profile-button").addEventListener("click", openProfileDialog);
document.querySelector("#profile-close").addEventListener("click", closeProfileDialog);
document.querySelector("#profile-done").addEventListener("click", closeProfileDialog);
document.querySelector("#reset-demo").addEventListener("click", () => {
  if (!window.confirm("Restaurar a base inicial e apagar os registros adicionados neste navegador?")) return;
  db = cloneSeed();
  saveDatabase();
  state.profileId = "direcao";
  state.currentStudent = "ana";
  localStorage.setItem(PROFILE_KEY, state.profileId);
  renderAll();
  closeProfileDialog();
  showRoute("painel");
  showToast("Base inicial restaurada.");
});
profileDialog.addEventListener("click", (event) => { if (event.target === profileDialog) closeProfileDialog(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSidebar(); });
window.addEventListener("hashchange", () => showRoute(location.hash.slice(1) || "painel", { skipHistory: true }));

if (!db.profiles.some((profile) => profile.id === state.profileId)) state.profileId = "direcao";
renderAll();
applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "true");
showRoute(location.hash.slice(1) || "painel", { skipHistory: true });
