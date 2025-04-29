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
  achievements: [] // ?? NEW!
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

  // Offline gains
  let lastLoginTime = localStorage.getItem("lastLogin");
  if (!lastLoginTime) lastLoginTime = Date.now();

  const timeOfflineSec = (Date.now() - lastLoginTime) / 1000;
  const baseRate = 1;
  player.qi += timeOfflineSec * baseRate;

  checkStage();
  tryAutoBreakthrough();
  checkQuests();
  updateDisplay();
});

// Manual Qi gain
function gainQi(amount = 1) {
  if (player.skills.innerFocus) amount *= 2;
  player.qi += amount;
  checkStage();
  checkQuests();
  updateDisplay();
  checkAchievements();
}

// Meditation Mode
function startMeditation() {
  if (isMeditating) return;
  isMeditating = true;
  alert("Entering meditation...");

  let duration = 0;
  const meditationTimer = setInterval(() => {
    duration++;

    player.qi += 2;

    if (Math.random() < 0.01) {
      clearInterval(meditationTimer);
      isMeditating = false;
      player.qi -= 100;
      alert("Meditation deviation! Lost 100 Qi.");
      updateDisplay();
      return;
    }

    checkStage();
    checkQuests();
    updateDisplay();

    if (duration >= 60) {
      clearInterval(meditationTimer);
      isMeditating = false;
      alert("Meditation complete!");
    }
  }, 1000);
}

// Divine Tribulation
function triggerTribulation() {
  let strikes = 3;
  alert("A divine tribulation approaches!");

  while (strikes > 0) {
    const dmg = Math.floor(Math.random() * 500);
    if (player.tribulationResistance > Math.random() * 10) {
      alert("Resisted heavenly bolt!");
    } else {
      player.qi -= dmg;
      alert("Tribulation hit! Lost " + dmg + " Qi.");
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
    alert("Brewed a spiritual potion! Your Spirit increased by 1.");
    checkQuests();
    updateDisplay();
    checkAchievements();
  } else {
    alert("You need an herb to brew!");
  }
}

// Buy Item
function buyItem(item) {
  if (player.spiritStones >= 1) {
    player.spiritStones--;
    player.inventory.push(item);
    alert("You bought an herb!");
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
    alert("You unlocked " + skill.name + "!");
    updateDisplay();
  } else {
    alert("Not enough Spirit Stones or already learned.");
  }
}

// Check stage advancement
function checkStage() {
  while (
    player.currentStageIndex < cultivationStages.length - 1 &&
    player.qi >= cultivationStages[player.currentStageIndex + 1].qiNeeded
  ) {
    player.currentStageIndex++;
    alert("You've ascended to " + cultivationStages[player.currentStageIndex].name + "!");
  }
}

// Auto breakthrough chance
function tryAutoBreakthrough() {
  const chance = Math.random();
  const nextStage = cultivationStages[player.currentStageIndex + 1];
  if (nextStage && chance < 0.05 && player.qi >= nextStage.qiNeeded) {
    player.currentStageIndex++;
    alert("A cosmic force stirs... You’ve broken through to " + nextStage.name + "!");
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
  localStorage.setItem("lastSave", new Date().toLocaleTimeString());
  alert("Game saved manually!");
}
// achivements
function checkAchievements() {
  if (player.qi >= 100 && !player.achievements.includes("First 100 Qi")) {
    player.achievements.push("First 100 Qi");
    player.spiritStones += 5;
    alert("Achievement Unlocked: First 100 Qi! You earned 5 Spirit Stones.");
  }

  if (player.currentStageIndex >= 2 && !player.achievements.includes("Reached Foundation Stage")) {
    player.achievements.push("Reached Foundation Stage");
    player.spiritStones += 10;
    alert("Achievement Unlocked: Reached Foundation Stage! You earned 10 Spirit Stones.");
  }

  if (player.potionsBrewed >= 3 && !player.achievements.includes("Master Alchemist")) {
    player.achievements.push("Master Alchemist");
    player.spiritStones += 15;
    alert("Achievement Unlocked: Master Alchemist! You earned 15 Spirit Stones.");
  }
  updateDisplay();
}

// Update UI
function updateDisplay() {
  document.getElementById('qi').innerText = Math.floor(player.qi);
  document.getElementById('stage').innerText = cultivationStages[player.currentStageIndex].name;
  document.getElementById('spirit').innerText = player.spirit;
  document.getElementById('bodyStrength').innerText = player.bodyStrength;
  document.getElementById('items').innerText = player.inventory.length || 'None';
  document.getElementById('spiritStones').innerText = player.spiritStones;
  document.getElementById('inventory').innerText = player.inventory.length ? player.inventory.join(', ') : 'None';
  document.getElementById('lastSaved').innerText = localStorage.getItem("lastSave") || "Never";
  document.getElementById('version').innerText = GAME_VERSION;
// Update leaderboard
const leaderboardList = document.getElementById("leaderboard");
const allPlayers = JSON.parse(localStorage.getItem("leaderboard") || "[]");

// Add current player if not already there
if (!allPlayers.some(p => p.name === "You")) {
  allPlayers.push({ name: "You", score: player.qi });
}

// Sort by score descending
allPlayers.sort((a, b) => b.score - a.score);

// Save updated list
localStorage.setItem("leaderboard", JSON.stringify(allPlayers));

// Display top 5
leaderboardList.innerHTML = "";
allPlayers.slice(0, 5).forEach((entry, i) => {
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