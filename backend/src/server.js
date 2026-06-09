require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Stub Base44 public-settings (mantém compatibilidade com checkAppState do AuthContext original)
app.get('/api/apps/public/prod/public-settings/by-id/:appId', (req, res) => {
  res.json({ id: req.params.appId, name: 'Cravo Dourado Local', is_local: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/entities', require('./routes/entities'));
app.use('/api/functions', require('./routes/functions'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = parseInt(process.env.PORT || '3003');
app.listen(PORT, () => {
  console.log(`Cravo Dourado backend rodando em http://localhost:${PORT}`);
  console.log('Endpoints: /api/auth  /api/entities/:type  /api/functions/:name');
});
