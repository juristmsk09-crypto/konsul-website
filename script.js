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
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
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

const form = document.querySelector(".contact-form");
const formStatus = document.querySelector("[data-form-status]");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const email = config.email || "juristmsk09@gmail.com";
    const data = new FormData(form);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";
    }
    if (formStatus) {
      formStatus.hidden = false;
      formStatus.textContent = "Отправляем заявку…";
      formStatus.className = "form-status";
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      });

      if (!response.ok) {
        throw new Error("send_failed");
      }

      form.reset();
      if (formStatus) {
        formStatus.textContent = "Заявка отправлена. Мы свяжемся с вами.";
        formStatus.className = "form-status is-success";
      }
      window.location.hash = "contact";
    } catch (error) {
      if (formStatus) {
        formStatus.textContent =
          "Не удалось отправить через сервис. Напишите напрямую на " + email;
        formStatus.className = "form-status is-error";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Отправить запрос";
      }
    }
  });
}
