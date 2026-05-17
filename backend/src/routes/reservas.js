const express = require('express');
const nodemailer = require('nodemailer');
const { pool } = require('../db');
const { confirmacionCliente, notificacionRestaurante } = require('../emails/templates');

const router = express.Router();

// Transporter de email — se inicializa una sola vez al arrancar
let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Validación básica de campos
function validate(body) {
  const errors = [];
  if (!body.nombre?.trim()) errors.push('nombre requerido');
  if (!body.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('email inválido');
  if (!body.telefono?.trim() || body.telefono.replace(/\D/g, '').length < 9)
    errors.push('teléfono inválido');
  if (!body.experiencia?.trim()) errors.push('experiencia requerida');
  if (!body.fecha?.match(/^\d{4}-\d{2}-\d{2}$/)) errors.push('fecha inválida');
  if (!body.hora?.trim()) errors.push('hora requerida');
  const personas = Number(body.personas);
  if (!Number.isInteger(personas) || personas < 1 || personas > 20)
    errors.push('personas inválido (1-20)');
  return errors;
}

// POST /api/reservas — crear reserva
router.post('/', async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }

  const { nombre, email, telefono, experiencia, fecha, hora, personas, mensaje } = req.body;

  let reserva;
  try {
    const result = await pool.query(
      `INSERT INTO reservas (nombre, email, telefono, experiencia, fecha, hora, personas, mensaje)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [nombre.trim(), email.trim().toLowerCase(), telefono.trim(),
       experiencia.trim(), fecha, hora.trim(), Number(personas),
       mensaje?.trim() || null]
    );
    reserva = result.rows[0];
  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ ok: false, error: 'Error al guardar la reserva' });
  }

  // Enviar emails en paralelo — si fallan no bloqueamos la respuesta
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const mailer = getTransporter();
    const from = `"${process.env.RESTAURANT_NAME || 'Bodegas Monasterio'}" <${process.env.SMTP_USER}>`;

    Promise.all([
      mailer.sendMail({
        from,
        to: reserva.email,
        subject: `Reserva recibida · ${reserva.experiencia} · ${reserva.fecha}`,
        html: confirmacionCliente(reserva),
      }),
      mailer.sendMail({
        from,
        to: process.env.RESTAURANT_EMAIL || process.env.SMTP_USER,
        subject: `Nueva reserva: ${reserva.nombre} · ${reserva.personas} pax · ${reserva.fecha}`,
        html: notificacionRestaurante(reserva),
      }),
    ]).catch((err) => console.error('Email error:', err.message));
  }

  return res.status(201).json({ ok: true, id: reserva.id });
});

// GET /api/reservas — listar (protegido con API key básica)
router.get('/', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM reservas ORDER BY fecha DESC, hora ASC LIMIT 200`
    );
    return res.json({ ok: true, reservas: rows });
  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ ok: false, error: 'Error al obtener reservas' });
  }
});

// PATCH /api/reservas/:id — actualizar estado (pendiente → confirmada / cancelada)
router.patch('/:id', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  const { estado } = req.body;
  if (!['pendiente', 'confirmada', 'cancelada'].includes(estado)) {
    return res.status(400).json({ ok: false, error: 'estado inválido' });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE reservas SET estado=$1 WHERE id=$2`,
      [estado, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ ok: false, error: 'Reserva no encontrada' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ ok: false, error: 'Error al actualizar' });
  }
});

module.exports = router;
