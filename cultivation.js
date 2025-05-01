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
        // ... (other stages remain the same)
      ];
  
      this.roots = {
        fire: { 
          name: "Fire Spiritual Root", 
          description: "Enhanced Qi absorption (+20% Qi Multiplier)", 
          effect: (p) => { p.qiMultiplier = (p.qiMultiplier || 1) * 1.2; } 
        },
        // ... (other roots remain the same)
      };
  
      this.dom = window.game?.domElements || {};
      this.meditationInterval = null;
      this.idleGainInterval = null;
      this.initializeEvents();
    }
  
    initializeEvents() {
      try {
        const cultivateBtn = this.dom['cultivate-btn'];
        const meditateBtn = this.dom['meditate-btn'];
        const breakthroughBtn = this.dom['breakthrough-btn'];
  
        if (cultivateBtn) {
          cultivateBtn.addEventListener('click', () => {
            this.gatherQi();
            window.game?.saveGame();
          });
        }
  
        if (meditateBtn) {
          meditateBtn.addEventListener('click', () => {
            this.toggleMeditation();
            window.game?.saveGame();
          });
        }
  
        if (breakthroughBtn) {
          breakthroughBtn.addEventListener('click', () => {
            this.attemptBreakthrough();
            window.game?.saveGame();
          });
        }
      } catch (e) {
        console.error("Error initializing cultivation events:", e);
      }
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
      if (!player) return;
  
      const multiplier = player.qiMultiplier || 1;
      const amount = baseAmount * multiplier;
  
      player.qi = parseFloat((player.qi + amount).toFixed(2));
      this.updateQiDisplay();
  
      if (triggerEvent && Math.random() < 0.1) {
        window.eventSystem?.triggerRandomEvent();
      }
    }
  
    toggleMeditation() {
      const player = window.game?.player;
      const btn = this.dom['meditate-btn'];
      if (!player || !btn) return;
  
      if (player.meditating) {
        this.endMeditation();
        window.notificationSystem?.show("You stop meditating.", "info");
      } else {
        this.startMeditation(player, btn);
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
      const btn = this.dom['meditate-btn'];
  
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
      if (!player) return;
  
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
      if (!player || !this.dom['qi-value'] || !this.dom['qi-progress'] || !this.dom['breakthrough-btn']) return;
  
      const currentStage = this.stages[player.currentStage];
      const nextStage = this.stages[player.currentStage + 1];
  
      this.dom['qi-value'].textContent = Math.floor(player.qi);
  
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
      
      this.dom['qi-progress'].style.width = `${progressPercent}%`;
  
      const breakthroughBtn = this.dom['breakthrough-btn'];
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
      if (!player || !this.dom['stage-name'] || !this.dom['character-image']) return;
  
      const stage = this.stages[player.currentStage];
      if (!stage) {
        console.error(`Invalid stage index: ${player.currentStage}`);
        return;
      }
  
      this.dom['stage-name'].textContent = stage.name;
  
      const charImage = this.dom['character-image'];
      charImage.className = charImage.className.replace(/cultivator-stage-\d+/g, '').trim();
      charImage.classList.add(`cultivator-stage-${player.currentStage}`);
      charImage.title = `${stage.name}: ${stage.description}`;
  
      this.updateQiDisplay();
    }
  }