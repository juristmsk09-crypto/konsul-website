const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const yearNodes = document.querySelectorAll("[data-year]");
const config = window.KONSUL_CONFIG || {};

yearNodes.forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const phoneNodes = document.querySelectorAll("[data-phone]");
phoneNodes.forEach((node) => {
  if (config.phoneDisplay && config.phoneTel) {
    const link = document.createElement("a");
    link.href = `tel:${config.phoneTel}`;
    link.textContent = config.phoneDisplay;
    node.replaceChildren(link);
    node.closest("[data-phone-row]")?.removeAttribute("hidden");
  } else {
    node.closest("[data-phone-row]")?.setAttribute("hidden", "");
  }
});

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if (menuToggle && nav) {
  const setMenuOpen = (open) => {
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  });
}

const revealItems = document.querySelectorAll(".service-list li, .case-study");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${(index % 4) * 70}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function normalizeHandle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.replace(/^@/, "");
}

function buildRequestText(fields) {
  return [
    "Заявка с сайта КОНСУЛ",
    "",
    `Имя: ${fields.name || "—"}`,
    `Телефон: ${fields.phone || "—"}`,
    "",
    "Суть вопроса:",
    fields.message || "—"
  ].join("\n");
}

function messengerUrl(channel, text) {
  const encoded = encodeURIComponent(text);
  const max = normalizeHandle(config.max);

  if (channel === "max") {
    if (/^https?:\/\//i.test(max)) {
      return max;
    }
    if (max) {
      return `https://max.ru/${max}`;
    }
    return `https://max.ru/:share?text=${encoded}`;
  }

  return "";
}

function directChat(channel) {
  const max = normalizeHandle(config.max);
  if (channel === "max") return Boolean(max);
  return false;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const form = document.querySelector(".contact-form");
const formStatus = document.querySelector("[data-form-status]");
const messengerLinks = document.querySelector("[data-messenger-links]");

function setFormStatus(message, type) {
  if (!formStatus) return;
  formStatus.hidden = false;
  formStatus.textContent = message;
  formStatus.className = type ? `form-status ${type}` : "form-status";
}

if (messengerLinks) {
  const max = normalizeHandle(config.max);
  const shareText = encodeURIComponent("Здравствуйте! Пишу с сайта КОНСУЛ.");

  const maxHref = /^https?:\/\//i.test(max)
    ? max
    : max
      ? `https://max.ru/${max}`
      : `https://max.ru/:share?text=${shareText}`;

  const items = [
    { channel: "max", href: maxHref, label: "MAX" }
  ];

  messengerLinks.innerHTML = items
    .map(
      (item) =>
        `<a href="${item.href}" data-channel="${item.channel}" target="_blank" rel="noopener noreferrer">${item.label}</a>`
    )
    .join("");
}

if (form) {
  const messengerButtons = form.querySelectorAll("[data-messenger]");

  messengerButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!form.reportValidity()) {
        setFormStatus("Заполните обязательные поля и согласие на обработку данных.", "is-error");
        return;
      }

      const fields = Object.fromEntries(new FormData(form).entries());
      const text = buildRequestText(fields);
      const channel = button.getAttribute("data-messenger");
      const url = messengerUrl(channel, text);

      if (!url) {
        setFormStatus("Мессенджер не настроен. Укажите контакт в config.js.", "is-error");
        return;
      }

      const copied = await copyText(text);
      window.open(url, "_blank", "noopener,noreferrer");

      if (directChat(channel) && copied) {
        setFormStatus(
          "Чат открыт, текст заявки скопирован — вставьте его в сообщение (Ctrl+V) и отправьте.",
          "is-success"
        );
      } else if (copied) {
        setFormStatus(
          "Откроется мессенджер с текстом заявки. Выберите чат КОНСУЛ и отправьте сообщение.",
          "is-success"
        );
      } else {
        setFormStatus("Мессенджер открыт. Отправьте заявку в чат КОНСУЛ.", "is-success");
      }
    });
  });
}

/* Callback request */
let callbackModal = null;
let callbackLastFocus = null;
let callbackRequestText = "";

function callbackPrivacyHref() {
  return /\/services\//.test(window.location.pathname) ? "../privacy.html" : "privacy.html";
}

