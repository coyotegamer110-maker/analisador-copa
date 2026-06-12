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

const calculateTeamStats = (games) => {
  const stats = {
    jogos_disputados: games.length,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    gols_marcados: 0,
    gols_sofridos: 0,
    pontos: 0,
    ultimos_5_resultados: [],
    resultados_por_rodada: []
  };

  games.forEach(game => {
    const isMandante = game.time_mandante === games[0].team;
    const gf = isMandante ? game.gols_mandante : game.gols_visitante;
    const ga = isMandante ? game.gols_visitante : game.gols_mandante;

    stats.gols_marcados += gf;
    stats.gols_sofridos += ga;

    let resultado = '';
    if (gf > ga) {
      stats.vitorias++;
      stats.pontos += 3;
      resultado = 'V';
    } else if (gf === ga) {
      stats.empates++;
      stats.pontos += 1;
      resultado = 'E';
    } else {
      stats.derrotas++;
      resultado = 'D';
    }

    stats.ultimos_5_resultados.push(resultado);
    stats.resultados_por_rodada.push({
      rodada: game.rodada,
      resultado,
      sinal: resultado === 'V' ? 1 : resultado === 'E' ? 0 : -1,
      gf,
      ga
    });
  });

  stats.ultimos_5_resultados = stats.ultimos_5_resultados.slice(-5);
  stats.saldo_gols = stats.gols_marcados - stats.gols_sofridos;
  stats.aproveitamento = stats.jogos_disputados > 0
    ? ((stats.pontos / (stats.jogos_disputados * 3)) * 100).toFixed(2)
    : 0;
  stats.media_gols = stats.jogos_disputados > 0
    ? (stats.gols_marcados / stats.jogos_disputados).toFixed(2)
    : 0;

  return stats;
};

module.exports = {
  getAllStatistics: (req, res) => {
    try {
      const games = readGamesData();
      const teams = new Set();

      games.forEach(game => {
        teams.add(game.time_mandante);
        teams.add(game.time_visitante);
      });

      const statistics = {};

      teams.forEach(team => {
        const teamGames = games.filter(game =>
          game.time_mandante === team || game.time_visitante === team
        );

        const gameWithTeam = teamGames.map(g => ({ ...g, team }));
        statistics[team] = calculateTeamStats(gameWithTeam);
      });

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getStatisticsByCopa: (req, res) => {
    try {
      const { copa } = req.params;
      const games = readGamesData();
      const filteredGames = games.filter(g => g.copa === decodeURIComponent(copa));

      const teams = new Set();
      filteredGames.forEach(game => {
        teams.add(game.time_mandante);
        teams.add(game.time_visitante);
      });

      const statistics = {};

      teams.forEach(team => {
        const teamGames = filteredGames.filter(game =>
          game.time_mandante === team || game.time_visitante === team
        );

        const gameWithTeam = teamGames.map(g => ({ ...g, team }));
        statistics[team] = calculateTeamStats(gameWithTeam);
      });

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getTeamStatistics: (req, res) => {
    try {
      const { team } = req.params;
      const games = readGamesData();
      const teamGames = games.filter(g =>
        g.time_mandante === decodeURIComponent(team) ||
        g.time_visitante === decodeURIComponent(team)
      );

      if (!teamGames.length) {
        return res.status(404).json({
          success: false,
          error: 'Time não encontrado'
        });
      }

      const gameWithTeam = teamGames.map(g => ({ ...g, team: decodeURIComponent(team) }));
      const stats = calculateTeamStats(gameWithTeam);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getChartData: (req, res) => {
    try {
      const { team } = req.params;
      const games = readGamesData();
      const teamGames = games.filter(g =>
        g.time_mandante === decodeURIComponent(team) ||
        g.time_visitante === decodeURIComponent(team)
      ).sort((a, b) => a.rodada - b.rodada);

      if (!teamGames.length) {
        return res.status(404).json({
          success: false,
          error: 'Time não encontrado'
        });
      }

      const chartData = {
        rodadas: [],
        pontos_acumulados: [],
        saldo_gols_acumulado: [],
        sinal_desempenho: [],
        tendencia_acumulada: []
      };

      let pontosAcum = 0;
      let saldoAcum = 0;
      let tendenciaAcum = 0;

      teamGames.forEach((game, index) => {
        const isMandante = game.time_mandante === decodeURIComponent(team);
        const gf = isMandante ? game.gols_mandante : game.gols_visitante;
        const ga = isMandante ? game.gols_visitante : game.gols_mandante;

        let sinal = 0;
        let pontos = 0;

        if (gf > ga) {
          sinal = 1;
          pontos = 3;
        } else if (gf === ga) {
          sinal = 0;
          pontos = 1;
        } else {
          sinal = -1;
          pontos = 0;
        }

        pontosAcum += pontos;
        saldoAcum += (gf - ga);
        tendenciaAcum += sinal;

        chartData.rodadas.push(game.rodada);
        chartData.pontos_acumulados.push(pontosAcum);
        chartData.saldo_gols_acumulado.push(saldoAcum);
        chartData.sinal_desempenho.push(sinal);
        chartData.tendencia_acumulada.push(tendenciaAcum);
      });

      res.json({
        success: true,
        data: chartData,
        games: teamGames
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};