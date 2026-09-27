const STORAGE_KEY = "notare-database-v7";
const PROFILE_KEY = "notare-profile-v4";
const SIDEBAR_KEY = "notare-sidebar-collapsed";
const {
  addBusinessDays,
  addDays,
  assetSlug,
  capitalize,
  dateKey,
  escapeHtml,
  formatDate,
  greetingFor,
  nextBusinessDay,
  parseDisplayDate,
  planEffectiveStatus,
  relativeDateLabel,
  startOfAgenda,
  startOfCurrentWeek,
  todayLabel
} = window.NOTARE_CORE;

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
  classFilter: "6º A",
  recordFilter: "todos",
  query: "",
  lastPlanId: null
};

const views = [...document.querySelectorAll("[data-view]")];
const announcement = document.querySelector("#announcement");
const toast = document.querySelector("#toast");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#sidebar-scrim");
const profileDialog = document.querySelector("#profile-dialog");
const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const notificationTemplates = [
  { id: "review-ana", title: "Revisão pendente", message: "O plano de Ana Souza possui uma revisão prevista para hoje." },
  { id: "return-joao", title: "Retorno sem confirmação", message: "O contato com o responsável de João Oliveira ainda não foi confirmado." }
];
const sidebarDrawer = window.NOTARE_UI.createModalDrawer({
  drawer: sidebar,
  scrim,
  trigger: document.querySelector("#menu-button"),
  closeButton: document.querySelector("#sidebar-close"),
  background: document.querySelector(".workspace")
});
const notificationCenter = window.NOTARE_UI.createNotificationCenter({
  announcement,
  escapeHtml,
  templates: notificationTemplates
});

function personPhoto(person) {
  if (person.photoSheet && Number.isInteger(person.photoIndex)) {
    const column = person.photoIndex % 6;
    const row = Math.floor(person.photoIndex / 6);
    return `<span class="avatar-photo avatar-sheet" style="--photo-sheet:url('${escapeHtml(person.photoSheet)}');--photo-x:${column * 20}%;--photo-y:${row * (100 / 3)}%" aria-hidden="true"></span>`;
  }
  return `<img class="avatar-photo" src="assets/profiles/${escapeHtml(person.photo || assetSlug(person.name))}.png" alt="" loading="lazy" />`;
}

function agendaDate(item, now) {
  const agendaStart = startOfAgenda(now);
  if (item.date) {
    const fixedDate = nextBusinessDay(new Date(`${item.date}T12:00:00`));
    if (!Number.isNaN(fixedDate.getTime())) return fixedDate < agendaStart ? agendaStart : fixedDate;
  }
  return addBusinessDays(agendaStart, item.dayOffset);
}

function agendaSlot(item, now, scheduledDate = agendaDate(item, now)) {
  const date = scheduledDate;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const dayLabel = dateKey(date) === dateKey(today)
    ? "Hoje"
    : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
  if (item.date && !item.time) {
    const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
    return `${dayLabel} · ${shortDate}`;
  }
  return item.time ? `${dayLabel} · ${item.time}` : dayLabel;
}

function agendaState(item, now = new Date()) {
  const scheduledDate = agendaDate(item, now);
  if (item.date) {
    const originalDate = new Date(`${item.date}T12:00:00`);
    if (Number.isNaN(originalDate.getTime())) return null;
    const normalizedDate = nextBusinessDay(originalDate);
    if (normalizedDate < startOfAgenda(now)) {
      return {
        label: "Atrasado",
        text: `Prazo original ${formatDate(item.date)} · reposicionado para ${relativeDateLabel(scheduledDate, now)}`
      };
    }
  }

  const overduePlan = item.sourcePlanId
    ? db.plans.find((plan) => plan.id === item.sourcePlanId && planEffectiveStatus(plan, now) === "overdue")
    : null;
  if (!overduePlan) return null;
  return {
    label: "Revisão pendente",
    text: `Prazo ${formatDate(overduePlan.date)} · ação reposicionada para ${relativeDateLabel(scheduledDate, now)}`
  };
}

function syncRecordDate(now = new Date()) {
  const input = document.querySelector('#record-form input[name="date"]');
  if (!input) return;
  const today = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  input.max = today;
  if (!input.value) input.value = today;
}

