// Praise the Heaven: Idle Cultivation RPG v2.2.0
// Now with Spiritual Roots, Events, and Quest System

const VERSION = "2.2.0";
const STAGES = [
  { name: "Mortal", qi: 0 },
  { name: "Essence Gathering", qi: 100 },
  { name: "Foundation Establishment", qi: 500 },
  { name: "Core Formation", qi: 2000 },
  { name: "Nascent Soul", qi: 5000 },
  { name: "Soul Transformation", qi: 10000 },
  { name: "Immortal Ascension", qi: 50000 },
  { name: "Void Sovereign", qi: 250000 },
  { name: "Eternal Dao", qi: 500000 }
];

const ROOTS = {
  fire: { name: "Fire Root", desc: "+20% Qi gain", modifier: p => p.qiBonus = 1.2 },
  water: { name: "Water Root", desc: "Safer meditation", modifier: p => { p.meditationBoost = true; } },
  wood: { name: "Wood Root", desc: "+Spirit over time", modifier: p => p.spiritGrowth = true },
  earth: { name: "Earth Root", desc: "Resist trib loss", modifier: p => p.tribulationResist = true },
  metal: { name: "Metal Root", desc: "Better breakthroughs", modifier: p => p.breakthroughBonus = true }
};

const EVENTS = [
  () => notify("A passing crane drops a spiritual feather. Gain 1 spirit stone."),
  () => { player.spirit += 1; notify("You meditate under a Bodhi tree. +1 Spirit"); },
  () => { player.qi += 250; notify("You found a Qi-rich spring. +250 Qi"); },
  () => notify("A celestial bell rings in the distance. Your soul trembles..."),
  () => { player.inventory.push("herb"); notify("A rare herb grows nearby. You collect it."); }
];

const QUESTS = [
  { title: "First Qi", desc: "Reach 500 Qi", check: p => p.qi >= 500, reward: () => { player.spiritStones += 1; } },
  { title: "Potion Crafter", desc: "Brew 1 potion", check: p => p.potions >= 1, reward: () => { player.spirit += 1; } },
  { title: "Beginner Stage", desc: "Reach Foundation Establishment", check: p => p.currentStage >= 2, reward: () => { player.karma += 1; } },
  { title: "Herb Collector", desc: "Get 3 herbs", check: p => (p.herbCount || 0) >= 3, reward: () => { player.inventory.push("elixir"); } }
];

let player = {
  qi: 0,
  spirit: 1,
  bodyStrength: 1,
  fate: 1,
  karma: 0,
  divineInsight: 0,
  spiritStones: 0,
  currentStage: 0,
  inventory: [],
  skills: {},
  rebirths: 0,
  root: null,
  qiBonus: 1,
  potions: 0,
  herbCount: 0,
  completedQuests: []
};

function updateDisplay() {
  const byId = id => document.getElementById(id);
  byId("qi").innerText = Math.floor(player.qi);
  byId("spirit").innerText = player.spirit;
  byId("bodyStrength").innerText = player.bodyStrength.toFixed(1);
  byId("karma").innerText = player.karma;
  byId("fate").innerText = player.fate.toFixed(1);
  byId("divineInsight").innerText = player.divineInsight.toFixed(1);
  byId("spiritStones").innerText = player.spiritStones;
  byId("stage").innerText = STAGES[player.currentStage].name;
  byId("version").innerText = VERSION;
  byId("lastSaved").innerText = localStorage.getItem("lastSave") || "Never";

  // Quest Log
  const questLog = document.getElementById("questLog");
  if (questLog) {
    questLog.innerHTML = "";
    QUESTS.forEach(q => {
      const done = player.completedQuests.includes(q.title);
      if (!done && q.check(player)) {
        q.reward();
        player.completedQuests.push(q.title);
        notify(`Quest Complete: ${q.title}`);
      }
      questLog.innerHTML += `<div class="${done ? 'done' : ''}"><strong>${q.title}</strong>: ${q.desc}</div>`;
    });
  }
}

function gainQi(base = 1) {
  let bonus = base * (player.qiBonus || 1);
  player.qi += bonus;
  checkStageUp();
  updateDisplay();
}

function checkStageUp() {
  let next = STAGES[player.currentStage + 1];
  if (next && player.qi >= next.qi) {
    player.currentStage++;
    notify(`You've advanced to ${STAGES[player.currentStage].name}!`);
  }
}

function startMeditation() {
  notify("Meditating... Qi flows within.");
  let ticks = 0;
  let duration = player.meditationBoost ? 90 : 60;
  let interval = setInterval(() => {
    gainQi(2);
    ticks++;
    if (!player.meditationBoost && Math.random() < 0.01) {
      clearInterval(interval);
      player.qi = Math.max(0, player.qi - 100);
      notify("Deviation! Lost 100 Qi.");
    }
    if (ticks >= duration) clearInterval(interval);
  }, 1000);
}

