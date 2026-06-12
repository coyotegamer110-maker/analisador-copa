const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../dados/games.json');

const readGamesData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return [];
  } catch (error) {
    return [];
  }
};

module.exports = {
  exportCSV: (req, res) => {
    try {
      const { data, filename } = req.body;

      const csv = data.join('\n');

      res.json({
        success: true,
        message: 'CSV pronto para download',
        data: csv
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  exportJSON: (req, res) => {
    try {
      const { data, filename } = req.body;

      res.json({
        success: true,
        message: 'JSON pronto para download',
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};