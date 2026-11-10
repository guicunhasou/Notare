(() => {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function assetSlug(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Código apenas de apresentação: relações continuam usando student.id.
  function studentDisplayCode(student, students) {
    const match = /^(\d+)\s*[º°]?\s*([A-Z])$/i.exec(student?.className || '');
    if (!match) return student?.code || '';
    const members = students.filter(item => item.className === student.className).slice().sort((a,b) => a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}) || String(a.id).localeCompare(String(b.id)));
    const position = members.findIndex(item => item.id === student.id) + 1;
    return position > 0 ? `${match[1]}${match[2].toUpperCase()}${String(position).padStart(2,'0')}` : student.code || '';
  }
  function frequencyChangeDescription(change) {
    const value = Math.abs(change), unit = value === 1 ? 'ponto percentual' : 'pontos percentuais';
    return change < 0 ? `queda de ${value} ${unit}` : change > 0 ? `aumento de ${value} ${unit}` : 'sem variação';
  }

  // actionsCompleted é o saldo histórico da base, não um contador de db.plans.
  // Cada plano concluído acrescenta uma ação; agenda e devolutiva vinculadas
  // representam a mesma conclusão e não são contadas novamente. Cálculo sem escrita,
  // inclusive para conclusões salvas antes desta regra e planos posteriormente anulados.
  function completionSummary(students, plans) {
    const totals = new Map(students.map(student => [student.id,
      Number.isSafeInteger(student.actionsCompleted) && student.actionsCompleted >= 0 ? student.actionsCompleted : 0
    ]));
    const counted = new Set();
    for (const plan of plans) {
      if (!plan.id || counted.has(plan.id) || plan.voidedAt || plan.status !== "done" || !totals.has(plan.studentId)) continue;
      counted.add(plan.id);
      totals.set(plan.studentId, totals.get(plan.studentId) + 1);
    }
    const values = [...totals.values()];
    return {
      completed: values.reduce((total, count) => total + count, 0),
      casesWithReturn: values.filter(count => count > 0).length
    };
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function startOfCurrentWeek(date) {
    const day = date.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = addDays(date, distanceToMonday);
    monday.setHours(12, 0, 0, 0);
    return monday;
  }

  function startOfAgenda(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    if (start.getDay() === 6) return addDays(start, 2);
    if (start.getDay() === 0) return addDays(start, 1);
    return start;
  }

  function addBusinessDays(date, amount) {
    let next = new Date(date);
    let remaining = Math.max(0, Number(amount) || 0);
    while (remaining > 0) {
      next = addDays(next, 1);
      if (next.getDay() !== 0 && next.getDay() !== 6) remaining -= 1;
    }
    return next;
  }

  function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
  }

  function nextBusinessDay(date) {
    let next = new Date(date);
    while (isWeekend(next)) next = addDays(next, 1);
    return next;
  }

  function greetingFor(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  function formatDate(value) {
    if (!value) return "—";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function todayLabel() {
    return new Intl.DateTimeFormat("pt-BR").format(new Date());
  }

  function parseDisplayDate(value, fallbackYear = new Date().getFullYear()) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(`${value}T12:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const match = String(value).match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
    if (!match) return null;
    const year = Number(match[3] || fallbackYear);
    const month = Number(match[2]) - 1;
    const day = Number(match[1]);
    const date = new Date(year, month, day, 12);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  }

  function relativeDateLabel(date, now = new Date()) {
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const difference = Math.round((current - target) / 86400000);
    if (difference === 0) return "hoje";
    if (difference === 1) return "ontem";
    if (difference === -1) return "amanhã";
    if (difference > 1) return `há ${difference} dias`;
    return `em ${Math.abs(difference)} dias`;
  }

  function capitalize(value) {
    return value ? value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1) : value;
  }

  function planEffectiveStatus(plan, now = new Date()) {
    if (plan.voidedAt) return "cancelled";
    if (plan.status === "done") return "done";
    const deadline = parseDisplayDate(plan.date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    if (deadline && deadline < today) return "overdue";
    return plan.status;
  }

  function reconcileStudentMedia(database, seed) {
    if (!database || !Array.isArray(database.students) || !Array.isArray(seed?.students)) return database;
    const seedStudents = new Map(seed.students.map((student) => [student.id, student]));
    database.students = database.students.map((student) => {
      const seedStudent = seedStudents.get(student.id);
      if (!seedStudent) return student;
      const nextStudent = { ...student };
      for (const field of ["photo", "photoSheet", "photoIndex"]) {
        if (seedStudent[field] === undefined) delete nextStudent[field];
        else nextStudent[field] = seedStudent[field];
      }
      return nextStudent;
    });
    return database;
  }

  function reconcileProfileConfiguration(database, seed) {
    if (!database || !Array.isArray(database.profiles) || !Array.isArray(seed?.profiles)) return database;
    const seedProfiles = new Map(seed.profiles.map((profile) => [profile.id, profile]));
    database.profiles = database.profiles.map((profile) => {
      const seedProfile = seedProfiles.get(profile.id);
      if (!seedProfile) return profile;
      return {
        ...profile,
        role: seedProfile.role,
        description: seedProfile.description,
        scope: seedProfile.scope,
        permissions: [...seedProfile.permissions]
      };
    });
    return database;
  }

  function createdPlanForScope(plans, createdId, studentIds) {
    if (!createdId) return null;
    return plans.find(plan => plan.id === createdId && !plan.voidedAt && plan.status !== "done" && studentIds.includes(plan.studentId)) || null;
  }

  window.NOTARE_CORE = Object.freeze({
    createdPlanForScope,
    completionSummary,
    studentDisplayCode,
    frequencyChangeDescription,
    addBusinessDays,
    addDays,
    assetSlug,
    capitalize,
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
  });
})();