function syncPlanDeadline(now = new Date()) {
  const input = document.querySelector('#plan-form input[name="date"]');
  if (!input) return;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const minimum = dateKey(startOfAgenda(today));
  input.min = minimum;
  if (!input.value || input.value < minimum) {
    input.value = dateKey(addBusinessDays(startOfAgenda(today), 2));
  }
}

function calendarEventCounts(now) {
  const counts = new Map();
  const visibleIds = new Set(visibleStudents().map((student) => student.id));
  const addEvent = (date) => {
    if (!date || Number.isNaN(date.getTime())) return;
    const key = dateKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  db.agenda.filter((item) => visibleIds.has(item.studentId)).forEach((item) => addEvent(agendaDate(item, now)));
  return counts;
}

function renderMiniCalendar(now) {
  const calendar = document.querySelector("#calendar-days");
  if (!calendar) return;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const start = startOfCurrentWeek(today);
  const counts = calendarEventCounts(today);
  const fullDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(today).replace(".", "").toUpperCase();

  document.querySelector("#mini-calendar-day").textContent = today.getDate();
  document.querySelector("#mini-calendar-month").textContent = month;
  document.querySelector("#mini-calendar").setAttribute("aria-label", `Calendário a partir de ${fullDate.format(start)}, com o dia atual em ${fullDate.format(today)}`);
  calendar.innerHTML = Array.from({ length: 21 }, (_, index) => {
    const date = addDays(start, index);
    const key = dateKey(date);
    const eventCount = counts.get(key) || 0;
    const isToday = key === dateKey(today);
    const eventLabel = eventCount ? `, ${eventCount} ${eventCount === 1 ? "evento" : "eventos"}` : ", sem eventos";
    const dots = Array.from({ length: Math.min(eventCount, 4) }, () => "<i></i>").join("");
    return `<span class="calendar-day ${isToday ? "is-today" : ""} ${date.getMonth() !== today.getMonth() ? "other-month" : ""}" ${isToday ? 'aria-current="date"' : ""} aria-label="${escapeHtml(fullDate.format(date))}${eventLabel}"><strong>${date.getDate()}</strong><span class="event-dots" aria-hidden="true">${dots}</span></span>`;
  }).join("");
}

function renderTemporalContext(now = new Date()) {
  const profile = getProfile();
  document.querySelector("#painel-title").textContent = `${greetingFor(now)}, ${profile.name.split(" ")[0]}`;
  renderMiniCalendar(now);
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
  if (profile.scope === "followup") return db.students.filter((student) => student.priority !== "estavel");
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
  if (priority === "alta") return "status-high";
  if (priority === "media") return "status-medium";
  if (priority === "evolucao") return "status-evolution";
  return "status-stable";
}

function planStatusLabel(status) {
  const labels = {
    active: "Em acompanhamento",
    review: "Aguardando revisão",
    overdue: "Revisão pendente",
    done: "Concluído"
  };
  return labels[status] || "Em acompanhamento";
}

function latestStudentActivityDate(student) {
  const dates = [
    ...db.records.filter((record) => record.studentId === student.id).map((record) => parseDisplayDate(record.date)),
    ...db.plans.filter((plan) => plan.studentId === student.id).map((plan) => parseDisplayDate(plan.created)),
    ...student.timeline.map(([date]) => parseDisplayDate(date, 2026))
  ].filter(Boolean);
  return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : null;
}

function studentUpdatedLabel(student, now = new Date()) {
  const date = latestStudentActivityDate(student);
  if (!date) return normalizeSeedRelativeLabel(student.updated, now);
  const time = String(student.updated || "").match(/\b\d{2}:\d{2}\b/)?.[0];
  const label = capitalize(relativeDateLabel(date, now));
  return time ? `${label}, ${time}` : label;
}

function studentContactLabel(student, now = new Date()) {
  const contact = db.records
    .filter((record) => record.studentId === student.id && record.kind === "Contato")
    .map((record) => ({ ...record, parsedDate: parseDisplayDate(record.date) }))
    .filter((record) => record.parsedDate)
    .sort((a, b) => b.parsedDate - a.parsedDate)[0];
  if (!contact) return student.contact;
  const state = String(student.contact || "").split("·").slice(1).join("·").trim();
  const label = relativeDateLabel(contact.parsedDate, now);
  return state ? `${label} · ${state}` : label;
}

function normalizeTemporalText(value, now = new Date()) {
  const reference = new Date(2026, 8, 25, 12);
  const replacements = [
    [/\bhoje\b/gi, relativeDateLabel(reference, now)],
    [/\bamanhã\b/gi, relativeDateLabel(addDays(reference, 1), now)]
  ];
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value));
}

