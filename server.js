import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Servidor ANZ funcionando correctamente." });
});

app.post("/api/contacto", (req, res) => {
  const { nombre, email, edificio, mensaje } = req.body ?? {};
  if (![nombre, email, mensaje].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Completa nombre, correo y mensaje." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  }

  // Versión inicial: muestra la consulta en la consola del servidor.
  // Para producción, conecta un correo o una base de datos segura.
  console.log("Consulta recibida:", {
    nombre: nombre.trim(),
    email: email.trim(),
    edificio: typeof edificio === "string" ? edificio.trim() : "",
    mensaje: mensaje.trim()
  });
  res.status(201).json({ message: "¡Gracias! Tu consulta fue recibida correctamente." });
});

app.post("/api/pagos/crear", async (req, res) => {
  const { nombre, email, departamento, concepto, monto } = req.body ?? {};
  const amount = Number(monto);

  if (![nombre, email, departamento, concepto].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Completa todos los datos del pago." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  }
  if (!Number.isFinite(amount) || amount < 1000 || amount > 5000000) {
    return res.status(400).json({ error: "El monto debe estar entre $1.000 y $5.000.000 CLP." });
  }
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return res.status(503).json({
      error: "Los pagos online aún no están habilitados. Configura Mercado Pago en el archivo .env."
    });
  }

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [{
          title: `${concepto} - Departamento ${departamento}`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: Math.round(amount)
        }],
        payer: { name: nombre.trim(), email: email.trim() },
        back_urls: {
          success: `${SITE_URL}/?pago=exito`,
          failure: `${SITE_URL}/?pago=error`,
          pending: `${SITE_URL}/?pago=pendiente`
        },
        auto_return: "approved",
        external_reference: `anz-${Date.now()}`
      })
    });
    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago respondió con un error:", data);
      return res.status(502).json({ error: "No se pudo iniciar el pago. Revisa la configuración de Mercado Pago." });
    }
    return res.json({ checkoutUrl: data.init_point });
  } catch (error) {
    console.error("Error al iniciar el pago:", error);
    return res.status(500).json({ error: "Ocurrió un error al iniciar el pago." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ANZ Administradores de Edificios: ${SITE_URL}`);
});
