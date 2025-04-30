// Core Game System - Ties Everything Together
class GameSystem {
  constructor() {
    this.version = "2.5.2";
    this.saveInterval = null;
    this.player = this.createNewPlayer();
    window.gameState = { player: this.player };
    this.initializeGame();
  }

  createNewPlayer() {
    return {
      qi: 0,
      spirit: 1,
      body: 1,
      fate: 1,
      karma: 0,
      divineInsight: 0,
      spiritStones: 0,
      currentStage: 0,
      rebirths: 0,
      root: null,
      qiMultiplier: 1,
      inventory: [],
      skills: {},
      sect: null,
      daoInsights: [],
      herbs: 0,
      pills: 0,
      lastSave: new Date(),
      completedQuests: [],
      meditating: false
    };
  }

  loadGameState() {
    const savedGame = localStorage.getItem('praiseTheHeavenSave');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        // Merge loaded data with default player structure
        this.player = {
          ...this.createNewPlayer(),
          ...parsed,
          lastSave: new Date(parsed.lastSave || Date.now())
        };
        window.gameState.player = this.player;
        console.log("Game loaded successfully");
      } catch (e) {
        console.error("Failed to load save, creating new game:", e);
        this.player = this.createNewPlayer();
      }
    }
  }

  initializeGame() {
    console.log("Initializing game systems...");
    
    // Initialize systems in proper order
    window.notificationSystem = new NotificationSystem();
    window.cultivationSystem = new CultivationSystem();
    window.sectSystem = new SectSystem();
    window.daoSystem = new DaoSystem();
    window.eventSystem = new EventSystem();

    // Initialize player in all systems
    this.initializePlayer();

    // Set up auto-save
    this.setupAutoSave();

    // Initial UI update
    this.updateAllDisplays();

    // Set up root selection if needed
    if (!this.player.root) {
      this.selectRoot();
    }

    console.log("Game initialization complete");
  }

  initializePlayer() {
    window.cultivationSystem.initializePlayer(this.player);
    window.sectSystem.initializePlayer(this.player);
    window.daoSystem.initializePlayer(this.player);
    window.eventSystem.initializePlayer(this.player);
  }

  selectRoot() {
    const modal = document.getElementById('root-modal');
    const closeModal = () => modal.style.display = 'none';

    modal.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const root = btn.dataset.root;
        this.player.root = root;
        window.cultivationSystem.roots[root].effect(this.player);
        closeModal();
        window.notificationSystem.show(
          `You have the ${window.cultivationSystem.roots[root].name}`,
          "success"
        );
        this.updateAllDisplays();
      });
    });

    modal.style.display = 'flex';
  }

  updateAllDisplays() {
    // Update all system displays
    window.cultivationSystem.updateQiDisplay();
    window.cultivationSystem.updateStageDisplay();
    window.sectSystem.updateSectDisplay();
    
    // Update core stats
    document.getElementById('spirit-value').textContent = this.player.spirit.toFixed(2);
    document.getElementById('body-value').textContent = this.player.body.toFixed(2);
    document.getElementById('fate-value').textContent = this.player.fate.toFixed(2);
    document.getElementById('karma-value').textContent = this.player.karma;
    document.getElementById('stones-value').textContent = this.player.spiritStones;
    document.getElementById('herbs-value').textContent = this.player.herbs;
    document.getElementById('pills-value').textContent = this.player.pills;
    document.getElementById('version').textContent = `v${this.version}`;
    document.getElementById('last-saved').textContent = `Last saved: ${this.formatTime(this.player.lastSave)}`;
  }

  formatTime(date) {
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  }

  setupAutoSave() {
    if (this.saveInterval) clearInterval(this.saveInterval);
    this.saveInterval = setInterval(() => {
      const success = this.saveGame();
      if (!success) {
        console.warn("Auto-save failed, retrying...");
        setTimeout(() => this.saveGame(), 5000);
      }
    }, 30000);
  }

  saveGame() {
    try {
      this.player.lastSave = new Date();
      localStorage.setItem('praiseTheHeavenSave', JSON.stringify(this.player));
      console.log("Game saved successfully");
      window.notificationSystem.show("Progress saved", "success");
      this.updateAllDisplays();
      return true;
    } catch (e) {
      console.error("Save failed:", e);
      window.notificationSystem.show("Failed to save progress", "danger");
      return false;
    }
  }

  resetGame() {
    if (confirm("This will erase all progress. Are you sure?")) {
      localStorage.removeItem('praiseTheHeavenSave');
      this.player = this.createNewPlayer();
      window.gameState.player = this.player;
      this.initializePlayer();
      this.updateAllDisplays();
      this.selectRoot();
      window.notificationSystem.show("Game reset", "success");
    }
  }
}

class NotificationSystem {
  constructor() {
    this.notificationQueue = [];
    this.isShowing = false;
    this.notificationElement = document.getElementById('notification');
  }

  show(message, type = "info") {
    this.notificationQueue.push({ message, type });
    this.processQueue();
  }

  processQueue() {
    if (this.isShowing || this.notificationQueue.length === 0) return;
    
    this.isShowing = true;
    const { message, type } = this.notificationQueue.shift();
    
    this.notificationElement.textContent = message;
    this.notificationElement.className = `notification show ${type}`;
    
    setTimeout(() => {
      this.notificationElement.classList.remove('show');
      this.isShowing = false;
      setTimeout(() => this.processQueue(), 500);
    }, 3000);
  }
}

// Initialize game when loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded, initializing game...");
  window.game = new GameSystem();
  
  // Expose core functions to UI
  window.forceSave = () => window.game.saveGame();
  window.resetGame = () => window.game.resetGame();
  
  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });
  
  // Close button for lore modal
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('lore-modal').style.display = 'none';
  });
});