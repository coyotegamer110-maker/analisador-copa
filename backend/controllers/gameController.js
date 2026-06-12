const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../dados/games.json');

const readGamesData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler dados:', error);
    return [];
  }
};

const saveGamesData = (games) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    throw error;
  }
};

const validateGame = (game) => {
  const errors = [];

  if (!game.data || !/^\d{4}-\d{2}-\d{2}$/.test(game.data)) {
    errors.push('Data inválida. Use formato YYYY-MM-DD');
  }

  if (!game.rodada || game.rodada < 1) {
    errors.push('Rodada deve ser um número maior que 0');
  }

  if (!game.time_mandante || game.time_mandante.trim() === '') {
    errors.push('Time mandante é obrigatório');
  }

  if (!game.time_visitante || game.time_visitante.trim() === '') {
    errors.push('Time visitante é obrigatório');
  }

  if (game.gols_mandante < 0 || !Number.isInteger(game.gols_mandante)) {
    errors.push('Gols mandante deve ser um número inteiro');
  }

  if (game.gols_visitante < 0 || !Number.isInteger(game.gols_visitante)) {
    errors.push('Gols visitante deve ser um número inteiro');
  }

  if (game.time_mandante === game.time_visitante) {
    errors.push('Time mandante e visitante não podem ser iguais');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  getAllGames: (req, res) => {
    try {
      const games = readGamesData();
      res.json({
        success: true,
        count: games.length,
        data: games
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getGamesByCopa: (req, res) => {
    try {
      const { copa } = req.params;
      const games = readGamesData();
      const filtered = games.filter(game => game.copa === decodeURIComponent(copa));

      res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getGamesByTeam: (req, res) => {
    try {
      const { team } = req.params;
      const games = readGamesData();
      const filtered = games.filter(game =>
        game.time_mandante === decodeURIComponent(team) ||
        game.time_visitante === decodeURIComponent(team)
      );

      res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  addGame: (req, res) => {
    try {
      const { copa, data, rodada, time_mandante, time_visitante, gols_mandante, gols_visitante } = req.body;

      const newGame = {
        id: Date.now().toString(),
        copa: copa || 'Copa Padrão',
        data,
        rodada: parseInt(rodada),
        time_mandante: time_mandante.trim(),
        time_visitante: time_visitante.trim(),
        gols_mandante: parseInt(gols_mandante),
        gols_visitante: parseInt(gols_visitante),
        created_at: new Date().toISOString()
      };

      const validation = validateGame(newGame);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const games = readGamesData();
      games.push(newGame);
      saveGamesData(games);

      res.status(201).json({
        success: true,
        message: 'Jogo adicionado com sucesso',
        data: newGame
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  importGames: (req, res) => {
    try {
      const { format, data, copa } = req.body;

      let games = [];

      if (format === 'json') {
        const parsedData = JSON.parse(data);
        games = Array.isArray(parsedData) ? parsedData : parsedData.jogos || [];
      } else if (format === 'csv') {
        games = parseCSV(data);
      }

      if (!games.length) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum jogo encontrado nos dados'
        });
      }

      const validatedGames = [];
      const errors = [];

      games.forEach((game, index) => {
        const formattedGame = {
          id: Date.now().toString() + index,
          copa: game.copa || copa || 'Copa Padrão',
          data: game.data,
          rodada: parseInt(game.rodada),
          time_mandante: game.time_mandante,
          time_visitante: game.time_visitante,
          gols_mandante: parseInt(game.gols_mandante),
          gols_visitante: parseInt(game.gols_visitante),
          created_at: new Date().toISOString()
        };

        const validation = validateGame(formattedGame);
        if (validation.valid) {
          validatedGames.push(formattedGame);
        } else {
          errors.push(`Linha ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validatedGames.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum jogo válido encontrado',
          details: errors
        });
      }

      let existingGames = readGamesData();
      existingGames = existingGames.concat(validatedGames);
      saveGamesData(existingGames);

      res.json({
        success: true,
        message: `${validatedGames.length} jogos importados com sucesso`,
        imported: validatedGames.length,
        errors: errors.length > 0 ? errors : undefined,
        data: validatedGames
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  deleteGame: (req, res) => {
    try {
      const { id } = req.params;
      let games = readGamesData();
      const initialLength = games.length;

      games = games.filter(game => game.id !== id);

      if (games.length === initialLength) {
        return res.status(404).json({
          success: false,
          error: 'Jogo não encontrado'
        });
      }

      saveGamesData(games);

      res.json({
        success: true,
        message: 'Jogo deletado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

const parseCSV = (csvData) => {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const games = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const game = {};

    headers.forEach((header, index) => {
      game[header] = values[index];
    });

    games.push(game);
  }

  return games;
};