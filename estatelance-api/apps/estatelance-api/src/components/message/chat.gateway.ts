import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageService } from './message.service';
import { PublicMessage } from '../../schemas/PublicMessage.model';

const PUBLIC_ROOM = 'public-lobby';
const connectedSockets = new Set<string>();
const onlineUsers = new Map<string, { senderName: string; senderId: string; isGuest: boolean }>();

function colorFromId(id: string): string {
  const colors = ['#4f46e5','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#db2777','#0d9488'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const wsOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : '*';

@WebSocketGateway({
  cors: { origin: wsOrigins, credentials: true },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('ChatGateway');

  constructor(
    private readonly messageService: MessageService,
    @InjectModel('PublicMessage') private readonly publicMsgModel: Model<PublicMessage>,
  ) {}

  handleConnection(client: Socket) {
    connectedSockets.add(client.id);
    client.emit('onlineCount', { count: connectedSockets.size });
    this.server.emit('onlineCount', { count: connectedSockets.size });
  }

  handleDisconnect(client: Socket) {
    connectedSockets.delete(client.id);
    onlineUsers.delete(client.id);
    this.server.emit('onlineCount', { count: connectedSockets.size });
  }

  // ─── Private DM ────────────────────────────────────────────────────────────

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { userId: string }) {
    client.join(`user:${payload.userId}`);
    client.emit('joined', { room: `user:${payload.userId}` });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string; senderName: string; receiverId: string; text: string },
  ) {
    try {
      const message = await this.messageService.sendMessage(payload.senderId, {
        receiverId: payload.receiverId,
        text: payload.text,
      });
      const outgoing = {
        _id:        (message as any)._id?.toString(),
        senderId:   payload.senderId,
        senderName: payload.senderName,
        receiverId: payload.receiverId,
        text:       payload.text,
        isRead:     false,
        createdAt:  (message as any).createdAt ?? new Date().toISOString(),
      };
      this.server.to(`user:${payload.receiverId}`).emit('newMessage', outgoing);
      client.emit('messageSent', outgoing);
    } catch {
      client.emit('error', { message: 'Xabar yuborishda xatolik' });
    }
  }

  // ─── Public lobby ───────────────────────────────────────────────────────────

  @SubscribeMessage('joinPublic')
  async handleJoinPublic(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderName: string; senderId: string; isGuest: boolean },
  ) {
    client.join(PUBLIC_ROOM);
    onlineUsers.set(client.id, payload);

    // Load last 50 messages from MongoDB
    const history = await this.publicMsgModel
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    client.emit('publicHistory', history.reverse().map(m => ({
      id:         m._id.toString(),
      senderName: m.senderName,
      senderId:   m.senderId,
      isGuest:    m.isGuest,
      text:       m.text,
      color:      m.color,
      createdAt:  m.createdAt,
    })));

    this.logger.log(`${payload.senderName} joined public lobby`);
  }

  @SubscribeMessage('publicMessage')
  async handlePublicMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderName: string; senderId: string; isGuest: boolean; text: string },
  ) {
    if (!payload.text?.trim()) return;

    // Save to MongoDB
    const saved = await this.publicMsgModel.create({
      senderName: payload.senderName,
      senderId:   payload.senderId,
      isGuest:    payload.isGuest,
      text:       payload.text.trim().slice(0, 500),
      color:      colorFromId(payload.senderId),
    });

    const msg = {
      id:         saved._id.toString(),
      senderName: saved.senderName,
      senderId:   saved.senderId,
      isGuest:    saved.isGuest,
      text:       saved.text,
      color:      saved.color,
      createdAt:  (saved as any).createdAt,
    };

    this.server.to(PUBLIC_ROOM).emit('publicMessage', msg);
  }

  emitMessagesRead(toUserId: string, byUserId: string) {
    this.server.to(`user:${toUserId}`).emit('messagesRead', { byUserId });
  }
}
