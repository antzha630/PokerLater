const { Hand } = require('pokersolver');

class PokerGame {
  constructor(id, onUpdate) {
    this.id = id;
    this.onUpdate = onUpdate;
    this.players = new Array(9).fill(null);
    this.board = [];
    this.deck = [];
    this.pot = 0;
    this.gameState = 'WAITING';
    this.dealerPosition = 0;
    this.activePosition = -1;
    this.minRaise = 20;
    this.lastBet = 0;
    this.timer = 30;
    this.gameFeed = [];
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.actionCount = 0;
    this.shownCards = new Set(); // Player IDs who chose to show cards
    this.runItTwiceRequests = new Set(); // Player IDs who want to run it twice
    this.isRunItTwice = false;
    this.slyRevealActive = new Set(); // Masterbubby cheat
    this.nextHandRigged = false; // Masterbubby cheat
    this.interval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    if (this.activePosition !== -1 && this.gameState !== 'WAITING' && this.gameState !== 'SHOWDOWN') {
        this.timer--;
        if (this.timer <= 0) {
            const player = this.players[this.activePosition];
            if (player) {
                if (player.bet < this.lastBet) {
                    this.handleAction(player.id, { type: 'fold' });
                } else {
                    this.handleAction(player.id, { type: 'check' });
                }
            }
        }
    }
  }

  destroy() {
      clearInterval(this.interval);
  }

  addPlayer(id, name, chips, position) {
    if (this.players[position]) return false;
    this.players[position] = {
      id,
      name,
      chips,
      bet: 0,
      holeCards: [],
      isFolded: false,
      isAllIn: false,
      position,
      lastAction: ''
    };
    this.addLog(`${name} joined the table at position ${position}`);
    return true;
  }

  removePlayer(id) {
    const playerIdx = this.players.findIndex(p => p && p.id === id);
    if (playerIdx !== -1) {
      this.addLog(`${this.players[playerIdx].name} left the table`);
      const wasActive = this.activePosition === playerIdx;
      this.players[playerIdx] = null;
      
      const playersInHand = this.players.filter(p => p && !p.isFolded);
      if (playersInHand.length < 2 && this.gameState !== 'WAITING') {
          this.endHandEarly();
      } else if (wasActive) {
          this.nextTurn();
      }
    }
  }

  endHandEarly() {
      if (this.gameState === 'SHOWDOWN') return;
      const winner = this.players.find(p => p && !p.isFolded);
      if (winner && this.pot > 0) {
          winner.chips += this.pot;
          this.addLog(`${winner.name} wins ${this.pot} (others folded/left)`);
      }
      this.pot = 0;
      this.gameState = 'SHOWDOWN';
      this.activePosition = -1;
      this.timer = 0;
      setTimeout(() => this.startNewHand(), 3000);
  }

