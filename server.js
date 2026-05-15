const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpetas necesarias si no existen
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Archivo donde se guardan los eventos
const EVENTS_FILE = path.join(dataDir, 'events.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'evento-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// Leer eventos desde el archivo JSON
function readEvents() {
  try {
    if (!fs.existsSync(EVENTS_FILE)) return [];
    const data = fs.readFileSync(EVENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo eventos:', err);
    return [];
  }
}

// Guardar eventos en el archivo JSON
function saveEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
}

// Ruta para obtener todos los eventos
app.get('/api/events', (req, res) => {
  const events = readEvents();
  res.json(events);
});

// Ruta para agregar un evento (recibe imagen + datos)
app.post('/api/events', upload.single('imagen'), (req, res) => {
  try {
    const { titulo, fecha, horario, info } = req.body;
    if (!titulo || !fecha || !horario) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (título, fecha, horario)' });
    }

    const events = readEvents();

    const newEvent = {
      id: Date.now().toString(),
      titulo,
      fecha,       // formato YYYY-MM-DD
      horario,     // ej. "10:00 - 12:00"
      info: info || '',
      imagen: req.file ? `/uploads/${req.file.filename}` : null,
      creado: new Date().toISOString()
    };

    events.push(newEvent);
    saveEvents(events);

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor AUDICIVIL escuchando en puerto ${PORT}`);
});