function normalizeSeedRelativeLabel(value, now = new Date()) {
  const text = String(value || "");
  const match = text.match(/^(Hoje|Ontem|Há (\d+) dias?)(?:,\s*(\d{2}:\d{2}))?$/i);
  if (!match) return text;
  const reference = new Date(2026, 8, 25, 12);
  const offset = /^ontem$/i.test(match[1]) ? 1 : Number(match[2] || 0);
  const label = capitalize(relativeDateLabel(addDays(reference, -offset), now));
  return match[3] ? `${label}, ${match[3]}` : label;
}

function studentButton(student) {
  return `
    <button class="student-row" type="button" data-student="${escapeHtml(student.id)}">
      <span class="mini-avatar">${personPhoto(student)}</span>
      <span class="student-identity"><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)}</span></span>
      <span class="signal-copy">${escapeHtml(student.signals)}</span>
      <span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span>
      <svg><use href="#i-arrow"></use></svg>
    </button>`;
}

function renderSchool() {
  const school = db.school;
  document.querySelector("#topbar-school-name").textContent = school.name;
  document.querySelector("#school-logo-image").src = "assets/profiles/escola-logo.png";
}

function renderChart() {
  const profile = getProfile();
  const labels = db.analytics.labels;
  const className = profile.scope.startsWith("class:") ? profile.scope.replace("class:", "") : null;
  const attendance = className && db.analytics.byClass[className] ? db.analytics.byClass[className] : db.analytics.attendance;
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
  const points = attendance.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const linePath = attendance.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");
  const area = `M ${x(0)} ${baseline} L ${x(0)} ${y(attendance[0])} ${attendance.slice(1).map((value, index) => `L ${x(index + 1)} ${y(value)}`).join(" ")} L ${x(labels.length - 1)} ${baseline} Z`;
  const gridValues = [70, 80, 90, 100];

  const svg = document.querySelector("#attendance-chart");
  svg.innerHTML = `
    <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F927D" stop-opacity=".24"/><stop offset="1" stop-color="#6F927D" stop-opacity="0"/></linearGradient></defs>
    ${gridValues.map((value) => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="rgba(24,59,70,.10)"/><text x="${left - 10}" y="${y(value) + 4}" fill="#768184" font-family="Manrope, system-ui, sans-serif" font-size="11" font-weight="500" text-anchor="end">${value}%</text>`).join("")}
    <path d="${area}" fill="url(#chart-fill)"/>
    <polyline points="${points}" fill="none" stroke="#183B46" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${attendance.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="5" fill="#F7F5F0" stroke="#6F927D" stroke-width="3"><title>${labels[index]}: ${value}% de frequência</title></circle>`).join("")}
    ${labels.map((label, index) => `<text x="${x(index)}" y="${height - 12}" fill="#768184" font-family="Manrope, system-ui, sans-serif" font-size="10" font-weight="500" text-anchor="middle">${escapeHtml(label)}</text>`).join("")}`;
  svg.setAttribute("aria-label", `Frequência de ${attendance.at(-1)} por cento na semana atual`);
}

