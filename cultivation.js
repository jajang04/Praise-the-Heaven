// Core Cultivation System
class CultivationSystem {
  constructor() {
    this.stages = [
      {
        name: "Mortal",
        qiRequired: 0,
        description: "An ordinary mortal with no cultivation",
        breakthrough: {
          requirement: (p) => p.qi >= 100,
          description: "Sense the flow of Qi in your surroundings"
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
        description: "Enhanced Qi absorption through yang energy",
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
    };

    this.currentStageIndex = 0;
    this.initializeEvents();
  }

  initializeEvents() {
    try {
      document.getElementById('cultivate-btn').addEventListener('click', () => {
        this.gatherQi();
        window.game.saveGame();
      });

      document.getElementById('meditate-btn').addEventListener('click', () => {
        this.startMeditation();
        window.game.saveGame();
      });

      document.getElementById('breakthrough-btn').addEventListener('click', () => {
        this.attemptBreakthrough();
        window.game.saveGame();
      });

      console.log("Cultivation events initialized successfully");
    } catch (e) {
      console.error("Error initializing cultivation events:", e);
    }
  }

  gatherQi(baseAmount = 1) {
    const player = window.gameState.player;
    if (!player) return;

    const multiplier = player.qiMultiplier || 1;
    const amount = baseAmount * multiplier;
    
    player.qi += amount;
    this.updateQiDisplay();
    
    // Small chance for random event
    if (Math.random() < 0.1) {
      window.eventSystem.triggerRandomEvent();
    }
  }

  startMeditation() {
    const player = window.gameState.player;
    const btn = document.getElementById('meditate-btn');
    if (!player || !btn) return;
    
    if (player.meditating) {
      window.notificationSystem.show("You are already meditating", "info");
      return;
    }
    
    player.meditating = true;
    btn.textContent = "Meditating...";
    btn.disabled = true;
    
    const interval = setInterval(() => {
      if (!player.meditating) {
        clearInterval(interval);
        return;
      }

      this.gatherQi(2);
      
      // Check for deviation (unless protected)
      if (!player.meditationBonus && Math.random() < 0.01) {
        player.qi = Math.max(0, player.qi - 100);
        window.notificationSystem.show("Qi deviation! Lost 100 Qi.", "danger");
        clearInterval(interval);
        this.endMeditation();
      }
    }, 1000);
    
    // Auto-stop after duration
    setTimeout(() => {
      if (player.meditating) {
        clearInterval(interval);
        this.endMeditation();
        window.notificationSystem.show("Meditation complete", "success");
      }
    }, 30000);
  }

  endMeditation() {
    const player = window.gameState.player;
    const btn = document.getElementById('meditate-btn');
    if (!player || !btn) return;
    
    player.meditating = false;
    btn.textContent = "Meditate";
    btn.disabled = false;
  }

  attemptBreakthrough() {
    const player = window.gameState.player;
    if (!player) return;

    const nextStageIndex = player.currentStage + 1;
    if (nextStageIndex >= this.stages.length) {
      window.notificationSystem.show("You have reached the pinnacle of cultivation", "info");
      return;
    }
    
    const nextStage = this.stages[nextStageIndex];
    if (!nextStage.breakthrough.requirement(player)) {
      window.notificationSystem.show("You don't meet the requirements for breakthrough", "danger");
      return;
    }
    
    // Calculate success chance
    let successChance = 0.7;
    if (player.breakthroughBonus) successChance *= player.breakthroughBonus;
    
    if (Math.random() < successChance) {
      player.currentStage = nextStageIndex;
      window.notificationSystem.show(
        `Breakthrough successful! You reached ${nextStage.name} realm`,
        "success"
      );
      
      // Stage-specific rewards
      if (player.currentStage >= 3) { // Core Formation
        player.skills.coreManifestation = true;
      }

      // Auto-create sect at Foundation Establishment
      if (player.currentStage >= 2 && !player.sect) {
        window.sectSystem.initializeSect(player);
      }
    } else {
      const qiLoss = player.tribulationResist ? 
        player.qi * 0.1 : 
        player.qi * 0.3;
      
      player.qi = Math.max(0, player.qi - qiLoss);
      window.notificationSystem.show(
        `Breakthrough failed! Lost ${Math.floor(qiLoss)} Qi`,
        "danger"
      );
    }
    
    this.updateStageDisplay();
  }

  updateQiDisplay() {
    const player = window.gameState.player;
    if (!player) return;

    const currentStage = this.stages[player.currentStage];
    const nextStage = this.stages[player.currentStage + 1];
    
    // Update numeric display
    document.getElementById('qi-value').textContent = Math.floor(player.qi);
    
    // Update progress bar
    if (nextStage) {
      const progress = (player.qi - currentStage.qiRequired) / 
                      (nextStage.qiRequired - currentStage.qiRequired);
      document.getElementById('qi-progress').style.width = `${Math.min(100, progress * 100)}%`;
    } else {
      document.getElementById('qi-progress').style.width = '100%';
    }
    
    // Enable/disable breakthrough button
    const breakthroughBtn = document.getElementById('breakthrough-btn');
    if (nextStage) {
      breakthroughBtn.disabled = !nextStage.breakthrough.requirement(player);
      breakthroughBtn.title = nextStage.breakthrough.description;
    } else {
      breakthroughBtn.disabled = true;
      breakthroughBtn.title = "You have reached the peak";
    }
  }

  updateStageDisplay() {
    const player = window.gameState.player;
    if (!player) return;

    const stage = this.stages[player.currentStage];
    document.getElementById('stage-name').textContent = stage.name;
    
    // Update character image based on stage
    const charImage = document.getElementById('character-image');
    if (charImage) {
      charImage.className = `cultivator-stage-${player.currentStage}`;
      charImage.title = stage.description;
    }
    
    this.updateQiDisplay();
  }

  initializePlayer(player) {
    if (!player) return;

    // Apply spiritual root effects
    if (player.root && this.roots[player.root]) {
      this.roots[player.root].effect(player);
    }
    
    // Set up idle gains
    setInterval(() => {
      if (!player.meditating) {
        this.gatherQi(0.1);
      }
      
      // Wood root spirit growth
      if (player.spiritGrowth) {
        player.spirit += player.spiritGrowth;
        document.getElementById('spirit-value').textContent = player.spirit.toFixed(2);
      }
    }, 2000);
    
    this.updateStageDisplay();
  }
}

// Initialize when game loads
document.addEventListener('DOMContentLoaded', () => {
  window.cultivationSystem = new CultivationSystem();
  
  if (window.gameState) {
    window.cultivationSystem.initializePlayer(window.gameState.player);
  }
});