require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const reservasRouter = require('./routes/reservas');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — permitir peticiones desde el frontend en GitHub Pages
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:5500', // Live Server de VS Code
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permitir peticiones sin origin (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origen no permitido'));
  },
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-Api-Key'],
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Rutas
app.use('/api/reservas', reservasRouter);

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: 'Ruta no encontrada' }));

// Error handler global
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

async function start() {
  try {
    await initDb();
    console.log('Base de datos inicializada');
    app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
  } catch (err) {
    console.error('Error al arrancar:', err.message);
    process.exit(1);
  }
}

start();
