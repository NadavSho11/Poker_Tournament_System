const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get("/", (req, res) => {
  const blindsPath = path.join(__dirname, "../data/blinds.json");
  try {
    const data = fs.readFileSync(blindsPath, "utf8");
    const blinds = JSON.parse(data);
    res.json(blinds);
  } catch (err) {
    console.error("שגיאה בטעינת blinds.json:", err);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

module.exports = router;
