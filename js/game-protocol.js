export const MSG = {
  JOIN: 'join',
  JOIN_ACK: 'join-ack',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  ROOM_INFO: 'room-info',
  GAME_START: 'game-start',
  QUESTION: 'question',
  ANSWER: 'answer',
  TIME_UP: 'time-up',
  REVEAL: 'reveal',
  NEXT_QUESTION: 'next-question',
  GAME_END: 'game-end',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong'
};

export function makeMsg(type, payload = {}) {
  return { type, ...payload, ts: Date.now() };
}
