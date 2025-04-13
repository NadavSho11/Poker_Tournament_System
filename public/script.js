document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reset-players-btn").addEventListener("click", () => {
    fetch("/api/players/reset", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadPlayers(); // מרענן את הטבלה
          alert("טבלת שחקנים אופסה בהצלחה");
        }
      });
  });

  const startBtn = document.getElementById("start-btn");
  const statusSpan = document.getElementById("status");

  startBtn.addEventListener("click", () => {
    fetch("/api/start", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          statusSpan.textContent = "הטורניר התחיל!";
          startBtn.disabled = true;
          document.getElementById("next-level-btn").disabled = false;
        }
      })
      .catch((err) => {
        console.error("שגיאה בהתחלת טורניר:", err);
      });
  });

  const nextLevelBtn = document.getElementById("next-level-btn");
  const finishBtn = document.getElementById("finish-btn");

  nextLevelBtn.addEventListener("click", () => {
    fetch("/api/next-level", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.lastLevel) {
          nextLevelBtn.style.display = "none";
          finishBtn.style.display = "inline-block";
        }
      });
  });

  finishBtn.addEventListener("click", () => {
    fetch("/api/finish", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          //שינוי
          document.getElementById("final-stats").style.display = "block";

          fetch("/api/players/stats")
            .then(res => res.json())
            .then(stats => {
              const tbody = document.getElementById("final-stats-body");
              tbody.innerHTML = "";

              stats.forEach(player => {
                const row = document.createElement("tr");
                row.innerHTML = `
        <td>${player.rank}</td>
        <td>${player.name}</td>
        <td>${player.chips}</td>
        <td>${player.eliminated}</td>
        <td>${player.prize}</td>
      `;
                tbody.appendChild(row);
              });
              document.getElementById("download-excel-btn").style.display = "inline-block";
              document.getElementById("download-excel-btn").addEventListener("click", downloadStatsAsExcel);
            });
          //סוף שינוי
          document.getElementById("status").textContent = "הטורניר הסתיים 🎉";
          finishBtn.disabled = true;
        }
      });
  });

  const resetBtn = document.getElementById("reset-btn");

  finishBtn.addEventListener("click", () => {
    fetch("/api/finish", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          document.getElementById("status").textContent = "הטורניר הסתיים 🎉";
          finishBtn.disabled = true;
          resetBtn.style.display = "inline-block";
        }
      });
  });

  resetBtn.addEventListener("click", () => {
    fetch("/api/reset", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadPlayers();
          location.reload();
        }
      });
  });

  loadPlayers();
  startTimerUpdater();
  loadPrizes();
  loadBlindsTable();
});

let timerPaused = false;
let savedDiffMs = null;
let intervalId = null;

function toggleTimer() {
  const btn = document.getElementById("toggle-timer-btn");
  const action = btn.textContent === "עצור" ? "pause" : "resume";

  fetch(`/api/${action}-timer`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        btn.textContent = action === "pause" ? "המשך" : "עצור";
      } else {
        alert(data.message || "שגיאה");
      }
    })
    .catch(err => {
      console.error("שגיאה בשינוי מצב טיימר:", err);
    });
}



function rebuy(playerId) {
  fetch(`/api/players/${playerId}/rebuy`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        loadPlayers(); // מרענן טבלה
      } else {
        alert(data.message || "לא ניתן לבצע Re-buy");
      }
    })
    .catch((err) => {
      console.error("שגיאה ב-Rebuy:", err);
    });
}