function renderProfileIdentity() {
  const profile = getProfile();
  document.querySelector("#user-avatar").innerHTML = personPhoto(profile);
  document.querySelector("#user-name").textContent = profile.name;
  document.querySelector("#user-role").textContent = profile.role;
  renderTemporalContext();
  document.querySelector("#dashboard-subtitle").textContent = profile.scope.startsWith("class:")
    ? `Você está vendo apenas estudantes da turma ${profile.scope.replace("class:", "")}.`
    : "Veja quem precisa de atenção e organize as próximas ações.";

  document.querySelectorAll("[data-permission]").forEach((element) => {
    element.hidden = !hasPermission(element.dataset.permission);
  });

  document.querySelector("#role-list").innerHTML = db.profiles.map((item) => `
    <button class="role-option ${item.id === profile.id ? "active" : ""}" type="button" data-profile="${escapeHtml(item.id)}" aria-pressed="${item.id === profile.id}">
      <span class="user-avatar">${personPhoto(item)}</span>
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

function renderDashboard(now = new Date()) {
  const students = visibleStudents();
  const priorities = students.filter((student) => student.priority === "alta");
  const plans = visiblePlans();
  const visibleIds = new Set(students.map((student) => student.id));
  const agenda = db.agenda
    .filter((item) => visibleIds.has(item.studentId))
    .map((item) => ({ ...item, scheduledDate: agendaDate(item, now), agendaState: agendaState(item, now) }))
    .sort((a, b) => a.scheduledDate - b.scheduledDate || (a.time || "23:59").localeCompare(b.time || "23:59"));
  const latestPlanAgendaId = db.agenda.find(
    (item) => item.sourcePlanId && visibleIds.has(item.studentId)
  )?.id;
  const latestPlanAgenda = agenda.find((item) => item.id === latestPlanAgendaId);
  let agendaPreview = agenda.slice(0, 4);
  if (latestPlanAgenda && !agendaPreview.some((item) => item.id === latestPlanAgenda.id)) {
    agendaPreview = [...agendaPreview.slice(0, 3), latestPlanAgenda];
  }
  const scheduledActions = agenda.length;
  const averageAttendance = students.length ? Math.round(students.reduce((total, student) => total + student.attendance, 0) / students.length) : 0;

  document.querySelector("#metric-priority").textContent = String(priorities.length);
  document.querySelector("#metric-followup").textContent = String(plans.filter((plan) => plan.status !== "done").length);
  document.querySelector("#metric-return").textContent = String(scheduledActions);
  document.querySelector(".metric:nth-child(4) strong").textContent = `${averageAttendance}%`;
  document.querySelector("#nav-priority-count").textContent = String(priorities.length);
  document.querySelector(".metric:nth-child(1) .metric-trend").textContent = `${priorities.length} para revisar`;
  document.querySelector(".metric:nth-child(2) .metric-trend").textContent = `${students.filter((student) => student.priority === "evolucao").length} evoluindo`;
  const agendaStart = startOfAgenda(now);
  const firstDayCount = agenda.filter((item) => dateKey(item.scheduledDate) === dateKey(agendaStart)).length;
  const startsToday = dateKey(agendaStart) === dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const agendaStartLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(agendaStart);
  document.querySelector(".metric:nth-child(3) .metric-trend").textContent = startsToday
    ? `${firstDayCount} para hoje`
    : `${firstDayCount} para ${agendaStartLabel}`;
  document.querySelector(".agenda-card .today-pill").textContent = startsToday ? "Hoje" : `A partir de ${agendaStartLabel}`;

  const order = { alta: 0, media: 1, evolucao: 2, estavel: 3 };
  const ordered = [...students].sort((a, b) => order[a.priority] - order[b.priority]);
  document.querySelector("#dashboard-students").innerHTML = ordered.slice(0, 5).map(studentButton).join("");

  document.querySelector("#agenda-list").innerHTML = agendaPreview.map((item) => {
    const student = getStudent(item.studentId);
    const owner = getOwner(item.ownerId);
    const stateCopy = item.agendaState ? `<small class="agenda-state">${escapeHtml(item.agendaState.label)} · ${escapeHtml(item.agendaState.text)}</small>` : "";
    return `<li class="${item.agendaState ? "is-repositioned" : ""}"><span class="agenda-time">${escapeHtml(agendaSlot(item, now, item.scheduledDate))}</span><span class="agenda-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(student.name)} · ${escapeHtml(owner?.name.split(" ")[0] || "Equipe")}</span>${stateCopy}</span></li>`;
  }).join("");

  const active = plans.filter((plan) => planEffectiveStatus(plan, now) === "active").length;
  const review = plans.filter((plan) => ["review", "overdue"].includes(planEffectiveStatus(plan, now))).length;
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
  document.querySelector(".outcome-ring").style.background = `radial-gradient(circle, var(--paper) 55%, transparent 57%), conic-gradient(var(--green) 0 ${returnRate}%, #e4e7e3 ${returnRate}% 100%)`;
  renderChart();
}

