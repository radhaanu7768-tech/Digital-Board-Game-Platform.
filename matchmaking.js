// Matchmaking queue - pairs players by ELO rating
class MatchmakingQueue {
  constructor() {
    this.queues = { chess: [], checkers: [] }; // { userId, elo, socketId, timestamp }
  }

  addPlayer(userId, elo, socketId, gameType) {
    this.queues[gameType] = this.queues[gameType] || [];
    this.queues[gameType].push({ userId, elo, socketId, timestamp: Date.now() });
    return this.findMatch(gameType);
  }

  findMatch(gameType) {
    const queue = this.queues[gameType];
    if (queue.length < 2) return null;

    // Sort by ELO to find closest match
    queue.sort((a, b) => a.elo - b.elo);
    
    const player1 = queue[0];
    // Find player within 200 ELO range, or take next in queue if none
    let player2Idx = 1;
    for (let i = 1; i < queue.length; i++) {
      if (Math.abs(queue[i].elo - player1.elo) <= 200) {
        player2Idx = i;
        break;
      }
    }
    
    const player2 = queue[player2Idx];
    
    // Remove matched players from queue
    queue.splice(Math.max(0, player2Idx), 1);
    queue.splice(0, 1);
    
    return { player1, player2, gameType };
  }

  removePlayer(socketId, gameType) {
    const queue = this.queues[gameType];
    if (queue) {
      const idx = queue.findIndex(p => p.socketId === socketId);
      if (idx >= 0) queue.splice(idx, 1);
    }
  }

  getQueueStats(gameType) {
    return {
      waiting: (this.queues[gameType] || []).length,
      avgWaitTime: 0 // can calculate if needed
    };
  }
}

module.exports = MatchmakingQueue;
