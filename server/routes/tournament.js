const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

// ניהול נתיבים של טורניר
router.get('/status', tournamentController.getStatus);
router.post('/start', tournamentController.startTournament);
router.post('/next-level', tournamentController.nextLevel);
router.post('/finish', tournamentController.finishTournament);
router.post('/reset', tournamentController.resetTournament);
router.post('/pause-timer', tournamentController.pauseTimer);
router.post('/resume-timer', tournamentController.resumeTimer);

module.exports = router;