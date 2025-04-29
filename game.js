// Cultivation Stages
const cultivationStages = [
  { name: "Mortal", qiNeeded: 0 },
  { name: "Essence Gathering", qiNeeded: 100 },
  { name: "Foundation Establishment", qiNeeded: 500 },
  { name: "Core Formation", qiNeeded: 2000 },
  { name: "Nascent Soul", qiNeeded: 5000 },
  { name: "Soul Transformation", qiNeeded: 10000 },
  { name: "Spirit Severing", qiNeeded: 25000 },
  { name: "Immortal Ascension", qiNeeded: 50000 }
];

const GAME_VERSION = "1.0.0";

let player = {
  qi: 0,
  spirit: 1,
  bodyStrength: 1,
  luck: 1,
  enlightenment: 1,
  tribulationResistance: 1,
  currentStageIndex: 0,
  inventory: [],
  spiritStones: 0,
  skills: {
    basicCultivation: true,
    innerFocus: false,
    soulMend: false,
    qiSurge: false,
    bodyTempering: false,
    luckyCharm: false
  },
  potionsBrewed: 0,
  achievements: []
};

let isMeditating = false;
let meditationTimerId = null;

window.innerFocusUsed = false;

let quests = [
  { title: "First Steps", completed: false, reward: 100, description: "Gain 500 Qi" },
  { title: "Herbalist", completed: false, reward: 1, description: "Brew a potion" },
  { title: "Power Spike", completed: false, reward: 2, description: "Reach 1000 Qi in one stage" },
  { title: "Bodybuilder", completed: false, reward: 3, description: "Increase Body Strength to 5" },
  { title: "Fortune Seeker", completed: false, reward: 2, description: "Use Lucky Charm or gain Luck" },
  { title: "Master of Focus", completed: false, reward: 1, description: "Activate Inner Focus once" }
];

const skillsData = {
  basicCultivation: { name: "Basic Cultivation", desc: "Base Qi gain +1/s" },
  innerFocus: { name: "Inner Focus", desc: "Double Qi gain for 5 minutes", cost: 3 },
  soulMend: { name: "Soul Mend", desc: "Reduces deviation chance", cost: 5 },
  qiSurge: { name: "Qi Surge", desc: "Triple Qi gain for 5 minutes", cost: 5 },
  bodyTempering: { name: "Body Tempering", desc: "Boosts Body Strength over time", cost: 4 },
  luckyCharm: { name: "Lucky Charm", desc: "Increases rare drop chance", cost: 6 }
};

document.addEventListener("DOMContentLoaded", function () {
  loadGame();
  updateDisplay();

  const lastLoginTime = parseInt(localStorage.getItem("lastLogin")) || Date.now();
  const timeOfflineSec = (Date.now() - lastLoginTime) / 1000;
  const baseRate = 1;
  player.qi += timeOfflineSec * baseRate;

  checkStage();
  checkAchievements();
  tryAutoBreakthrough();
  checkQuests();
  updateDisplay();

  localStorage.setItem("lastLogin", Date.now());
});

function gainQi(amount = 1) {
  if (player.skills.innerFocus) {
    amount *= 2;
    window.innerFocusUsed = true;
  }

  if (player.skills.qiSurge) {
    amount *= 3;
  }

  player.qi += amount;

  checkStage();
  checkQuests();
  checkAchievements();
  updateDisplay();
}

function startMeditation() {
  if (isMeditating || meditationTimerId) return;
  isMeditating = true;
  showNotification("Entering meditation...");

  let duration = 0;

  meditationTimerId = setInterval(() => {
    duration++;
    gainQi(2);

    if (Math.random() < 0.01) {
      stopMeditation();
      player.qi -= 100;
      showNotification("Meditation deviation! Lost 100 Qi.");
      updateDisplay();
      return;
    }

    // Lucky Charm Effect
    if (player.skills.luckyCharm && Math.random() < 0.05) {
      player.inventory.push("herb");
      showNotification("Lucky charm worked! You found an herb while meditating.");
    }

    if (duration >= 60) {
      stopMeditation();
      showNotification("Meditation complete!");
    }
  }, 1000);
}

