import { Socket, Server } from 'socket.io';
import { bigintToString } from './bigintToString';

export function safeEmit(socketOrIo: Socket | Server, event: string, data: any) {
  // Fallback: use JSON.stringify with replacer to catch any missed BigInt
  const replacer = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;
  const safeData = bigintToString(data);
  try {
    socketOrIo.emit(event, safeData);
  } catch (e) {
    // fallback: emit as JSON string if object fails
    socketOrIo.emit(event, JSON.parse(JSON.stringify(data, replacer)));
  }
}
