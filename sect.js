// Sect Management System
class SectSystem {
  constructor() {
    this.techniques = [
      {
        name: "Heavenly Sword Art",
        description: "A powerful sword technique that channels Qi through the blade",
        cost: 50,
        effect: (p) => { p.combatPower = (p.combatPower || 1) * 1.5; }
      },
      {
        name: "Phoenix Rebirth Method",
        description: "Allows recovery from near-fatal injuries",
        cost: 100,
        effect: (p) => { p.survivalChance = 0.9; }
      },
      {
        name: "Dragon Subduing Palm",
        description: "Devastating palm technique that can crush boulders",
        cost: 75,
        effect: (p) => { p.qiGainBonus = (p.qiGainBonus || 1) * 1.2; }
      },
      {
        name: "Turtle Shell Defense",
        description: "Impenetrable defensive technique",
        cost: 60,
        effect: (p) => { p.defense = (p.defense || 1) * 2; }
      },
      {
        name: "Five Elements Cycle",
        description: "Balanced technique harnessing all elements",
        cost: 150,
        effect: (p) => { 
          p.qiMultiplier = (p.qiMultiplier || 1) * 1.1;
          p.spiritGrowth = (p.spiritGrowth || 0) + 0.005;
        }
      }
    ];

    this.sectUpgrades = [
      {
        name: "Basic Training Ground",
        description: "Simple area for disciples to practice",
        cost: 100,
        effect: (s) => { s.trainingEfficiency = 1.2; }
      },
      {
        name: "Herbal Garden",
        description: "Grow your own medicinal herbs",
        cost: 200,
        effect: (s) => { s.herbProduction = 0.1; }
      },
      {
        name: "Qi Gathering Formation",
        description: "Enhances Qi concentration in your sect",
        cost: 300,
        effect: (s) => { s.qiBonus = 1.1; }
      },
      {
        name: "Library Pavilion",
        description: "Store and study cultivation manuals",
        cost: 400,
        effect: (s) => { s.researchSpeed = 1.3; }
      },
      {
        name: "Grand Hall",
        description: "Impressive structure that attracts talent",
        cost: 500,
        effect: (s) => { s.reputationGrowth = 1.5; }
      }
    ];

    this.initializeEvents();
  }

  initializeEvents() {
    document.getElementById('recruit-btn').addEventListener('click', () => this.recruitDisciple());
    document.getElementById('train-btn').addEventListener('click', () => this.trainDisciples());
    document.getElementById('expand-btn').addEventListener('click', () => this.expandSect());
  }

  recruitDisciple() {
    const player = window.gameState.player;
    const sect = player.sect;

    if (!sect) {
      this.initializeSect(player);
      return;
    }

    // Base cost increases with each disciple
    const cost = 10 + (sect.disciples * 5);

    if (player.spiritStones < cost) {
      window.notificationSystem.show(`Need ${cost} Spirit Stones to recruit`, "danger");
      return;
    }

    player.spiritStones -= cost;
    sect.disciples++;
    sect.reputation += 2;

    window.notificationSystem.show(
      `New disciple joins your sect! (Total: ${sect.disciples})`, 
      "success"
    );

    this.updateSectDisplay();
  }

  trainDisciples() {
    const player = window.gameState.player;
    const sect = player.sect;

    if (!sect || sect.disciples < 1) {
      window.notificationSystem.show("No disciples to train", "danger");
      return;
    }

    // Training consumes time but improves disciples
    const trainingPower = sect.trainingEfficiency || 1;
    const qiGain = sect.disciples * 0.5 * trainingPower;

    player.qi += qiGain;
    sect.reputation += sect.disciples * 0.1;

    window.notificationSystem.show(
      `Disciples trained! Gained ${qiGain.toFixed(1)} Qi and ${(sect.disciples * 0.1).toFixed(1)} reputation`,
      "success"
    );

    this.updateSectDisplay();
  }

  expandSect() {
    const player = window.gameState.player;
    const sect = player.sect;

    if (!sect) {
      this.initializeSect(player);
      return;
    }

    if (player.spiritStones < 100) {
      window.notificationSystem.show("Need 100 Spirit Stones to expand", "danger");
      return;
    }

    player.spiritStones -= 100;
    sect.reputation += 10;

    // Random chance to discover technique
    if (Math.random() < 0.3 && sect.techniques.length < this.techniques.length) {
      const availableTechs = this.techniques.filter(t => 
        !sect.techniques.some(st => st.name === t.name)
      );
      if (availableTechs.length > 0) {
        const newTech = availableTechs[0];
        sect.techniques.push(newTech);
        newTech.effect(player);
        window.notificationSystem.show(
          `Discovered new technique: ${newTech.name}!`, 
          "success"
        );
      }
    }

    window.notificationSystem.show(
      `Sect expanded! Reputation increased to ${sect.reputation}`,
      "success"
    );

    this.updateSectDisplay();
  }

  initializeSect(player) {
    if (!player.sect) {
      player.sect = {
        name: player.root ? `${player.root.charAt(0).toUpperCase() + player.root.slice(1)} Cloud Sect` : "Lonely Cultivator",
        disciples: 0,
        reputation: 0,
        techniques: [],
        upgrades: []
      };

      window.notificationSystem.show(
        `You have established the ${player.sect.name}!`,
        "success"
      );

      this.updateSectDisplay();
    }
  }

  updateSectDisplay() {
    const player = window.gameState.player;
    const sect = player.sect;

    if (!sect) return;

    document.getElementById('sect-name').textContent = sect.name;
    document.getElementById('disciple-count').textContent = sect.disciples;

    // Update sect management buttons
    document.getElementById('recruit-btn').textContent = 
      `Recruit Disciple (${10 + (sect.disciples * 5)} Stones)`;
    document.getElementById('train-btn').disabled = sect.disciples < 1;
    document.getElementById('expand-btn').textContent = 
      `Expand Sect (100 Stones)`;

    // Update player's spirit stones display
    document.getElementById('stones-value').textContent = player.spiritStones;
  }

  initializePlayer(player) {
    if (player.currentStage >= 2) { // Foundation Establishment or higher
      this.initializeSect(player);
    }

    // Set up idle sect production
    setInterval(() => {
      if (player.sect) {
        // Herb production from upgrades
        if (player.sect.herbProduction) {
          player.herbs = (player.herbs || 0) + player.sect.herbProduction;
          document.getElementById('herbs-value').textContent = player.herbs.toFixed(1);
        }

        // Passive reputation growth
        if (player.sect.reputationGrowth) {
          player.sect.reputation += 0.01 * player.sect.reputationGrowth;
        }
      }
    }, 10000);
  }
}

// Initialize when game loads
document.addEventListener('DOMContentLoaded', () => {
  window.sectSystem = new SectSystem();
  
  if (window.gameState) {
    window.sectSystem.initializePlayer(window.gameState.player);
  } else {
    const checkGameState = setInterval(() => {
      if (window.gameState) {
        clearInterval(checkGameState);
        window.sectSystem.initializePlayer(window.gameState.player);
      }
    }, 100);
  }
});