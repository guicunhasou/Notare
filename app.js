const STORAGE_KEY = "notare-database-v7";
const PROFILE_KEY = "notare-profile-v4";
const SIDEBAR_KEY = "notare-sidebar-collapsed";
const {
  addBusinessDays,
  addDays,
  assetSlug,
  capitalize,
  createdPlanForScope,
  dateKey,
  escapeHtml,
  formatDate,
  greetingFor,
  isWeekend,
  nextBusinessDay,
  parseDisplayDate,
  planEffectiveStatus,
  reconcileProfileConfiguration,
  reconcileStudentMedia,
  relativeDateLabel,
  startOfAgenda,
  startOfCurrentWeek,
  todayLabel
} = window.NOTARE_CORE;

function cloneSeed() {
  return window.NOTARE_BUSINESS.initialize(JSON.parse(JSON.stringify(window.NOTARE_SEED)));
}

function reconcileRecordTimes(database, seed) {
  const recordTimes = new Map(seed.records.map((record) => [record.id, record.time]));
  const planTimes = new Map(seed.plans.map((plan) => [plan.id, plan.createdTime]));
  return {
    ...database,
    records: database.records.map((record) => ({ ...record, time: record.time || recordTimes.get(record.id) })),
    plans: database.plans.map((plan) => ({ ...plan, createdTime: plan.createdTime || planTimes.get(plan.id) }))
  };
}

function loadDatabase({ persistMigration = true } = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = JSON.parse(raw || "null");
    if (saved?.schemaVersion === window.NOTARE_SEED.schemaVersion) {
      const reconciled = reconcileProfileConfiguration(reconcileStudentMedia(saved, window.NOTARE_SEED), window.NOTARE_SEED);
      const previousExampleRevision = saved.business?.exampleRevision || 0;
      const database = window.NOTARE_BUSINESS.initialize(reconcileRecordTimes(reconciled, window.NOTARE_SEED));
      if (persistMigration && previousExampleRevision < (database.business.exampleRevision || 0)) {
        // Persistência aditiva; uma falha de armazenamento não restaura nem apaga a base em uso.
        try {
          if (localStorage.getItem(STORAGE_KEY) !== raw) return loadDatabase({ persistMigration: false });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
        } catch (error) { console.warn("Os novos exemplos estão disponíveis nesta sessão; a base anterior foi mantida no armazenamento.", error); }
      }
      return database;
    }
  } catch (error) {
    console.warn("A base local não pôde ser carregada; usando a base inicial.", error);
  }
  return cloneSeed();
}

let db = loadDatabase();

const state = {
  profileId: localStorage.getItem(PROFILE_KEY) || "direcao",
  currentStudent: "ana",
  currentRoute: "entrada",
  previousRoute: "entrada",
  filter: "todos",
  classFilter: "6º A",
  studentSort: "name",
  recordClass: "8º B",
  recordFilter: "todos",
  recordsStudentId: null,
  followupClassFilter: "todas",
  recordsClassFilter: "todas",
  registrationClassFilter: "todas",
  studentReturnContext: null,
  formReturnContext: null,
  registrationTab: "students",
  registrationQuery: "",
  registrationPage: 1,
  recordKind: "Ausência",
  query: "",
  calendarDate: null,
  calendarWeekOffset: 0,
  dashboardProfileId: null,
  dashboardExpansion: {},
  lastPlanId: null
};

const DASHBOARD_PANELS = ['priority', 'followup', 'actions', 'attendance', 'agenda', 'evolution', 'overview'];
const DASHBOARD_KEY = 'notare-dashboard-v1:';
function readDashboardPreferences(profileId) {
  try {
    const preferences = JSON.parse(localStorage.getItem(DASHBOARD_KEY + profileId) || '{}');
    return Object.fromEntries(DASHBOARD_PANELS.map(key => [key, preferences?.[key] === true]));
  } catch { return {}; }
}
function ensureDashboardPreferences() {
  if (state.dashboardProfileId === state.profileId) return;
  state.dashboardProfileId = state.profileId;
  state.dashboardExpansion = readDashboardPreferences(state.profileId);
  state.calendarDate = null;
  state.calendarWeekOffset = 0;
}
function saveDashboardPreferences() {
  try { localStorage.setItem(DASHBOARD_KEY + state.profileId, JSON.stringify(state.dashboardExpansion)); }
  catch { showToast('Sua escolha será mantida nesta sessão. Não foi possível salvar a preferência neste navegador.'); }
}
function applyDashboardPanels() {
  DASHBOARD_PANELS.forEach(key => {
    const expanded = state.dashboardExpansion[key] === true;
    const button = document.querySelector(`[data-dashboard-toggle="${key}"]`);
    const details = document.querySelector(`#dashboard-${key}-details`);
    button.setAttribute('aria-expanded', String(expanded));
    const title = document.querySelector(`[data-dashboard-panel="${key}"] h2`)?.textContent || ({followup:'Em acompanhamento',actions:'Ações agendadas',attendance:'Frequência média'})[key];
    button.setAttribute('aria-label', `${expanded ? 'Recolher' : 'Expandir'} ${title}`);
    button.querySelector('span').textContent = expanded ? 'Recolher' : 'Expandir';
    details.classList.toggle('is-expanded', expanded);
    details.inert = !expanded;
    details.setAttribute('aria-hidden', String(!expanded));
    document.querySelector(`[data-dashboard-panel="${key}"]`).classList.toggle('is-expanded', expanded);
  });
}
function toggleDashboardPanel(key) {
  if (!DASHBOARD_PANELS.includes(key)) return;
  ensureDashboardPreferences();
  state.dashboardExpansion[key] = !state.dashboardExpansion[key];
  saveDashboardPreferences();
  applyDashboardPanels();
}
function activeAgenda(now = new Date()) {
  const ids = new Set(visibleStudents().map(student => student.id));
  return db.agenda.filter(item => !item.voidedAt && item.status !== 'done' && item.status !== 'cancelled' && ids.has(item.studentId) && item.ownerId === state.profileId)
    .map(item => ({...item, scheduledDate: agendaDate(item, now), agendaState: agendaState(item, now)}))
    .sort((a,b) => a.scheduledDate - b.scheduledDate || (a.time || '23:59').localeCompare(b.time || '23:59'));
}
function selectCalendarDate(value, {focus = true} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !parseDisplayDate(value)) return;
  ensureDashboardPreferences();
  state.calendarDate = value;
  state.dashboardExpansion.agenda = true;
  saveDashboardPreferences();
  renderDashboard();
  if (focus) document.querySelector(`[data-calendar-date="${value}"]`)?.focus({preventScroll:true});
}
function openDashboardIndicator(action) {
  if (action === 'priorities') {
    state.filter = 'alta'; state.followupClassFilter = 'todas'; state.query = '';
    showRoute('busca-ativa');
  } else if (action === 'plans') {
    state.recordFilter = 'Plano'; state.recordsClassFilter = 'todas';
    showRoute('registros');
  } else if (action === 'students') {
    state.classFilter = 'todas';
    showRoute('estudantes');
  } else if (action === 'calendar') {
    state.calendarWeekOffset = 0;
    selectCalendarDate(dateKey(new Date()));
  }
}

const views = [...document.querySelectorAll("[data-view]")];
const announcement = document.querySelector("#announcement");
const toast = document.querySelector("#toast");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#sidebar-scrim");
const profileDialog = document.querySelector("#profile-dialog");
const planDialog = document.querySelector("#institution-plan-dialog");
const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const schoolMenuButton = document.querySelector("#school-menu-button");
const schoolPopover = document.querySelector("#school-popover");
const journeyCaptureMode = new URLSearchParams(location.search).has("capture");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let journeyReducedMotion = motionPreference.matches;
const requestedJourneyStep = Number.parseInt(new URLSearchParams(location.search).get("journey-step") || "0", 10);
let journeyStep = Number.isInteger(requestedJourneyStep) ? Math.min(Math.max(requestedJourneyStep, 0), 3) : 0;
let journeyPaused = false;
let journeyTimer = null;
let journeyWaitResolve = null;
let journeyRunId = 0;
let journeyMode = "manual";
let journeyRunning = false;
let journeyStepComplete = false;
const notificationTestMode = new URLSearchParams(location.search).has("notification-test");
const notificationDelays = notificationTestMode ? [500, 2500] : [120000, 300000];
let notificationProfileId = null;
const sidebarDrawer = window.NOTARE_UI.createModalDrawer({
  drawer: sidebar,
  scrim,
  trigger: document.querySelector("#menu-button"),
  closeButton: document.querySelector("#sidebar-close"),
  background: document.querySelector(".workspace")
});
const notificationCenter = window.NOTARE_UI.createNotificationCenter({
  announcement,
  escapeHtml
});

