const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/prizes', (req, res) => {
  const prizesPath = path.join(__dirname, '../data/prizes.json');
  try {
    const data = fs.readFileSync(prizesPath, 'utf8');
    const prizes = JSON.parse(data);
    res.json(prizes);
  } catch (err) {
    console.error('שגיאה בטעינת פרסים:', err);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
});

module.exports = router;
