// Core Game System - Manages game state, initialization, saving, loading, and UI updates.
class GameSystem {
    constructor() {
      this.version = "2.5.2";
      this.saveKey = 'praiseTheHeavenSave_v1';
      this.saveInterval = null;
      this.player = null;
      this.domElements = {};
      this.notificationSystem = null;
      this.subSystems = {};
      
      this.initializeGame();
    }
  
    // --- Initialization ---
    initializeGame() {
      console.log("Initializing game systems...");
      
      this.cacheDOMElements();
      this.loadGameState();
      this.initializeSubSystems();
      this.initializePlayerSystems();
      this.attachEventListeners();
      this.updateAllDisplays();
      
      if (!this.player.root) {
        this.showRootSelectionModal();
      } else {
        this.applyRootEffect();
      }
      
      this.setupAutoSave();
      console.log(`Game initialization complete. Version: ${this.version}`);
    }
  
    initializeSubSystems() {
      this.notificationSystem = new NotificationSystem(this.domElements.notification);
      this.subSystems = {
        cultivation: new CultivationSystem(),
        sect: new SectSystem(),
        dao: new DaoSystem(),
        event: new EventSystem()
      };
      
      // Make systems globally available
      Object.entries(this.subSystems).forEach(([key, system]) => {
        window[key + 'System'] = system;
      });
      window.game = this;
      window.gameState = { player: this.player };
    }
  
    cacheDOMElements() {
      const ids = [
        'qi-value', 'qi-progress', 'stage-name', 'character-image',
        'spirit-value', 'body-value', 'fate-value', 'karma-value',
        'stones-value', 'herbs-value', 'pills-value', 'version', 'last-saved',
        'cultivate-btn', 'meditate-btn', 'breakthrough-btn', 'comprehend-btn',
        'recruit-btn', 'train-btn', 'expand-btn',
        'sect-name', 'disciple-count', 'sect-reputation', 'sect-info', 'sect-actions', 'sect-prompt',
        'notification', 'lore-modal', 'lore-title', 'lore-text', 'root-modal',
        'save-btn', 'reset-btn', 'event-log', 'dao-insights-list'
      ];
      
      ids.forEach(id => {
        this.domElements[id] = document.getElementById(id);
        if (!this.domElements[id]) {
          console.warn(`DOM element with ID '${id}' not found during caching.`);
        }
      });
  
      // Cache elements with classes
      this.domElements.modalCloseButtons = document.querySelectorAll('.modal .close-btn');
      this.domElements.loreButtons = document.querySelectorAll('.lore-btn');
      this.domElements.rootButtons = document.querySelectorAll('#root-modal button[data-root]');
    }
  
    // --- Player State Management ---
    createNewPlayer() {
      return {
        qi: 0,
        spirit: 1,
        body: 1,
        fate: 1,
        karma: 0,
        spiritStones: 0,
        currentStage: 0,
        rebirths: 0,
        root: null,
        qiMultiplier: 1,
        skills: {},
        sect: null,
        daoInsights: [],
        herbs: 0,
        pills: 0,
        lastSave: null,
        meditating: true,
        qiIdleGain: 0.1,
        combatPower: 1,
        tribulationResist: 0,
        breakthroughBonus: 1
      };
    }
  
    loadGameState() {
      const savedGame = localStorage.getItem(this.saveKey);
      if (!savedGame) {
        this.player = this.createNewPlayer();
        return;
      }
  
      try {
        const parsed = JSON.parse(savedGame);
        if (parsed && typeof parsed.qi !== 'undefined') {
          this.player = {
            ...this.createNewPlayer(),
            ...parsed,
            lastSave: parsed.lastSave ? new Date(parsed.lastSave) : null
          };
          
          // Ensure nested objects
          this.player.sect = this.player.sect || null;
          this.player.skills = this.player.skills || {};
          this.player.daoInsights = this.player.daoInsights || [];
          
          console.log("Game loaded successfully from localStorage.");
          this.notificationSystem?.show("Game loaded.", "info");
        } else {
          throw new Error("Invalid save data structure.");
        }
      } catch (e) {
        console.error("Failed to parse save data. Creating new game.", e);
        localStorage.removeItem(this.saveKey);
        this.player = this.createNewPlayer();
        this.notificationSystem?.show("Failed to load save. Started new game.", "danger");
      }
      
      window.gameState = { player: this.player };
    }
  