function stopMeditation() {
  clearInterval(meditationTimerId);
  meditationTimerId = null;
  isMeditating = false;
}

function triggerTribulation() {
  showNotification("A divine tribulation approaches!");

  for (let i = 0; i < 3; i++) {
    const dmg = Math.floor(Math.random() * 500);
    if (player.tribulationResistance > Math.random() * 10) {
      showNotification("Resisted heavenly bolt!");
    } else {
      player.qi -= dmg;
      showNotification(`Tribulation hit! Lost ${dmg} Qi.`);
    }
  }

  checkStage();
  updateDisplay();
}

function brewPotion() {
  if (player.inventory.includes("herb")) {
    const index = player.inventory.indexOf("herb");
    player.inventory.splice(index, 1);
    player.potionsBrewed++;
    player.spirit += 1;
    showNotification("Brewed a spiritual potion! Your Spirit increased by 1.");
    checkQuests();
    checkAchievements();
    updateDisplay();
  } else {
    showNotification("You need an herb to brew!");
  }
}

function buyItem(item) {
  if (player.spiritStones >= 1) {
    player.spiritStones--;
    player.inventory.push(item);
    showNotification("You bought an herb!");
    updateDisplay();
  } else {
    document.getElementById("shopMessage").innerText = "Not enough Spirit Stones!";
    setTimeout(() => document.getElementById("shopMessage").innerText = "", 2000);
  }
}

function unlockSkill(skillName) {
  const skill = skillsData[skillName];
  if (!player.skills[skillName] && player.spiritStones >= skill.cost) {
    player.skills[skillName] = true;
    player.spiritStones -= skill.cost;
    showNotification("You unlocked " + skill.name + "!");
    updateDisplay();
  } else {
    showNotification("Not enough Spirit Stones or already learned.");
  }
}

function checkStage() {
  while (
    player.currentStageIndex < cultivationStages.length - 1 &&
    player.qi >= cultivationStages[player.currentStageIndex + 1].qiNeeded
  ) {
    player.currentStageIndex++;
    showNotification("You've ascended to " + cultivationStages[player.currentStageIndex].name + "!");
  }
}

function tryAutoBreakthrough() {
  const nextStage = cultivationStages[player.currentStageIndex + 1];
  if (nextStage && Math.random() < 0.05 && player.qi >= nextStage.qiNeeded) {
    player.currentStageIndex++;
    showNotification("A cosmic force stirs... You’ve broken through to " + nextStage.name + "!");
  }
}
setInterval(tryAutoBreakthrough, 30000);

window.onbeforeunload = () => {
  localStorage.setItem("lastLogin", Date.now());
  localStorage.setItem("playerData", JSON.stringify(player));
};

function loadGame() {
  const savedPlayer = localStorage.getItem("playerData");
  if (savedPlayer) {
    player = JSON.parse(savedPlayer);
  }
}

function forceSave() {
  localStorage.setItem("playerData", JSON.stringify(player));
  const now = new Date().toLocaleTimeString();
  localStorage.setItem("lastSave", now);
  showNotification("Game saved manually!");
}

const achievementList = [
  {
    name: "First 100 Qi",
    reward: 5,
    check: () => player.qi >= 100
  },
  {
    name: "Reached Foundation Stage",
    reward: 10,
    check: () => player.currentStageIndex >= 2
  },
  {
    name: "Master Alchemist",
    reward: 15,
    check: () => player.potionsBrewed >= 3
  },
  {
    name: "Power Spike Master",
    reward: 5,
    check: () => {
      const currentMin = cultivationStages[player.currentStageIndex].qiNeeded;
      const nextMin = cultivationStages[player.currentStageIndex + 1]?.qiNeeded || Infinity;
      return player.qi - currentMin >= 1000 && player.qi < nextMin;
    }
  },
  {
    name: "Strong Body Disciple",
    reward: 5,
    check: () => player.bodyStrength >= 5
  }
];

