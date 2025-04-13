const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// טעינת ראוטים
const playerRoutes = require('./routes/player');
app.use('/api', playerRoutes);
const tournamentRoutes = require('./routes/tournament');
app.use('/api', tournamentRoutes);
const prizeRoutes = require('./routes/prize');
app.use('/api', prizeRoutes);
const blindsRoutes = require("./routes/blinds");
app.use("/api/blinds", blindsRoutes);



// שליחת index.html כתגובה לברירת מחדל
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
});