    // --- Save/Load System ---
    saveGame() {
      if (!this.player) {
        console.error("Cannot save game: Player data missing.");
        return false;
      }
  
      try {
        this.player.lastSave = new Date();
        localStorage.setItem(this.saveKey, JSON.stringify(this.player));
        
        // UI Feedback
        const saveBtn = this.domElements['save-btn'];
        if (saveBtn) {
          saveBtn.textContent = 'Progress Saved!';
          setTimeout(() => {
            saveBtn.textContent = 'Preserve Cultivation';
          }, 1500);
        }
        
        if (this.domElements['last-saved']) {
          this.domElements['last-saved'].textContent = `Last saved: ${this.formatTime(this.player.lastSave)}`;
        }
        
        return true;
      } catch (e) {
        console.error("Save failed:", e);
        const message = e.name === 'QuotaExceededError' 
          ? "LocalStorage quota exceeded! Cannot save." 
          : "Failed to save progress!";
        this.notificationSystem.show(message, "danger");
        return false;
      }
    }
  
    resetGame() {
      if (confirm("This will erase all progress. Are you sure you want to reset?")) {
        localStorage.removeItem(this.saveKey);
        this.player = this.createNewPlayer();
        window.gameState.player = this.player;
        
        // Reset all subsystems
        Object.values(this.subSystems).forEach(system => {
          if (system.initializePlayer) {
            system.initializePlayer(this.player);
          }
        });
        
        // Clear event log
        const logContent = this.domElements['event-log']?.querySelector('.log-content');
        if (logContent) logContent.innerHTML = '';
        
        this.updateAllDisplays();
        this.showRootSelectionModal();
        this.notificationSystem.show("Game has been reset.", "success");
      }
    }
  
    setupAutoSave() {
      if (this.saveInterval) clearInterval(this.saveInterval);
      this.saveInterval = setInterval(() => {
        const success = this.saveGame();
        if (success && this.domElements['last-saved'] && this.player.lastSave) {
          this.domElements['last-saved'].textContent = `Last saved: ${this.formatTime(this.player.lastSave)}`;
        }
      }, 30000);
    }
  
    // --- Root Selection ---
    showRootSelectionModal() {
      this.showModal(this.domElements['root-modal']);
    }
  
    selectRoot(rootId) {
      if (!this.player || !this.subSystems.cultivation?.roots[rootId]) return;
      
      this.player.root = rootId;
      this.applyRootEffect();
      this.hideModal(this.domElements['root-modal']);
      
      const rootName = this.subSystems.cultivation.roots[rootId].name;
      this.notificationSystem.show(`You possess the ${rootName}!`, "success");
      this.updateAllDisplays();
      this.saveGame();
    }
  
    applyRootEffect() {
      if (this.player?.root && this.subSystems.cultivation?.roots[this.player.root]) {
        this.subSystems.cultivation.roots[this.player.root].effect(this.player);
      }
    }
  
