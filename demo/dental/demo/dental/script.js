/* ==========================================================
   SMILE CARE DENTAL — script.js
   OnlineLand Digital Services
   ========================================================== */

/* ============ CONFIG — change ONLY this per client ============ */
const CONFIG = {
  clinicName: "Smile Care Dental Clinic",
  phone: "919999999999",          // with country code, no +
  phoneDisplay: "+91 99999 99999",
  email: "care@smilecare.in",
  address: "2nd Floor, Sai Complex, Miyapur X Roads, Hyderabad — 500049",
};
/* ============================================================= */

// ---------- Apply CONFIG everywhere ----------
const waLink = (msg) =>
  "https://wa.me/" + CONFIG.phone + "?text=" + encodeURIComponent(msg);

document.querySelectorAll(".js-wa").forEach((el) => {
  el.href = waLink("Hi " + CONFIG.clinicName + " 👋, I would like to book an appointment.");
});
document.querySelectorAll(".js-call").forEach((el) => {
  el.href = "tel:+" + CONFIG.phone;
});
document.querySelectorAll(".js-phone-text").forEach((el) => {
  el.textContent = CONFIG.phoneDisplay;
});
document.querySelectorAll(".js-email-link").forEach((el) => {
  el.href = "mailto:" + CONFIG.email;
});
document.querySelectorAll(".js-email-text").forEach((el) => {
  el.textContent = CONFIG.email;
});
document.querySelectorAll(".js-address").forEach((el) => {
  el.textContent = CONFIG.address;
});
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Mobile menu ----------
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
});

nav.querySelectorAll(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ---------- Sticky header ----------
const header = document.getElementById("header");
const toTop = document.getElementById("toTop");

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    header.classList.toggle("stuck", y > 30);
    toTop.classList.toggle("show", y > 500);
  },
  { passive: true }
);

// ---------- Back to top ----------
toTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// ---------- Scroll reveal animations ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- Active nav highlighting ----------
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id)
        );
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => navObserver.observe(s));

// ---------- Appointment form validation ----------
const form = document.getElementById("apptForm");

const setError = (input, message) => {
  const field = input.closest(".field");
  field.classList.toggle("invalid", Boolean(message));
  field.querySelector(".err").textContent = message || "";
};

const validators = {
  fName: (v) => (v.trim().length >= 3 ? "" : "Please enter your full name."),
  fPhone: (v) =>
    /^[6-9]\d{9}$/.test(v.trim()) ? "" : "Enter a valid 10-digit mobile number.",
  fTreat: (v) => (v ? "" : "Please select a treatment."),
  fDate: (v) => {
    if (!v) return "Please pick a preferred date.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(v) >= today ? "" : "Date cannot be in the past.";
  },
};

// live validation on blur
Object.keys(validators).forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("blur", () => setError(input, validators[id](input.value)));
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  let firstInvalid = null;
  Object.keys(validators).forEach((id) => {
    const input = document.getElementById(id);
    const msg = validators[id](input.value);
    setError(input, msg);
    if (msg && !firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // Build WhatsApp message with form details
  const name = document.getElementById("fName").value.trim();
  const phone = document.getElementById("fPhone").value.trim();
  const treatment = document.getElementById("fTreat").value;
  const date = document.getElementById("fDate").value;
  const message = document.getElementById("fMsg").value.trim();

  const text =
    "🦷 *New Appointment Request*\n" +
    "Name: " + name + "\n" +
    "Mobile: " + phone + "\n" +
    "Treatment: " + treatment + "\n" +
    "Preferred date: " + date +
    (message ? "\nMessage: " + message : "");

  window.open(waLink(text), "_blank");
  form.reset();
});
      
