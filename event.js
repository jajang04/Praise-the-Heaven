// Event System for Random Cultivation Encounters
class EventSystem {
  constructor() {
    this.events = this.initializeEvents();
    this.eventCooldown = false;
    this.initializeTimers();
  }

  initializeEvents() {
    return [
      {
        name: "Ancient Manual",
        description: "You discover an ancient cultivation manual in a forgotten cave.",
        condition: (p) => p.currentStage >= 2,
        effect: (p) => {
          p.qi += 500;
          return "Gained 500 Qi from studying the manual";
        },
        rarity: "uncommon"
      },
      // ... (other events remain similar but with improved structure)
    ];
  }

  initializeTimers() {
    // Regular random events
    this.regularEventInterval = setInterval(() => {
      if (!this.eventCooldown && Math.random() < 0.15) {
        this.triggerRandomEvent();
        this.eventCooldown = true;
        setTimeout(() => this.eventCooldown = false, 60000);
      }
    }, 30000);

    // Special meditation events
    this.meditationEventInterval = setInterval(() => {
      const player = window.gameState?.player;
      if (player?.meditating && Math.random() < 0.1) {
        this.triggerMeditationEvent();
      }
    }, 15000);
  }

  cleanupTimers() {
    if (this.regularEventInterval) clearInterval(this.regularEventInterval);
    if (this.meditationEventInterval) clearInterval(this.meditationEventInterval);
  }

  triggerRandomEvent() {
    const player = window.gameState?.player;
    if (!player) return;

    const possibleEvents = this.events.filter(e => 
      e.condition(player) && 
      this.checkRarity(e.rarity)
    );

    if (possibleEvents.length === 0) return;

    const event = this.selectRandomEvent(possibleEvents);
    this.executeEvent(event, player);
  }

  checkRarity(rarity) {
    const rarityChances = {
      common: 1,
      uncommon: 0.8,
      rare: 0.5,
      legendary: 0.05
    };
    return Math.random() < (rarityChances[rarity] || 1);
  }

  selectRandomEvent(possibleEvents) {
    // Weighted random selection could be implemented here
    return possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
  }

  executeEvent(event, player) {
    try {
      const result = event.effect(player);
      this.displayEvent({
        title: event.name,
        description: event.description,
        result: result,
        rarity: event.rarity
      });

      window.cultivationSystem?.updateQiDisplay();
      window.game?.saveGame();
    } catch (e) {
      console.error(`Error executing event ${event.name}:`, e);
    }
  }

  triggerMeditationEvent() {
    const player = window.gameState?.player;
    if (!player) return;

    const meditationEvents = [
      {
        title: "Qi Surge",
        description: "Your meditation taps into a powerful energy vein.",
        effect: (p) => {
          const gain = 300 * (p.meditationBonus ? 1.5 : 1);
          p.qi += gain;
          return `Gained ${gain} Qi from energy surge`;
        }
      },
      // ... (other meditation events)
    ];

    const event = meditationEvents[Math.floor(Math.random() * meditationEvents.length)];
    this.executeMeditationEvent(event, player);
  }

  executeMeditationEvent(event, player) {
    try {
      const result = event.effect(player);
      this.displayEvent({
        title: event.title,
        description: event.description,
        result: result,
        rarity: "common"
      });

      window.cultivationSystem?.updateQiDisplay();
      window.game?.saveGame();
    } catch (e) {
      console.error(`Error executing meditation event ${event.title}:`, e);
    }
  }

  displayEvent(eventData) {
    if (!eventData) return;

    const eventBox = document.createElement('div');
    eventBox.className = `event-notification ${eventData.rarity}`;
    eventBox.innerHTML = `
      <h3>${eventData.title}</h3>
      <p>${eventData.description}</p>
      <div class="event-result">${eventData.result}</div>
    `;

    const log = document.querySelector('#event-log .log-content');
    if (log) {
      this.addToEventLog(log, eventBox);
    }

    this.showNotification(eventData);
  }

  addToEventLog(log, eventBox) {
    log.prepend(eventBox);
    log.scrollTop = 0;
    this.limitLogSize(log);
  }

  limitLogSize(log) {
    while (log.children.length > 10) {
      log.removeChild(log.lastChild);
    }
  }

  showNotification(eventData) {
    if (!window.notificationSystem) return;
    
    const notificationType = eventData.rarity === "legendary" ? "success" : "info";
    window.notificationSystem.show(
      `${eventData.title}: ${eventData.result}`,
      notificationType
    );
  }

  initializePlayer(player) {
    player.eventFlags = player.eventFlags || {};
  }
}

// Initialize when game loads
document.addEventListener('DOMContentLoaded', () => {
  window.eventSystem = new EventSystem();
  
  if (window.gameState) {
    window.eventSystem.initializePlayer(window.gameState.player);
  }
});