function renderStudents() {
  const scopedStudents = visibleStudents();
  const classNames = [...new Set(scopedStudents.map((student) => student.className))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const classSelect = document.querySelector("#class-filter");
  if (state.classFilter !== "todas" && !classNames.includes(state.classFilter)) state.classFilter = classNames[0] || "todas";
  classSelect.innerHTML = `<option value="todas">Todas as turmas</option>${classNames.map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`).join("")}`;
  classSelect.value = state.classFilter;

  const visible = scopedStudents.filter((student) => {
    const matchesFilter = state.filter === "todos" || student.priority === state.filter;
    const haystack = `${student.name} ${student.className} ${student.code}`.toLocaleLowerCase("pt-BR");
    return matchesFilter && haystack.includes(state.query.toLocaleLowerCase("pt-BR"));
  });

  document.querySelector("#student-table").innerHTML = visible.map((student) => `
    <tr>
      <td><div class="table-student"><span class="mini-avatar">${personPhoto(student)}</span><div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)}</span></div></div></td>
      <td class="table-signals">${escapeHtml(student.signals)}</td>
      <td class="table-muted">${escapeHtml(studentUpdatedLabel(student))}</td>
      <td><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></td>
      <td><button class="row-open" data-student="${escapeHtml(student.id)}" aria-label="Abrir perfil de ${escapeHtml(student.name)}"><svg><use href="#i-arrow"></use></svg></button></td>
    </tr>`).join("");
  document.querySelector("#student-empty").hidden = visible.length > 0;
  const directoryStudents = state.classFilter === "todas" ? scopedStudents : scopedStudents.filter((student) => student.className === state.classFilter);
  const followupCount = directoryStudents.filter((student) => student.priority !== "estavel").length;
  const stableCount = directoryStudents.length - followupCount;
  document.querySelector("#class-summary").textContent = `${directoryStudents.length} ${directoryStudents.length === 1 ? "estudante" : "estudantes"} · ${followupCount} em acompanhamento · ${stableCount} sem alertas`;
  document.querySelector("#student-directory").innerHTML = directoryStudents.map((student) => `
    <button class="directory-card" data-student="${escapeHtml(student.id)}">
      <span class="mini-avatar">${personPhoto(student)}</span>
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
  document.querySelector("#student-initials").innerHTML = personPhoto(student);
  document.querySelector("#student-name").textContent = student.name;
  document.querySelector("#student-meta").textContent = `${student.className} · cadastro ${student.code}`;
  const badge = document.querySelector("#student-status");
  badge.textContent = student.status;
  badge.className = `status-badge ${statusClass(student.priority)}`;

  const activePlan = db.plans.some(
    (plan) => plan.studentId === student.id && plan.status !== "done"
  );
  document.querySelector("#student-plan-status").hidden = !activePlan;

  document.querySelector("#priority-reason").textContent = student.reason;
  document.querySelector("#last-contact").textContent = studentContactLabel(student);
  const contactRows = document.querySelectorAll(".contact-card dd");
  contactRows[0].textContent = student.guardian;
  contactRows[1].textContent = student.preferredChannel;
  document.querySelector("#signal-grid").innerHTML = student.metrics.map(([value, label, note]) => `<article class="signal-tile"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(normalizeTemporalText(note))}</small></article>`).join("");

  const planEntries = db.plans
    .filter((plan) => plan.studentId === student.id)
    .map((plan) => {
      const status = planStatusLabel(planEffectiveStatus(plan));
      return [
        plan.created,
        `${status}: ${plan.type}. Responsável: ${plan.owner}. Prazo: ${formatDate(plan.date)}.`
      ];
    });
  const timelineEntries = [...planEntries, ...student.timeline]
    .map(([date, copy]) => ({ date, copy, parsedDate: parseDisplayDate(date) }))
    .sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0));
  document.querySelector("#student-timeline").innerHTML = timelineEntries.map(({ date, copy, parsedDate }) => `<div class="timeline-entry"><span class="timeline-dot"></span><time${parsedDate ? ` datetime="${dateKey(parsedDate)}"` : ""}>${escapeHtml(date)}</time><p>${escapeHtml(copy)}</p></div>`).join("");
  document.querySelector("#plan-student-caption").textContent = `${student.name} · ${student.className}`;
  syncRecordDate();
  syncPlanDeadline();
  renderStudentSelect();
}

