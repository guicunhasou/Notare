(() => {
  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function createModalDrawer({ drawer, scrim, trigger, closeButton, background }) {
    function focusableElements() {
      return [...drawer.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => (
        !element.hidden
        && element.getAttribute("aria-hidden") !== "true"
        && element.getClientRects().length > 0
      ));
    }

    function open() {
      drawer.classList.add("open");
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      scrim.hidden = false;
      background.inert = true;
      trigger.setAttribute("aria-expanded", "true");
      closeButton.focus();
    }

    function close({ restoreFocus = false } = {}) {
      const wasOpen = drawer.classList.contains("open");
      drawer.classList.remove("open");
      drawer.removeAttribute("role");
      drawer.removeAttribute("aria-modal");
      scrim.hidden = true;
      background.inert = false;
      trigger.setAttribute("aria-expanded", "false");
      if (restoreFocus && wasOpen) trigger.focus();
    }

    function trapFocus(event) {
      if (event.key !== "Tab" || !drawer.classList.contains("open")) return false;
      const elements = focusableElements();
      if (!elements.length) {
        event.preventDefault();
        drawer.focus();
        return true;
      }
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return true;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
        return true;
      }
      if (!drawer.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return true;
      }
      return false;
    }

    return Object.freeze({ close, open, trapFocus });
  }

  function createNotificationCenter({ announcement, escapeHtml }) {
    const center = document.querySelector("#notification-center");
    const popover = document.querySelector("#notification-popover");
    const button = document.querySelector("#notification-button");
    const badge = document.querySelector("#notification-badge");
    const banner = document.querySelector("#notification-banner");
    const list = document.querySelector("#notification-list");
    const closeButton = document.querySelector("#notification-close");
    const notifications = [];
    let scheduledTimers = [];

    function render() {
      const unread = notifications.filter((notification) => !notification.read).length;
      badge.textContent = String(unread);
      badge.hidden = unread === 0;
      button.setAttribute("aria-label", unread ? `Notificações, ${unread} ${unread === 1 ? "nova" : "novas"}` : "Notificações");

      if (!notifications.length) {
        list.innerHTML = `<div class="notification-empty-state"><span class="notification-item-icon" aria-hidden="true"><svg><use href="#i-bell"></use></svg></span><strong>Tudo em dia</strong><p>Nenhuma notificação nova.</p></div>`;
        return;
      }

      list.innerHTML = notifications.slice().reverse().map((notification) => {
        const stateLabel = notification.resolved ? "Resolvida" : notification.read ? "Lida" : "Nova";
        const id = escapeHtml(notification.id);
        const actions = [
          !notification.read ? `<button type="button" data-notification-action="read" data-notification-id="${id}">Marcar como lida</button>` : "",
          !notification.resolved ? `<button type="button" data-notification-action="resolve" data-notification-id="${id}">Resolver</button>` : ""
        ].join("");
        return `<article class="notification-item ${notification.read ? "" : "unread"} ${notification.resolved ? "resolved" : ""}">
          <span class="notification-item-icon" aria-hidden="true"><svg><use href="#i-bell"></use></svg></span>
          <div class="notification-item-body"><div class="notification-item-heading"><strong>${escapeHtml(notification.title)}</strong><span class="notification-state">${stateLabel}</span></div><p>${escapeHtml(notification.message)}</p>${actions ? `<div class="notification-item-actions">${actions}</div>` : ""}</div>
        </article>`;
      }).join("");
    }

    function open() {
      render();
      popover.hidden = false;
      button.setAttribute("aria-expanded", "true");
      closeButton.focus();
    }

    function close({ restoreFocus = false } = {}) {
      const wasOpen = !popover.hidden;
      popover.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus && wasOpen) button.focus();
    }

    function toggle() {
      if (popover.hidden) open();
      else close();
    }

    function dismissBanner() {
      banner.hidden = true;
      delete banner.dataset.notificationId;
    }

    function showBanner(notification) {
      banner.dataset.notificationId = notification.id;
      document.querySelector("#notification-banner-title").textContent = notification.title;
      document.querySelector("#notification-banner-message").textContent = notification.message;
      banner.hidden = false;
    }

    function create(template) {
      if (notifications.some((notification) => notification.id === template.id)) return;
      const notification = { ...template, read: false, resolved: false };
      notifications.push(notification);
      render();
      showBanner(notification);
      announcement.textContent = `Nova notificação: ${notification.title}.`;
    }

    function update(notificationId, action) {
      const notification = notifications.find((item) => item.id === notificationId);
      if (!notification) return;
      notification.read = true;
      if (action === "resolve") notification.resolved = true;
      if (banner.dataset.notificationId === notificationId) dismissBanner();
      render();
      announcement.textContent = action === "resolve" ? "Notificação resolvida." : "Notificação marcada como lida.";
    }

    function handleAction(event) {
      const actionButton = event.target.closest("[data-notification-action]");
      if (!actionButton) return;
      update(actionButton.dataset.notificationId, actionButton.dataset.notificationAction);
    }

    function closeWhenOutside(event) {
      const path = event.composedPath();
      if (!path.includes(center) && !path.includes(banner) && !popover.hidden) close();
    }

    function clearSchedule() {
      scheduledTimers.forEach((timer) => window.clearTimeout(timer));
      scheduledTimers = [];
    }

    function reset() {
      clearSchedule();
      notifications.splice(0, notifications.length);
      dismissBanner();
      close();
      render();
    }

    function schedule(templates, delays) {
      clearSchedule();
      templates.forEach((template, index) => {
        const delay = delays[index] ?? delays.at(-1) ?? 0;
        scheduledTimers.push(window.setTimeout(() => create(template), delay));
      });
    }

    return Object.freeze({
      close,
      closeWhenOutside,
      dismissBanner,
      handleAction,
      open,
      render,
      reset,
      schedule,
      toggle
    });
  }

  window.NOTARE_UI = Object.freeze({ createModalDrawer, createNotificationCenter });
})();
