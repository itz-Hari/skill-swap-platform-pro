let allUsers = [];
let onlineUsers = [];

document.addEventListener('DOMContentLoaded', function() {
  const userCards = document.querySelectorAll('.user-card');
  userCards.forEach(card => {
    const userId = parseInt(card.dataset.userId);
    const isOnline = card.dataset.isOnline === '1';
    
    allUsers.push({
      element: card,
      userId: userId,
      name: card.dataset.name.toLowerCase(),
      skillsTeach: card.dataset.skillsTeach.toLowerCase(),
      skillsLearn: card.dataset.skillsLearn.toLowerCase(),
      isOnline: isOnline
    });

    if (isOnline) {
      onlineUsers.push(userId);
    }
  });

  organizeUsersByOnlineStatus();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
  }

  if (typeof socket !== 'undefined') {
    socket.on('userStatusUpdate', (data) => {
      updateUserOnlineStatus(data.userId, data.isOnline);
    });

    socket.emit('getOnlineUsers');

    socket.on('onlineUsersList', (userIds) => {
      onlineUsers = userIds;
      allUsers.forEach(user => {
        user.isOnline = onlineUsers.includes(user.userId);
        updateUserCard(user);
      });
      organizeUsersByOnlineStatus();
    });
  }
});

function filterUsers() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  allUsers.forEach(user => {
    const matches = user.name.includes(searchTerm) ||
                   user.skillsTeach.includes(searchTerm) ||
                   user.skillsLearn.includes(searchTerm);
    
    if (matches || searchTerm === '') {
      user.element.style.display = 'block';
    } else {
      user.element.style.display = 'none';
    }
  });

  organizeUsersByOnlineStatus();
}

function updateUserOnlineStatus(userId, isOnline) {
  const user = allUsers.find(u => u.userId === userId);
  if (user) {
    user.isOnline = isOnline;
    updateUserCard(user);
    organizeUsersByOnlineStatus();
  }
}

function updateUserCard(user) {
  const badge = user.element.querySelector('.online-badge');
  if (badge) {
    if (user.isOnline) {
      badge.classList.remove('bg-secondary');
      badge.classList.add('bg-success');
      badge.textContent = '● Online';
    } else {
      badge.classList.remove('bg-success');
      badge.classList.add('bg-secondary');
      badge.textContent = '○ Offline';
    }
  }
}

function organizeUsersByOnlineStatus() {
  const container = document.getElementById('userResults');
  if (!container) return;

  const visibleUsers = allUsers.filter(u => u.element.style.display !== 'none');
  
  const online = visibleUsers.filter(u => u.isOnline);
  const offline = visibleUsers.filter(u => !u.isOnline);

  container.innerHTML = '';

  if (online.length > 0) {
    const onlineSection = document.createElement('div');
    onlineSection.className = 'mb-4';
    onlineSection.innerHTML = '<h5 class="text-success mb-3">🔵 Online Users (' + online.length + ')</h5>';
    const onlineRow = document.createElement('div');
    onlineRow.className = 'row';
    online.forEach(u => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 mb-3';
      col.appendChild(u.element);
      onlineRow.appendChild(col);
    });
    onlineSection.appendChild(onlineRow);
    container.appendChild(onlineSection);
  }

  if (offline.length > 0) {
    const offlineSection = document.createElement('div');
    offlineSection.className = 'mb-4';
    offlineSection.innerHTML = '<h5 class="text-secondary mb-3">⚪ Offline Users (' + offline.length + ')</h5>';
    const offlineRow = document.createElement('div');
    offlineRow.className = 'row';
    offline.forEach(u => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 mb-3';
      col.appendChild(u.element);
      offlineRow.appendChild(col);
    });
    offlineSection.appendChild(offlineRow);
    container.appendChild(offlineSection);
  }

  if (visibleUsers.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No users found</div>';
  }
}
