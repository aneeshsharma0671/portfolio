import type { Player } from '../state';
import {
  createMessageDeduper,
  parsePeerMessage,
  serializePeerMessage,
  type PeerMessageEnvelope,
} from './protocol';

export type NetworkAdapter = {
  createRoom: (roomCode: string, localPlayer: Player) => Promise<void>;
  joinRoom: (roomCode: string, localPlayer: Player) => Promise<void>;
  leave: () => void;
  broadcast: (message: PeerMessageEnvelope) => void;
  onMessage: (handler: (message: PeerMessageEnvelope) => void) => () => void;
  onError: (handler: (message: string) => void) => () => void;
};

export class LocalNetworkAdapter implements NetworkAdapter {
  private messageHandlers = new Set<(message: PeerMessageEnvelope) => void>();
  private errorHandlers = new Set<(message: string) => void>();
  private deduper = createMessageDeduper();
  private roomCode = '';

  async createRoom(roomCode: string) {
    this.roomCode = roomCode;
  }

  async joinRoom(roomCode: string) {
    this.roomCode = roomCode;
  }

  leave() {
    this.roomCode = '';
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }

  broadcast(message: PeerMessageEnvelope) {
    if (message.roomCode !== this.roomCode) {
      this.emitError('Message room does not match the local room.');
      return;
    }

    const serialized = serializePeerMessage(message);
    const parsed = parsePeerMessage(serialized);

    if (!parsed.ok) {
      this.emitError(parsed.reason);
      return;
    }

    if (!this.deduper.remember(parsed.message.id)) {
      this.emitError('Duplicate message ignored.');
      return;
    }

    this.messageHandlers.forEach((handler) => handler(parsed.message));
  }

  onMessage(handler: (message: PeerMessageEnvelope) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: (message: string) => void) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private emitError(message: string) {
    this.errorHandlers.forEach((handler) => handler(message));
  }
}
