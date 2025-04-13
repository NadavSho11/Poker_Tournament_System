const express = require("express");
const router = express.Router();
const playerController = require("../controllers/playerController");

router.get("/players", playerController.getPlayers);
router.post("/players/:id/rebuy", playerController.rebuyPlayer);
router.post("/players/reset", playerController.resetPlayers);
router.post("/players/:id/eliminate", playerController.eliminatePlayer);
router.put('/players/:id/chips', playerController.updateChips);
router.get("/players/stats", playerController.getFinalStats);


module.exports = router;
