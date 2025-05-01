// Core Cultivation System - Manages Qi, Stages, Breakthroughs, Meditation, Roots
class CultivationSystem {
  constructor() {
    this.stages = [
      { 
        name: "Mortal", 
        qiRequired: 0, 
        description: "An ordinary mortal with no cultivation.", 
        breakthrough: { 
          requirement: (p) => p.qi >= 100, 
          description: "Sense the flow of Qi" 
        } 
      },
      {
        name: "Qi Refining",
        qiRequired: 100,
        description: "Begin refining your body and absorbing Qi",
        breakthrough: {
          requirement: (p) => p.qi >= 500 && p.spirit >= 3,
          description: "Establish your foundation in cultivation"
        }
      },
      {
        name: "Foundation Establishment",
        qiRequired: 500,
        description: "Solidify your cultivation base",
        breakthrough: {
          requirement: (p) => p.qi >= 2000 && p.body >= 5,
          description: "Form your golden core"
        }
      },
      {
        name: "Core Formation",
        qiRequired: 2000,
        description: "Your golden core takes shape",
        breakthrough: {
          requirement: (p) => p.qi >= 5000 && p.spirit >= 10,
          description: "Nurture your nascent soul"
        }
      },
      {
        name: "Nascent Soul",
        qiRequired: 5000,
        description: "Your soul begins its immortal journey",
        breakthrough: {
          requirement: (p) => p.qi >= 10000 && p.fate >= 3,
          description: "Face the heavenly tribulation"
        }
      },
      {
        name: "Soul Transformation",
        qiRequired: 10000,
        description: "Your soul undergoes metamorphosis",
        breakthrough: {
          requirement: (p) => p.qi >= 50000 && p.karma >= 5,
          description: "Ascend to immortality"
        }
      },
      {
        name: "Immortal Ascension",
        qiRequired: 50000,
        description: "You become an immortal being",
        breakthrough: {
          requirement: (p) => p.qi >= 250000 && p.rebirths >= 1,
          description: "Comprehend the void"
        }
      },
      {
        name: "Void Sovereign",
        qiRequired: 250000,
        description: "Master of cosmic emptiness",
        breakthrough: {
          requirement: (p) => p.qi >= 500000 && p.daoInsights >= 10,
          description: "Merge with the eternal Dao"
        }
      }

    ];
    this.roots = {
      fire: { 
        name: "Fire Spiritual Root", 
        description: "Enhanced Qi absorption (+20% Qi Multiplier)", 
        effect: (p) => { p.qiMultiplier = (p.qiMultiplier || 1) * 1.2; } 
      },
      water: {
        name: "Water Spiritual Root",
        description: "Calm mind prevents cultivation deviation",
        effect: (p) => { p.meditationBonus = true; }
      },
      wood: {
        name: "Wood Spiritual Root",
        description: "Natural connection enhances spirit growth",
        effect: (p) => { p.spiritGrowth = 0.01; }
      },
      earth: {
        name: "Earth Spiritual Root",
        description: "Steady progress resists tribulation damage",
        effect: (p) => { p.tribulationResist = 0.5; }
      },
      metal: {
        name: "Metal Spiritual Root",
        description: "Strong foundations improve breakthroughs",
        effect: (p) => { p.breakthroughBonus = 1.2; }
      }  
      // ... (other roots remain the same)
    };

    // Direct DOM binding instead of relying on game.domElements
    this.dom = {};
    this.meditationInterval = null;
    this.idleGainInterval = null;
    
    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindDOMElements());
    } else {
      this.bindDOMElements();
    }
  }
  
  bindDOMElements() {
    // Direct DOM element binding
    this.dom = {
      'cultivate-btn': document.getElementById('cultivate-btn'),
      'meditate-btn': document.getElementById('meditate-btn'),
      'breakthrough-btn': document.getElementById('breakthrough-btn'),
      'qi-value': document.getElementById('qi-value'),
      'qi-progress': document.getElementById('qi-progress'),
      'stage-name': document.getElementById('stage-name'),
      'character-image': document.getElementById('character-image')
    };
    
    // Initialize events after binding DOM elements
    this.initializeEvents();
    
    // Setup a safety check to handle window.game availability
    this.setupGameIntegration();
  }
  
  setupGameIntegration() {
    // Check if game object exists or wait for it
    if (window.game) {
      this.integrateWithGame();
    } else {
      // Wait for game object to be defined
      const gameCheckInterval = setInterval(() => {
        if (window.game) {
          clearInterval(gameCheckInterval);
          this.integrateWithGame();
        }
      }, 100);
      
      // Safety timeout after 5 seconds
      setTimeout(() => {
        clearInterval(gameCheckInterval);
        console.warn("Game object not found after 5 seconds");
      }, 5000);
    }
  }
  
  integrateWithGame() {
    // Update DOM references from game if they exist
    if (window.game.domElements) {
      for (const key in window.game.domElements) {
        if (window.game.domElements[key]) {
          this.dom[key] = window.game.domElements[key];
        }
      }
    }
    
    // Initialize player if available
    if (window.game.player) {
      this.initializePlayer(window.game.player);
    }
  }

  initializeEvents() {
    try {
      const { cultivateBtn, meditateBtn, breakthroughBtn } = this.getButtons();

      if (cultivateBtn) {
        // Remove any existing event listeners
        cultivateBtn.replaceWith(cultivateBtn.cloneNode(true));
        // Get fresh reference after replacing
        const freshCultivateBtn = document.getElementById('cultivate-btn');
        
        if (freshCultivateBtn) {
          freshCultivateBtn.addEventListener('click', () => {
            console.log("Gather Qi button clicked");
            this.gatherQi();
            window.game?.saveGame();
          });
          this.dom['cultivate-btn'] = freshCultivateBtn;
        }
      } else {
        console.warn("Cultivate button not found in DOM");
      }

      if (meditateBtn) {
        // Remove any existing event listeners
        meditateBtn.replaceWith(meditateBtn.cloneNode(true));
        // Get fresh reference after replacing
        const freshMeditateBtn = document.getElementById('meditate-btn');
        
        if (freshMeditateBtn) {
          freshMeditateBtn.addEventListener('click', () => {
            console.log("Meditate button clicked");
            this.toggleMeditation();
            window.game?.saveGame();
          });
          this.dom['meditate-btn'] = freshMeditateBtn;
        }
      } else {
        console.warn("Meditate button not found in DOM");
      }

      if (breakthroughBtn) {
        // Remove any existing event listeners
        breakthroughBtn.replaceWith(breakthroughBtn.cloneNode(true));
        // Get fresh reference after replacing
        const freshBreakthroughBtn = document.getElementById('breakthrough-btn');
        
        if (freshBreakthroughBtn) {
          freshBreakthroughBtn.addEventListener('click', () => {
            console.log("Breakthrough button clicked");
            this.attemptBreakthrough();
            window.game?.saveGame();
          });
          this.dom['breakthrough-btn'] = freshBreakthroughBtn;
        }
      } else {
        console.warn("Breakthrough button not found in DOM");
      }
    } catch (e) {
      console.error("Error initializing cultivation events:", e);
    }
  }
  
  getButtons() {
    return {
      cultivateBtn: this.dom['cultivate-btn'] || document.getElementById('cultivate-btn'),
      meditateBtn: this.dom['meditate-btn'] || document.getElementById('meditate-btn'),
      breakthroughBtn: this.dom['breakthrough-btn'] || document.getElementById('breakthrough-btn')
    };
  }

  initializePlayer(player) {
    if (!player) {
      console.error("CultivationSystem: Cannot initialize null player.");
      return;
    }

    // Clear existing intervals
    this.clearIntervals();

    // Set up idle gains
    this.setupIdleGains(player);
    this.updateStageDisplay();
  }

  clearIntervals() {
    if (this.meditationInterval) {
      clearInterval(this.meditationInterval);
      this.meditationInterval = null;
    }
    if (this.idleGainInterval) {
      clearInterval(this.idleGainInterval);
      this.idleGainInterval = null;
    }
  }

  setupIdleGains(player) {
    const idleTickRate = 2000;
    this.idleGainInterval = setInterval(() => {
      const currentPlayer = window.game?.player;
      if (!currentPlayer || currentPlayer.meditating) return;

      const idleGainAmount = currentPlayer.qiIdleGain || 0.1;
      this.gatherQi(idleGainAmount, false);

      if (currentPlayer.spiritGrowth > 0) {
        currentPlayer.spirit = parseFloat((currentPlayer.spirit + currentPlayer.spiritGrowth).toFixed(2));
        window.game?.updateTextContent('spirit-value', currentPlayer.spirit.toFixed(2));
      }
    }, idleTickRate);
  }

  gatherQi(baseAmount = 1, triggerEvent = true) {
    const player = window.game?.player;
    if (!player) {
      console.warn("Cannot gather Qi: player not found");
      return;
    }

    const multiplier = player.qiMultiplier || 1;
    const amount = baseAmount * multiplier;

    player.qi = parseFloat((player.qi + amount).toFixed(2));
    this.updateQiDisplay();
    
    console.log(`Gathered ${amount} Qi (${baseAmount} × ${multiplier})`);

    if (triggerEvent && Math.random() < 0.1) {
      window.eventSystem?.triggerRandomEvent();
    }
  }

  toggleMeditation() {
    const player = window.game?.player;
    const btn = this.dom['meditate-btn'] || document.getElementById('meditate-btn');
    
    if (!player) {
      console.warn("Cannot toggle meditation: player not found");
      return;
    }
    
    if (!btn) {
      console.warn("Cannot toggle meditation: button not found");
      return;
    }

    if (player.meditating) {
      this.endMeditation();
      console.log("Meditation ended");
      window.notificationSystem?.show("You stop meditating.", "info");
    } else {
      this.startMeditation(player, btn);
      console.log("Meditation started");
    }
  }

  startMeditation(player, btn) {
    if (this.meditationInterval) clearInterval(this.meditationInterval);

    player.meditating = true;
    btn.textContent = "Meditating...";
    btn.disabled = true;

    const meditationTickRate = 1000;
    const meditationQiGain = 2;
    const deviationChance = 0.01;
    const deviationQiLoss = 100;

    this.meditationInterval = setInterval(() => {
      const currentPlayer = window.game?.player;
      if (!currentPlayer || !currentPlayer.meditating) {
        this.endMeditation();
        return;
      }

      this.gatherQi(meditationQiGain, false);

      if (!currentPlayer.meditationBonus && Math.random() < deviationChance) {
        currentPlayer.qi = Math.max(0, currentPlayer.qi - deviationQiLoss);
        window.notificationSystem?.show(`Qi deviation! Lost ${deviationQiLoss} Qi. Meditation stopped.`, "danger");
        this.endMeditation();
      }

      if (Math.random() < 0.02) {
        window.eventSystem?.triggerMeditationEvent();
      }
    }, meditationTickRate);

    window.notificationSystem?.show("You begin meditating, focusing your mind.", "info");
  }

  endMeditation() {
    const player = window.game?.player;
    const btn = this.dom['meditate-btn'] || document.getElementById('meditate-btn');

    if (this.meditationInterval) {
      clearInterval(this.meditationInterval);
      this.meditationInterval = null;
    }

    if (player) player.meditating = false;
    if (btn) {
      btn.textContent = "Meditate";
      btn.disabled = false;
    }
  }

  attemptBreakthrough() {
    const player = window.game?.player;
    if (!player) {
      console.warn("Cannot attempt breakthrough: player not found");
      return;
    }

    const currentStageIndex = player.currentStage;
    const nextStageIndex = currentStageIndex + 1;

    if (nextStageIndex >= this.stages.length) {
      window.notificationSystem?.show("You have reached the pinnacle of known cultivation.", "info");
      return;
    }

    const nextStage = this.stages[nextStageIndex];
    if (!nextStage.breakthrough.requirement(player)) {
      window.notificationSystem?.show(`Requirements not met: ${nextStage.breakthrough.description}`, "danger");
      return;
    }

    window.notificationSystem?.show("You focus your Qi, preparing to break through...", "info");

    const baseSuccessChance = 0.7;
    const finalSuccessChance = Math.min(0.95, baseSuccessChance * (player.breakthroughBonus || 1));

    setTimeout(() => {
      if (Math.random() < finalSuccessChance) {
        this.handleBreakthroughSuccess(player, nextStageIndex, nextStage);
      } else {
        this.handleBreakthroughFailure(player);
      }
      this.updateStageDisplay();
      window.game?.saveGame();
    }, 1500);
  }

  handleBreakthroughSuccess(player, nextStageIndex, nextStage) {
    player.currentStage = nextStageIndex;
    window.notificationSystem?.show(`Breakthrough SUCCESSFUL! You have reached the ${nextStage.name} realm!`, "success");
    this.applyStageUnlocks(player, nextStageIndex);

    if (nextStageIndex === 2 && !player.sect) {
      window.sectSystem?.initializeSect(player);
    }
  }

  handleBreakthroughFailure(player) {
    const baseQiLossPercent = 0.3;
    const actualQiLossPercent = baseQiLossPercent * (1 - (player.tribulationResist || 0));
    const qiLossAmount = Math.floor(player.qi * actualQiLossPercent);
    player.qi = Math.max(0, player.qi - qiLossAmount);
    window.notificationSystem?.show(`Breakthrough FAILED! Your Qi scatters, losing ${qiLossAmount} Qi.`, "danger");
  }

  applyStageUnlocks(player, newStageIndex) {
    if (newStageIndex === 3 && !player.skills?.coreManifestation) {
      player.skills = player.skills || {};
      player.skills.coreManifestation = true;
      window.notificationSystem?.show("You feel a new power welling within your core!", "info");
    }
  }

  updateQiDisplay() {
    const player = window.game?.player;
    const qiValueElement = this.dom['qi-value'] || document.getElementById('qi-value');
    const qiProgressElement = this.dom['qi-progress'] || document.getElementById('qi-progress');
    const breakthroughBtn = this.dom['breakthrough-btn'] || document.getElementById('breakthrough-btn');
    
    if (!player) {
      console.warn("Cannot update Qi display: player not found");
      return;
    }
    
    if (!qiValueElement || !qiProgressElement || !breakthroughBtn) {
      console.warn("Cannot update Qi display: required elements not found");
      return;
    }

    const currentStage = this.stages[player.currentStage];
    const nextStage = this.stages[player.currentStage + 1];

    qiValueElement.textContent = Math.floor(player.qi);

    let progressPercent = 0;
    if (nextStage) {
      const qiNeededForNext = nextStage.qiRequired - (currentStage?.qiRequired || 0);
      const qiProgressInStage = player.qi - (currentStage?.qiRequired || 0);
      progressPercent = qiNeededForNext > 0 
        ? Math.min(100, Math.max(0, (qiProgressInStage / qiNeededForNext) * 100))
        : 100;
    } else {
      progressPercent = 100;
    }
    
    qiProgressElement.style.width = `${progressPercent}%`;

    if (nextStage) {
      const canBreakthrough = nextStage.breakthrough.requirement(player);
      breakthroughBtn.disabled = !canBreakthrough;
      breakthroughBtn.title = canBreakthrough
        ? `Attempt Breakthrough to ${nextStage.name}`
        : `Requirements: ${nextStage.breakthrough.description}`;
    } else {
      breakthroughBtn.disabled = true;
      breakthroughBtn.title = "You have reached the peak of known cultivation";
    }
  }

  updateStageDisplay() {
    const player = window.game?.player;
    const stageNameElement = this.dom['stage-name'] || document.getElementById('stage-name');
    const charImageElement = this.dom['character-image'] || document.getElementById('character-image');
    
    if (!player) {
      console.warn("Cannot update stage display: player not found");
      return;
    }
    
    if (!stageNameElement || !charImageElement) {
      console.warn("Cannot update stage display: required elements not found");
      return;
    }

    const stage = this.stages[player.currentStage];
    if (!stage) {
      console.error(`Invalid stage index: ${player.currentStage}`);
      return;
    }

    stageNameElement.textContent = stage.name;

    charImageElement.className = charImageElement.className.replace(/cultivator-stage-\d+/g, '').trim();
    charImageElement.classList.add(`cultivator-stage-${player.currentStage}`);
    charImageElement.title = `${stage.name}: ${stage.description}`;

    this.updateQiDisplay();
  }
}