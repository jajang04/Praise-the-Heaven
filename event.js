// Event System for Random Cultivation Encounters
class EventSystem {
  constructor() {
    this.events = [
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
      {
        name: "Spirit Herb",
        description: "You find a rare spirit herb glowing with energy.",
        condition: (p) => true,
        effect: (p) => {
          p.herbs = (p.herbs || 0) + 1;
          return "Found 1 rare spirit herb";
        },
        rarity: "common"
      },
      {
        name: "Bandit Ambush",
        description: "A group of rogue cultivators attempts to rob you!",
        condition: (p) => p.qi >= 1000,
        effect: (p) => {
          const success = Math.random() < 0.7 + (p.combatPower || 0);
          if (success) {
            const loot = 50 + Math.floor(Math.random() * 100);
            p.spiritStones += loot;
            return `Defeated the bandits! Gained ${loot} Spirit Stones`;
          } else {
            const loss = Math.floor(p.qi * 0.2);
            p.qi = Math.max(0, p.qi - loss);
            return `Lost the fight! ${loss} Qi damaged`;
          }
        },
        rarity: "common"
      },
      {
        name: "Daoist Elder",
        description: "A wandering elder offers you guidance.",
        condition: (p) => p.karma >= 3,
        effect: (p) => {
          p.spirit += 2;
          return "Elder's wisdom increased your Spirit by 2";
        },
        rarity: "rare"
      },
      {
        name: "Heavenly Revelation",
        description: "The heavens part and you receive divine insight.",
        condition: (p) => p.currentStage >= 5,
        effect: (p) => {
          p.daoInsights = p.daoInsights || [];
          if (!p.daoInsights.includes("revelation")) {
            p.daoInsights.push("revelation");
            p.fate += 1;
            return "Gained Heavenly Revelation! Fate +1";
          }
          return "The heavens remain silent this time";
        },
        rarity: "legendary"
      },
      {
        name: "Auction House",
        description: "A traveling merchant offers rare goods.",
        condition: (p) => p.spiritStones >= 100,
        effect: (p) => {
          const options = [
            { cost: 100, effect: () => { p.herbs += 3; return "Bought 3 spirit herbs"; } },
            { cost: 200, effect: () => { p.qi += 1000; return "Gained 1000 Qi from spirit pill"; } },
            { cost: 300, effect: () => { p.spirit += 1; return "Permanent Spirit +1"; } }
          ];
          
          const choice = options[Math.floor(Math.random() * options.length)];
          if (p.spiritStones >= choice.cost) {
            p.spiritStones -= choice.cost;
            return choice.effect();
          }
          return "Not enough stones for the auction";
        },
        rarity: "uncommon"
      },
      {
        name: "Tribulation Lightning",
        description: "A stray bolt of tribulation lightning strikes nearby!",
        condition: (p) => p.currentStage >= 4,
        effect: (p) => {
          if (Math.random() < 0.3) {
            const gain = 2000;
            p.qi += gain;
            return `Harnessed the lightning! Gained ${gain} Qi`;
          } else {
            const loss = Math.floor(p.qi * 0.4);
            p.qi = Math.max(0, p.qi - loss);
            return `Struck by lightning! Lost ${loss} Qi`;
          }
        },
        rarity: "rare"
      }
    ];

    this.eventCooldown = false;
    this.initializeTimers();
  }

  initializeTimers() {
    // Regular random events
    setInterval(() => {
      if (!this.eventCooldown && Math.random() < 0.15) {
        this.triggerRandomEvent();
        this.eventCooldown = true;
        setTimeout(() => this.eventCooldown = false, 60000);
      }
    }, 30000);

    // Special meditation events
    setInterval(() => {
      const player = window.gameState?.player;
      if (player?.meditating && Math.random() < 0.1) {
        this.triggerMeditationEvent();
      }
    }, 15000);
  }

  triggerRandomEvent() {
    const player = window.gameState.player;
    const possibleEvents = this.events.filter(e => 
      e.condition(player) && 
      (e.rarity !== "legendary" || Math.random() < 0.05)
    );

    if (possibleEvents.length === 0) return;

    const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    const result = event.effect(player);

    this.displayEvent({
      title: event.name,
      description: event.description,
      result: result,
      rarity: event.rarity
    });

    window.cultivationSystem.updateQiDisplay();
  }

  triggerMeditationEvent() {
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
      {
        title: "Inner Demon",
        description: "Dark thoughts arise during your meditation.",
        effect: (p) => {
          if (p.meditationBonus) {
            p.spirit += 0.5;
            return "Overcame inner demon! Spirit +0.5";
          } else {
            const loss = 200;
            p.qi = Math.max(0, p.qi - loss);
            return `Lost ${loss} Qi to inner demon`;
          }
        }
      },
      {
        title: "Enlightenment",
        description: "A moment of perfect clarity.",
        effect: (p) => {
          p.spirit += 0.3;
          return "Gained 0.3 Spirit from enlightenment";
        }
      }
    ];

    const player = window.gameState.player;
    const event = meditationEvents[Math.floor(Math.random() * meditationEvents.length)];
    const result = event.effect(player);

    this.displayEvent({
      title: event.title,
      description: event.description,
      result: result,
      rarity: "common"
    });

    window.cultivationSystem.updateQiDisplay();
  }

  displayEvent(eventData) {
    const eventBox = document.createElement('div');
    eventBox.className = `event-notification ${eventData.rarity}`;
    eventBox.innerHTML = `
      <h3>${eventData.title}</h3>
      <p>${eventData.description}</p>
      <div class="event-result">${eventData.result}</div>
    `;

    const log = document.querySelector('#event-log .log-content');
    log.prepend(eventBox);
    
    // Auto-scroll and limit log size
    log.scrollTop = 0;
    while (log.children.length > 10) {
      log.removeChild(log.lastChild);
    }

    // Also show as floating notification
    window.notificationSystem.show(
      `${eventData.title}: ${eventData.result}`,
      eventData.rarity === "legendary" ? "success" : "info"
    );
  }

  initializePlayer(player) {
    // Initialize any player-specific event state
    player.eventFlags = player.eventFlags || {};
  }
}

// Initialize when game loads
document.addEventListener('DOMContentLoaded', () => {
  window.eventSystem = new EventSystem();
  
  if (window.gameState) {
    window.eventSystem.initializePlayer(window.gameState.player);
  } else {
    const checkGameState = setInterval(() => {
      if (window.gameState) {
        clearInterval(checkGameState);
        window.eventSystem.initializePlayer(window.gameState.player);
      }
    }, 100);
  }
});