function loadPlayers() {
  fetch("/api/players")
    .then((res) => res.json())
    .then((players) => {
      // מיון מיקומים
      players.sort((a, b) => {
        // פעילים לפני מודחים
        if (a.status === 'active' && b.status === 'eliminated') return -1;
        if (a.status === 'eliminated' && b.status === 'active') return 1;

        // אם שניהם פעילים – לפי צ'יפים (מהכי הרבה להכי מעט)
        if (a.status === 'active' && b.status === 'active') {
          return b.chips - a.chips;
        }

        // אם שניהם מודחים – לפי סדר הדחה (מהראשון שהודח לאחרון)
        return a.eliminationOrder - b.eliminationOrder;
      });


      const tableBody = document.querySelector("#players-table tbody");
      tableBody.innerHTML = ""; // מנקה טבלה קיימת
      players.forEach((player, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${player.name}</td>
          <td>${player.status === 'active' ? '✅ פעיל' : '❌ מודח'}</td>
          <td>${player.chips}</td>
          <td>
           ${player.status === 'active' ? `
            <input type="number" id="chips-input-${player.id}" value="${player.chips}" style="width: 60px;" />
            <button onclick="updateChips(${player.id})">עדכן</button>
             ` : ''}
          </td>
           <td>
             ${player.status === 'active' ? `<button onclick="rebuy(${player.id})">Re-buy</button>` : ''}
           </td>
           <td>
             ${player.status === 'active' ? `<button onclick="eliminate(${player.id})">הדח</button>` : ''}
           </td>
       `;


        row.style.opacity = player.status === "eliminated" ? "0.5" : "1";

        if (player.status === "eliminated") {
          row.style.backgroundColor = "#f8d7da"; // אדמדם עדין
        }

        tableBody.appendChild(row);
      });
    })
    .catch((err) => {
      console.error("שגיאה בטעינת שחקנים:", err);
    });
}

function startTimerUpdater() {
  setInterval(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        // עדכון שלב ובליינדים
        if (data.status === "active") {
          document.getElementById("current-level").textContent = data.currentLevel + 1;
          document.getElementById("total-levels").textContent = data.totalLevels || "--";

          if (data.currentBlind) {
            document.getElementById("blinds-display").textContent =
              `${data.currentBlind.sb} / ${data.currentBlind.bb}`;
          } else {
            document.getElementById("blinds-display").textContent = "-- / --";
          }
        } else {
          document.getElementById("current-level").textContent = "--";
          document.getElementById("total-levels").textContent = "--";
          document.getElementById("blinds-display").textContent = "-- / --";
        }


        const timerSpan = document.getElementById("timer");

        // במצב המתנה או שאין טיימר בכלל
        if ((!data.timerEnd && !data.timerRemaining) || data.status !== "active") {
          timerSpan.textContent = "--:--";
          return;
        }

        // אם הטיימר במצב עצירה - מציג את הזמן שנותר
        if (data.timerPaused && data.timerRemaining !== null) {
          const minutes = Math.floor(data.timerRemaining / 60000);
          const seconds = Math.floor((data.timerRemaining % 60000) / 1000);
          const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          timerSpan.textContent = formatted;
          return;
        }

        // חישוב הזמן שנותר אם הטיימר פעיל
        const end = new Date(data.timerEnd);
        const now = new Date();
        const diffMs = end - now;

        if (diffMs <= 0) {
          timerSpan.textContent = "00:00";

          if (lastAlertedLevel !== data.currentLevel) {
            document.getElementById("alert-sound").play();
            lastAlertedLevel = data.currentLevel;
          }

          return;
        }

        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        timerSpan.textContent = formatted;
      });
  }, 1000);
}

function eliminate(playerId) {
  fetch(`/api/players/${playerId}/eliminate`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        loadPlayers(); // מרענן את הטבלה
      } else {
        alert(data.message || "לא ניתן להדיח את השחקן");
      }
    })
    .catch((err) => {
      console.error("שגיאה בהדחת שחקן:", err);
    });
}

function updateChips(playerId) {
  const input = document.getElementById(`chips-input-${playerId}`);
  const newChips = parseInt(input.value);

  if (isNaN(newChips) || newChips < 0) {
    alert("סכום צ'יפים לא חוקי");
    return;
  }

  fetch(`/api/players/${playerId}/chips`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chips: newChips }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        loadPlayers(); // מרענן טבלה
      } else {
        alert(data.message || "שגיאה בעדכון צ'יפים");
      }
    })
    .catch((err) => {
      console.error("שגיאה בעדכון צ'יפים:", err);
    });
}

function loadPrizes() {
  fetch('/api/prizes')
    .then(res => res.json())
    .then(prizes => {
      const tableBody = document.querySelector('#prizes-table tbody');
      tableBody.innerHTML = '';

      prizes.forEach(prize => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prize.place}</td>
          <td>${prize.prize}</td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error('שגיאה בטעינת פרסים:', err);
    });
}

function loadBlindsTable() {
  fetch('/api/blinds')
    .then(res => res.json())
    .then(blinds => {
      const tbody = document.querySelector("#blinds-table tbody");
      tbody.innerHTML = "";

      blinds.forEach(level => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${level.level}</td>
          <td>${level.sb}</td>
          <td>${level.bb}</td>
          <td>${level.duration}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("שגיאה בטעינת טבלת שלבים:", err);
    });
}

function downloadStatsAsExcel() {
  const table = document.getElementById("final-stats-body");
  const rows = Array.from(table.querySelectorAll("tr")).map(row =>
    Array.from(row.querySelectorAll("td")).map(cell => cell.textContent)
  );

  const header = ["מקום", "שם", "צ'יפים", "סטטוס", "פרס"];
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "טורניר פוקר");

  XLSX.writeFile(workbook, "תוצאות_סופיות.xlsx");
}