function personPhoto(person) {
  if (person.scope?.startsWith("family:") || person.scope?.startsWith("partner:")) {
    const media = window.NOTARE_COMMUNITY_MEDIA?.[person.id];
    return media?.src ? `<img class="avatar-photo ${person.scope.startsWith("partner:") ? "community-logo" : "community-photo"}" src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}" loading="lazy" />` : `<span class="ecosystem-avatar">${escapeHtml(person.initials)}</span>`;
  }
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
  activeAgenda(now).forEach(item => {
    const key = dateKey(item.scheduledDate);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}
function renderMiniCalendar(now) {
  const calendar = document.querySelector('#calendar-days');
  if (!calendar) return;
  const focusedDate = document.activeElement?.dataset?.calendarDate;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const start = addDays(startOfCurrentWeek(today), state.calendarWeekOffset * 7);
  const end = addDays(start,20);
  const counts = calendarEventCounts(today);
  const fullDate = new Intl.DateTimeFormat('pt-BR', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const month = new Intl.DateTimeFormat('pt-BR', {month:'short'}).format(today).replace('.','').toUpperCase();
  document.querySelector('#mini-calendar-day').textContent = today.getDate();
  document.querySelector('#mini-calendar-month').textContent = month;
  document.querySelector('#calendar-today').setAttribute('aria-label', `Selecionar hoje, ${fullDate.format(today)}`);
  document.querySelector('#mini-calendar').setAttribute('aria-label', `Calendário de ${formatDate(dateKey(start))} a ${formatDate(dateKey(end))}`);
  document.querySelector('#calendar-range').textContent = `${formatDate(dateKey(start))}–${formatDate(dateKey(end))}`;
  const target = state.calendarDate && parseDisplayDate(state.calendarDate) >= start && parseDisplayDate(state.calendarDate) <= end ? state.calendarDate : today >= start && today <= end ? dateKey(today) : dateKey(start);
  calendar.innerHTML = Array.from({length:21}, (_,index) => {
    const date = addDays(start,index), key = dateKey(date), count = counts.get(key) || 0;
    const isToday = key === dateKey(today), selected = key === state.calendarDate;
    const label = `${fullDate.format(date)}, ${count ? `${count} ${count === 1 ? 'compromisso' : 'compromissos'}` : 'sem compromissos'}`;
    return `<button class="calendar-day ${isToday ? 'is-today' : ''} ${selected ? 'is-selected' : ''}" type="button" data-calendar-date="${key}" tabindex="${key === target ? 0 : -1}" aria-pressed="${selected}" ${isToday ? 'aria-current="date"' : ''} aria-label="${escapeHtml(label)}"><strong>${date.getDate()}</strong><span class="event-dots" aria-hidden="true">${Array.from({length:Math.min(count,4)},()=>'<i></i>').join('')}</span></button>`;
  }).join('');
  if (focusedDate) document.querySelector(`[data-calendar-date="${focusedDate}"]`)?.focus({preventScroll:true});
}

function renderTemporalContext(now = new Date()) {
  const profile = getProfile();
  document.querySelector("#painel-title").textContent = `${greetingFor(now)}, ${profile.name.split(" ")[0]}`;
  renderMiniCalendar(now);
}

function saveDatabase() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function currentTimeLabel(now = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}

function allProfiles() { return window.NOTARE_BUSINESS.profiles(db); }
function getProfile(id = state.profileId) {
  return allProfiles().find((profile) => profile.id === id) || allProfiles()[0];
}
function defaultRoute() {
  if (hasPermission("family:view")) return "familia";
  if (hasPermission("partner:manage")) return "parceiro";
  return "painel";
}

function hasPermission(permission) {
  return getProfile().permissions.includes(permission);
}

function profileClassNames(profile = getProfile()) {
  if (profile.scope.startsWith("classes:")) return profile.scope.replace("classes:", "").split("|").filter(Boolean);
  if (profile.scope.startsWith("class:")) return [profile.scope.replace("class:", "")];
  return [];
}

function sortStudentsByName(students) {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}

function sortStudents(students, mode = "name") {
  if (mode !== "priority") return sortStudentsByName(students);
  const priorityOrder = { alta: 0, media: 1, evolucao: 2, estavel: 3 };
  return [...students].sort((a, b) =>
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    || a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );
}

function visibleStudents() {
  const profile = getProfile();
  if (profile.scope.startsWith("family:") || profile.scope.startsWith("partner:")) return window.NOTARE_BUSINESS.scopedStudents(db, profile);
  const classNames = profileClassNames(profile);
  if (classNames.length) return db.students.filter((student) => classNames.includes(student.className));
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
  return allProfiles().find((profile) => profile.id === id);
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
    done: "Concluído",
    cancelled: "Anulado"
  };
  return labels[status] || "Em acompanhamento";
}

function profileNotificationTemplates() {
  const profile = getProfile();
  const visibleIds = new Set(visibleStudents().map((student) => student.id));
  const templates = [];
  const add = (template) => {
    if (template && templates.length < 2 && !templates.some((item) => item.id === template.id)) templates.push(template);
  };

  const agendaItem = db.agenda
    .filter((item) => !item.voidedAt && item.status !== "done" && item.ownerId === profile.id && visibleIds.has(item.studentId))
    .map((item) => ({ ...item, scheduledDate: agendaDate(item, new Date()) }))
    .sort((a, b) => a.scheduledDate - b.scheduledDate || (a.time || "23:59").localeCompare(b.time || "23:59"))[0];
  if (agendaItem) {
    const student = getStudent(agendaItem.studentId);
    add({
      id: `${profile.id}-agenda-${agendaItem.studentId}-${assetSlug(agendaItem.title)}`,
      title: "Compromisso na agenda",
      message: `${agendaItem.title} com ${student.name} (${student.className}) está entre suas próximas ações.`
    });
  }

  const plan = visiblePlans()
    .filter((item) => !item.voidedAt && item.ownerId === profile.id && planEffectiveStatus(item) !== "done")
    .sort((a, b) => new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`))[0];
  if (plan) {
    const student = getStudent(plan.studentId);
    const status = planEffectiveStatus(plan);
    const title = status === "overdue" ? "Prazo de acompanhamento" : status === "review" ? "Revisão pendente" : "Acompanhamento programado";
    add({
      id: `${profile.id}-plan-${plan.id}`,
      title,
      message: `${plan.type} de ${student.name} (${student.className}) tem prazo em ${formatDate(plan.date)}.`
    });
  }

  visibleRecords()
    .filter((record) => record.ownerId === profile.id && record.followup && !record.voidedAt)
    .sort((a, b) => b.date.split("/").reverse().join("").localeCompare(a.date.split("/").reverse().join("")))
    .forEach((record) => {
      const student = getStudent(record.studentId);
      add({
        id: `${profile.id}-record-${record.id}`,
        title: "Registro para acompanhar",
        message: `O registro de ${record.kind.toLocaleLowerCase("pt-BR")} de ${student.name} (${student.className}) foi marcado para acompanhamento.`
      });
    });

  sortStudents(visibleStudents(), "priority")
    .filter((student) => student.priority !== "estavel")
    .forEach((student) => add({
      id: `${profile.id}-student-${student.id}`,
      title: "Atenção necessária",
      message: `${student.name} (${student.className}) aparece entre as prioridades visíveis para este perfil.`
    }));

  return templates;
}

function resetProfileNotifications() {
  notificationProfileId = null;
  notificationCenter.reset();
}

function startProfileNotifications() {
  if (state.currentRoute !== "painel" || notificationProfileId === state.profileId) return;
  notificationCenter.reset();
  notificationProfileId = state.profileId;
  notificationCenter.schedule(profileNotificationTemplates(), notificationDelays);
}

function latestStudentActivityDate(student) {
  const dates = [
    ...db.records.filter((record) => record.studentId === student.id).filter(record => !record.voidedAt).map((record) => parseDisplayDate(record.date)),
    ...db.plans.filter((plan) => plan.studentId === student.id).filter(plan => !plan.voidedAt).map((plan) => parseDisplayDate(plan.created)),
    ...student.timeline.map(([date]) => parseDisplayDate(date, 2026))
  ].filter(Boolean);
  return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : null;
}

function studentUpdatedLabel(student, now = new Date()) {
  const date = latestStudentActivityDate(student);
  if (!date) return normalizeSeedRelativeLabel(student.updated, now);
  return formatDate(dateKey(date));
}

function studentContactLabel(student, now = new Date()) {
  const communication = window.NOTARE_BUSINESS.communicationStatus(db, student.id);
  if (communication) return `${formatDate(dateKey(new Date(communication.at)))} · ${communication.label}`;
  const contact = db.records
    .filter((record) => record.studentId === student.id && record.kind === "Contato" && !record.voidedAt)
    .map((record) => ({ ...record, parsedDate: parseDisplayDate(record.date) }))
    .filter((record) => record.parsedDate)
    .sort((a, b) => b.parsedDate - a.parsedDate)[0];
  if (!contact) return student.contact;
  const state = String(student.contact || "").split("·").slice(1).join("·").trim();
  const label = formatDate(dateKey(contact.parsedDate));
  return state ? `${label} · ${state}` : label;
}

function normalizeTemporalText(value, now = new Date()) {
  const reference = new Date(2026, 8, 25, 12);
  const replacements = [
    [/\bhoje\b/gi, relativeDateLabel(reference, now)],
    [/\bamanhã\b/gi, relativeDateLabel(addDays(reference, 1), now)]
  ];
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value))
    .replace(/\b(\d{2}\/\d{2})(?![\/\d])/g, "$1/2026");
}

function normalizeSeedRelativeLabel(value, now = new Date()) {
  const text = String(value || "");
  const match = text.match(/^(Hoje|Ontem|Há (\d+) dias?)(?:,\s*(\d{2}:\d{2}))?$/i);
  if (!match) return text;
  const reference = new Date(2026, 8, 25, 12);
  const offset = /^ontem$/i.test(match[1]) ? 1 : Number(match[2] || 0);
  const label = formatDate(dateKey(addDays(reference, -offset)));
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
  document.querySelector("#school-popover-name").textContent = school.name;
  document.querySelector("#school-logo-image").src = "assets/profiles/escola-logo.png";
}

function attendanceSeries() {
  const profile = getProfile();
  const labels = db.analytics.labels;
  const classSeries = profileClassNames(profile).map((className) => db.analytics.byClass[className]).filter(Boolean);
  return classSeries.length
    ? labels.map((_, index) => Math.round(classSeries.reduce((total, values) => total + values[index], 0) / classSeries.length))
    : db.analytics.attendance;
}

function renderChart() {
  const labels = db.analytics.labels;
  const attendance = attendanceSeries();
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
  const area = `M ${x(0)} ${baseline} L ${x(0)} ${y(attendance[0])} ${attendance.slice(1).map((value, index) => `L ${x(index + 1)} ${y(value)}`).join(" ")} L ${x(labels.length - 1)} ${baseline} Z`;
  const gridValues = [70, 80, 90, 100];

  const svg = document.querySelector("#attendance-chart");
  svg.innerHTML = `
    <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F927D" stop-opacity=".24"/><stop offset="1" stop-color="#6F927D" stop-opacity="0"/></linearGradient></defs>
    ${gridValues.map((value) => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="rgba(24,59,70,.10)"/><text x="${left - 10}" y="${y(value) + 4}" fill="#768184" font-family="Manrope, system-ui, sans-serif" font-size="11" font-weight="500" text-anchor="end">${value}%</text>`).join("")}
    <path d="${area}" fill="url(#chart-fill)"/>
    <polyline points="${points}" fill="none" stroke="#183B46" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${attendance.map((value, index) => {
      const tooltipX = Math.min(Math.max(x(index) - 45, left), width - right - 90);
      const tooltipY = Math.max(y(value) - 44, 3);
      const label = `${labels[index]}: ${value}%`;
      return `<g class="chart-point" tabindex="0" role="img" aria-label="${escapeHtml(labels[index])}: ${value}% de frequência"><circle class="chart-point-hit" cx="${x(index)}" cy="${y(value)}" r="15"/><circle class="chart-point-dot" cx="${x(index)}" cy="${y(value)}" r="5"/><g class="chart-tooltip"><rect x="${tooltipX}" y="${tooltipY}" width="90" height="30" rx="7"/><text x="${tooltipX + 45}" y="${tooltipY + 19}" text-anchor="middle">${escapeHtml(label)}</text></g></g>`;
    }).join("")}
    ${labels.map((label, index) => `<text x="${x(index)}" y="${height - 12}" fill="#768184" font-family="Manrope, system-ui, sans-serif" font-size="10" font-weight="500" text-anchor="middle">${escapeHtml(label)}</text>`).join("")}`;
  svg.setAttribute("aria-label", `Frequência de ${attendance.at(-1)} por cento em ${labels.at(-1)}`);
}

function renderProfileIdentity() {
  const profile = getProfile();
  document.querySelector("#user-avatar").innerHTML = personPhoto(profile);
  document.querySelector("#user-name").textContent = profile.name;
  document.querySelector("#user-role").textContent = profile.role;
  document.querySelector("#school-plan").hidden = !profile.permissions.includes("school:view");
  document.querySelector("#topbar-account-kind").textContent = profile.scope.startsWith("family:") ? "Ambiente da família" : profile.scope.startsWith("partner:") ? "Parceiro do Clube" : "Conta institucional";
  const brand = document.querySelector(".brand");
  brand.href = `#${defaultRoute()}`;
  brand.dataset.route = defaultRoute();
  brand.setAttribute("aria-label", "Notare, ir ao início");
  renderTemporalContext();
  const classNames = profileClassNames(profile);
  document.querySelector("#dashboard-subtitle").textContent = classNames.length
    ? `Você está vendo estudantes das turmas ${classNames.join(" e ")}.`
    : "Veja quem precisa de atenção e organize as próximas ações.";

  document.querySelectorAll("[data-permission]").forEach((element) => {
    element.hidden = !hasPermission(element.dataset.permission);
  });

  document.querySelector("#role-list").innerHTML = allProfiles().map((item) => `
    <button class="role-option ${item.id === profile.id ? "active" : ""}" type="button" data-profile="${escapeHtml(item.id)}" aria-pressed="${item.id === profile.id}">
      <span class="user-avatar">${personPhoto(item)}</span>
      <span><strong>${escapeHtml(item.role)}</strong><small>${escapeHtml(item.name)} · ${escapeHtml(item.description)}</small></span>
      <span class="role-check" aria-hidden="true">${item.id === profile.id ? "✓" : ""}</span>
    </button>`).join("");
  applySidebarState(appShell.classList.contains("sidebar-collapsed"));
}

function renderOwnerOptions() {
  const planOwners = db.profiles.filter((profile) => profile.permissions.includes("plans:create"));
  const option = (profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)} · ${escapeHtml(profile.role)}</option>`;
  document.querySelector("#plan-owner").innerHTML = planOwners.map(option).join("");
  const profile = getProfile();
  document.querySelector("#record-owner-display").textContent = `${profile.name} · ${profile.role}`;
  if (planOwners.some((profile) => profile.id === state.profileId)) document.querySelector("#plan-owner").value = state.profileId;
}

function renderDashboard(now = new Date()) {
  const students = visibleStudents();
  const priorities = students.filter((student) => student.priority === "alta");
  const plans = visiblePlans();
  ensureDashboardPreferences();
  const agenda = activeAgenda(now);
  const agendaPreview = state.calendarDate ? agenda.filter(item => dateKey(item.scheduledDate) === state.calendarDate) : agenda;
  const scheduledActions = agenda.length;
  const averageAttendance = students.length ? Math.round(students.reduce((total, student) => total + student.attendance, 0) / students.length) : 0;

  document.querySelector("#metric-priority").textContent = String(priorities.length);
  document.querySelector("#metric-followup").textContent = String(plans.filter((plan) => !plan.voidedAt && plan.status !== "done").length);
  document.querySelector("#metric-return").textContent = String(scheduledActions);
  document.querySelector(".metric:nth-child(4) strong").textContent = `${averageAttendance}%`;
  document.querySelector(".metric:nth-child(1) .metric-trend").textContent = `${priorities.length} para revisar`;
  document.querySelector(".metric:nth-child(2) .metric-trend").textContent = `${students.filter((student) => student.priority === "evolucao").length} evoluindo`;
  const agendaStart = startOfAgenda(now);
  const firstDayCount = agenda.filter((item) => dateKey(item.scheduledDate) === dateKey(agendaStart)).length;
  const startsToday = dateKey(agendaStart) === dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const agendaStartLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(agendaStart);
  document.querySelector(".metric:nth-child(3) .metric-trend").textContent = startsToday
    ? `${firstDayCount} para hoje`
    : `${firstDayCount} para ${agendaStartLabel}`;

  const order = { alta: 0, media: 1, evolucao: 2, estavel: 3 };
  const ordered = [...students].sort((a, b) => order[a.priority] - order[b.priority]);
  document.querySelector('#priority-summary').textContent = `${priorities.length} com atenção alta · ${students.length} estudantes no seu escopo`;
  document.querySelector('#dashboard-priority-preview').innerHTML = ordered.slice(0,2).map(studentButton).join('') || '<p class="dashboard-note">Nenhum estudante neste escopo.</p>';
  document.querySelector("#dashboard-students").innerHTML = ordered.slice(0, 5).map(studentButton).join("");
  document.querySelector('.metric:nth-child(4) .metric-trend').textContent = `${students.length} estudantes`;
  const openPlans = plans.filter(plan => !plan.voidedAt && plan.status !== 'done');
  document.querySelector('#dashboard-open-plans').innerHTML = openPlans.slice(0,3).map(plan => `<li><span>${escapeHtml(getStudent(plan.studentId).name)}<small>${escapeHtml(plan.type)} · prazo ${formatDate(plan.date)}</small></span></li>`).join('') || '<li>Nenhum plano aberto.</li>';
  document.querySelector('#dashboard-action-summary').textContent = agenda.length ? `Próxima ação: ${agenda[0].title}, em ${formatDate(dateKey(agenda[0].scheduledDate))}${agenda[0].time ? ` às ${agenda[0].time}` : ''}.` : 'Nenhuma ação agendada para este perfil.';
  const classes = [...new Set(students.map(student => student.className))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  document.querySelector('#dashboard-class-attendance').innerHTML = classes.map(name => {
    const members = students.filter(student => student.className === name);
    return `<li><span>${escapeHtml(name)}</span><strong>${Math.round(members.reduce((total,student)=>total+student.attendance,0)/members.length)}%</strong></li>`;
  }).join('') || '<li>Nenhuma turma neste escopo.</li>';
  const series = attendanceSeries(), change = series.at(-1) - series[0];
  const seriesDate = label => { const date = parseDisplayDate(label,2026); return date ? formatDate(dateKey(date)) : label; };
  document.querySelector('#evolution-summary').textContent = `${series.at(-1)}% em ${seriesDate(db.analytics.labels.at(-1))} · ${change > 0 ? '+' : ''}${change} p.p. desde ${seriesDate(db.analytics.labels[0])}`;
  document.querySelector('#agenda-upcoming').hidden = !state.calendarDate;
  document.querySelector('.agenda-card .today-pill').textContent = state.calendarDate ? formatDate(state.calendarDate) : 'Próximas ações';
  document.querySelector('#agenda-summary').textContent = state.calendarDate
    ? `${formatDate(state.calendarDate)} · ${agendaPreview.length} ${agendaPreview.length === 1 ? 'compromisso' : 'compromissos'}`
    : agenda.length ? `${agenda.length} ${agenda.length === 1 ? 'compromisso' : 'compromissos'} · próximo: ${agenda[0].title}, ${formatDate(dateKey(agenda[0].scheduledDate))}` : 'Nenhum compromisso atribuído a você.';

  document.querySelector("#agenda-list").innerHTML = agendaPreview.length ? agendaPreview.map((item) => {
    const student = getStudent(item.studentId);
    const stateCopy = item.agendaState ? `<small class="agenda-state">${escapeHtml(item.agendaState.label)} · ${escapeHtml(item.agendaState.text)}</small>` : "";
    return `<li class="${item.agendaState ? "is-repositioned" : ""}"><span class="agenda-time">${escapeHtml(agendaSlot(item, now, item.scheduledDate))}</span><span class="agenda-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(student.name)} (${escapeHtml(student.className)})</span>${stateCopy}<button class="text-button agenda-context" type="button" data-agenda-student="${escapeHtml(student.id)}">Ver contexto de ${escapeHtml(student.name)}</button></span></li>`;
  }).join("") : `<li class="agenda-empty">${state.calendarDate ? 'Nenhum compromisso nesta data.' : 'Nenhum compromisso atribuído a você.'}</li>`;

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
  document.querySelector('#overview-summary').textContent = `${active + review} planos abertos · ${review} aguardando revisão · ${returnRate}% dos casos com retorno registrado`;
  renderChart();
  renderMiniCalendar(now);
  applyDashboardPanels();
}

function renderClassFilter(selector, key) {
  const select = document.querySelector(selector);
  const classes = [...new Set(visibleStudents().map(student => student.className))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  if (!classes.includes(state[key])) state[key] = "todas";
  select.innerHTML = `<option value="todas">Todas as turmas</option>${classes.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  select.value = state[key];
}

function renderStudents() {
  renderClassFilter("#followup-class-filter", "followupClassFilter");
  const scopedStudents = sortStudentsByName(visibleStudents());
  const classNames = [...new Set(scopedStudents.map((student) => student.className))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const classSelect = document.querySelector("#class-filter");
  const sortSelect = document.querySelector("#student-sort");
  if (state.classFilter !== "todas" && !classNames.includes(state.classFilter)) state.classFilter = classNames[0] || "todas";
  classSelect.innerHTML = `<option value="todas">Todas as turmas</option>${classNames.map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`).join("")}`;
  classSelect.value = state.classFilter;
  sortSelect.value = state.studentSort;

  const visible = sortStudents(scopedStudents.filter((student) => {
    const matchesFilter = state.filter === "todos" || student.priority === state.filter;
    const haystack = `${student.name} ${student.className} ${student.code}`.toLocaleLowerCase("pt-BR");
    return matchesFilter && (state.followupClassFilter === "todas" || student.className === state.followupClassFilter) && haystack.includes(state.query.toLocaleLowerCase("pt-BR"));
  }), "priority");

  document.querySelector("#student-table").innerHTML = visible.map((student) => `
    <tr>
      <td><div class="table-student"><span class="mini-avatar">${personPhoto(student)}</span><div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)}</span></div></div></td>
      <td class="table-signals">${escapeHtml(student.signals)}</td>
      <td class="table-muted">${escapeHtml(studentUpdatedLabel(student))}</td>
      <td><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></td>
      <td><button class="row-open" data-student="${escapeHtml(student.id)}" aria-label="Abrir perfil de ${escapeHtml(student.name)}"><svg><use href="#i-arrow"></use></svg></button></td>
    </tr>`).join("");
  document.querySelector("#student-empty").hidden = visible.length > 0;
  const filteredDirectoryStudents = state.classFilter === "todas" ? scopedStudents : scopedStudents.filter((student) => student.className === state.classFilter);
  const directoryStudents = sortStudents(filteredDirectoryStudents, state.studentSort);
  const followupCount = directoryStudents.filter((student) => student.priority !== "estavel").length;
  const stableCount = directoryStudents.length - followupCount;
  document.querySelector("#class-summary").textContent = `${directoryStudents.length} ${directoryStudents.length === 1 ? "estudante" : "estudantes"} · ${followupCount} em acompanhamento · ${stableCount} sem alertas`;
  document.querySelector("#student-directory").innerHTML = directoryStudents.map((student) => `
    <button class="directory-card" data-student="${escapeHtml(student.id)}">
      <span class="mini-avatar">${personPhoto(student)}</span>
      <div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)} · ${escapeHtml(student.code)}</span><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></div>
    </button>`).join("");
}

function registrationScopeLabel(profile) {
  const classNames = profileClassNames(profile);
  if (classNames.length) return classNames.join(" e ");
  if (profile.scope === "followup") return "Estudantes em acompanhamento";
  return "Toda a escola";
}

function renderRegistrations() {
  if (!hasPermission("registrations:view")) {
    state.registrationTab = "students";
    state.registrationQuery = "";
    state.registrationPage = 1;
    document.querySelector("#registration-search").value = "";
    document.querySelector("#registration-table").replaceChildren();
    document.querySelector("#registration-summary").textContent = "";
    document.querySelector("#registration-page").textContent = "";
    return;
  }

  renderClassFilter("#registration-class-filter", "registrationClassFilter");
  document.querySelector("#registration-class-field").hidden = state.registrationTab !== "students";
  const pageSize = 8;
  const query = state.registrationQuery.trim().toLocaleLowerCase("pt-BR");
  const table = document.querySelector("#registration-table");
  const search = document.querySelector("#registration-search");
  const createLabel = document.querySelector("#registration-create span");
  let records = [];
  let renderRow = () => "";
  let columns = [];
  let noun = "estudantes";

  if (state.registrationTab === "staff") {
    columns = ["Nome", "Função", "Escopo", "Situação"];
    noun = "funcionários";
    records = db.profiles.filter((profile) => `${profile.name} ${profile.role} ${registrationScopeLabel(profile)}`.toLocaleLowerCase("pt-BR").includes(query));
    renderRow = (profile) => `<tr><td><span class="registration-identity">${personPhoto(profile)}<strong>${escapeHtml(profile.name)}</strong></span></td><td>${escapeHtml(profile.role)}</td><td>${escapeHtml(registrationScopeLabel(profile))}</td><td><span class="registration-status">Ativo</span></td></tr>`;
    search.placeholder = "Buscar funcionário";
    createLabel.textContent = "Novo funcionário";
  } else if (state.registrationTab === "classes") {
    columns = ["Turma", "Estudantes", "Em acompanhamento", "Situação"];
    noun = "turmas";
    records = [...new Set(visibleStudents().map((student) => student.className))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .filter((className) => className.toLocaleLowerCase("pt-BR").includes(query));
    renderRow = (className) => {
      const students = visibleStudents().filter((student) => student.className === className);
      const followup = students.filter((student) => student.priority !== "estavel").length;
      return `<tr><td><strong>${escapeHtml(className)}</strong></td><td>${students.length}</td><td>${followup}</td><td><span class="registration-status">Ativa</span></td></tr>`;
    };
    search.placeholder = "Buscar turma";
    createLabel.textContent = "Nova turma";
  } else {
    columns = ["Nome", "Turma", "Código", "Situação"];
    records = sortStudentsByName(visibleStudents()).filter((student) => (state.registrationClassFilter === "todas" || student.className === state.registrationClassFilter) && `${student.name} ${student.className} ${student.code}`.toLocaleLowerCase("pt-BR").includes(query));
    renderRow = (student) => `<tr><td><span class="registration-identity">${personPhoto(student)}<strong>${escapeHtml(student.name)}</strong></span></td><td>${escapeHtml(student.className)}</td><td>${escapeHtml(student.code)}</td><td><span class="status-badge ${statusClass(student.priority)}">${escapeHtml(student.status)}</span></td></tr>`;
    search.placeholder = "Buscar estudante";
    createLabel.textContent = "Novo estudante";
  }

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  state.registrationPage = Math.min(Math.max(state.registrationPage, 1), totalPages);
  const pageStart = (state.registrationPage - 1) * pageSize;
  const pageRecords = records.slice(pageStart, pageStart + pageSize);
  const rows = pageRecords.map(renderRow);
  table.innerHTML = `<table class="registration-table"><thead><tr>${columns.map((column) => `<th scope="col">${column}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>${rows.length ? "" : '<p class="registration-empty">Nenhum resultado encontrado.</p>'}`;
  const firstVisible = records.length ? pageStart + 1 : 0;
  const lastVisible = pageStart + pageRecords.length;
  document.querySelector("#registration-summary").textContent = records.length
    ? `Mostrando ${firstVisible}–${lastVisible} de ${records.length} ${noun}`
    : `Nenhum ${noun.slice(0, -1)} encontrado`;
  document.querySelector("#registration-page").textContent = `Página ${state.registrationPage} de ${totalPages}`;
  document.querySelector("#registration-previous").disabled = state.registrationPage === 1;
  document.querySelector("#registration-next").disabled = state.registrationPage === totalPages;
  document.querySelectorAll("[data-registration-tab]").forEach((button) => {
    const active = button.dataset.registrationTab === state.registrationTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    if (active) table.setAttribute("aria-labelledby", button.id);
  });
}

function renderStudentSelect() {
  const scopedStudents = sortStudentsByName(visibleStudents());
  const classSelect = document.querySelector("#record-class");
  const studentSelect = document.querySelector("#record-student");
  const classes = [...new Set(scopedStudents.map((student) => student.className))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const currentStudent = scopedStudents.find((student) => student.id === state.currentStudent);
  state.recordClass = currentStudent?.className || (classes.includes(state.recordClass) ? state.recordClass : classes[0] || "");
  classSelect.innerHTML = classes.map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`).join("");
  classSelect.value = state.recordClass;

  const classStudents = sortStudentsByName(scopedStudents.filter((student) => student.className === state.recordClass));
  if (!classStudents.some((student) => student.id === state.currentStudent)) state.currentStudent = classStudents[0]?.id || scopedStudents[0]?.id;
  studentSelect.innerHTML = classStudents.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}</option>`).join("");
  studentSelect.value = state.currentStudent;
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
    (plan) => plan.studentId === student.id && !plan.voidedAt && plan.status !== "done"
  );
  document.querySelector("#student-plan-status").hidden = !activePlan;

  const communication = window.NOTARE_BUSINESS.communicationStatus(db, student.id);
  document.querySelector("#priority-reason").textContent = communication
    ? `Os sinais escolares cadastrados mantêm este caso em acompanhamento. Comunicação atual: ${communication.label}. A prioridade deve ser revisada pela equipe com base no contexto; a resposta familiar não altera a frequência automaticamente.`
    : student.reason;
  document.querySelector("#last-contact").textContent = studentContactLabel(student);
  const contactRows = document.querySelectorAll(".contact-card dd");
  contactRows[0].textContent = student.guardian;
  contactRows[1].textContent = student.preferredChannel;
  const metrics = student.metrics.map(metric => communication && /contato/i.test(metric[1])
    ? [String(communication.count), "comunicados compartilhados", communication.label] : metric);
  document.querySelector("#signal-grid").innerHTML = metrics.map(([value, label, note]) => `<article class="signal-tile"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(normalizeTemporalText(note))}</small></article>`).join("");

  const planEntries = visiblePlans()
    .filter((plan) => plan.studentId === student.id)
    .map((plan) => {
      const status = planStatusLabel(planEffectiveStatus(plan));
      return [
        plan.created,
        `${status}: ${plan.type}. Responsável: ${plan.owner}. Prazo: ${formatDate(plan.date)}.`
      ];
    });
  const recordEntries = visibleRecords().filter(record => record.studentId === student.id)
    .map(record => [record.date, `${record.voidedAt ? "Registro anulado · " : ""}${record.description}`]);
  // Datas sem ano pertencem à base demonstrativa de 2026.
  const savedEntries = [...recordEntries, ...planEntries];
  // Evita repetir um evento da base, preservando registros salvos distintos, mesmo com texto igual.
  const seedEntries = student.timeline.filter(([date, copy]) => !savedEntries.some(([savedDate, savedCopy]) =>
    savedCopy === copy && parseDisplayDate(savedDate, 2026)?.getTime() === parseDisplayDate(date, 2026)?.getTime()));
  const timelineEntries = [...savedEntries, ...seedEntries]
    .map(([date, copy]) => ({ date, copy, parsedDate: parseDisplayDate(date, 2026) }))
    .sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0));
  document.querySelector("#student-timeline").innerHTML = timelineEntries.map(({ date, copy, parsedDate }) => `<div class="timeline-entry"><span class="timeline-dot"></span><time${parsedDate ? ` datetime="${dateKey(parsedDate)}"` : ""}>${escapeHtml(parsedDate ? formatDate(dateKey(parsedDate)) : date)}</time><p>${escapeHtml(copy)}</p></div>`).join("");
  document.querySelector("#plan-student-caption").textContent = `${student.name} · ${student.className}`;
  syncRecordDate();
  syncPlanDeadline();
  renderStudentSelect();
}

function recordKindPresentation(kind) {
  return {
    "Ausência": { icon: "i-absence", tone: "absence" },
    "Contato": { icon: "i-contact", tone: "contact" },
    "Ocorrência": { icon: "i-occurrence", tone: "occurrence" },
    "Devolutiva": { icon: "i-feedback", tone: "feedback" },
    "Plano": { icon: "i-plan", tone: "plan", label: "Plano de ação" }
  }[kind] || { icon: "i-clipboard", tone: "default" };
}

const recordTextTemplates = {
  "Ausência": [
    { id: "absence-unexplained", label: "Ausência sem justificativa", text: (student) => `${student.name} não esteve presente na data informada. Até o momento, a equipe não recebeu justificativa para a ausência.` },
    { id: "absence-recurring", label: "Ausências consecutivas", text: (student) => `Foram identificadas ausências consecutivas de ${student.name}. O registro foi incluído para acompanhamento da frequência e definição do próximo contato.` },
    { id: "absence-return", label: "Retorno após ausência", text: (student) => `${student.name} retornou às atividades após período de ausência. A equipe seguirá observando a frequência e os apoios necessários.` }
  ],
  "Contato": [
    { id: "contact-no-answer", label: "Tentativa sem retorno", text: (student) => `Foi realizada uma tentativa de contato com o responsável de ${student.name}, ainda sem retorno. Uma nova tentativa será organizada pela equipe.` },
    { id: "contact-confirmed", label: "Contato confirmado", text: (student) => `Foi realizado contato com o responsável de ${student.name}. As informações necessárias foram compartilhadas e o próximo passo foi combinado.` },
    { id: "contact-meeting", label: "Reunião agendada", text: (student) => `Foi agendada uma conversa com o responsável de ${student.name} para alinhar o acompanhamento e definir os próximos encaminhamentos.` }
  ],
  "Ocorrência": [
    { id: "occurrence-observed", label: "Situação observada", text: (student) => `Foi observada uma situação relacionada à rotina escolar de ${student.name}. Este registro descreve somente os fatos verificados pela equipe.` },
    { id: "occurrence-mediated", label: "Mediação realizada", text: (student) => `A equipe realizou uma mediação após situação envolvendo ${student.name}. As pessoas envolvidas foram ouvidas e receberam as orientações cabíveis.` },
    { id: "occurrence-referral", label: "Encaminhamento à equipe", text: (student) => `A situação observada envolvendo ${student.name} foi encaminhada à equipe responsável para análise e acompanhamento.` }
  ],
  "Devolutiva": [
    { id: "feedback-student", label: "Devolutiva ao estudante", text: (student) => `Foi realizada uma devolutiva com ${student.name} sobre o acompanhamento. As orientações e os próximos passos foram apresentados de forma objetiva.` },
    { id: "feedback-family", label: "Devolutiva à família", text: (student) => `Foi compartilhada uma devolutiva com o responsável de ${student.name}. A família foi informada sobre o acompanhamento e os próximos passos.` },
    { id: "feedback-team", label: "Revisão com a equipe", text: (student) => `A equipe revisou o acompanhamento de ${student.name} e registrou os encaminhamentos necessários para a continuidade do trabalho.` }
  ]
};

function selectedRecordKind(form = document.querySelector("#record-form")) {
  return new FormData(form).get("kind") || "Ausência";
}

function renderRecordTemplates() {
  const form = document.querySelector("#record-form");
  const select = document.querySelector("#record-template");
  const templates = recordTextTemplates[selectedRecordKind(form)] || [];
  const selected = select.value;
  select.innerHTML = `<option value="">Selecione uma opção</option>${templates.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.label)}</option>`).join("")}`;
  select.value = templates.some((template) => template.id === selected) ? selected : "";
}

function insertRecordText(text, announcementText) {
  const description = document.querySelector('#record-form textarea[name="description"]');
  description.value = text;
  description.focus();
  const status = document.querySelector("#record-text-status");
  status.hidden = false;
  status.textContent = announcementText;
  announcement.textContent = announcementText;
}

function renderRecords() {
  renderClassFilter("#records-class-filter", "recordsClassFilter");
  if (!visibleStudents().some(student => student.id === state.recordsStudentId)) state.recordsStudentId = null;
  const scopedStudent = state.recordsStudentId ? getStudent(state.recordsStudentId) : null;
  document.querySelector("#registros-title").textContent = scopedStudent ? `Registros de ${scopedStudent.name}` : "Registros";
  document.querySelector("#records-back").hidden = !scopedStudent;
  document.querySelector("#records-filters").hidden = Boolean(scopedStudent);
  document.querySelector("#records-context").textContent = scopedStudent ? `${scopedStudent.name} · ${scopedStudent.className}` : "Consulta geral";
  const plans = visiblePlans().map((plan) => ({ id: plan.id, kind: "Plano", studentId: plan.studentId, description: `${plan.type} · ${plan.owner} · prazo ${formatDate(plan.date)}`, date: plan.created, time: plan.createdTime, status: planEffectiveStatus(plan), voidedAt: plan.voidedAt, voidedById: plan.voidedById }));
  const items = [...visibleRecords(), ...plans]
    .filter((record) => (!state.recordsStudentId || record.studentId === state.recordsStudentId) &&
      (state.recordsClassFilter === "todas" || getStudent(record.studentId).className === state.recordsClassFilter))
    .filter((record) => state.recordFilter === "todos" || record.kind === state.recordFilter)
    .sort((a, b) => `${b.date.split("/").reverse().join("")} ${b.time || "00:00"}`.localeCompare(`${a.date.split("/").reverse().join("")} ${a.time || "00:00"}`));

  document.querySelector("#records-list").innerHTML = items.map((record) => {
    const student = getStudent(record.studentId);
    const owner = getOwner(record.ownerId);
    const ownerLabel = owner ? ` · por ${owner.name}` : "";
    const recordDate = parseDisplayDate(record.date);
    const dateTime = recordDate ? `${dateKey(recordDate)}${record.time ? `T${record.time}` : ""}` : "";
    const state = record.voidedAt ? "Anulado" : record.kind === "Plano" ? planStatusLabel(record.status) : "";
    const auditLabel = record.voidedAt ? `Criação anulada em ${formatDate(dateKey(new Date(record.voidedAt)))} por ${getOwner(record.voidedById)?.name || "seu autor"}. Original preservado.` : "";
    const presentation = recordKindPresentation(record.kind);
    return `<article class="record-item"><span class="record-kind record-kind-${presentation.tone}"><svg aria-hidden="true"><use href="#${presentation.icon}"></use></svg><span>${escapeHtml(presentation.label || record.kind)}</span></span><div class="record-copy"><div class="record-heading"><strong><button class="text-button" data-student="${escapeHtml(student.id)}">${escapeHtml(student.name)}</button> <em>(${escapeHtml(student.className)})</em></strong>${state ? `<span class="record-state record-state-${escapeHtml(record.voidedAt ? "cancelled" : record.status)}">${escapeHtml(state)}</span>` : ""}</div><p>${escapeHtml(record.description)}${escapeHtml(ownerLabel)}</p>${auditLabel ? `<small class="record-audit">${escapeHtml(auditLabel)}</small>` : ""}</div><time${dateTime ? ` datetime="${dateTime}"` : ""}><span>${escapeHtml(record.date)}</span><small>${escapeHtml(record.time || "Horário não informado")}</small></time></article>`;
  }).join("");
  document.querySelector("#records-empty").hidden = items.length > 0;
}

function renderPlanSuccess() {
  const plan = createdPlanForScope(db.plans, state.lastPlanId, visibleStudents().map(student => student.id));
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
  renderRegistrations();
  renderStudentProfile();
  renderRecords();
  renderRecordTemplates();
  businessUI.render();
  captureBusinessFormBaselines();
}

function routeTitle(route) {
  const labels = { familias: "Famílias e retornos", familia: "Minha família", clube: "Clube de Benefícios", parceiro: "Ofertas e conversões", assinatura: "Plano e assinatura", parcerias: "Revisar parcerias", entrada: "Acesso", painel: "Visão geral", "busca-ativa": "Acompanhamento escolar", estudante: "Perfil do estudante", registros: "Registros", estudantes: "Estudantes", cadastros: "Cadastros", jornada: "Implantação do Notare", "novo-registro": "Novo registro", plano: "Plano de ação", conclusao: "Plano criado" };
  return labels[route] || "Notare";
}

const routePermissions = {
  painel: "dashboard:view",
  "busca-ativa": "followup:view",
  estudante: "students:view",
  estudantes: "students:view",
  registros: "records:view",
  cadastros: "registrations:view",
  "novo-registro": "records:create",
  familias: "families:manage", familia: "family:view", clube: "club:view", parceiro: "partner:manage", assinatura: "subscription:manage", parcerias: "partners:review",
  conclusao: "plans:create",
  plano: "plans:create"
};

const navigationKeys = ["currentStudent", "filter", "classFilter", "studentSort", "recordFilter", "recordsStudentId", "followupClassFilter", "recordsClassFilter", "registrationClassFilter", "query", "studentReturnContext"];
const formBaselines = new Map();
const businessFormBaselines = new WeakMap();
function captureBusinessFormBaselines() {
  document.querySelectorAll("[data-business-form]").forEach(form => businessFormBaselines.set(form, formSnapshot(form)));
}
function hasUnsavedBusinessForm() {
  return [...document.querySelectorAll(".view.active [data-business-form]")].some(form =>
    businessFormBaselines.has(form) && formSnapshot(form) !== businessFormBaselines.get(form));
}
function navigationContext() {
  return Object.fromEntries([ ["route", state.currentRoute], ...navigationKeys.map(key => [key, state[key]]) ]);
}
function routeHash(route = state.currentRoute) {
  const studentId = route === "estudante" ? state.currentStudent : route === "registros" ? state.recordsStudentId : null;
  return `#${route}${studentId ? `?estudante=${encodeURIComponent(studentId)}` : ""}`;
}
function formSnapshot(form) { return JSON.stringify([...new FormData(form)]); }
function activeForm() {
  return document.querySelector(state.currentRoute === "novo-registro" ? "#record-form" : state.currentRoute === "plano" ? "#plan-form" : "#no-active-form");
}
function hasUnsavedForm() {
  const form = activeForm();
  return form && formBaselines.has(form.id) && formSnapshot(form) !== formBaselines.get(form.id);
}
function confirmFormExit() {
  if (!hasUnsavedForm()) {
    const form = activeForm();
    if (form) formBaselines.delete(form.id);
    return true;
  }
  if (!window.confirm("Sair sem salvar? As alterações deste formulário serão descartadas.")) return false;
  const form = activeForm();
  form.reset();
  formBaselines.delete(form.id);
  state.recordKind = "Ausência";
  document.querySelector("#record-text-status").hidden = true;
  showToast("Operação cancelada. Nenhuma alteração foi salva.");
  return true;
}
function returnToContext(context, fallback = "painel") {
  return showRoute(context?.route || fallback, { context });
}
function syncNavigationControls() {
  const returnLabels = { "busca-ativa": "Voltar ao acompanhamento", estudantes: "Voltar aos estudantes", registros: "Voltar aos registros", painel: "Voltar à visão geral" };
  document.querySelector("#student-back span").textContent = returnLabels[state.studentReturnContext?.route] || "Voltar ao acompanhamento";
  document.querySelector("#student-search").value = state.query;
  document.querySelectorAll("[data-filter], [data-record-filter]").forEach(button => {
    const active = button.dataset.filter ? button.dataset.filter === state.filter : button.dataset.recordFilter === state.recordFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function animateEntry(view) {
  if (motionPreference.matches || !view) return;
  const selectors = ".page-heading, .form-intro, .metric, .dashboard-chart, .dashboard-grid > *, .profile-hero, .profile-main, .profile-side > *, .class-toolbar, .toolbar, .table-card, .records-shell, .registration-shell, .data-form > fieldset, .data-form > .two-fields, .data-form > label, .description-field, .form-actions, .success-card > *, .ecosystem-card";
  const candidates = [...view.querySelectorAll(selectors)].filter(element => element.getClientRects().length);
  const items = candidates.filter(element => !candidates.some(parent => parent !== element && parent.contains(element))).slice(0, 18);
  items.forEach((element, index) => {
    element.style.setProperty("--enter-delay", `${Math.min(index * 35, 210)}ms`);
    element.classList.remove("enter-item");
    element.classList.add("enter-item");
    element.addEventListener("animationend", () => element.classList.remove("enter-item"), { once: true });
  });
}
function alignEntryBrand() {
  const brand = document.querySelector(".entry-brand");
  const opening = document.querySelector("#entry-opening");
  if (!brand?.getClientRects().length) return;
  const box = brand.getBoundingClientRect();
  const container = opening.getBoundingClientRect();
  opening.style.setProperty("--brand-left", `${box.left - container.left}px`);
  opening.style.setProperty("--brand-top", `${box.top - container.top}px`);
  opening.style.setProperty("--brand-width", `${box.width}px`);
}

function showRoute(route, options = {}) {
  const [routeName, query = ""] = route.split("?");
  const studentId = options.studentId || new URLSearchParams(query).get("estudante");
  route = routeName;
  if (state.currentRoute !== route && !confirmFormExit()) {
    if (options.skipHistory) history.replaceState(navigationContext(), "", routeHash());
    return false;
  }
  if (!options.skipHistory) history.replaceState(navigationContext(), "", routeHash());
  const origin = navigationContext();
  if (options.context) navigationKeys.forEach(key => { if (key in options.context) state[key] = options.context[key]; });
  if (studentId && visibleStudents().some(student => student.id === studentId)) state.currentStudent = studentId;
  // O histórico do navegador pode pertencer a um perfil demonstrativo anterior.
  const scopedStudents = visibleStudents();
  if (!scopedStudents.some(student => student.id === state.currentStudent)) state.currentStudent = scopedStudents[0]?.id;
  if (route === "registros" && !options.context) state.recordsStudentId = studentId || null;
  if (["novo-registro", "plano"].includes(route) && state.currentRoute !== route) state.formReturnContext = origin;

  const exists = views.some((view) => view.dataset.view === route);
  let nextRoute = exists ? route : "entrada";
  const permission = routePermissions[nextRoute];
  if (permission && !hasPermission(permission)) {
    showToast(`O perfil ${getProfile().role} não tem acesso a esta ação.`);
    nextRoute = defaultRoute();
  }

  if (nextRoute === "conclusao" && !createdPlanForScope(db.plans, state.lastPlanId, visibleStudents().map(student => student.id))) {
    showToast("Nenhum plano recém-criado disponível. Consulte o histórico do acompanhamento.");
    nextRoute = defaultRoute();
  }

  if (state.currentRoute !== nextRoute) state.previousRoute = state.currentRoute;
  state.currentRoute = nextRoute;
  appShell.classList.toggle("journey-mode", nextRoute === "entrada" || nextRoute === "jornada");
  document.querySelector("#topbar-new-record").hidden = nextRoute !== "painel";
  if (nextRoute === "jornada") startJourney({ reset: !options.skipHistory });
  else stopJourney();
  if (nextRoute === "estudante" || nextRoute === "plano" || nextRoute === "novo-registro") renderStudentProfile();
  syncNavigationControls();
  if (["busca-ativa", "estudantes"].includes(nextRoute)) renderStudents();
  if (nextRoute === "registros") renderRecords();
  if (["novo-registro", "plano"].includes(nextRoute)) {
    if (nextRoute === "novo-registro") renderRecordTemplates();
    const form = activeForm();
    if (!formBaselines.has(form.id)) formBaselines.set(form.id, formSnapshot(form));
    document.querySelector("#record-text-status").hidden = !form.elements.description?.value;
  }
  if (nextRoute === "painel") {
    renderDashboard();
    startProfileNotifications();
  }
  if (nextRoute === "conclusao") renderPlanSuccess();

  views.forEach((view) => {
    const active = view.dataset.view === nextRoute;
    view.classList.toggle("active", active);
    view.setAttribute("aria-hidden", String(!active));
  });
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const active = link.dataset.route === nextRoute || (nextRoute === "estudante" && link.dataset.route === (state.studentReturnContext?.route || "busca-ativa"));
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const nextHash = routeHash(nextRoute);
  if (options.skipHistory && location.hash !== nextHash) {
    history.replaceState(navigationContext(), "", nextHash);
  } else if (!options.skipHistory) {
    if (location.hash === nextHash) history.replaceState(navigationContext(), "", nextHash);
    else history.pushState(navigationContext(), "", nextHash);
  }
  if (nextRoute === "entrada") {
    alignEntryBrand();
    window.requestAnimationFrame(alignEntryBrand);
    document.fonts?.ready.then(alignEntryBrand);
  } else if (origin.route !== nextRoute && nextRoute !== "jornada") {
    animateEntry(views.find(view => view.dataset.view === nextRoute));
  }
  document.title = `${routeTitle(nextRoute)} — Notare`;
  announcement.textContent = `Tela ${routeTitle(nextRoute)}`;
  document.querySelector("#main-content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
  sidebarDrawer.close();
  return true;
}

function stopJourney() {
  window.clearTimeout(journeyTimer);
  journeyTimer = null;
  journeyWaitResolve?.(false);
  journeyWaitResolve = null;
  document.querySelectorAll(".is-typing").forEach(element => element.classList.remove("is-typing"));
  journeyRunId += 1;
  journeyRunning = false;
}

function journeyWait(milliseconds, runId = journeyRunId) {
  return new Promise((resolve) => {
    const settle = value => { if (journeyWaitResolve === settle) journeyWaitResolve = null; resolve(value); };
    journeyWaitResolve = settle;
    let remaining = milliseconds;
    let previousTick = Date.now();
    const tick = () => {
      if (runId !== journeyRunId || state.currentRoute !== "jornada") {
        settle(false);
        return;
      }
      const currentTick = Date.now();
      if (!journeyPaused) remaining -= currentTick - previousTick;
      previousTick = currentTick;
      if (remaining <= 0) {
        journeyTimer = null;
        settle(true);
        return;
      }
      journeyTimer = window.setTimeout(tick, Math.min(remaining, 100));
    };
    tick();
  });
}

async function typeJourneyText(element, text, runId) {
  element.textContent = "";
  element.classList.add("is-typing");
  for (const [index, character] of [...text].entries()) {
    if (runId !== journeyRunId || state.currentRoute !== "jornada") {
      element.classList.remove("is-typing");
      return false;
    }
    element.textContent += character;
    const pause = /[.,@]/.test(character) ? 240 : character === " " ? 75 : 92 + (index % 4) * 10;
    if (!await journeyWait(pause, runId)) {
      element.classList.remove("is-typing");
      return false;
    }
  }
  element.classList.remove("is-typing");
  return true;
}

function completeJourneyPreview(step) {
  step.querySelectorAll("[data-demo-text]").forEach((element) => { element.textContent = element.dataset.demoText; });
  step.querySelectorAll("[data-demo-select]").forEach((element) => {
    element.value = element.dataset.demoSelect;
    element.classList.add("is-set");
  });
  step.querySelectorAll(".demo-reveal, .demo-photo").forEach((element) => element.classList.add("is-visible"));
}

function prepareJourneyPreview(step) {
  step.querySelectorAll("[data-demo-text]").forEach((element) => {
    element.textContent = "";
    element.classList.remove("is-typing");
  });
  step.querySelectorAll("[data-demo-select]").forEach((element) => {
    element.value = "";
    element.classList.remove("is-set");
  });
  step.querySelectorAll(".demo-reveal, .demo-photo").forEach((element) => element.classList.remove("is-visible"));
}

function advanceJourney() {
  stopJourney();
  journeyStepComplete = false;
  if (journeyStep < 3) {
    journeyStep += 1;
    renderJourney();
    scheduleJourney();
  } else {
    finishJourney();
  }
}

function finishJourney() {
  switchProfile("direcao", { announce: false });
  showRoute("painel");
}

async function scheduleJourneyAdvance() {
  if (journeyRunning || journeyMode !== "automatic" || !journeyStepComplete || state.currentRoute !== "jornada") return;
  journeyRunning = true;
  const runId = journeyRunId;
  const completed = await journeyWait(5000, runId);
  if (runId !== journeyRunId) return;
  journeyRunning = false;
  if (completed && journeyMode === "automatic" && journeyStepComplete) advanceJourney();
}

async function playJourneyStep() {
  if (journeyRunning || journeyPaused || state.currentRoute !== "jornada") return;
  journeyRunning = true;
  const runId = journeyRunId;
  const step = document.querySelector(`[data-journey-step="${journeyStep}"]`);
  journeyStepComplete = false;
  prepareJourneyPreview(step);
  renderJourney();

  if (journeyCaptureMode || journeyReducedMotion) {
    completeJourneyPreview(step);
    journeyStepComplete = true;
    journeyRunning = false;
    renderJourney();
    return;
  }

  if (!await journeyWait(2000, runId)) return;
  if (journeyReducedMotion) {
    completeJourneyPreview(step);
  } else {
    for (const element of step.querySelectorAll("[data-demo-text]")) {
      if (!await typeJourneyText(element, element.dataset.demoText, runId)) return;
      if (!await journeyWait(600, runId)) return;
    }
    for (const element of step.querySelectorAll("[data-demo-select]")) {
      if (!await journeyWait(850, runId)) return;
      element.value = element.dataset.demoSelect;
      element.classList.add("is-set");
      if (!await journeyWait(650, runId)) return;
    }
    for (const element of step.querySelectorAll(".demo-reveal, .demo-photo")) {
      element.classList.add("is-visible");
      if (!await journeyWait(800, runId)) return;
    }
  }
  journeyStepComplete = true;
  journeyRunning = false;
  renderJourney();
  scheduleJourneyAdvance();
}

function scheduleJourney() {
  if (journeyRunning || journeyPaused || journeyStepComplete || state.currentRoute !== "jornada") return;
  playJourneyStep();
}

function renderJourney() {
  document.querySelectorAll("[data-journey-step]").forEach((step) => {
    const active = Number(step.dataset.journeyStep) === journeyStep;
    step.hidden = !active;
    step.classList.toggle("active", active);
  });
  document.querySelector("#journey-step-label").textContent = `Etapa ${journeyStep + 1} de 4`;
  document.querySelector("#journey-progress-bar").style.width = `${(journeyStep + 1) * 25}%`;
  const status = document.querySelector("#journey-autoplay");
  if (journeyCaptureMode) status.textContent = "Modo de captura: preenchimento concluído.";
  else if (journeyPaused) status.textContent = "Apresentação pausada.";
  else if (journeyMode === "manual" && journeyStepComplete) status.textContent = "Etapa concluída. Continue quando estiver pronto.";
  else if (journeyMode === "manual") status.textContent = "O preenchimento é automático; você decide quando avançar.";
  else if (journeyStepComplete) status.textContent = "Próxima etapa em alguns segundos.";
  else status.textContent = "Os dados desta etapa serão apresentados em sequência.";

  document.querySelectorAll("[data-journey-mode]").forEach((button) => {
    const active = button.dataset.journeyMode === journeyMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const pauseButton = document.querySelector("#journey-pause");
  pauseButton.hidden = journeyMode === "manual" || journeyCaptureMode;
  pauseButton.setAttribute("aria-pressed", String(journeyPaused));
  pauseButton.setAttribute("aria-label", journeyPaused ? "Retomar apresentação" : "Pausar apresentação");
  pauseButton.querySelector("use").setAttribute("href", journeyPaused ? "#i-play" : "#i-pause");
  const nextButton = document.querySelector("#journey-next");
  nextButton.hidden = journeyCaptureMode;
  nextButton.disabled = false;
  nextButton.textContent = journeyStep === 3 ? "Ir ao painel" : "Avançar";
  const backButton = document.querySelector("#journey-back");
  backButton.hidden = journeyCaptureMode;
  backButton.disabled = journeyStep === 0;
}

function startJourney({ reset = true } = {}) {
  stopJourney();
  if (reset) journeyStep = 0;
  journeyPaused = false;
  journeyStepComplete = false;
  renderJourney();
  scheduleJourney();
}

function toggleJourneyPause() {
  journeyPaused = !journeyPaused;
  renderJourney();
  if (!journeyPaused) scheduleJourney();
}

function setJourneyMode(mode) {
  if (!["automatic", "manual"].includes(mode) || journeyMode === mode) return;
  if (journeyStepComplete && journeyRunning) stopJourney();
  journeyMode = mode;
  journeyPaused = false;
  renderJourney();
  if (journeyMode === "automatic" && journeyStepComplete) scheduleJourneyAdvance();
  else scheduleJourney();
}

function closeSchoolMenu({ restoreFocus = false } = {}) {
  const wasOpen = !schoolPopover.hidden;
  schoolPopover.hidden = true;
  schoolMenuButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && wasOpen) schoolMenuButton.focus();
}

function toggleSchoolMenu() {
  const willOpen = schoolPopover.hidden;
  schoolPopover.hidden = !willOpen;
  schoolMenuButton.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) notificationCenter.close();
}

function openStudent(id) {
  const allowed = visibleStudents().some((student) => student.id === id);
  if (!allowed) {
    showToast("Este estudante está fora do escopo do perfil selecionado.");
    return;
  }
  if (state.currentRoute !== "estudante") state.studentReturnContext = { ...navigationContext(), studentReturnContext: null };
  showRoute("estudante", { studentId: id });
}

const creationNotice = window.NOTARE_UI.createUndoNotice({
  root: document.querySelector("#creation-notice"),
  notify: showToast,
  undo: operation => {
    if (hasUnsavedForm() || hasUnsavedBusinessForm()) throw new Error("Conclua ou cancele o formulário aberto antes de desfazer a criação anterior.");
    if (localStorage.getItem(STORAGE_KEY) !== JSON.stringify(db)) throw new Error("Os dados mudaram em outra aba. Recarregue a página para preservar o histórico.");
    const previousDatabase = JSON.parse(JSON.stringify(db));
    let annulled;
    try {
      annulled = window.NOTARE_OPERATIONS.annulCreation(db, getProfile(), operation);
      saveDatabase();
    } catch (error) {
      db = previousDatabase;
      throw new Error(`Não foi possível desfazer. ${error.message}`);
    }
    renderAll();
    if (state.currentRoute === "conclusao") showRoute(`registros?estudante=${encodeURIComponent(annulled.studentId)}`);
    document.querySelector("#main-content").focus({ preventScroll: true });
  }
});

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
  sidebarDrawer.close();
  renderProfileIdentity();
  if (typeof profileDialog.showModal === "function") profileDialog.showModal();
  else profileDialog.setAttribute("open", "");
}

function closeProfileDialog() {
  const wasOpen = profileDialog.open;
  if (typeof profileDialog.close === "function" && profileDialog.open) profileDialog.close();
  else profileDialog.removeAttribute("open");
  if (wasOpen) {
    const menu = document.querySelector("#menu-button");
    (menu.getClientRects().length ? menu : document.querySelector("#profile-button")).focus();
  }
}

function openInstitutionPlanDialog() {
  if (!hasPermission("school:view") && !hasPermission("subscription:manage")) return showToast("Consulta institucional reservada à direção.");
  closeSchoolMenu();
  if (typeof planDialog.showModal === "function") planDialog.showModal();
  else planDialog.setAttribute("open", "");
}

function closeInstitutionPlanDialog() {
  if (typeof planDialog.close === "function" && planDialog.open) planDialog.close();
  else planDialog.removeAttribute("open");
}

function switchProfile(profileId, { announce = true } = {}) {
  if (!allProfiles().some((profile) => profile.id === profileId)) return;
  if (!confirmFormExit()) return;
  formBaselines.clear();
  creationNotice.clear();
  state.recordsStudentId = null;
  state.followupClassFilter = "todas";
  state.recordsClassFilter = "todas";
  state.registrationClassFilter = "todas";
  state.studentReturnContext = null;
  resetProfileNotifications();
  document.querySelector("#record-form").reset();
  state.recordKind = "Ausência";
  state.profileId = profileId;
  state.query = "";
  state.filter = "todos";
  const classNames = profileClassNames(getProfile(profileId));
  state.classFilter = classNames[0] || "6º A";
  state.recordClass = classNames[0] || getStudent().className;
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
  if (routePermissions[state.currentRoute] && !hasPermission(routePermissions[state.currentRoute])) showRoute(defaultRoute());
  closeProfileDialog();
  startProfileNotifications();
  if (announce) showToast(`Perfil alterado para ${getProfile().role}.`);
}

document.addEventListener("click", (event) => {
  const dashboardToggle = event.target.closest('[data-dashboard-toggle]');
  if (dashboardToggle) { toggleDashboardPanel(dashboardToggle.dataset.dashboardToggle); return; }
  const dashboardAction = event.target.closest('[data-dashboard-action]');
  if (dashboardAction) { openDashboardIndicator(dashboardAction.dataset.dashboardAction); return; }
  const agendaContext = event.target.closest('[data-agenda-student]');
  if (agendaContext) { openStudent(agendaContext.dataset.agendaStudent); return; }
  const routeControl = event.target.closest("[data-route]");
  if (routeControl) {
    event.preventDefault();
    const navigated = showRoute(routeControl.dataset.route);
    if (navigated && routeControl.hasAttribute("data-cancel")) showToast("Operação cancelada. Nenhuma alteração foi salva.");
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
  if (backControl && returnToContext(state.formReturnContext) && backControl.hasAttribute("data-cancel")) showToast("Operação cancelada. Nenhuma alteração foi salva.");
});

document.querySelector("#entry-dashboard").addEventListener("click", () => {
  switchProfile("direcao", { announce: false });
  showRoute("painel");
});

document.querySelector("#student-back").addEventListener("click", () => returnToContext(state.studentReturnContext, "busca-ativa"));
document.querySelector("#student-history").addEventListener("click", () => {
  state.recordFilter = "todos";
  state.recordsClassFilter = "todas";
  showRoute(`registros?estudante=${encodeURIComponent(state.currentStudent)}`);
});
document.querySelector("#records-back").addEventListener("click", () => showRoute("estudante", { studentId: state.recordsStudentId }));
document.querySelector("#records-clear").addEventListener("click", () => {
  state.recordFilter = "todos";
  state.recordsClassFilter = "todas";
  showRoute("registros");
});
for (const [selector, key, render] of [
  ["#followup-class-filter", "followupClassFilter", renderStudents],
  ["#records-class-filter", "recordsClassFilter", renderRecords],
  ["#registration-class-filter", "registrationClassFilter", renderRegistrations]
]) document.querySelector(selector).addEventListener("change", event => {
  state[key] = event.currentTarget.value;
  if (key === "registrationClassFilter") state.registrationPage = 1;
  render();
});

document.querySelector('#calendar-days').addEventListener('click', event => {
  const day = event.target.closest('[data-calendar-date]');
  if (day) selectCalendarDate(day.dataset.calendarDate);
});
document.querySelector('#calendar-days').addEventListener('keydown', event => {
  const day = event.target.closest('[data-calendar-date]');
  if (!day || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) return;
  event.preventDefault();
  const date = parseDisplayDate(day.dataset.calendarDate);
  const weekday = (date.getDay() + 6) % 7;
  const offset = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-weekday,End:6-weekday,PageUp:-21,PageDown:21}[event.key];
  const next = addDays(date,offset);
  while (next < addDays(startOfCurrentWeek(new Date()), state.calendarWeekOffset * 7)) state.calendarWeekOffset--;
  while (next > addDays(addDays(startOfCurrentWeek(new Date()), state.calendarWeekOffset * 7),20)) state.calendarWeekOffset++;
  selectCalendarDate(dateKey(next));
});
document.querySelector('#calendar-previous').addEventListener('click', () => {state.calendarWeekOffset--;renderMiniCalendar(new Date());});
document.querySelector('#calendar-next').addEventListener('click', () => {state.calendarWeekOffset++;renderMiniCalendar(new Date());});
document.querySelector('#calendar-today').addEventListener('click', () => {state.calendarWeekOffset=0;selectCalendarDate(dateKey(new Date()));});
document.querySelector('#agenda-upcoming').addEventListener('click', () => {state.calendarDate=null;renderDashboard();});

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

document.querySelector("#student-sort").addEventListener("change", (event) => {
  state.studentSort = event.currentTarget.value;
  renderStudents();
});

document.querySelectorAll("[data-registration-tab]").forEach((button) => button.addEventListener("click", () => {
  state.registrationTab = button.dataset.registrationTab;
  state.registrationQuery = "";
  state.registrationPage = 1;
  document.querySelector("#registration-search").value = "";
  renderRegistrations();
}));

document.querySelector("#registration-search").addEventListener("input", (event) => {
  state.registrationQuery = event.currentTarget.value;
  state.registrationPage = 1;
  renderRegistrations();
});

document.querySelector(".registration-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...document.querySelectorAll("[data-registration-tab]")];
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  event.preventDefault();
  const nextIndex = event.key === "Home" ? 0
    : event.key === "End" ? tabs.length - 1
      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex].click();
  tabs[nextIndex].focus();
});

document.querySelector("#registration-previous").addEventListener("click", () => {
  state.registrationPage = Math.max(1, state.registrationPage - 1);
  renderRegistrations();
});

document.querySelector("#registration-next").addEventListener("click", () => {
  state.registrationPage += 1;
  renderRegistrations();
});

function confirmRecordContextChange() {
  const form = document.querySelector("#record-form");
  const description = form.elements.description;
  if (!description.value.trim()) {
    form.elements.template.value = "";
    return true;
  }
  if (!window.confirm("Trocar o estudante ou o tipo de registro limpará a descrição atual. Deseja continuar?")) return false;
  description.value = "";
  document.querySelector("#record-text-status").hidden = true;
  form.elements.template.value = "";
  return true;
}

function confirmRecordTextReplacement() {
  const description = document.querySelector('#record-form textarea[name="description"]');
  if (!description.value.trim()) return true;
  return window.confirm("Substituir a descrição atual pelo novo texto? As alterações feitas nela serão perdidas.");
}

document.querySelector("#record-class").addEventListener("change", (event) => {
  const previousClass = state.recordClass;
  if (!confirmRecordContextChange()) {
    event.currentTarget.value = previousClass;
    return;
  }
  state.recordClass = event.currentTarget.value;
  const firstStudent = visibleStudents().find((student) => student.className === state.recordClass);
  if (firstStudent) state.currentStudent = firstStudent.id;
  renderStudentSelect();
});

document.querySelector("#record-student").addEventListener("change", (event) => {
  const previousStudent = state.currentStudent;
  if (!confirmRecordContextChange()) {
    event.currentTarget.value = previousStudent;
    return;
  }
  state.currentStudent = event.currentTarget.value;
});

document.querySelectorAll('#record-form input[name="kind"]').forEach((input) => input.addEventListener("change", (event) => {
  if (!confirmRecordContextChange()) {
    document.querySelector(`#record-form input[name="kind"][value="${state.recordKind}"]`).checked = true;
    return;
  }
  state.recordKind = event.currentTarget.value;
  renderRecordTemplates();
}));

document.querySelector("#record-template").addEventListener("change", (event) => {
  if (!event.currentTarget.value) return;
  if (!confirmRecordTextReplacement()) {
    event.currentTarget.value = "";
    document.querySelector('#record-form textarea[name="description"]').focus();
    return;
  }
  const form = document.querySelector("#record-form");
  const student = getStudent(form.elements.student.value);
  const template = (recordTextTemplates[selectedRecordKind(form)] || []).find((item) => item.id === event.currentTarget.value);
  if (!template) return;
  insertRecordText(template.text(student), "Texto pré-elaborado inserido. Você pode editar a descrição antes de salvar.");
});

document.querySelector("#record-suggestion").addEventListener("click", () => {
  if (!confirmRecordTextReplacement()) return;
  const form = document.querySelector("#record-form");
  const student = getStudent(form.elements.student.value);
  const kind = new FormData(form).get("kind");
  const suggestions = {
    "Ausência": `${student.name} não esteve presente na data informada. O registro foi incluído para acompanhamento da frequência, sem informações adicionais sobre o motivo.`,
    "Contato": `Foi realizado contato com o responsável de ${student.name}. A equipe aguarda confirmação ou devolutiva para definir o próximo passo.`,
    "Ocorrência": `Foi observado um fato relacionado à rotina escolar de ${student.name}. O registro descreve apenas o que foi verificado e será revisado pela equipe responsável.`,
    "Devolutiva": `Foi registrada uma devolutiva sobre o acompanhamento de ${student.name}. A equipe irá verificar o retorno e combinar a continuidade necessária.`
  };
  insertRecordText(suggestions[kind] || suggestions["Ausência"], "Sugestão inserida. Revise e edite o texto antes de salvar.");
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
  if (data.get("family") === "on" && !window.confirm("Salvar o plano e incluir um comunicado no acesso da família neste navegador? Revise as informações antes de confirmar.")) return showToast("Salvamento cancelado. Você pode revisar o plano.");
  const databaseBeforeSave = JSON.parse(JSON.stringify(db));
  const previousPlanId = state.lastPlanId;
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
    created: todayLabel(),
    createdTime: currentTimeLabel()
  };
  const undoOperation = window.NOTARE_OPERATIONS.offer("plan", plan, state.profileId);
  db.plans.unshift(plan);
  if (plan.family && db.business.families.some((family) => family.students.includes(student.id))) {
    const message = window.NOTARE_BUSINESS.sendMessage(db, getProfile(), student.id, `A escola organizou um acompanhamento: ${plan.type}. Prazo para retorno: ${formatDate(plan.date)}. Entre em contato para combinar os próximos passos.`);
    message.sourcePlanId = plan.id;
  }
  state.lastPlanId = plan.id;
  db.agenda.unshift({
    id: `agenda-${plan.id}`,
    date: plan.date,
    title: `Revisar plano: ${plan.type}`,
    studentId: student.id,
    ownerId: owner.id,
    sourcePlanId: plan.id
  });
  try { saveDatabase(); } catch (error) {
    db = databaseBeforeSave;
    state.lastPlanId = previousPlanId;
    return showToast("Não foi possível salvar neste navegador. O formulário foi preservado; revise o armazenamento e tente novamente.");
  }
  formBaselines.delete(event.currentTarget.id);
  renderPlanSuccess();
  event.currentTarget.reset();
  renderAll();
  showRoute("conclusao");
  creationNotice.show("Plano de ação salvo com sucesso.", undoOperation);
});

document.querySelector("#record-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("records:create")) return showToast("Este perfil não pode criar registros.");
  const data = new FormData(event.currentTarget);
  if (data.get("kind") === "Ocorrência" && !hasPermission("occurrences:create")) return showToast("Este perfil não pode criar registros de ocorrência.");
  const description = String(data.get("description") || "").trim();
  if (!description) {
    event.currentTarget.elements.description.focus();
    return showToast("Preencha ou revise a descrição antes de salvar.");
  }
  const student = getStudent(data.get("student"));
  db.records.unshift({
    id: `rec-${Date.now()}`,
    kind: data.get("kind"),
    studentId: student.id,
    description,
    date: formatDate(data.get("date")),
    time: currentTimeLabel(),
    ownerId: state.profileId,
    followup: data.get("followup") === "on"
  });
  const undoOperation = window.NOTARE_OPERATIONS.offer("record", db.records[0], state.profileId);
  try { saveDatabase(); } catch (error) {
    db.records.shift();
    return showToast("Não foi possível salvar neste navegador. A descrição foi preservada; revise o armazenamento e tente novamente.");
  }
  formBaselines.delete(event.currentTarget.id);
  event.currentTarget.reset();
  state.recordKind = "Ausência";
  renderRecordTemplates();
  renderAll();
  state.recordFilter = "todos";
  state.recordsClassFilter = "todas";
  const contextual = ["estudante", "plano"].includes(state.formReturnContext?.route) || state.formReturnContext?.recordsStudentId;
  showRoute(contextual ? `registros?estudante=${encodeURIComponent(student.id)}` : "registros");
  creationNotice.show("Registro salvo com sucesso.", undoOperation);
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
schoolMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSchoolMenu();
});
document.querySelector("#school-plan").addEventListener("click", openInstitutionPlanDialog);
document.querySelector("#school-logout").addEventListener("click", () => {
  closeSchoolMenu();
  closeProfileDialog();
  resetProfileNotifications();
  journeyStep = 0;
  if (!showRoute("entrada")) return;
  announcement.textContent = "Sessão local encerrada. Retorno ao acesso institucional.";
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#school-menu")) closeSchoolMenu();
});
document.querySelector("#journey-skip").addEventListener("click", finishJourney);
document.querySelector("#journey-pause").addEventListener("click", toggleJourneyPause);
document.querySelector("#journey-next").addEventListener("click", () => {
  advanceJourney();
});
document.querySelector("#journey-back").addEventListener("click", () => {
  if (journeyStep === 0) return;
  stopJourney();
  journeyStep -= 1;
  journeyStepComplete = false;
  renderJourney();
  scheduleJourney();
});
document.querySelectorAll("[data-journey-mode]").forEach((button) => button.addEventListener("click", () => setJourneyMode(button.dataset.journeyMode)));
document.querySelector("#profile-button").addEventListener("click", openProfileDialog);
document.querySelector("#profile-close").addEventListener("click", closeProfileDialog);
document.querySelector("#profile-done").addEventListener("click", closeProfileDialog);
document.querySelector("#institution-plan-close").addEventListener("click", closeInstitutionPlanDialog);
document.querySelector("#institution-plan-done").addEventListener("click", closeInstitutionPlanDialog);
document.querySelector("#reset-demo").addEventListener("click", () => {
  if (!window.confirm("Restaurar a base inicial e apagar os registros adicionados neste navegador?")) return showToast("Restauração cancelada. Os dados foram mantidos.");
  if (!confirmFormExit()) return;
  const databaseBeforeReset = db;
  db = cloneSeed();
  try { saveDatabase(); } catch (error) {
    db = databaseBeforeReset;
    return showToast("Não foi possível restaurar a base. Os dados atuais foram mantidos.");
  }
  formBaselines.clear();
  creationNotice.clear();
  resetProfileNotifications();
  state.profileId = "direcao";
  state.currentStudent = "ana";
  localStorage.setItem(PROFILE_KEY, state.profileId);
  renderAll();
  closeProfileDialog();
  showRoute("painel");
  showToast("Base inicial restaurada.");
});
profileDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeProfileDialog(); });
profileDialog.addEventListener("click", (event) => { if (event.target === profileDialog) closeProfileDialog(); });
planDialog.addEventListener("click", (event) => { if (event.target === planDialog) closeInstitutionPlanDialog(); });
document.addEventListener("keydown", (event) => {
  if (sidebarDrawer.trapFocus(event)) return;
  if (event.key !== "Escape") return;
  sidebarDrawer.close({ restoreFocus: true });
  notificationCenter.close({ restoreFocus: true });
  closeSchoolMenu({ restoreFocus: true });
});
window.addEventListener("popstate", event => showRoute(location.hash.slice(1) || "entrada", { skipHistory: true, context: event.state }));
window.addEventListener("resize", alignEntryBrand);
motionPreference.addEventListener?.("change", event => { journeyReducedMotion = event.matches; if (state.currentRoute === "jornada") startJourney({ reset: false }); });
window.addEventListener("beforeunload", event => {
  if (!hasUnsavedForm()) return;
  event.preventDefault();
  event.returnValue = "";
});

const businessUI = window.NOTARE_BUSINESS_UI.create({
  database: () => db, actor: () => getProfile(), save: saveDatabase,
  refresh: renderAll, navigate: showRoute, notify: showToast, escape: escapeHtml
});
document.querySelector("#manage-subscription").addEventListener("click", () => { closeInstitutionPlanDialog(); showRoute("assinatura"); });

if (!allProfiles().some((profile) => profile.id === state.profileId)) state.profileId = "direcao";
renderAll();
applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "true");
const initialRoute = location.hash.slice(1) || "entrada";
const initialContext = history.state?.route === initialRoute.split("?")[0] ? history.state : null;
showRoute(initialRoute, { skipHistory: true, context: initialContext });
history.replaceState(navigationContext(), "", routeHash());
notificationCenter.render();
window.setInterval(renderTemporalContext, 60000);
