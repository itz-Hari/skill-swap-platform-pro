document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });

  const forms = document.querySelectorAll('form[data-confirm]');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const message = this.getAttribute('data-confirm');
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
});

function blockUser(userId) {
  if (!confirm('Are you sure you want to block this user?')) {
    return;
  }

  fetch(`/block/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('User blocked successfully');
      location.reload();
    } else {
      alert(data.error || 'Error blocking user');
    }
  })
  .catch(err => {
    alert('Error blocking user');
  });
}

function unblockUser(userId) {
  if (!confirm('Are you sure you want to unblock this user?')) {
    return;
  }

  fetch(`/unblock/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('User unblocked successfully');
      location.reload();
    } else {
      alert(data.error || 'Error unblocking user');
    }
  })
  .catch(err => {
    alert('Error unblocking user');
  });
}

function showReportModal(reportedUserId, requestId) {
  document.getElementById('reportedUserId').value = reportedUserId;
  document.getElementById('reportRequestId').value = requestId;
  const modal = new bootstrap.Modal(document.getElementById('reportModal'));
  modal.show();
}

function submitReport() {
  const form = document.getElementById('reportForm');
  const formData = new FormData(form);

  fetch('/report/submit', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Report submitted successfully');
      bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
      form.reset();
    } else {
      alert(data.error || 'Error submitting report');
    }
  })
  .catch(err => {
    alert('Error submitting report');
  });
}

function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let html = '';
  for (let i = 0; i < fullStars; i++) {
    html += '★';
  }
  if (halfStar) {
    html += '⯨';
  }
  for (let i = 0; i < emptyStars; i++) {
    html += '☆';
  }
  return html;
}
