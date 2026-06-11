const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const gameRoutes = require('./routes/games');
const statisticsRoutes = require('./routes/statistics');
const exportRoutes = require('./routes/export');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

const dirs = [
  path.join(__dirname, '../dados'),
  path.join(__dirname, '../exports'),
  path.join(__dirname, '../graficos')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const dataFile = path.join(__dirname, '../dados/games.json');
if (!fs.existsSync(dataFile)) {
  const exampleData = require('./data/exampleData');
  fs.writeFileSync(dataFile, JSON.stringify(exampleData, null, 2));
}

app.use('/api/games', gameRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/export', exportRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'vercel' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Acesse http://localhost:${PORT} para usar a aplicação`);
  });
}

module.exports = app;