function renderRecords() {
  const plans = visiblePlans().map((plan) => ({ id: plan.id, kind: "Plano", studentId: plan.studentId, description: `${plan.type} · ${plan.owner} · prazo ${formatDate(plan.date)}`, date: plan.created, status: planEffectiveStatus(plan) }));
  const items = [...visibleRecords(), ...plans]
    .filter((record) => state.recordFilter === "todos" || record.kind === state.recordFilter)
    .sort((a, b) => b.date.split("/").reverse().join("").localeCompare(a.date.split("/").reverse().join("")));

  document.querySelector("#records-list").innerHTML = items.map((record) => {
    const student = getStudent(record.studentId);
    const owner = getOwner(record.ownerId);
    const ownerLabel = owner ? ` · por ${owner.name}` : "";
    const recordDate = parseDisplayDate(record.date);
    const state = record.kind === "Plano" ? planStatusLabel(record.status) : "";
    return `<article class="record-item"><span class="record-kind">${escapeHtml(record.kind.slice(0, 2).toUpperCase())}</span><div class="record-copy"><div class="record-heading"><strong>${escapeHtml(record.kind)} · ${escapeHtml(student.name)}</strong>${state ? `<span class="record-state record-state-${escapeHtml(record.status)}">${escapeHtml(state)}</span>` : ""}</div><p>${escapeHtml(record.description)}${escapeHtml(ownerLabel)}</p></div><time${recordDate ? ` datetime="${dateKey(recordDate)}"` : ""}>${escapeHtml(record.date)}</time></article>`;
  }).join("");
  document.querySelector("#records-empty").hidden = items.length > 0;
}

function renderPlanSuccess() {
  const plan = db.plans.find((item) => item.id === state.lastPlanId)
    || db.plans.find((item) => item.studentId === state.currentStudent);
  if (!plan) return;
  const student = getStudent(plan.studentId);
  document.querySelector("#summary-student").textContent = student.name;
  document.querySelector("#summary-action").textContent = plan.type;
  document.querySelector("#summary-owner").textContent = plan.owner;
  document.querySelector("#summary-date").textContent = formatDate(plan.date);
  document.querySelector("#success-next-step").textContent =
    `Próximo passo: revisar este acompanhamento em ${formatDate(plan.date)}. O prazo já aparece na agenda da equipe.`;
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
  const labels = { painel: "Visão geral", "busca-ativa": "Acompanhamento escolar", estudante: "Perfil do estudante", registros: "Registros", estudantes: "Estudantes", ativacao: "Ativação da escola", "novo-registro": "Novo registro", plano: "Plano de ação", conclusao: "Plano criado" };
  return labels[route] || "Notare";
}

const routePermissions = {
  painel: "dashboard:view",
  "busca-ativa": "followup:view",
  estudante: "students:view",
  estudantes: "students:view",
  ativacao: "school:view",
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
  if (nextRoute === "conclusao") renderPlanSuccess();

  views.forEach((view) => {
    const active = view.dataset.view === nextRoute;
    view.classList.toggle("active", active);
    view.setAttribute("aria-hidden", String(!active));
  });
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const active = link.dataset.route === nextRoute || (nextRoute === "estudante" && link.dataset.route === "busca-ativa");
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const nextHash = `#${nextRoute}`;
  if (options.skipHistory && location.hash !== nextHash) {
    history.replaceState({ route: nextRoute }, "", nextHash);
  } else if (!options.skipHistory) {
    if (location.hash === nextHash) history.replaceState({ route: nextRoute }, "", nextHash);
    else history.pushState({ route: nextRoute }, "", nextHash);
  }
  document.title = `${routeTitle(nextRoute)} — Notare`;
  announcement.textContent = `Tela ${routeTitle(nextRoute)}`;
  document.querySelector("#main-content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
  sidebarDrawer.close();
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
  state.classFilter = getProfile(profileId).scope.startsWith("class:") ? getProfile(profileId).scope.replace("class:", "") : "6º A";
  state.recordFilter = "todos";
  localStorage.setItem(PROFILE_KEY, profileId);
  document.querySelector("#student-search").value = "";
  document.querySelectorAll("[data-filter]").forEach((item) => {
    const active = item.dataset.filter === "todos";
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-record-filter]").forEach((item) => {
    const active = item.dataset.recordFilter === "todos";
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
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
  document.querySelectorAll("[data-filter]").forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderStudents();
}));

