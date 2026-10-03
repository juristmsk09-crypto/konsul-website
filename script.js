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

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
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
  const telegram = normalizeHandle(config.telegram);
  const max = normalizeHandle(config.max);
  const whatsapp = digitsOnly(config.whatsapp || config.phoneTel);

  if (channel === "whatsapp") {
    if (!whatsapp) return "";
    return `https://wa.me/${whatsapp}?text=${encoded}`;
  }

  if (channel === "telegram") {
    if (/^https?:\/\//i.test(telegram)) {
      return telegram;
    }
    if (telegram) {
      return `https://t.me/${telegram}`;
    }
    return `https://t.me/share/url?url=${encodeURIComponent("https://consulmsk.ru")}&text=${encoded}`;
  }

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
  const telegram = normalizeHandle(config.telegram);
  const max = normalizeHandle(config.max);
  if (channel === "telegram") return Boolean(telegram);
  if (channel === "max") return Boolean(max);
  if (channel === "whatsapp") return Boolean(digitsOnly(config.whatsapp || config.phoneTel));
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
  const tg = normalizeHandle(config.telegram);
  const wa = digitsOnly(config.whatsapp || config.phoneTel || "79777093393");
  const max = normalizeHandle(config.max);
  const shareText = encodeURIComponent("Здравствуйте! Пишу с сайта КОНСУЛ.");

  const telegramHref = /^https?:\/\//i.test(tg)
    ? tg
    : tg
      ? `https://t.me/${tg}`
      : `https://t.me/share/url?url=${encodeURIComponent("https://consulmsk.ru")}&text=${shareText}`;

  const maxHref = /^https?:\/\//i.test(max)
    ? max
    : max
      ? `https://max.ru/${max}`
      : `https://max.ru/:share?text=${shareText}`;

  const items = [
    { channel: "telegram", href: telegramHref, label: "Telegram" },
    { channel: "whatsapp", href: `https://wa.me/${wa}`, label: "WhatsApp" },
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

      if (channel === "whatsapp") {
        setFormStatus("Открыт WhatsApp с текстом заявки. Нажмите «Отправить» в чате.", "is-success");
      } else if (directChat(channel) && copied) {
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
