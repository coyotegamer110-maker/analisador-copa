const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/', statsController.getAllStatistics);
router.get('/copa/:copa', statsController.getStatisticsByCopa);
router.get('/team/:team', statsController.getTeamStatistics);
router.get('/charts/:team', statsController.getChartData);

module.exports = router;
