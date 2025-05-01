// Sect Management System - Handles sect creation, disciples, and upgrades
class SectSystem {
  constructor() {
    this.techniques = this.initializeTechniques();
    this.sectUpgrades = this.initializeUpgrades();
    this.initializeEvents();
  }

  initializeTechniques() {
    return [
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
      // ... other techniques ...
    ];
  }

  initializeUpgrades() {
    return [
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
      // ... other upgrades ...
    ];
  }

  initializeEvents() {
    try {
      const recruitBtn = document.getElementById('recruit-btn');
      const trainBtn = document.getElementById('train-btn');
      const expandBtn = document.getElementById('expand-btn');

      if (recruitBtn) {
        recruitBtn.addEventListener('click', () => {
          this.recruitDisciple();
          window.game?.saveGame();
        });
      }

      if (trainBtn) {
        trainBtn.addEventListener('click', () => {
          this.trainDisciples();
          window.game?.saveGame();
        });
      }

      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          this.expandSect();
          window.game?.saveGame();
        });
      }
    } catch (e) {
      console.error("Error initializing sect events:", e);
    }
  }

  initializePlayer(player) {
    if (!player) return;

    // Initialize sect if player meets requirements
    if (player.currentStage >= 2 && !player.sect) {
      this.initializeSect(player);
    }

    // Set up idle sect production
    this.setupIdleProduction(player);
  }

  initializeSect(player) {
    if (player.sect) return;

    player.sect = {
      name: this.generateSectName(player),
      disciples: 0,
      reputation: 0,
      techniques: [],
      upgrades: [],
      trainingEfficiency: 1,
      herbProduction: 0,
      qiBonus: 1,
      researchSpeed: 1,
      reputationGrowth: 1
    };

    window.notificationSystem?.show(
      `You have established the ${player.sect.name}!`,
      "success"
    );

    this.updateSectDisplay();
    this.toggleSectUI(true);
  }

  generateSectName(player) {
    return player.root 
      ? `${player.root.charAt(0).toUpperCase() + player.root.slice(1)} Cloud Sect`
      : "Lonely Cultivator";
  }

  setupIdleProduction(player) {
    setInterval(() => {
      if (!player.sect) return;

      // Herb production
      if (player.sect.herbProduction > 0) {
        player.herbs = parseFloat((player.herbs || 0) + player.sect.herbProduction).toFixed(1);
        window.game?.updateTextContent('herbs-value', player.herbs);
      }

      // Passive reputation growth
      if (player.sect.reputationGrowth > 1) {
        player.sect.reputation = parseFloat((player.sect.reputation + 0.01 * player.sect.reputationGrowth).toFixed(2));
      }
    }, 10000);
  }

  recruitDisciple() {
    const player = window.gameState?.player;
    if (!player) return;

    // Initialize sect if it doesn't exist
    if (!player.sect) {
      this.initializeSect(player);
      return;
    }

    const cost = 10 + (player.sect.disciples * 5);
    if (player.spiritStones < cost) {
      window.notificationSystem?.show(`Need ${cost} Spirit Stones to recruit`, "danger");
      return;
    }

    player.spiritStones -= cost;
    player.sect.disciples++;
    player.sect.reputation += 2;

    window.notificationSystem?.show(
      `New disciple joins your sect! (Total: ${player.sect.disciples})`, 
      "success"
    );

    this.updateSectDisplay();
  }

  trainDisciples() {
    const player = window.gameState?.player;
    if (!player || !player.sect || player.sect.disciples < 1) {
      window.notificationSystem?.show("No disciples to train", "danger");
      return;
    }

    const trainingPower = player.sect.trainingEfficiency || 1;
    const qiGain = parseFloat((player.sect.disciples * 0.5 * trainingPower).toFixed(1));
    const repGain = parseFloat((player.sect.disciples * 0.1).toFixed(1));

    player.qi += qiGain;
    player.sect.reputation += repGain;

    window.notificationSystem?.show(
      `Disciples trained! Gained ${qiGain} Qi and ${repGain} reputation`,
      "success"
    );

    this.updateSectDisplay();
  }

  expandSect() {
    const player = window.gameState?.player;
    if (!player) return;

    if (!player.sect) {
      this.initializeSect(player);
      return;
    }

    if (player.spiritStones < 100) {
      window.notificationSystem?.show("Need 100 Spirit Stones to expand", "danger");
      return;
    }

    player.spiritStones -= 100;
    player.sect.reputation += 10;

    // Chance to discover new technique
    if (Math.random() < 0.3 && player.sect.techniques.length < this.techniques.length) {
      this.discoverNewTechnique(player);
    }

    window.notificationSystem?.show(
      `Sect expanded! Reputation increased to ${player.sect.reputation}`,
      "success"
    );

    this.updateSectDisplay();
  }

  discoverNewTechnique(player) {
    const availableTechs = this.techniques.filter(t => 
      !player.sect.techniques.some(st => st.name === t.name)
    );

    if (availableTechs.length > 0) {
      const newTech = availableTechs[0];
      player.sect.techniques.push(newTech);
      newTech.effect(player);
      
      window.notificationSystem?.show(
        `Discovered new technique: ${newTech.name}!`, 
        "success"
      );
    }
  }

  updateSectDisplay() {
    const player = window.gameState?.player;
    if (!player || !player.sect) return;

    // Update sect info display
    this.updateTextContent('sect-name', player.sect.name);
    this.updateTextContent('disciple-count', player.sect.disciples);
    this.updateTextContent('sect-reputation', player.sect.reputation.toFixed(1));
    this.updateTextContent('stones-value', player.spiritStones);

    // Update button states
    this.updateRecruitButton(player);
    this.updateTrainButton(player);
    this.updateExpandButton();
    
    // Toggle sect UI based on stage
    this.toggleSectUI(player.currentStage >= 2);
  }

  updateRecruitButton(player) {
    const recruitBtn = document.getElementById('recruit-btn');
    if (recruitBtn) {
      const cost = 10 + (player.sect.disciples * 5);
      recruitBtn.textContent = `Recruit Disciple (${cost} Stones)`;
    }
  }

  updateTrainButton(player) {
    const trainBtn = document.getElementById('train-btn');
    if (trainBtn) {
      trainBtn.disabled = player.sect.disciples < 1;
    }
  }

  updateExpandButton() {
    const expandBtn = document.getElementById('expand-btn');
    if (expandBtn) {
      expandBtn.textContent = `Expand Sect (100 Stones)`;
    }
  }

  toggleSectUI(show) {
    const sectActions = document.getElementById('sect-actions');
    const sectPrompt = document.getElementById('sect-prompt');
    
    if (sectActions) sectActions.style.display = show ? 'grid' : 'none';
    if (sectPrompt) sectPrompt.style.display = show ? 'none' : 'block';
  }

  updateTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
}