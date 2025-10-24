const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socket.id
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] User ${socket.userId} connected`);

      // Store user socket mapping
      this.userSockets.set(socket.userId, socket.id);

      // Join user-specific room
      socket.join(`user_${socket.userId}`);

      // Join role-specific room
      socket.join(`role_${socket.userRole}`);

      socket.on('disconnect', () => {
        console.log(`[WebSocket] User ${socket.userId} disconnected`);
        this.userSockets.delete(socket.userId);
      });

      // Handle typing indicators for messaging
      socket.on('typing', (data) => {
        socket.to(`chat_${data.chatId}`).emit('user_typing', {
          userId: socket.userId,
          chatId: data.chatId
        });
      });

      socket.on('stop_typing', (data) => {
        socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          chatId: data.chatId
        });
      });
    });

    console.log('[WebSocket] Server initialized');
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, event, data) {
    if (this.io) {
      userIds.forEach(userId => {
        this.io.to(`user_${userId}`).emit(event, data);
      });
    }
  }

  // Broadcast to all users of a specific role
  sendToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role_${role}`).emit(event, data);
    }
  }

  // Broadcast to everyone
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Notification events
  notifyNewCommission(userId, amount, fromUser) {
    this.sendToUser(userId, 'new_commission', {
      amount,
      fromUser,
      timestamp: new Date()
    });
  }

  notifyNewReferral(userId, newUserEmail) {
    this.sendToUser(userId, 'new_referral', {
      newUserEmail,
      timestamp: new Date()
    });
  }

  notifyAchievementUnlocked(userId, achievement) {
    this.sendToUser(userId, 'achievement_unlocked', {
      achievement,
      timestamp: new Date()
    });
  }

  notifyRankUp(userId, newRank) {
    this.sendToUser(userId, 'rank_up', {
      newRank,
      timestamp: new Date()
    });
  }

  notifyWithdrawalUpdate(userId, withdrawal) {
    this.sendToUser(userId, 'withdrawal_update', {
      withdrawal,
      timestamp: new Date()
    });
  }

  notifySecurityAlert(userId, alert) {
    this.sendToUser(userId, 'security_alert', {
      alert,
      timestamp: new Date()
    });
  }

  // Messaging events
  sendMessage(chatId, message) {
    if (this.io) {
      this.io.to(`chat_${chatId}`).emit('new_message', message);
    }
  }

  notifyMessageRead(chatId, messageId, userId) {
    if (this.io) {
      this.io.to(`chat_${chatId}`).emit('message_read', {
        messageId,
        userId,
        timestamp: new Date()
      });
    }
  }
}

module.exports = new WebSocketService();
