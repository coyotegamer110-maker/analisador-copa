const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.post('/csv', exportController.exportCSV);
router.post('/json', exportController.exportJSON);

module.exports = router;
