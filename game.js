// Cultivation Stages (Expanded)
const cultivationStages = [
  { name: "Mortal", qiNeeded: 0 },
  { name: "Essence Gathering", qiNeeded: 100 },
  { name: "Foundation Establishment", qiNeeded: 500 },
  { name: "Core Formation", qiNeeded: 2000 },
  { name: "Nascent Soul", qiNeeded: 5000 },
  { name: "Soul Transformation", qiNeeded: 10000 },
  { name: "Spirit Severing", qiNeeded: 25000 },
  { name: "Immortal Ascension", qiNeeded: 50000 },
  { name: "Divine Core", qiNeeded: 100000 },
  { name: "Void Sovereign", qiNeeded: 250000 },
  { name: "Eternal Dao", qiNeeded: 500000 }
];

const GAME_VERSION = "1.0.0";

let player = {
  qi: 0,
  spirit: 1,
  bodyStrength: 1,
  luck: 1,
  enlightenment: 1,
  tribulationResistance: 1,
  karma: 0,
  fate: 1,
  divineInsight: 0,
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
  achievements: [],
  luckyHerbCount: 0,
  tribulationSurvived: false,
  lastTribulation: 0,
  rebirthCount: 0
};

let isMeditating = false;
let meditationTimerId = null;
let skillCooldowns = {
  innerFocus: false,
  qiSurge: false
};
let currentEnemy = null;

const enemyDatabase = [
  { name: "Wolf Spirit", hp: 50, rewardQi: 100, rewardSpiritStones: 1 },
  { name: "Corrupted Cultivator", hp: 100, rewardQi: 200, rewardSpiritStones: 2 },
  { name: "Mountain Beast", hp: 200, rewardQi: 500, rewardSpiritStones: 3 },
  { name: "Ancient Demon", hp: 500, rewardQi: 1000, rewardSpiritStones: 5 }
];

const quests = [
  { title: "First Steps", completed: false, reward: 100, description: "Gain 500 Qi" },
  { title: "Herbalist", completed: false, reward: 1, description: "Brew a potion" },
  { title: "Power Spike", completed: false, reward: 2, description: "Reach 1000 Qi in one stage" },
  { title: "Bodybuilder", completed: false, reward: 3, description: "Increase Body Strength to 5" },
  { title: "Fortune Seeker", completed: false, reward: 2, description: "Use Lucky Charm or gain Luck" },
  { title: "Master of Focus", completed: false, reward: 1, description: "Activate Inner Focus once" },
  { title: "Transcend Death", completed: false, reward: 5, description: "Reincarnate once" }
];

const skillsData = {
  basicCultivation: { name: "Basic Cultivation", desc: "Base Qi gain +1/s" },
  innerFocus: { name: "Inner Focus", desc: "Double Qi gain for 5 minutes", cost: 3 },
  soulMend: { name: "Soul Mend", desc: "Reduces deviation chance", cost: 5 },
  qiSurge: { name: "Qi Surge", desc: "Triple Qi gain for 5 minutes", cost: 5 },
  bodyTempering: { name: "Body Tempering", desc: "Boosts Body Strength over time", cost: 4 },
  luckyCharm: { name: "Lucky Charm", desc: "Increases rare drop chance", cost: 6 }
};

const achievementList = [
  {
    name: "First 100 Qi",
    reward: 5,
    check: () => player.qi >= 100,
    help: "Gain 100 Qi naturally through cultivation."
  },
  {
    name: "Reached Foundation Stage",
    reward: 10,
    check: () => player.currentStageIndex >= 2,
    help: "Ascend to the Foundation Establishment stage."
  },
  {
    name: "Master Alchemist",
    reward: 15,
    check: () => player.potionsBrewed >= 3,
    help: "Successfully brew 3 potions."
  },
  {
    name: "Power Spike Master",
    reward: 5,
    check: () => {
      const currentMin = cultivationStages[player.currentStageIndex].qiNeeded;
      const nextMin = cultivationStages[player.currentStageIndex + 1]?.qiNeeded || Infinity;
      return player.qi - currentMin >= 1000 && player.qi < nextMin;
    },
    help: "Reach 1000 Qi above your current stage minimum."
  },
  {
    name: "Strong Body Disciple",
    reward: 5,
    check: () => player.bodyStrength >= 5,
    help: "Increase your Body Strength to at least 5."
  },
  {
    name: "Qi Surge Master",
    reward: 5,
    check: () => skillCooldowns.qiSurge === true,
    help: "Activate the Qi Surge skill once."
  },
  {
    name: "Body Tempering Beginner",
    reward: 7,
    check: () => player.bodyStrength >= 10,
    help: "Reach Body Strength of 10 by using Body Tempering."
  },
  {
    name: "Lucky Collector",
    reward: 6,
    check: () => player.luckyHerbCount >= 3,
    help: "Collect 3 herbs using the Lucky Charm effect."
  },
  {
    name: "Tribulation Survivor",
    reward: 8,
    check: () => player.tribulationSurvived === true,
    help: "Survive a divine Tribulation."
  },
  {
    name: "Master Alchemist II",
    reward: 12,
    check: () => player.potionsBrewed >= 10,
    help: "Brew 10 potions successfully."
  },
  {
    name: "Cycle Broken",
    reward: 10,
    check: () => player.rebirthCount >= 1,
    help: "Break free from samsara and Reborn!"
  }
];

