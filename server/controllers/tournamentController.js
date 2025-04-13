const fs = require('fs');
const path = require('path');
const blindsPath = path.join(__dirname, '../data/blinds.json');
const blinds = JSON.parse(fs.readFileSync(blindsPath, 'utf8'));

// מצב נוכחי של הטורניר – כרגע בזיכרון בלבד
let tournamentState = {
  status: 'waiting',
  startTime: null,
  players: 12,
  pot: null,
  currentLevel: 0,
  timerEnd: null,
  timerPaused: false,
  timerRemaining: null
};

// שליחה של סטטוס נוכחי
exports.getStatus = (req, res) => {
  const currentBlind = blinds.find(b => b.level === tournamentState.currentLevel + 1);
  const totalLevels = blinds.length;
  res.json({...tournamentState, currentBlind, totalLevels});
};

// התחלת הטורניר
exports.startTournament = (req, res) => {
  tournamentState.status = 'active';
  tournamentState.startTime = new Date().toISOString();
  tournamentState.currentLevel = 0;
  setTimerForCurrentLevel();
  console.log('🎬 טורניר התחיל!');
  res.json({ success: true, status: 'active' });
};

exports.nextLevel = (req, res) => {
  const blindsPath = path.join(__dirname, '../data/blinds.json');
  const blinds = JSON.parse(fs.readFileSync(blindsPath, 'utf8'));

  tournamentState.currentLevel += 1;

  if (tournamentState.currentLevel >= blinds.length - 1) {
    setTimerForCurrentLevel();
    return res.json({ lastLevel: true, level: tournamentState.currentLevel });
  }

  setTimerForCurrentLevel();
  res.json({ success: true, level: tournamentState.currentLevel });
};

exports.finishTournament = (req, res) => {
  tournamentState.status = 'finished';
  console.log('🏁 טורניר הסתיים!');
  res.json({ success: true, status: 'finished' });
};

// הגדרת טיימר לשלב הנוכחי - פונקציית עזר
function setTimerForCurrentLevel() {
  const blindsPath = path.join(__dirname, '../data/blinds.json');
  const blinds = JSON.parse(fs.readFileSync(blindsPath, 'utf8'));

  const currentBlind = blinds[tournamentState.currentLevel];
  if (!currentBlind) {
    console.warn('⛔ אין שלב בליינדים עבור currentLevel:', tournamentState.currentLevel);
    return;
  }

  const duration = currentBlind.duration;
  const now = new Date();
  tournamentState.timerEnd = new Date(now.getTime() + duration * 60000).toISOString();

  tournamentState.timerPaused = false;
  tournamentState.timerRemaining = null;
}

exports.resetTournament = (req, res) => {
  const fs = require('fs');
  const path = require('path');

  // איפוס מצב הטורניר
  tournamentState = {
    status: 'waiting',
    startTime: null,
    players: 12,
    pot: 1800,
    currentLevel: 0,
    timerEnd: null
  };

  // איפוס רשימת שחקנים
  const playersPath = path.join(__dirname, '../data/players.json');
  const originalPlayers = [
    "נדב", "רון", "דורון", "גלר", "חג'ג'", "בנג'ו",
    "כרמלי", "מייקל", "סער", "עידן", "ביופורד", "חבר של סער"
  ].map((name, i) => ({
    id: i + 1,
    name,
    chips: 15000,
    status: "active"
  }));

  try {
    fs.writeFileSync(playersPath, JSON.stringify(originalPlayers, null, 2), 'utf8');
    console.log('🔄 טורניר + שחקנים אופסו');
    res.json({ success: true, message: 'טורניר ושחקנים אופסו' });
  } catch (err) {
    console.error('שגיאה באיפוס:', err);
    res.status(500).json({ success: false, message: 'שגיאה באיפוס' });
  }
};


exports.pauseTimer = (req, res) => {
  if (!tournamentState.timerEnd || tournamentState.timerPaused) {
    return res.status(400).json({ success: false, message: "הטיימר לא פעיל או כבר נעצר" });
  }

  const now = new Date();
  const remaining = new Date(tournamentState.timerEnd) - now;

  tournamentState.timerPaused = true;
  tournamentState.timerRemaining = remaining;
  tournamentState.timerEnd = null;

  res.json({ success: true, message: "הטיימר נעצר" });
};

exports.resumeTimer = (req, res) => {
  if (!tournamentState.timerPaused || tournamentState.timerRemaining == null) {
    return res.status(400).json({ success: false, message: "הטיימר לא נעצר" });
  }

  const now = new Date();
  tournamentState.timerEnd = new Date(now.getTime() + tournamentState.timerRemaining);
  tournamentState.timerPaused = false;
  tournamentState.timerRemaining = null;

  res.json({ success: true, message: "הטיימר חודש" });
};





