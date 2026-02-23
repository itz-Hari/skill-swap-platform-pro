const Request = require('../models/Request');
const BlockedUser = require('../models/BlockedUser');

const videoHandler = (io, socket, userId) => {
  
  socket.on('call:initiate', async (data) => {
    try {
      const { targetUserId, requestId } = data;

      const request = await Request.findById(requestId);
      if (!request || request.status !== 'accepted') {
        socket.emit('call:error', { message: 'Invalid request or not accepted' });
        return;
      }

      if (request.sender_id !== userId && request.receiver_id !== userId) {
        socket.emit('call:error', { message: 'Unauthorized' });
        return;
      }

      const isBlocked = await BlockedUser.checkBlockBetweenUsers(userId, targetUserId);
      if (isBlocked) {
        socket.emit('call:error', { message: 'User is blocked' });
        return;
      }

      const targetSocketId = global.onlineUsers.get(targetUserId);
      
      if (!targetSocketId) {
        socket.emit('call:error', { message: 'User is offline' });
        return;
      }

      io.to(targetSocketId).emit('call:incoming', {
        callerId: userId,
        callerName: socket.userName,
        requestId: requestId
      });

    } catch (error) {
      socket.emit('call:error', { message: 'Failed to initiate call' });
    }
  });

  socket.on('call:accept', (data) => {
    const { callerId } = data;
    const callerSocketId = global.onlineUsers.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:accepted', {
        userId: userId
      });
    }
  });

  socket.on('call:reject', (data) => {
    const { callerId } = data;
    const callerSocketId = global.onlineUsers.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:rejected', {
        userId: userId
      });
    }
  });

  socket.on('call:offer', (data) => {
    const { targetUserId, offer } = data;
    const targetSocketId = global.onlineUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:offer', {
        offer: offer,
        callerId: userId
      });
    }
  });

  socket.on('call:answer', (data) => {
    const { targetUserId, answer } = data;
    const targetSocketId = global.onlineUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:answer', {
        answer: answer,
        userId: userId
      });
    }
  });

  socket.on('call:ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetSocketId = global.onlineUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ice-candidate', {
        candidate: candidate,
        userId: userId
      });
    }
  });

  socket.on('call:end', (data) => {
    const { targetUserId } = data;
    const targetSocketId = global.onlineUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ended', {
        userId: userId
      });
    }
  });
};

module.exports = videoHandler;
