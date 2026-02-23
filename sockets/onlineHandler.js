const User = require('../models/User');

const onlineHandler = (io, socket, userId) => {
  
  const updateOnlineStatus = async (isOnline) => {
    try {
      await User.setOnlineStatus(userId, isOnline);
      
      if (isOnline) {
        global.onlineUsers.set(userId, socket.id);
      } else {
        global.onlineUsers.delete(userId);
      }

      io.emit('userStatusUpdate', {
        userId: userId,
        isOnline: isOnline
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  updateOnlineStatus(true);

  socket.on('disconnect', () => {
    updateOnlineStatus(false);
  });

  socket.on('getOnlineUsers', async () => {
    try {
      const onlineUsersList = Array.from(global.onlineUsers.keys());
      socket.emit('onlineUsersList', onlineUsersList);
    } catch (error) {
      socket.emit('error', { message: 'Failed to get online users' });
    }
  });
};

module.exports = onlineHandler;
