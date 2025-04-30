// Core Game System - Ties Everything Together
class GameSystem {
  constructor() {
    this.version = "2.5.0";
    this.saveInterval = null;
    this.initializeGame();
  }

  initializeGame() {
    // Load or create game state
    this.loadGameState();
    
    // Initialize all systems
    window.cultivationSystem = new CultivationSystem();
    window.sectSystem = new SectSystem();
    window.daoSystem = new DaoSystem();
    window.eventSystem = new EventSystem();
    window.notificationSystem = new NotificationSystem();
    
    // Initialize player in all systems
    this.initializePlayer();
    
    // Set up auto-save
    this.saveInterval = setInterval(() => this.saveGame(), 30000);
    
    // Initial UI update
    this.updateAllDisplays();
    
    // Set up root selection for new players
    if (!this.player.root) {
      this.selectRoot();
    }
  }

  loadGameState() {
    const savedGame = localStorage.getItem('praiseTheHeavenSave');
    if (savedGame) {
      this.player = JSON.parse(savedGame);
      this.player.lastSave = new Date(this.player.lastSave || Date.now());
    } else {
      this.player = this.createNewPlayer();
    }
    window.gameState = { player: this.player };
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
      completedQuests: []
    };
  }

  initializePlayer() {
    window.cultivationSystem.initializePlayer(this.player);
    window.sectSystem.initializePlayer(this.player);
    window.daoSystem.initializePlayer(this.player);
    window.eventSystem.initializePlayer(this.player);
    
    // Set up stage-based unlocks
    if (this.player.currentStage >= 2 && !this.player.sect) {
      window.sectSystem.initializeSect(this.player);
    }
  }

  selectRoot() {
    const modal = document.createElement('div');
    modal.className = 'root-selection-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Choose Your Spiritual Root</h2>
        <p>Your root determines your innate cultivation affinity</p>
        <div class="root-options">
          <button data-root="fire">Fire Root (+20% Qi)</button>
          <button data-root="water">Water Root (Safer Meditation)</button>
          <button data-root="wood">Wood Root (Spirit Growth)</button>
          <button data-root="earth">Earth Root (Tribulation Resist)</button>
          <button data-root="metal">Metal Root (Better Breakthroughs)</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const root = btn.dataset.root;
        this.player.root = root;
        window.cultivationSystem.roots[root].effect(this.player);
        document.body.removeChild(modal);
        window.notificationSystem.show(
          `You have the ${window.cultivationSystem.roots[root].name}`,
          "success"
        );
        this.updateAllDisplays();
      });
    });
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

  saveGame() {
    this.player.lastSave = new Date();
    localStorage.setItem('praiseTheHeavenSave', JSON.stringify(this.player));
    window.notificationSystem.show("Progress saved", "success");
    this.updateAllDisplays();
  }

  resetGame() {
    if (confirm("This will erase all progress. Are you sure?")) {
      localStorage.removeItem('praiseTheHeavenSave');
      this.player = this.createNewPlayer();
      window.gameState.player = this.player;
      this.initializePlayer();
      this.updateAllDisplays();
      this.selectRoot();
    }
  }
}

// Notification System
class NotificationSystem {
  constructor() {
    this.notificationQueue = [];
    this.isShowing = false;
  }

  show(message, type = "info") {
    const notification = {
      message,
      type,
      timestamp: Date.now()
    };
    
    this.notificationQueue.push(notification);
    this.processQueue();
  }

  processQueue() {
    if (this.isShowing || this.notificationQueue.length === 0) return;
    
    this.isShowing = true;
    const notification = this.notificationQueue.shift();
    const element = document.getElementById('notification');
    
    element.textContent = notification.message;
    element.className = `notification show ${notification.type}`;
    
    setTimeout(() => {
      element.classList.remove('show');
      this.isShowing = false;
      setTimeout(() => this.processQueue(), 500);
    }, 3000);
  }
}

// Initialize game when loaded
document.addEventListener('DOMContentLoaded', () => {
  window.game = new GameSystem();
  
  // Expose core functions to UI
  window.forceSave = () => window.game.saveGame();
  window.resetGame = () => window.game.resetGame();
});