    // --- UI Updates ---
    updateAllDisplays() {
      if (!this.player) return;
      
      // Update all subsystems
      this.subSystems.cultivation?.updateStageDisplay();
      this.subSystems.sect?.updateSectDisplay();
      this.subSystems.dao?.updateDaoDisplay();
      
      // Update core stats
      this.updateStatDisplay('spirit-value', this.player.spirit?.toFixed(2));
      this.updateStatDisplay('body-value', this.player.body?.toFixed(2));
      this.updateStatDisplay('fate-value', this.player.fate?.toFixed(2));
      this.updateStatDisplay('karma-value', this.player.karma);
      
      // Update resources
      this.updateStatDisplay('stones-value', this.player.spiritStones);
      this.updateStatDisplay('herbs-value', this.player.herbs?.toFixed(1));
      this.updateStatDisplay('pills-value', this.player.pills);
      
      // Update footer
      this.updateStatDisplay('version', `v${this.version}`);
      this.updateStatDisplay('last-saved', 
        this.player.lastSave ? `Last saved: ${this.formatTime(this.player.lastSave)}` : 'Last saved: Never');
      
      // Update button states
      if (this.domElements['comprehend-btn']) {
        this.domElements['comprehend-btn'].disabled = this.player.qi < 500;
        this.domElements['comprehend-btn'].title = this.player.qi < 500 
          ? "Need 500 Qi to comprehend" 
          : "Attempt to comprehend the Dao (costs 500 Qi)";
      }
    }
  
    updateStatDisplay(elementId, value) {
      if (this.domElements[elementId]) {
        this.domElements[elementId].textContent = value ?? 'N/A';
      }
    }
  
    formatTime(date) {
      if (!date || !(date instanceof Date) || isNaN(date)) return 'Never';
      try {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }) + ' ' + date.toLocaleDateString();
      } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
      }
    }
  
    // --- Modal Management ---
    showModal(modalElement) {
      if (!modalElement) return;
      modalElement.style.display = 'flex';
      setTimeout(() => {
        modalElement.classList.add('show');
      }, 10);
    }
  
    hideModal(modalElement) {
      if (!modalElement) return;
      modalElement.classList.remove('show');
      modalElement.addEventListener('transitionend', () => {
        if (!modalElement.classList.contains('show')) {
          modalElement.style.display = 'none';
        }
      }, { once: true });
    }
  
    // --- Event Listeners ---
    attachEventListeners() {
      // Footer Buttons
      this.domElements['save-btn']?.addEventListener('click', () => this.saveGame());
      this.domElements['reset-btn']?.addEventListener('click', () => this.resetGame());
  
      // Modal Close Buttons
      this.domElements.modalCloseButtons?.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modal = e.target.closest('.modal');
          if (modal) this.hideModal(modal);
        });
      });
  
      // Root Selection Buttons
      this.domElements.rootButtons?.forEach(btn => {
        btn.addEventListener('click', () => this.selectRoot(btn.dataset.root));
      });
    }
  
    initializePlayerSystems() {
      if (!this.player) {
        console.error("Cannot initialize player systems: Player data missing.");
        return;
      }
      
      Object.values(this.subSystems).forEach(system => {
        if (system.initializePlayer) {
          system.initializePlayer(this.player);
        }
      });
    }
  }
  
  // Notification System
  class NotificationSystem {
    constructor(notificationElement) {
      this.notificationQueue = [];
      this.isShowing = false;
      this.notificationElement = notificationElement;
      this.timeoutId = null;
    }
  
    show(message, type = "info") {
      if (!this.notificationElement) {
        console.warn("Notification element not available.");
        return;
      }
      
      // Prevent queue overflow
      if (this.notificationQueue.length > 5) {
        this.notificationQueue.shift();
      }
      
      this.notificationQueue.push({ message, type });
      this.processQueue();
    }
  
    processQueue() {
      if (this.isShowing || this.notificationQueue.length === 0 || !this.notificationElement) return;
      
      this.isShowing = true;
      const { message, type } = this.notificationQueue.shift();
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      this.notificationElement.textContent = message;
      this.notificationElement.className = 'notification';
      this.notificationElement.classList.add(type);
      
      // Force reflow before showing
      void this.notificationElement.offsetWidth;
      this.notificationElement.classList.add('show');
      
      this.timeoutId = setTimeout(() => {
        this.notificationElement.classList.remove('show');
        this.notificationElement.addEventListener('transitionend', () => {
          this.isShowing = false;
          this.timeoutId = null;
          setTimeout(() => this.processQueue(), 50);
        }, { once: true });
      }, 3000);
    }
  }
  
  // Initialize game when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new GameSystem();
  });