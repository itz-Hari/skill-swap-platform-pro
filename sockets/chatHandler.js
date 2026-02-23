const Message = require('../models/Message');
const Request = require('../models/Request');
const BlockedUser = require('../models/BlockedUser');

const chatHandler = (io, socket, userId) => {
  
  socket.on('joinRoom', (requestId) => {
    socket.join(`request_${requestId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { requestId, senderId, senderName, message } = data;

      if (senderId !== userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const request = await Request.findById(requestId);
      
      if (!request) {
        socket.emit('error', { message: 'Request not found' });
        return;
      }

      if (request.sender_id !== userId && request.receiver_id !== userId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      const otherUserId = request.sender_id === userId ? request.receiver_id : request.sender_id;
      
      const isBlocked = await BlockedUser.checkBlockBetweenUsers(userId, otherUserId);
      if (isBlocked) {
        socket.emit('error', { message: 'Cannot send message. User blocked.' });
        return;
      }

      await Message.create(requestId, senderId, message);
      
      io.to(`request_${requestId}`).emit('newMessage', {
        senderId: senderId,
        senderName: senderName,
        message: message,
        createdAt: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

module.exports = chatHandler;