  createDeck() {
    const suits = ['s', 'h', 'd', 'c'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, id: `${rank}${suit}` });
      }
    }
    this.shuffle(deck);
    this.deck = deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  addLog(msg) {
    this.gameFeed.unshift(msg);
    if (this.gameFeed.length > 20) this.gameFeed.pop();
    if (this.onUpdate) this.onUpdate();
  }

  startNewHand() {
    // Prevent starting if game is already in progress
    if (this.gameState !== 'WAITING' && this.gameState !== 'SHOWDOWN') return;

    const activePlayersCount = this.players.filter(p => p && p.chips > 0).length;
    if (activePlayersCount < 2) {
      if (this.gameState !== 'WAITING') {
          this.gameState = 'WAITING';
          this.addLog('Waiting for more players...');
      }
      return;
    }

    this.gameState = 'PRE_FLOP';
    this.createDeck();
    
    // Clear old hands
    this.players.forEach(p => { if (p) p.holeCards = []; });

    if (this.nextHandRigged) {
        this.rigDeck();
        this.nextHandRigged = false;
    }

    this.board = [];
    this.pot = 0;
    this.lastBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.actionCount = 0;
    this.shownCards = new Set();
    this.runItTwiceRequests = new Set();
    this.isRunItTwice = false;

    // Remove bust players
    this.players = this.players.map(p => {
      if (p && p.chips <= 0) {
        this.addLog(`${p.name} was stacked and left the table`);
        return null;
      }
      return p;
    });

    this.players.forEach(p => {
      if (p) {
        // Only deal hole cards if they weren't already rigged
        if (p.holeCards.length === 0) {
            p.holeCards = [this.deck.pop(), this.deck.pop()];
        }
        p.bet = 0;
        p.isFolded = false;
        p.isAllIn = false;
        p.lastAction = '';
      }
    });

    this.dealerPosition = this.getNextSeat(this.dealerPosition);
    const sbPos = this.getNextActivePosition(this.dealerPosition);
    const bbPos = this.getNextActivePosition(sbPos);

    this.postBlind(sbPos, this.smallBlind);
    this.postBlind(bbPos, this.bigBlind);

    this.activePosition = this.getNextActivePosition(bbPos);
    this.timer = 30;
    this.addLog('New hand started.');
    if (this.onUpdate) this.onUpdate();
  }

  postBlind(pos, amount) {
    const p = this.players[pos];
    const actual = Math.min(p.chips, amount);
    p.chips -= actual;
    p.bet = actual;
    this.pot += actual;
    if (p.chips === 0) p.isAllIn = true;
    p.lastAction = actual === this.smallBlind ? 'Small Blind' : 'Big Blind';
  }

  getNextSeat(currentPos) {
      return (currentPos + 1) % 9;
  }

  getNextActivePosition(currentPos) {
    let next = (currentPos + 1) % 9;
    let count = 0;
    while (count < 9 && (!this.players[next] || this.players[next].isFolded || (this.players[next].chips === 0 && !this.players[next].isAllIn))) {
      next = (next + 1) % 9;
      count++;
    }
    return next;
  }

  handleAction(playerId, action) {
    if (this.gameState === 'SHOWDOWN' || this.gameState === 'WAITING') return false;
    const player = this.players[this.activePosition];
    if (!player || player.id !== playerId) return false;

    const { type, amount } = action;
    this.actionCount++;
    
    switch (type) {
      case 'fold':
        player.isFolded = true;
        player.lastAction = 'Fold';
        this.addLog(`${player.name} folds`);
        break;
      case 'call':
        const callAmount = this.lastBet - player.bet;
        const actualCall = Math.min(player.chips, callAmount);
        player.chips -= actualCall;
        player.bet += actualCall;
        this.pot += actualCall;
        player.lastAction = 'Call';
        if (player.chips === 0) player.isAllIn = true;
        this.addLog(`${player.name} calls`);
        break;
      case 'check':
        if (player.bet < this.lastBet) return false;
        player.lastAction = 'Check';
        this.addLog(`${player.name} checks`);
        break;
      case 'raise':
        const raiseTo = amount;
        if (raiseTo < this.lastBet + this.minRaise) return false;
        const totalToBet = raiseTo - player.bet;
        if (totalToBet > player.chips) return false;
        
        player.chips -= totalToBet;
        player.bet += totalToBet;
        this.pot += totalToBet;
        this.minRaise = raiseTo - this.lastBet;
        this.lastBet = raiseTo;
        player.lastAction = `Raise to ${raiseTo}`;
        if (player.chips === 0) player.isAllIn = true;
        this.addLog(`${player.name} raises to ${raiseTo}`);
        break;
    }

    this.nextTurn();
    if (this.onUpdate) this.onUpdate();
    return true;
  }

  nextTurn() {
    const activePlayers = this.players.filter(p => p && !p.isFolded && !p.isAllIn);
    const playersInHand = this.players.filter(p => p && !p.isFolded);
    
    // Check if hand is over (everyone folded except one)
    if (playersInHand.length === 1) {
        this.endHandEarly();
        return;
    }

    // Check if betting round is over
    const everyoneActed = this.actionCount >= playersInHand.length;
    const allBetsEqual = playersInHand.every(p => p.bet === this.lastBet || p.isAllIn);

    if (everyoneActed && allBetsEqual) {
        this.nextStage();
    } else {
        this.activePosition = this.getNextActivePosition(this.activePosition);
        // If no one can act (all in), skip to next stage
        if (this.players[this.activePosition].isAllIn || this.players[this.activePosition].isFolded) {
            this.nextTurn();
        }
    }
    this.timer = 30;
    if (this.onUpdate) this.onUpdate();
  }

  nextStage() {
    this.players.forEach(p => { if (p) { p.bet = 0; p.lastAction = ''; } });
    this.lastBet = 0;
    this.minRaise = this.bigBlind;
    this.actionCount = 0;

    const playersWithChips = this.players.filter(p => p && !p.isFolded && p.chips > 0);
    
    // If fewer than 2 players have chips left (everyone else all-in), just deal out the cards
    if (playersWithChips.length < 2) {
        this.dealToFinish();
        return;
    }

    switch (this.gameState) {
      case 'PRE_FLOP':
        this.gameState = 'FLOP';
        this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
        this.activePosition = this.getNextActivePosition(this.dealerPosition);
        break;
      case 'FLOP':
        this.gameState = 'TURN';
        this.board.push(this.deck.pop());
        this.activePosition = this.getNextActivePosition(this.dealerPosition);
        break;
      case 'TURN':
        this.gameState = 'RIVER';
        this.board.push(this.deck.pop());
        this.activePosition = this.getNextActivePosition(this.dealerPosition);
        break;
      case 'RIVER':
        this.showdown();
        break;
    }
    if (this.onUpdate) this.onUpdate();
  }

  dealToFinish() {
      while (this.board.length < 5) {
          this.board.push(this.deck.pop());
      }
      this.showdown();
  }

  showdown() {
    if (this.gameState === 'SHOWDOWN') return;
    this.gameState = 'SHOWDOWN';
    this.activePosition = -1;
    this.timer = 0;
    const activePlayers = this.players.filter(p => p && !p.isFolded);
    
    if (activePlayers.length === 0) {
        this.pot = 0;
        setTimeout(() => this.startNewHand(), 5000);
        return;
    }

    const hands = activePlayers.map(p => {
        const solverCards = [...p.holeCards, ...this.board].map(c => `${c.rank}${c.suit}`);
        const hand = Hand.solve(solverCards);
        hand.playerId = p.id;
        return hand;
    });

    const winners = Hand.winners(hands);
    
    if (this.isRunItTwice) {
        // Simple run it twice: split pot, deal another board
        // In real poker, we'd need another board and evaluate both.
        // For this version, we'll just log it and award normally as a start.
        // To truly run it twice, we need to store board2 and pot / 2.
    }

    const winAmount = Math.floor(this.pot / winners.length);
    
    winners.forEach(w => {
        const p = this.players.find(pl => pl && pl.id === w.playerId);
        p.chips += winAmount;
        this.addLog(`${p.name} wins ${winAmount} with ${w.descr}`);
    });

    this.pot = 0;
    setTimeout(() => this.startNewHand(), 5000);
  }

  rigDeck() {
    const master = this.players.find(p => p && p.name === 'masterbubby');
    if (!master) return;

    // Guaranteed win for masterbubby: Quads vs Full House
    // We'll pre-select 9 cards: 5 for the board, 2 for master, 2 for each opponent (up to available power cards)
    
    const boardCards = [
        { rank: 'A', suit: 's', id: 'As' },
        { rank: 'A', suit: 'd', id: 'Ad' },
        { rank: 'K', suit: 's', id: 'Ks' },
        { rank: '2', suit: 'c', id: '2c' },
        { rank: '3', suit: 'h', id: '3h' }
    ];

    const masterHole = [
        { rank: 'A', suit: 'c', id: 'Ac' },
        { rank: 'A', suit: 'h', id: 'Ah' }
    ];

    const opponentPowerCards = [
        { rank: 'K', suit: 'h', id: 'Kh' }, { rank: 'K', suit: 'd', id: 'Kd' },
        { rank: 'Q', suit: 's', id: 'Qs' }, { rank: 'Q', suit: 'h', id: 'Qh' },
        { rank: 'Q', suit: 'd', id: 'Qd' }, { rank: 'Q', suit: 'c', id: 'Qc' },
        { rank: 'J', suit: 's', id: 'Js' }, { rank: 'J', suit: 'h', id: 'Jh' },
        { rank: 'J', suit: 'd', id: 'Jd' }, { rank: 'J', suit: 'c', id: 'Jc' }
    ];

    // Remove these cards from the deck
    const allRiggedIds = [...boardCards, ...masterHole, ...opponentPowerCards].map(c => c.id);
    this.deck = this.deck.filter(c => !allRiggedIds.includes(c.id));

    // Assign rigged cards
    this.board = []; // We will deal these normally, but they are gone from the deck
    // Note: PokerGame.js deals from this.deck.pop(). We need to put the board cards at the bottom
    // so they don't get dealt as hole cards, OR we just modify the deal logic.
    // Better: Put the rigged board cards at the indices where they will be popped.
    
    // In PRE_FLOP, cards are dealt to players first, then deck is used for Flop/Turn/River.
    // Dealing hole cards: 2 * activePlayersCount
    const activePlayers = this.players.filter(p => p && p.chips > 0);
    
    master.holeCards = masterHole;
    
    let powerIdx = 0;
    this.players.forEach(p => {
        if (p && p.name !== 'masterbubby') {
            const c1 = opponentPowerCards[powerIdx++] || this.deck.pop();
            const c2 = opponentPowerCards[powerIdx++] || this.deck.pop();
            p.holeCards = [c1, c2];
        }
    });

    // Now place the 5 board cards at the top of the deck so they are dealt in order
    // Flop (3), Turn (1), River (1)
    // Dealing logic uses deck.pop(), so we push them in reverse order
    this.deck.push(boardCards[4]); // River
    this.deck.push(boardCards[3]); // Turn
    this.deck.push(boardCards[2]); // Flop 3
    this.deck.push(boardCards[1]); // Flop 2
    this.deck.push(boardCards[0]); // Flop 1

    this.addLog('Masterbubby: The table is set.');
  }

  toggleSlyReveal(playerId) {
    const p = this.players.find(pl => pl && pl.id === playerId);
    if (p && p.name === 'masterbubby') {
        if (this.slyRevealActive.has(playerId)) {
            this.slyRevealActive.delete(playerId);
        } else {
            this.slyRevealActive.add(playerId);
        }
        if (this.onUpdate) this.onUpdate();
    }
  }

  rigNextHand(playerId) {
    const p = this.players.find(pl => pl && pl.id === playerId);
    if (p && p.name === 'masterbubby') {
        this.nextHandRigged = true;
        this.addLog('Masterbubby is feeling lucky...');
    }
  }

  getState(viewerId) {
    const viewer = this.players.find(p => p && p.id === viewerId);
    const isMaster = viewer && viewer.name === 'masterbubby';
    const isSly = isMaster && this.slyRevealActive.has(viewerId);

    return {
      id: this.id,
      players: this.players.map(p => {
        if (!p) return null;
        const canSeeCards = p.id === viewerId || 
                           (this.gameState === 'SHOWDOWN' && !p.isFolded) ||
                           this.shownCards.has(p.id) ||
                           isSly;
        return {
          ...p,
          holeCards: canSeeCards ? p.holeCards : [null, null]
        };
      }),
      board: this.board,
      pot: this.pot,
      gameState: this.gameState,
      dealerPosition: this.dealerPosition,
      activePosition: this.activePosition,
      minRaise: this.minRaise,
      lastBet: this.lastBet,
      gameFeed: this.gameFeed,
      timer: this.timer,
      isRunItTwice: this.isRunItTwice
    };
  }

  showCards(playerId) {
    if (this.gameState === 'SHOWDOWN') {
      this.shownCards.add(playerId);
      const p = this.players.find(pl => pl && pl.id === playerId);
      if (p) this.addLog(`${p.name} shows their cards`);
      if (this.onUpdate) this.onUpdate();
    }
  }

  requestRunItTwice(playerId) {
    const activePlayersCount = this.players.filter(p => p && !p.isFolded).length;
    if (activePlayersCount === 2 && (this.gameState === 'PRE_FLOP' || this.gameState === 'FLOP' || this.gameState === 'TURN')) {
      this.runItTwiceRequests.add(playerId);
      const p = this.players.find(pl => pl && pl.id === playerId);
      if (p) this.addLog(`${p.name} wants to run it twice`);
      
      const playersInHand = this.players.filter(p => p && !p.isFolded);
      if (this.runItTwiceRequests.size === playersInHand.length) {
          this.isRunItTwice = true;
          this.addLog(`Both players agreed! Running it twice.`);
      }
      if (this.onUpdate) this.onUpdate();
    }
  }
}

module.exports = PokerGame;