function buildCallbackModal() {
  const wrap = document.createElement("div");
  wrap.className = "callback-modal";
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="callback-backdrop" data-callback-close></div>
    <div class="callback-dialog" role="dialog" aria-modal="true" aria-labelledby="callback-title">
      <button class="callback-close" type="button" aria-label="Закрыть окно" data-callback-close>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg>
      </button>
      <p class="eyebrow">Обратный звонок</p>
      <h2 id="callback-title">Перезвоните мне</h2>
      <p class="callback-lead">Оставьте имя и телефон — перезвоним в рабочее время и уточним задачу.</p>
      <form class="callback-form" novalidate>
        <label>
          Имя
          <input type="text" name="name" required autocomplete="name" placeholder="Как к вам обращаться" />
        </label>
        <label>
          Телефон
          <input type="tel" name="phone" required autocomplete="tel" placeholder="+7 (___) ___-__-__" />
        </label>
        <label class="consent">
          <input type="checkbox" name="consent" value="yes" required />
          <span>Согласен(на) на обработку персональных данных согласно <a href="${callbackPrivacyHref()}">политике</a></span>
        </label>
        <div class="callback-actions">
          <button class="btn btn-gold" type="submit">Отправить</button>
          <button class="btn callback-cancel" type="button" data-callback-close>Отмена</button>
        </div>
        <p class="callback-status" data-callback-status role="status" hidden></p>
      </form>
    </div>`;
  document.body.appendChild(wrap);
  return wrap;
}

function openCallback() {
  if (!callbackModal) callbackModal = buildCallbackModal();
  callbackLastFocus = document.activeElement;
  callbackModal.hidden = false;
  document.body.classList.add("callback-open");
  const firstField = callbackModal.querySelector('input[name="name"]');
  if (firstField) {
    window.setTimeout(() => firstField.focus(), 40);
  }
}

function closeCallback() {
  if (!callbackModal) return;
  callbackModal.hidden = true;
  document.body.classList.remove("callback-open");
  const status = callbackModal.querySelector("[data-callback-status]");
  if (status) {
    status.hidden = true;
    status.className = "callback-status";
    status.textContent = "";
  }
  if (callbackLastFocus && typeof callbackLastFocus.focus === "function") {
    callbackLastFocus.focus();
  }
  callbackLastFocus = null;
}

function showCallbackStatus() {
  if (!callbackModal) return;
  const status = callbackModal.querySelector("[data-callback-status]");
  if (!status) return;
  const email = config.email || "juristmsk09@gmail.com";
  status.hidden = false;
  status.className = "callback-status is-success";
  status.textContent = `Открываем почтовое приложение. Если оно не открылось — напишите на ${email}, а текст заявки можно `;
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "callback-copy";
  copyButton.textContent = "скопировать";
  copyButton.addEventListener("click", async () => {
    const copied = await copyText(callbackRequestText);
    copyButton.textContent = copied ? "скопировано" : "не удалось";
  });
  status.appendChild(copyButton);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".js-callback");
  if (trigger) {
    event.preventDefault();
    openCallback();
    return;
  }
  if (event.target.closest("[data-callback-close]")) {
    event.preventDefault();
    closeCallback();
  }
});

document.addEventListener("keydown", (event) => {
  if (!callbackModal || callbackModal.hidden) return;
  if (event.key === "Escape") {
    closeCallback();
    return;
  }
  if (event.key === "Tab") {
    const focusables = Array.from(
      callbackModal.querySelectorAll("button, input, a[href]")
    ).filter((node) => !node.disabled && node.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.addEventListener("submit", (event) => {
  const callbackForm = event.target;
  if (!callbackForm.classList || !callbackForm.classList.contains("callback-form")) return;
  event.preventDefault();

  if (!callbackForm.checkValidity()) {
    callbackForm.reportValidity();
    return;
  }

  const fields = new FormData(callbackForm);
  const name = String(fields.get("name") || "").trim();
  const phone = String(fields.get("phone") || "").trim();

  callbackRequestText = [
    "Заявка с сайта КОНСУЛ",
    "Обратный звонок",
    "",
    `Имя: ${name || "—"}`,
    `Телефон: ${phone || "—"}`,
    "",
    `Страница: ${window.location.href}`
  ].join("\r\n");

  const subject = "Перезвоните мне — заявка с сайта КОНСУЛ";
  const mailto = `mailto:${config.email || "juristmsk09@gmail.com"}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(callbackRequestText)}`;

  window.location.href = mailto;
  showCallbackStatus();
});

function addFloatingCallback() {
  if (document.querySelector(".callback-fab")) return;
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "callback-fab js-callback";
  fab.setAttribute("aria-label", "Перезвоните мне");
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V19c0 .6-.4 1-1 1C10.6 20 4 13.4 4 5c0-.6.4-1 1-1h2.9c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1z"/></svg>
    <span>Перезвоните мне</span>`;
  document.body.appendChild(fab);
}

addFloatingCallback();

const contactSection = document.querySelector("#contact");
if (contactSection && "IntersectionObserver" in window) {
  const fabObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        document.body.classList.toggle("callback-fab-hidden", entry.isIntersecting);
      });
    },
    { threshold: 0.12 }
  );
  fabObserver.observe(contactSection);
}
