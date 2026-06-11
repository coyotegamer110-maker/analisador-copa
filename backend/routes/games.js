const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.getAllGames);
router.get('/copa/:copa', gameController.getGamesByCopa);
router.get('/team/:team', gameController.getGamesByTeam);
router.post('/', gameController.addGame);
router.post('/import', gameController.importGames);
router.delete('/:id', gameController.deleteGame);

module.exports = router;
