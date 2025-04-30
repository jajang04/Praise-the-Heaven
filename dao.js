// Dao Comprehension System
class DaoSystem {
  constructor() {
    this.insights = [
      {
        id: "wuwei",
        title: "The Principle of Wu Wei",
        text: "By non-action, all things are done. The sage cultivates without striving.",
        effect: (p) => { p.qiIdleGain = (p.qiIdleGain || 0.1) * 1.1; },
        requirements: (p) => p.spirit >= 5
      },
      {
        id: "unity",
        title: "Unity of Heaven and Man",
        text: "Heaven is eternal, Earth is lasting. The sage aligns with both.",
        effect: (p) => { p.fate += 0.5; },
        requirements: (p) => p.currentStage >= 3
      },
      {
        id: "cycle",
        title: "Cycle of Rebirth",
        text: "All things return to their root. Cultivation is the journey home.",
        effect: (p) => { p.rebirthBonus = 1.2; },
        requirements: (p) => p.rebirths >= 1
      },
      {
        id: "emptiness",
        title: "The Virtue of Emptiness",
        text: "The Dao is empty, yet infinitely useful. The sage embraces the void.",
        effect: (p) => { p.tribulationResist = (p.tribulationResist || 0) + 0.2; },
        requirements: (p) => p.qi >= 10000
      },
      {
        id: "balance",
        title: "Yin-Yang Balance",
        text: "All things carry Yin and embrace Yang. The sage harmonizes these forces.",
        effect: (p) => { 
          p.qiMultiplier = (p.qiMultiplier || 1) * 1.15;
          p.meditationBonus = true;
        },
        requirements: (p) => p.root && ['water', 'fire'].includes(p.root)
      }
    ];

    this.koans = [
      "What was your original face before your parents were born?",
      "If you meet the Buddha on the road, kill him.",
      "The sound of one hand clapping.",
      "Not the wind, not the flag - mind is moving.",
      "All things return to the One. What does the One return to?"
    ];

    this.initializeEvents();
  }

  initializeEvents() {
    document.getElementById('comprehend-btn').addEventListener('click', () => this.attemptComprehension());
    
    // Lore button events
    document.querySelectorAll('.lore-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showLore(btn.dataset.id));
    });
    
    document.querySelector('.close-btn').addEventListener('click', () => {
      document.getElementById('lore-modal').style.display = 'none';
    });
  }

  attemptComprehension() {
    const player = window.gameState.player;
    
    // Basic requirements
    if (player.qi < 500) {
      window.notificationSystem.show("You need at least 500 Qi to comprehend the Dao", "danger");
      return;
    }
    
    // Consume Qi for the attempt
    const qiCost = 500;
    player.qi -= qiCost;
    window.cultivationSystem.updateQiDisplay();
    
    // Chance based on spirit stat
    const baseChance = 0.3;
    const spiritBonus = player.spirit * 0.05;
    const totalChance = Math.min(0.9, baseChance + spiritBonus);
    
    if (Math.random() < totalChance) {
      this.gainInsight(player);
    } else {
      const randomKoan = this.koans[Math.floor(Math.random() * this.koans.length)];
      window.notificationSystem.show(
        `Comprehension failed. Meditate on this: "${randomKoan}"`,
        "info"
      );
      
      // Failed attempts still give small spirit growth
      player.spirit += 0.1;
      document.getElementById('spirit-value').textContent = player.spirit.toFixed(2);
    }
  }

  gainInsight(player) {
    // Get available insights not yet gained
    const availableInsights = this.insights.filter(insight => 
      !player.daoInsights?.includes(insight.id) && 
      insight.requirements(player)
    );
    
    if (availableInsights.length === 0) {
      window.notificationSystem.show(
        "You've comprehended all currently available Dao insights",
        "info"
      );
      return;
    }
    
    // Select random insight
    const newInsight = availableInsights[
      Math.floor(Math.random() * availableInsights.length)
    ];
    
    // Initialize array if doesn't exist
    player.daoInsights = player.daoInsights || [];
    player.daoInsights.push(newInsight.id);
    
    // Apply effect
    newInsight.effect(player);
    
    // Show notification and lore
    window.notificationSystem.show(
      `New Dao Insight: ${newInsight.title}`,
      "success"
    );
    
    // Update display
    this.updateDaoDisplay();
    
    // Automatically show the lore
    this.showLore(newInsight.id);
  }

  showLore(insightId) {
    const insight = this.insights.find(i => i.id === insightId);
    if (!insight) return;
    
    const modal = document.getElementById('lore-modal');
    document.getElementById('lore-title').textContent = insight.title;
    document.getElementById('lore-text').textContent = insight.text;
    modal.style.display = 'block';
  }

  updateDaoDisplay() {
    const player = window.gameState.player;
    const daoCount = player.daoInsights?.length || 0;
    
    // Update any UI elements that show Dao progress
    // (Can be expanded based on your HTML structure)
  }

  initializePlayer(player) {
    // Set up any initial Dao state
    player.daoInsights = player.daoInsights || [];
    
    // Set up idle comprehension chance
    setInterval(() => {
      if (player.meditating && Math.random() < 0.01) {
        this.attemptComprehension();
      }
    }, 30000);
  }
}

// Initialize when game loads
document.addEventListener('DOMContentLoaded', () => {
  window.daoSystem = new DaoSystem();
  
  if (window.gameState) {
    window.daoSystem.initializePlayer(window.gameState.player);
  } else {
    const checkGameState = setInterval(() => {
      if (window.gameState) {
        clearInterval(checkGameState);
        window.daoSystem.initializePlayer(window.gameState.player);
      }
    }, 100);
  }
});