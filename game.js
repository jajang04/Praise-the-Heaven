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
    soulMend: false
  },
  potionsBrewed: 0,
  achievements: []
};
let isMeditating = false;

let quests = [
  { title: "First Steps", completed: false, reward: 100, description: "Gain 500 Qi" },
  { title: "Herbalist", completed: false, reward: 1, description: "Brew a potion" }
];

const skillsData = {
  basicCultivation: { name: "Basic Cultivation", desc: "Base Qi gain +1/s" },
  innerFocus: { name: "Inner Focus", desc: "Double Qi gain for 5 minutes", cost: 3 },
  soulMend: { name: "Soul Mend", desc: "Reduces deviation chance", cost: 5 }
};

// DOM Loaded
document.addEventListener("DOMContentLoaded", function () {
  loadGame();
  updateDisplay();

  let lastLoginTime = localStorage.getItem("lastLogin") || Date.now();
  const timeOfflineSec = (Date.now() - lastLoginTime) / 1000;
  const baseRate = 1;
  player.qi += timeOfflineSec * baseRate;

  checkStage();
  tryAutoBreakthrough();
  checkQuests();
  checkAchievements();
  updateDisplay();
});

// Manual Qi gain
function gainQi(amount = 1) {
  if (player.skills.innerFocus) amount *= 2;
  player.qi += amount;

  checkStage();
  checkQuests();
  checkAchievements();
  updateDisplay();
}

// Meditation Mode
function startMeditation() {
  if (isMeditating) return;
  isMeditating = true;
  showNotification("Entering meditation...");

  let duration = 0;
  const meditationTimer = setInterval(() => {
    duration++;
    gainQi(2);

    if (Math.random() < 0.01) {
      clearInterval(meditationTimer);
      isMeditating = false;
      player.qi -= 100;
      showNotification("Meditation deviation! Lost 100 Qi.");
      updateDisplay();
      return;
    }

    if (duration >= 60) {
      clearInterval(meditationTimer);
      isMeditating = false;
      showNotification("Meditation complete!");
    }
  }, 1000);
}

// Divine Tribulation
function triggerTribulation() {
  let strikes = 3;
  showNotification("A divine tribulation approaches!");

  while (strikes > 0) {
    const dmg = Math.floor(Math.random() * 500);
    if (player.tribulationResistance > Math.random() * 10) {
      showNotification("Resisted heavenly bolt!");
    } else {
      player.qi -= dmg;
      showNotification(`Tribulation hit! Lost ${dmg} Qi.`);
    }
    strikes--;
  }

  checkStage();
  updateDisplay();
}

// Potion Crafting
function brewPotion() {
  if (player.inventory.includes("herb")) {
    const index = player.inventory.indexOf("herb");
    player.inventory.splice(index, 1);
    player.potionsBrewed++;
    player.spirit += 1;
    showNotification("Brewed a spiritual potion! Your Spirit increased by 1.");
    checkQuests();
    updateDisplay();
    checkAchievements();
  } else {
    showNotification("You need an herb to brew!");
  }
}

// Buy Item
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

// Unlock Skill
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

// Check stage advancement
function checkStage() {
  while (
    player.currentStageIndex < cultivationStages.length - 1 &&
    player.qi >= cultivationStages[player.currentStageIndex + 1].qiNeeded
  ) {
    player.currentStageIndex++;
    showNotification("You've ascended to " + cultivationStages[player.currentStageIndex].name + "!");
  }
}

// Auto breakthrough chance
function tryAutoBreakthrough() {
  const chance = Math.random();
  const nextStage = cultivationStages[player.currentStageIndex + 1];
  if (nextStage && chance < 0.05 && player.qi >= nextStage.qiNeeded) {
    player.currentStageIndex++;
    showNotification("A cosmic force stirs... You’ve broken through to " + nextStage.name + "!");
  }
}

// Save game on page close
window.onbeforeunload = () => {
  localStorage.setItem("lastLogin", Date.now());
  localStorage.setItem("playerData", JSON.stringify(player));
};

// Load saved game
function loadGame() {
  const savedPlayer = localStorage.getItem("playerData");
  if (savedPlayer) {
    player = JSON.parse(savedPlayer);
  }
}

// Force Save
function forceSave() {
  localStorage.setItem("playerData", JSON.stringify(player));
  const now = new Date().toLocaleTimeString();
  localStorage.setItem("lastSave", now);
  showNotification("Game saved manually!");
}

// Achievement system
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

// Check quest completion
function checkQuests() {
  quests.forEach(quest => {
    if (!quest.completed) {
      if (quest.description.includes("Gain") && player.qi >= 500) {
        quest.completed = true;
        player.spiritStones += quest.reward;
        showNotification(`Quest Completed: ${quest.title}!`);
      }
      if (quest.title === "Herbalist" && player.potionsBrewed >= 1) {
        quest.completed = true;
        player.spiritStones += quest.reward;
        showNotification(`Quest Completed: ${quest.title}!`);
      }
    }
  });
  updateDisplay();
}

// Update UI
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

  // Update leaderboard
  const leaderboardList = document.getElementById("leaderboard");
  const allPlayers = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  if (!allPlayers.some(p => p.name === "You")) {
    allPlayers.push({ name: "You", score: player.qi });
  }

  allPlayers.sort((a, b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(allPlayers));

  leaderboardList.innerHTML = "";
  allPlayers.slice(0, 5).forEach(entry => {
    leaderboardList.innerHTML += `<li>${entry.name} – ${entry.score} Qi</li>`;
  });

  // Update Quest Log
  const questLog = document.getElementById("questLog");
  questLog.innerHTML = "";
  quests.forEach(q => {
    const status = q.completed ? "Completed" : "Locked";
    questLog.innerHTML += `<div>[${status}] <strong>${q.title}</strong>: ${q.description}<br/>Reward: ${q.reward}</div>`;
  });
}

// Optional: Auto-refresh display every second
setInterval(updateDisplay, 1000);

// Custom Notification System
function showNotification(message) {
  const notif = document.getElementById("notification");
  notif.innerText = message;
  notif.classList.add("show");
  setTimeout(() => {
    notif.classList.remove("show");
  }, 3000);
}