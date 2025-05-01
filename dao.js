// Dao Comprehension System - Manages insights, comprehension attempts, and lore display
class DaoSystem {
    constructor() {
      this.insights = this.initializeInsights();
      this.koans = this.initializeKoans();
      this.dom = window.game?.domElements || {};
      this.idleComprehensionInterval = null;
      this.initializeEvents();
    }
  
    initializeInsights() {
      return [
        {
          id: "wuwei",
          title: "The Principle of Wu Wei",
          text: "Action through non-action. The sage cultivates without striving, letting Qi flow naturally. This enhances passive Qi accumulation.",
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
        // ... other insights ...
      ];
    }
  
    initializeKoans() {
      return [
        "What is the sound of one hand clapping?",
        "If you meet the Buddha on the road, kill him.","What was your original face before your parents were born?",
        "If you meet the Buddha on the road, kill him.",
        "The sound of one hand clapping.",
        "Not the wind, not the flag - mind is moving.",
        "All things return to the One. What does the One return to?"
      ];
    }
  
    initializeEvents() {
      try {
        // Comprehend Button
        this.dom['comprehend-btn']?.addEventListener('click', () => {
          this.attemptComprehension();
          window.game?.saveGame();
        });
  
        // Insight List Click Handler
        this.dom['dao-insights-list']?.addEventListener('click', (e) => {
          if (e.target?.classList.contains('dao-insight-item')) {
            this.showLore(e.target.dataset.id);
          }
        });
  
        console.log("Dao events initialized successfully.");
      } catch (e) {
        console.error("Error initializing Dao events:", e);
      }
    }
  
    initializePlayer(player) {
      if (!player) {
        console.error("DaoSystem: Cannot initialize null player.");
        return;
      }
  
      player.daoInsights = player.daoInsights || [];
      this.setupIdleComprehension();
      this.updateDaoDisplay();
    }
  
    setupIdleComprehension() {
      this.clearIdleInterval();
      
      this.idleComprehensionInterval = setInterval(() => {
        const player = window.game?.player;
        if (player?.meditating && Math.random() < 0.05) {
          this.attemptComprehension(true);
        }
      }, 30000);
    }
  
    clearIdleInterval() {
      if (this.idleComprehensionInterval) {
        clearInterval(this.idleComprehensionInterval);
        this.idleComprehensionInterval = null;
      }
    }
  
    attemptComprehension(isIdle = false) {
      const player = window.game?.player;
      if (!player) return;
  
      const qiCost = 500;
      if (player.qi < qiCost) {
        if (!isIdle) {
          window.notificationSystem?.show(`Need ${qiCost} Qi to attempt comprehension.`, "danger");
        }
        return;
      }
  
      player.qi -= qiCost;
      window.cultivationSystem?.updateQiDisplay();
  
      const success = this.calculateSuccessChance(player);
      if (Math.random() < success.chance) {
        this.handleComprehensionSuccess(player, isIdle);
      } else {
        this.handleComprehensionFailure(player, isIdle);
      }
    }
  
    calculateSuccessChance(player) {
      const baseChance = 0.25;
      const minSpiritForBonus = 5;
      const spiritBonus = Math.max(0, (player.spirit - minSpiritForBonus) * 0.05);
      return {
        chance: Math.min(0.85, baseChance + spiritBonus),
        spiritBonus
      };
    }
  
    handleComprehensionSuccess(player, isIdle) {
      const availableInsights = this.getAvailableInsights(player);
      
      if (availableInsights.length === 0) {
        this.handleNoAvailableInsights(player, isIdle);
        return;
      }
  
      const newInsight = this.selectRandomInsight(availableInsights);
      this.applyNewInsight(player, newInsight);
    }
  
    getAvailableInsights(player) {
      return this.insights.filter(insight =>
        !player.daoInsights.includes(insight.id) &&
        insight.requirements(player)
      );
    }
  
    handleNoAvailableInsights(player, isIdle) {
      player.spirit += 0.2;
      window.game?.updateTextContent('spirit-value', player.spirit.toFixed(2));
      
      if (!isIdle) {
        window.notificationSystem?.show(
          "You have comprehended all available Dao insights for your current level.", 
          "info"
        );
      }
    }
  
    selectRandomInsight(availableInsights) {
      return availableInsights[Math.floor(Math.random() * availableInsights.length)];
    }
  
    applyNewInsight(player, insight) {
      player.daoInsights.push(insight.id);
      
      try {
        insight.effect(player);
      } catch (e) {
        console.error(`Error applying insight effect ${insight.id}:`, e);
      }
  
      window.notificationSystem?.show(
        `New Dao Insight: ${insight.title}!`, 
        "success"
      );
      
      this.updateDaoDisplay();
      this.showLore(insight.id);
      window.game?.updateAllDisplays();
    }
  
    handleComprehensionFailure(player, isIdle) {
      const koan = this.koans[Math.floor(Math.random() * this.koans.length)];
      player.spirit += 0.05;
      window.game?.updateTextContent('spirit-value', player.spirit.toFixed(2));
  
      if (!isIdle) {
        window.notificationSystem?.show(
          `Comprehension failed. Meditate upon this: "${koan}"`, 
          "info"
        );
      }
    }
  
    showLore(insightId) {
      const insight = this.insights.find(i => i.id === insightId);
      if (!insight) return;
  
      const modal = this.dom['lore-modal'];
      const title = this.dom['lore-title'];
      const text = this.dom['lore-text'];
  
      if (modal && title && text) {
        title.textContent = insight.title;
        text.textContent = insight.text;
        window.game?.showModal(modal);
      }
    }
  
    updateDaoDisplay() {
      const player = window.game?.player;
      const listContainer = this.dom['dao-insights-list'];
      if (!player || !listContainer) return;
  
      listContainer.innerHTML = '';
  
      if (player.daoInsights?.length > 0) {
        player.daoInsights.forEach(insightId => {
          const insight = this.insights.find(i => i.id === insightId);
          if (insight) {
            const item = document.createElement('button');
            item.className = 'dao-insight-item';
            item.textContent = insight.title;
            item.title = `Click to read about: ${insight.title}`;
            item.dataset.id = insight.id;
            listContainer.appendChild(item);
          }
        });
      }
    }
  }