require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("./db");

const app = express();

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "2mb" }));

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((it) => ({
      id: String(it.id ?? ""),
      nombre: String(it.nombre ?? ""),
      precio: Number(it.precio ?? 0),
      imagen: String(it.imagen ?? ""),
      talla: it.talla ? String(it.talla) : null,
      cantidad: Math.max(1, Number(it.cantidad ?? 1)),
    }))
    .filter((it) => it.id && it.nombre && Number.isFinite(it.precio));
}

function calcTotal(items) {
  return items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "Back", port: PORT });
});

app.post("/api/auth/register", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const nombre = String(req.body?.nombre || "").trim();
  const correo = String(req.body?.correo || "").trim();
  const documento = String(req.body?.documento || "").trim();
  const telefono = String(req.body?.telefono || "").trim();
  const direccion = String(req.body?.direccion || "").trim();

  if (username.length < 3) {
    return res.status(400).json({ error: "Usuario mínimo 3 caracteres" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Contraseña mínimo 6 caracteres" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (existing) return res.status(409).json({ error: "Usuario ya existe" });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (username, password_hash, nombre, correo, documento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(username, password_hash, nombre || null, correo || null, documento || null, telefono || null, direccion || null);

  return res.status(201).json({ id: info.lastInsertRowid, username });
});

app.post("/api/auth/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  const user = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username);
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = signToken(user);
  return res.json({ token });
});

app.get("/api/me", auth, (req, res) => {
  const row = db
    .prepare(
      "SELECT id, username, nombre, correo, documento, telefono, direccion, avatar FROM users WHERE id = ?"
    )
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({
    id: row.id,
    username: row.username,
    nombre: row.nombre,
    correo: row.correo,
    documento: row.documento,
    telefono: row.telefono,
    direccion: row.direccion,
    avatar: row.avatar || null,
  });
});

app.put("/api/me", auth, (req, res) => {
  const { nombre, correo, documento, telefono, direccion, avatar } = req.body || {};
  const updates = [];
  const values = [];
  if (nombre !== undefined) {
    updates.push("nombre = ?");
    values.push(String(nombre).trim() || null);
  }
  if (correo !== undefined) {
    updates.push("correo = ?");
    values.push(String(correo).trim() || null);
  }
  if (documento !== undefined) {
    updates.push("documento = ?");
    values.push(String(documento).trim() || null);
  }
  if (telefono !== undefined) {
    updates.push("telefono = ?");
    values.push(String(telefono).trim() || null);
  }
  if (direccion !== undefined) {
    updates.push("direccion = ?");
    values.push(String(direccion).trim() || null);
  }
  if (avatar !== undefined) {
    const av = typeof avatar === "string" && avatar.length < 500000 ? avatar : null;
    updates.push("avatar = ?");
    values.push(av);
  }
  if (updates.length === 0) return res.status(400).json({ error: "Nada que actualizar" });
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  const row = db
    .prepare("SELECT id, username, nombre, correo, documento, telefono, direccion, avatar FROM users WHERE id = ?")
    .get(req.user.id);
  res.json({
    id: row.id,
    username: row.username,
    nombre: row.nombre,
    correo: row.correo,
    documento: row.documento,
    telefono: row.telefono,
    direccion: row.direccion,
    avatar: row.avatar || null,
  });
});

app.get("/api/orders", auth, (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, items_json, total, created_at FROM orders WHERE user_id = ? ORDER BY id DESC"
    )
    .all(req.user.id);

  const orders = rows.map((r) => ({
    id: r.id,
    items: JSON.parse(r.items_json),
    total: r.total,
    createdAt: r.created_at,
  }));

  res.json(orders);
});

// Checkout (pasarela): hoy registra orden y (opcionalmente) devuelve checkoutUrl.
// Para integrar una pasarela real (Stripe/MercadoPago), aquí creas la "preferencia/sesión"
// y devuelves el link para redirigir.
app.post("/api/checkout", auth, (req, res) => {
  const items = normalizeItems(req.body?.items);
  if (items.length === 0) {
    return res.status(400).json({ error: "Carrito vacío o inválido" });
  }

  const total = calcTotal(items);
  const info = db
    .prepare("INSERT INTO orders (user_id, items_json, total) VALUES (?, ?, ?)")
    .run(req.user.id, JSON.stringify(items), total);

  // Si más adelante agregas pasarela, devuelve { checkoutUrl } aquí.
  res.status(201).json({ orderId: info.lastInsertRowid });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[Back] listening on http://localhost:${PORT}`);
});

