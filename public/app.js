const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

navLinks?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

const contactForm = document.querySelector("#contactForm");
const contactStatus = document.querySelector("#contactMessageStatus");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  contactStatus.textContent = "Enviando consulta...";
  contactStatus.classList.remove("error");

  const formData = Object.fromEntries(new FormData(contactForm).entries());
  try {
    const response = await fetch("/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo enviar la consulta.");
    contactStatus.textContent = result.message;
    contactForm.reset();
  } catch (error) {
    contactStatus.textContent = error.message || "No se pudo conectar con el servidor.";
    contactStatus.classList.add("error");
  }
});

const paymentForm = document.querySelector("#paymentForm");
const paymentStatus = document.querySelector("#paymentMessage");

paymentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  paymentStatus.textContent = "Conectando con la plataforma de pago...";
  paymentStatus.classList.remove("error");

  const formData = Object.fromEntries(new FormData(paymentForm).entries());
  try {
    const response = await fetch("/api/pagos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo iniciar el pago.");
    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
  } catch (error) {
    paymentStatus.textContent = error.message || "No se pudo conectar con el servidor.";
    paymentStatus.classList.add("error");
  }
});

const params = new URLSearchParams(window.location.search);
const paymentResult = params.get("pago");
if (paymentResult) {
  const messages = {
    exito: "Regresaste desde el proveedor de pago. La confirmación definitiva debe validarse en el servidor.",
    error: "El proveedor de pago indicó que la operación no se completó.",
    pendiente: "El pago está pendiente de confirmación del proveedor."
  };
  if (messages[paymentResult]) {
    document.querySelector("#paymentMessage").textContent = messages[paymentResult];
    document.querySelector("#pagos").scrollIntoView({ behavior: "smooth" });
  }
}
