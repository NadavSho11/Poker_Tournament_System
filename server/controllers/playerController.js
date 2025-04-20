const fs = require('fs');
const path = require('path');

const playersPath = path.join(__dirname, '../data/players.json');
let eliminationCounter = 0;

exports.getPlayers = (req, res) => {
  try {
    const playersData = fs.readFileSync(playersPath, 'utf8');
    const players = JSON.parse(playersData);
    res.json(players);
  } catch (err) {
    console.error('שגיאה בקריאת players.json:', err);
    res.status(500).json({ error: 'בעיה בטעינת רשימת שחקנים' });
  }
};

exports.rebuyPlayer = (req, res) => {
  const playersPath = path.join(__dirname, '../data/players.json');

  try {
    const data = fs.readFileSync(playersPath, 'utf8');
    const players = JSON.parse(data);

    const playerId = parseInt(req.params.id);
    const player = players.find(p => p.id === playerId);

    if (!player) {
      return res.status(404).json({ success: false, message: 'שחקן לא נמצא' });
    }

    const now = new Date();
    const limit = new Date();
    limit.setHours(19, 0, 0); // שעה 19:00

    if (now > limit) {
      return res.status(403).json({ success: false, message: 'עבר הזמן לביצוע Re-buy' });
    }

    player.chips += 12000;

    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf8');
    return res.json({ success: true });

  } catch (err) {
    console.error('שגיאה בביצוע Re-buy:', err);
    res.status(500).json({ success: false, message: 'שגיאה בשרת' });
  }
};
  

  exports.resetPlayers = (req, res) => {
    const fs = require('fs');
    const path = require('path');
  
    const playersPath = path.join(__dirname, '../data/players.json');
  
    const originalPlayers = [
      "נדב", "רון", "דורון", "גלר", "ראם", "בנג'ו",
      "כרמלי", "מייקל", "סער", "רפאל", "אילן", "רועי","עומר"
    ].map((name, i) => ({
      id: i + 1,
      name,
      chips: 15000,
      status: "active"
    }));
  
    try {
      fs.writeFileSync(playersPath, JSON.stringify(originalPlayers, null, 2), 'utf8');
      res.json({ success: true, message: 'רשימת שחקנים אופסה' });
    } catch (err) {
      console.error('שגיאה באיפוס שחקנים:', err);
      res.status(500).json({ success: false, message: 'שגיאה באיפוס' });
    }
  };

  
  exports.eliminatePlayer = (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const playersPath = path.join(__dirname, '../data/players.json');
  
    try {
      const data = fs.readFileSync(playersPath, 'utf8');
      const players = JSON.parse(data);
  
      const playerId = parseInt(req.params.id);
      const player = players.find(p => p.id === playerId);
  
      if (!player) {
        return res.status(404).json({ success: false, message: 'שחקן לא נמצא' });
      }
  
      if (player.status === 'eliminated') {
        return res.status(400).json({ success: false, message: 'שחקן כבר הודח' });
      }
  
      player.status = 'eliminated';
      player.chips = 0;
  
      // מחשבים את סדר ההדחה
      const maxEliminationOrder = Math.max(
        0,
        ...players
          .filter(p => p.status === 'eliminated' && typeof p.eliminationOrder === 'number')
          .map(p => p.eliminationOrder)
      );
  
      player.eliminationOrder = maxEliminationOrder + 1;
  
      fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf8');
      return res.json({ success: true });
  
    } catch (err) {
      console.error('שגיאה בהדחת שחקן:', err);
      res.status(500).json({ success: false, message: 'שגיאה בשרת' });
    }
  };
  
  

  exports.updateChips = (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const playersPath = path.join(__dirname, '../data/players.json');
  
    try {
      const data = fs.readFileSync(playersPath, 'utf8');
      const players = JSON.parse(data);
  
      const playerId = parseInt(req.params.id);
      const { chips } = req.body;
  
      if (isNaN(chips) || chips < 0) {
        return res.status(400).json({ success: false, message: 'צ\'יפים לא חוקיים' });
      }
  
      const player = players.find(p => p.id === playerId);
      if (!player) {
        return res.status(404).json({ success: false, message: 'שחקן לא נמצא' });
      }
  
      player.chips = chips;
  
      fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf8');
      res.json({ success: true });
  
    } catch (err) {
      console.error('שגיאה בעדכון צ\'יפים:', err);
      res.status(500).json({ success: false, message: 'שגיאה בשרת' });
    }
  };
  
  exports.getFinalStats = (req, res) => {
    const fs = require("fs");
    const path = require("path");
  
    const playersPath = path.join(__dirname, "../data/players.json");
    const prizesPath = path.join(__dirname, "../data/prizes.json");
  
    try {
      const playersData = fs.readFileSync(playersPath, "utf8");
      const players = JSON.parse(playersData);
  
      const prizesData = fs.readFileSync(prizesPath, "utf8");
      const prizes = JSON.parse(prizesData);
  
      // דירוג שחקנים
      const rankedPlayers = [...players].sort((a, b) => {
        if (a.status === "active" && b.status === "eliminated") return -1;
        if (a.status === "eliminated" && b.status === "active") return 1;
        if (a.status === "active" && b.status === "active") return b.chips - a.chips;
        return a.eliminationOrder - b.eliminationOrder;
      });
  
      const stats = rankedPlayers.map((player, index) => {
        const prize = prizes.find(p => p.place === index + 1)?.prize || "";
        return {
          rank: index + 1,
          name: player.name,
          chips: player.chips,
          eliminated: player.status === "eliminated" ? player.eliminationOrder : "פעיל",
          prize
        };
      });
  
      res.json(stats);
    } catch (err) {
      console.error("שגיאה בהפקת סטטיסטיקות:", err);
      res.status(500).json({ error: "שגיאה בשרת" });
    }
  };
  