document.addEventListener("DOMContentLoaded", () => {
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
  setupTooltips();

  setInterval(() => {
    if (player.skills.bodyTempering) {
      player.bodyStrength += 0.01;
    }
    if (player.fate > 1 && Math.random() < 0.01) {
      player.spiritStones++;
      showNotification("Fate brings you an extra Spirit Stone!");
    }
  }, 1000);

  setInterval(forceSave, 10000); // autosave every 10 seconds
});

function gainQi(amount = 1) {
  if (player.skills.innerFocus && !skillCooldowns.innerFocus) amount *= 2;
  if (player.skills.qiSurge && !skillCooldowns.qiSurge) amount *= 3;
  player.qi += amount;
  checkStage();
  checkQuests();
  checkAchievements();
}

function startMeditation() {
  if (isMeditating || meditationTimerId) return;
  isMeditating = true;
  showNotification("Entering meditation...");
  let duration = 0;
  meditationTimerId = setInterval(() => {
    duration++;
    gainQi(2);
    // Deviation chance
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
      player.luckyHerbCount++;
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
  updateDisplay();
}

function triggerTribulation(force = false) {
  const minInterval = 1000 * 60 * 5; // 5 minutes
  const now = Date.now();
  if (!force && now - player.lastTribulation < minInterval) {
    showNotification("You’ve recently faced a tribulation. Rest before tempting fate again.");
    return;
  }
  player.lastTribulation = now;
  player.tribulationSurvived = true;
  const intensityLevel = Math.floor(player.currentStageIndex / 2); // 0 to 4
  const strikes = [1, 2, 3, 4, 5][intensityLevel] || 3;
  showNotification("A Divine Tribulation Descends!");
  for (let i = 0; i < strikes; i++) {
    const dmg = Math.floor(Math.random() * 500 * (intensityLevel + 1));
    const resistRoll = Math.random() * 10;
    if (player.tribulationResistance > resistRoll) {
      showNotification("Resisted heavenly bolt!");
    } else {
      player.qi -= dmg;
      showNotification(`Tribulation struck! Lost ${dmg} Qi.`);
      player.tribulationSurvived = false;
    }
  }
  checkStage();
  checkAchievements();
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

window.onbeforeunload = () => {
  localStorage.setItem("playerData", JSON.stringify(player));
};

function loadGame() {
  const savedPlayer = localStorage.getItem("playerData");
  if (savedPlayer) player = JSON.parse(savedPlayer);
}

function forceSave() {
  localStorage.setItem("playerData", JSON.stringify(player));
  const now = new Date().toLocaleTimeString();
  localStorage.setItem("lastSave", now);
  showNotification("Game saved manually!");
}

function checkAchievements() {
  achievementList.forEach(ach => {
    if (!player.achievements.includes(ach.name) && ach.check()) {
      player.achievements.push(ach.name);
      player.spiritStones += ach.reward;
      showNotification("Achievement Unlocked: " + ach.name + "! You earned " + ach.reward + " Spirit Stones.");
    }
  });
}

function checkQuests() {
  quests.forEach(quest => {
    if (!quest.completed) {
      switch (quest.title) {
        case "First Steps":
          if (player.qi >= 500) quest.completed = true;
          break;
        case "Herbalist":
          if (player.potionsBrewed >= 1) quest.completed = true;
          break;
        case "Power Spike":
          const currentMin = cultivationStages[player.currentStageIndex].qiNeeded;
          const nextMin = cultivationStages[player.currentStageIndex + 1]?.qiNeeded || Infinity;
          if (player.qi - currentMin >= 1000 && player.qi < nextMin) quest.completed = true;
          break;
        case "Bodybuilder":
          if (player.bodyStrength >= 5) quest.completed = true;
          break;
        case "Fortune Seeker":
          if (player.luck > 1 || player.inventory.includes("herb")) quest.completed = true;
          break;
        case "Master of Focus":
          if (skillCooldowns.innerFocus) quest.completed = true;
          break;
        case "Transcend Death":
          if (player.rebirthCount >= 1) quest.completed = true;
          break;
      }
      if (quest.completed) {
        player.spiritStones += quest.reward;
        showNotification(`Quest Completed: ${quest.title}!`);
      }
    }
  });
}

function attemptRebirth() {
  if (player.currentStageIndex < 7) {
    showNotification("You must reach Immortal Ascension before attempting Rebirth.");
    return;
  }

  if (confirm("Are you sure you wish to reincarnate? This will reset progress but grant permanent benefits.")) {
    player.rebirthCount++;

    const bonusSpiritStones = Math.floor(player.spiritStones * 0.1) + player.rebirthCount * 5;
    const bonusQi = Math.floor(player.qi * 0.05) + player.rebirthCount * 100;

    player = {
      qi: bonusQi,
      spirit: player.spirit,
      bodyStrength: 1.5,
      luck: player.luck,
      enlightenment: player.enlightenment,
      tribulationResistance: player.tribulationResistance + 0.1,
      karma: player.karma - Math.floor(player.rebirthCount / 5),
      fate: player.fate + 0.1,
      divineInsight: player.divineInsight + Math.random(),
      currentStageIndex: 0,
      inventory: [],
      spiritStones: bonusSpiritStones,
      skills: player.skills,
      potionsBrewed: 0,
      achievements: player.achievements,
      luckyHerbCount: 0,
      tribulationSurvived: false,
      lastTribulation: 0,
      rebirthCount: player.rebirthCount
    };

    showNotification("You have been reborn! Your soul has grown stronger.");
    checkAchievements();
    checkQuests();
    updateDisplay();
  }
}
function attemptRebirth() {
  if (player.currentStageIndex < 7) {
    showNotification("You must reach Immortal Ascension before attempting Rebirth.");
    return;
  }

  if (confirm("Are you sure you wish to reincarnate? This will reset progress but grant permanent benefits.")) {
    player.rebirthCount++;

    const bonusSpiritStones = Math.floor(player.spiritStones * 0.1) + player.rebirthCount * 5;
    const bonusQi = Math.floor(player.qi * 0.05) + player.rebirthCount * 100;

    player = {
      qi: bonusQi,
      spirit: player.spirit,
      bodyStrength: 1.5,
      luck: player.luck,
      enlightenment: player.enlightenment,
      tribulationResistance: player.tribulationResistance + 0.1,
      karma: player.karma - Math.floor(player.rebirthCount / 5),
      fate: player.fate + 0.1,
      divineInsight: player.divineInsight + Math.random(),
      currentStageIndex: 0,
      inventory: [],
      spiritStones: bonusSpiritStones,
      skills: player.skills,
      potionsBrewed: 0,
      achievements: player.achievements,
      luckyHerbCount: 0,
      tribulationSurvived: false,
      lastTribulation: 0,
      rebirthCount: player.rebirthCount
    };

    showNotification("You have been reborn! Your soul has grown stronger.");
    checkAchievements();
    checkQuests();
    updateDisplay();
  }
}
function updateDisplay() {
  document.getElementById('qi').innerText = Math.floor(player.qi);
  document.getElementById('stage').innerText = cultivationStages[player.currentStageIndex].name;
  document.getElementById('spirit').innerText = player.spirit;
  document.getElementById('bodyStrength').innerText = player.bodyStrength.toFixed(1);
  document.getElementById('luck').innerText = player.luck.toFixed(1);
  document.getElementById('enlightenment').innerText = player.enlightenment.toFixed(1);
  document.getElementById('tribulationResistance').innerText = player.tribulationResistance.toFixed(1);
  document.getElementById('karma').innerText = player.karma.toFixed(1);
  document.getElementById('fate').innerText = player.fate.toFixed(1);
  document.getElementById('divineInsight').innerText = player.divineInsight.toFixed(1);
  document.getElementById('spiritStones').innerText = player.spiritStones;
  document.getElementById('inventory').innerText = player.inventory.length ? player.inventory.join(', ') : 'None';
  document.getElementById('lastSaved').innerText = localStorage.getItem("lastSave") || "Never";
  document.getElementById('version').innerText = GAME_VERSION;

  // Update Leaderboard
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

  // Update Quest Log
  const questLog = document.getElementById("questLog");
  if (questLog) {
    questLog.innerHTML = "";
    quests.forEach(q => {
      const status = q.completed ? "Completed" : "Locked";
      questLog.innerHTML += `<div>[${status}] <strong>${q.title}</strong>: ${q.description}<br/>Reward: ${q.reward}</div>`;
    });
  }

  // Update Achievement Log
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

  updateBattleDisplay();
}