function brewPotion() {
  if (player.inventory.includes("herb")) {
    player.spirit++;
    player.potions++;
    player.inventory.splice(player.inventory.indexOf("herb"), 1);
    notify("Brewed potion! Spirit increased.");
    updateDisplay();
  } else notify("No herb to brew.");
}

function triggerTribulation() {
  const success = Math.random() < player.fate / 10;
  if (success) {
    notify("You endured the tribulation and ascended!");
    player.qi += 5000;
  } else {
    let loss = player.tribulationResist ? 1500 : 3000;
    notify("The Heavens strike! You lose Qi.");
    player.qi = Math.max(0, player.qi - loss);
  }
  updateDisplay();
}

function attemptRebirth() {
  if (player.currentStage < 6) return notify("You must reach Immortal Ascension.");
  if (!confirm("Rebirth resets progress but grants you deeper fate. Proceed?")) return;

  player.rebirths++;
  const bonus = player.rebirths * 5;
  player = {
    qi: bonus * 10,
    spirit: 1,
    bodyStrength: 1,
    fate: 1 + player.rebirths * 0.2,
    karma: 0,
    divineInsight: 0,
    spiritStones: bonus,
    currentStage: 0,
    inventory: [],
    skills: {},
    rebirths: player.rebirths,
    root: player.root,
    qiBonus: 1,
    potions: 0,
    herbCount: 0,
    completedQuests: []
  };
  ROOTS[player.root].modifier(player);
  notify("You have been reborn. A new cycle begins.");
  updateDisplay();
}

function forceSave() {
  localStorage.setItem("praisePlayer", JSON.stringify(player));
  const now = new Date().toLocaleTimeString();
  localStorage.setItem("lastSave", now);
  notify("Progress saved.");
}

function loadGame() {
  const save = localStorage.getItem("praisePlayer");
  if (save) {
    player = JSON.parse(save);
    if (player.root && ROOTS[player.root]) ROOTS[player.root].modifier(player);
  } else {
    selectRoot();
  }
  updateDisplay();
}

function notify(msg) {
  const box = document.getElementById("notification");
  box.innerText = msg;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3000);
}

function selectRoot() {
  let choice = prompt(`Choose your Spiritual Root:\n
1. Fire – +20% Qi gain\n2. Water – Safer meditation\n3. Wood – Gain spirit over time\n4. Earth – Resist tribulation loss\n5. Metal – Easier breakthroughs\n\nEnter: fire / water / wood / earth / metal`).toLowerCase();
  if (!ROOTS[choice]) return selectRoot();
  player.root = choice;
  ROOTS[choice].modifier(player);
  alert(`You have chosen the ${ROOTS[choice].name}.`);
}

function randomEvent() {
  if (Math.random() < 0.15) {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    event();
    updateDisplay();
  }
}

window.onload = () => {
  loadGame();
  setInterval(() => gainQi(1), 1000);
  setInterval(() => { if (player.spiritGrowth) player.spirit += 0.01; }, 2000);
  setInterval(() => randomEvent(), 15000);
  setInterval(forceSave, 10000);
};
// Praise the Heaven: Idle Cultivation RPG v2.3.0
// Lore System, Events, Quests, Spiritual Roots Included

// ... (all previous game code remains unchanged)

// ?? LORE SYSTEM
const LORE_ENTRIES = [
  {
    id: "roots",
    title: "Spiritual Roots",
    text: "In the vastness of the world, five roots bind a cultivator to the elements: Fire, Water, Wood, Earth, and Metal. These roots shape one’s Dao."
  },
  {
    id: "tribulations",
    title: "Heavenly Tribulations",
    text: "When a cultivator challenges the heavens to break through, tribulations descend. Few survive, fewer transcend."
  },
  {
    id: "rebirth",
    title: "The Cycle of Samsara",
    text: "Rebirth grants wisdom through loss. Those who dare to be reborn must part with power, but gain insight eternal."
  },
  {
    id: "qi",
    title: "Qi - The Flow of All",
    text: "Qi flows in all things — mountain, tree, star. Cultivation is but harmonizing oneself with the rhythm of creation."
  }
];

function openLoreModal(id) {
  const entry = LORE_ENTRIES.find(e => e.id === id);
  if (!entry) return;
  const modal = document.getElementById("loreModal");
  modal.querySelector("#loreTitle").innerText = entry.title;
  modal.querySelector("#loreText").innerText = entry.text;
  modal.style.display = "block";
}

// Hook lore buttons (for index.html)
window.addEventListener("DOMContentLoaded", () => {
  const loreButtons = document.querySelectorAll(".lore-btn");
  loreButtons.forEach(btn => {
    btn.onclick = () => openLoreModal(btn.dataset.id);
  });
});

// Close modal via outside click
window.onclick = e => {
  const modal = document.getElementById("loreModal");
  if (e.target === modal) modal.style.display = "none";
};
