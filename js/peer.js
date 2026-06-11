import { MSG, makeMsg } from './game-protocol.js';

const Peer = window.Peer;

const SIGNALING = { host: '0.peerjs.com', port: 443, secure: true };

export class PeerHost {
  constructor(roomId) {
    this.roomId = roomId;
    this.peer = null;
    this.players = new Map();
    this.onMessage = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.awaitingJoin = new Set();
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(this.roomId, {
          host: SIGNALING.host,
          port: SIGNALING.port,
          secure: SIGNALING.secure
        });
        this.peer.on('open', id => {
          console.log('Host peer open:', id);
          resolve(id);
        });
        this.peer.on('error', err => {
          console.error('Host peer error:', err);
          reject(err);
        });
        this.peer.on('disconnected', () => {
          console.log('Host peer disconnected, reconnecting...');
          this.peer.reconnect();
        });
        this.peer.on('connection', conn => this.setupConnection(conn));
      } catch (err) {
        reject(err);
      }
    });
  }

  setupConnection(conn) {
    conn.on('open', () => {
      this.awaitingJoin.add(conn.peer);
    });

    conn.on('data', data => {
      if (data.type === MSG.JOIN) {
        if (this.awaitingJoin.has(conn.peer)) {
          this.awaitingJoin.delete(conn.peer);
          const player = {
            id: conn.peer,
            nickname: data.nickname || 'Anonyme',
            connection: conn,
            score: 0,
            correctCount: 0
          };
          this.players.set(player.id, player);
          conn.send(makeMsg(MSG.JOIN_ACK, { playerId: conn.peer }));
          this.onPlayerJoined?.(player);
          this.broadcastExcept(conn.peer, makeMsg(MSG.PLAYER_JOINED, {
            playerId: player.id,
            nickname: player.nickname,
            playerCount: this.players.size
          }));
        }
        return;
      }

      this.onMessage?.(conn.peer, data);
    });

    conn.on('close', () => {
      const player = this.players.get(conn.peer);
      if (player) {
        this.players.delete(conn.peer);
        this.broadcast(makeMsg(MSG.PLAYER_LEFT, {
          playerId: conn.peer,
          nickname: player.nickname,
          playerCount: this.players.size
        }));
        this.onPlayerLeft?.(conn.peer);
      }
    });

    conn.on('error', err => {
      console.error('Connection error:', err);
    });
  }

  broadcast(msg) {
    this.players.forEach(p => {
      try { p.connection.send(msg); } catch (e) { console.error('Broadcast failed:', e); }
    });
  }

  broadcastExcept(excludePlayerId, msg) {
    this.players.forEach((p, id) => {
      if (id !== excludePlayerId) {
        try { p.connection.send(msg); } catch (e) { console.error('Broadcast failed:', e); }
      }
    });
  }

  sendTo(playerId, msg) {
    const player = this.players.get(playerId);
    if (player) {
      try { player.connection.send(msg); } catch (e) { console.error('Send failed:', e); }
    }
  }

  getPlayerCount() { return this.players.size; }
  getPlayers() { return [...this.players.values()]; }

  destroy() {
    this.peer?.destroy();
    this.players.clear();
  }
}

export class PeerPlayer {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.playerId = null;
    this.onMessage = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer({
          host: SIGNALING.host,
          port: SIGNALING.port,
          secure: SIGNALING.secure
        });
        this.peer.on('open', id => {
          this.playerId = id;
          console.log('Player peer open:', id);
          resolve(id);
        });
        this.peer.on('error', err => {
          console.error('Player peer error:', err);
          this.onError?.(err);
          reject(err);
        });
        this.peer.on('disconnected', () => {
          console.log('Player peer disconnected, reconnecting...');
          this.peer.reconnect();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  connect(hostId) {
    return new Promise((resolve, reject) => {
      this.conn = this.peer.connect(hostId, { reliable: true });
      this.conn.on('open', () => {
        console.log('Connected to host:', hostId);
        resolve();
      });
      this.conn.on('error', err => {
        console.error('Connection error:', err);
        this.onError?.(err);
        reject(err);
      });
      this.conn.on('data', data => {
        this.onMessage?.(data);
      });
      this.conn.on('close', () => {
        console.log('Connection closed');
        this.onDisconnect?.();
      });
    });
  }

  sendJoin(nickname) {
    this.send(makeMsg(MSG.JOIN, { nickname }));
  }

  sendAnswer(questionIndex, answerId) {
    this.send(makeMsg(MSG.ANSWER, { questionIndex, answerId }));
  }

  send(msg) {
    if (this.conn && this.conn.open) {
      try { this.conn.send(msg); } catch (e) { console.error('Send failed:', e); }
    }
  }

  destroy() {
    this.peer?.destroy();
    this.conn = null;
  }
}

const COLORS = [
  'bleu', 'rouge', 'vert', 'jaune', 'violet', 'orange', 'rose',
  'marron', 'gris', 'noir', 'blanc', 'turquoise', 'corail', 'indigo',
  'lilas', 'saumon', 'olive', 'menthe', 'lavande', 'abricot'
];

export function generateRoomId() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `precept-${color}-${num}`;
}