document.querySelector("#class-filter").addEventListener("change", (event) => {
  state.classFilter = event.currentTarget.value;
  renderStudents();
});

document.querySelectorAll("[data-record-filter]").forEach((button) => button.addEventListener("click", () => {
  state.recordFilter = button.dataset.recordFilter;
  document.querySelectorAll("[data-record-filter]").forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderRecords();
}));

document.querySelector("#plan-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("plans:create")) return showToast("Este perfil não pode criar planos de ação.");
  const data = new FormData(event.currentTarget);
  const deadlineInput = event.currentTarget.elements.date;
  const deadlineValue = data.get("date");
  const deadline = new Date(`${deadlineValue}T12:00:00`);
  const agendaStart = startOfAgenda(new Date());
  if (Number.isNaN(deadline.getTime()) || deadline < agendaStart) {
    syncPlanDeadline();
    deadlineInput.focus();
    return showToast("Escolha um prazo a partir do próximo dia útil disponível.");
  }
  if (isWeekend(deadline)) {
    deadlineInput.focus();
    return showToast("Escolha um dia útil para o prazo do acompanhamento.");
  }
  const student = getStudent();
  const owner = getProfile(data.get("owner"));
  const plan = {
    id: `plan-${Date.now()}`,
    studentId: student.id,
    type: data.get("type"),
    ownerId: owner.id,
    owner: `${owner.name} · ${owner.role}`,
    date: deadlineValue,
    status: "active",
    notes: data.get("notes"),
    family: data.get("family") === "on",
    created: todayLabel()
  };
  db.plans.unshift(plan);
  state.lastPlanId = plan.id;
  db.agenda.unshift({
    id: `agenda-${plan.id}`,
    date: plan.date,
    title: `Revisar plano: ${plan.type}`,
    studentId: student.id,
    ownerId: owner.id,
    sourcePlanId: plan.id
  });
  saveDatabase();
  renderPlanSuccess();
  event.currentTarget.reset();
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

document.querySelector("#menu-button").addEventListener("click", sidebarDrawer.open);
sidebarToggle.addEventListener("click", toggleSidebar);
document.querySelector("#sidebar-close").addEventListener("click", () => sidebarDrawer.close({ restoreFocus: true }));
scrim.addEventListener("click", () => sidebarDrawer.close({ restoreFocus: true }));
document.querySelector("#notification-button").addEventListener("click", notificationCenter.toggle);
document.querySelector("#notification-close").addEventListener("click", () => notificationCenter.close({ restoreFocus: true }));
document.querySelector("#notification-banner-close").addEventListener("click", notificationCenter.dismissBanner);
document.querySelector("#notification-banner-open").addEventListener("click", (event) => {
  event.stopPropagation();
  notificationCenter.open();
  notificationCenter.dismissBanner();
});
document.querySelector("#notification-list").addEventListener("click", notificationCenter.handleAction);
document.addEventListener("click", notificationCenter.closeWhenOutside);
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
document.addEventListener("keydown", (event) => {
  if (sidebarDrawer.trapFocus(event)) return;
  if (event.key !== "Escape") return;
  sidebarDrawer.close({ restoreFocus: true });
  notificationCenter.close({ restoreFocus: true });
});
window.addEventListener("popstate", () => showRoute(location.hash.slice(1) || "painel", { skipHistory: true }));

if (!db.profiles.some((profile) => profile.id === state.profileId)) state.profileId = "direcao";
renderAll();
applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "true");
const initialRoute = location.hash.slice(1) || "painel";
history.replaceState({ route: initialRoute }, "", `#${initialRoute}`);
showRoute(initialRoute, { skipHistory: true });
notificationCenter.render();
const notificationTestMode = new URLSearchParams(location.search).has("notification-test");
const notificationDelays = notificationTestMode ? [500, 2500] : [60000, 120000];
notificationCenter.schedule(notificationDelays);
window.setInterval(renderTemporalContext, 60000);