function checkAchievements() {
  achievementList.forEach(ach => {
    if (!player.achievements.includes(ach.name) && ach.check()) {
      player.achievements.push(ach.name);
      player.spiritStones += ach.reward;
      showNotification("Achievement Unlocked: " + ach.name + "! You earned " + ach.reward + " Spirit Stones.");
    }
  });
  updateDisplay();
}

function checkQuests() {
  quests.forEach(quest => {
    if (!quest.completed) {
      switch (quest.title) {
        case "First Steps":
          if (player.qi >= 500) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;

        case "Herbalist":
          if (player.potionsBrewed >= 1) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;

        case "Power Spike":
          const currentMin = cultivationStages[player.currentStageIndex].qiNeeded;
          const nextMin = cultivationStages[player.currentStageIndex + 1]?.qiNeeded || Infinity;
          if (player.qi - currentMin >= 1000 && player.qi < nextMin) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;

        case "Bodybuilder":
          if (player.bodyStrength >= 5) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;

        case "Fortune Seeker":
          if (player.luck > 1 || player.inventory.includes("herb")) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;

        case "Master of Focus":
          if (window.innerFocusUsed) {
            quest.completed = true;
            player.spiritStones += quest.reward;
            showNotification(`Quest Completed: ${quest.title}!`);
          }
          break;
      }
    }
  });
  updateDisplay();
}

function updateDisplay() {
  document.getElementById('qi').innerText = Math.floor(player.qi);
  document.getElementById('stage').innerText = cultivationStages[player.currentStageIndex].name;
  document.getElementById('spirit').innerText = player.spirit;
  document.getElementById('bodyStrength').innerText = player.bodyStrength;
  document.getElementById('items').innerText = player.inventory.length ? player.inventory.length : 'None';
  document.getElementById('spiritStones').innerText = player.spiritStones;
  document.getElementById('inventory').innerText = player.inventory.length ? player.inventory.join(', ') : 'None';
  document.getElementById('lastSaved').innerText = localStorage.getItem("lastSave") || "Never";
  document.getElementById('version').innerText = GAME_VERSION;

  const leaderboardList = document.getElementById("leaderboard");
  const allPlayers = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  const youIndex = allPlayers.findIndex(p => p.name === "You");
  if (youIndex !== -1) {
    allPlayers[youIndex].score = player.qi;
  } else {
    allPlayers.push({ name: "You", score: player.qi });
  }

  allPlayers.sort((a, b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(allPlayers));

  leaderboardList.innerHTML = "";
  allPlayers.slice(0, 5).forEach(entry => {
    leaderboardList.innerHTML += `<li>${entry.name} – ${entry.score} Qi</li>`;
  });

  const questLog = document.getElementById("questLog");
  if (questLog) {
    questLog.innerHTML = "";
    quests.forEach(q => {
      const status = q.completed ? "Completed" : "Locked";
      questLog.innerHTML += `<div>[${status}] <strong>${q.title}</strong>: ${q.description}<br/>Reward: ${q.reward}</div>`;
    });
  }

  const achievementLog = document.getElementById("achievementLog");
  if (achievementLog) {
    achievementLog.innerHTML = "";
    if (player.achievements.length === 0) {
      achievementLog.innerHTML = "<li>No achievements yet.</li>";
    } else {
      player.achievements.forEach(ach => {
        achievementLog.innerHTML += `<li>? ${ach}</li>`;
      });
    }
  }
}

setInterval(updateDisplay, 1000);

function showNotification(message) {
  const notif = document.getElementById("notification");
  notif.innerText = message;
  notif.classList.add("show");
  setTimeout(() => {
    notif.classList.remove("show");
  }, 3000);
}