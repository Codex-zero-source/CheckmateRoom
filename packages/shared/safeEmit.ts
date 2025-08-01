import { Socket, Server } from 'socket.io';
import { bigintToString } from '../../shared/bigintToString';

export function safeEmit(socketOrIo: Socket | Server, event: string, data: any) {
  socketOrIo.emit(event, bigintToString(data));
}
