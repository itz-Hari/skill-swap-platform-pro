class VideoCall {
  constructor(socket, currentUserId) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.targetUserId = null;
    this.requestId = null;
    this.isScreenSharing = false;
    this.originalVideoTrack = null;
    this.screenStream = null;
    
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('call:incoming', (data) => {
      this.handleIncomingCall(data);
    });

    this.socket.on('call:accepted', (data) => {
      this.handleCallAccepted(data);
    });

    this.socket.on('call:rejected', () => {
      this.handleCallRejected();
    });

    this.socket.on('call:offer', (data) => {
      this.handleOffer(data);
    });

    this.socket.on('call:answer', (data) => {
      this.handleAnswer(data);
    });

    this.socket.on('call:ice-candidate', (data) => {
      this.handleIceCandidate(data);
    });

    this.socket.on('call:ended', () => {
      this.endCall();
    });

    this.socket.on('call:error', (data) => {
      alert(data.message);
    });
  }

  async startCall(targetUserId, requestId) {
    this.targetUserId = targetUserId;
    this.requestId = requestId;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      document.getElementById('localVideo').srcObject = this.localStream;
      document.getElementById('videoCallModal').style.display = 'block';
      document.getElementById('callStatus').textContent = 'Calling...';

      this.socket.emit('call:initiate', {
        targetUserId: targetUserId,
        requestId: requestId
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone');
    }
  }

  handleIncomingCall(data) {
    this.targetUserId = data.callerId;
    this.requestId = data.requestId;

    const modal = document.getElementById('incomingCallModal');
    document.getElementById('callerName').textContent = data.callerName;
    modal.style.display = 'block';

    document.getElementById('acceptCallBtn').onclick = () => {
      modal.style.display = 'none';
      this.acceptCall();
    };

    document.getElementById('rejectCallBtn').onclick = () => {
      modal.style.display = 'none';
      this.rejectCall();
    };
  }

  async acceptCall() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      document.getElementById('localVideo').srcObject = this.localStream;
      document.getElementById('videoCallModal').style.display = 'block';
      document.getElementById('callStatus').textContent = 'Connecting...';

      this.socket.emit('call:accept', {
        callerId: this.targetUserId
      });

      this.createPeerConnection();

    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Could not access camera/microphone');
    }
  }

  rejectCall() {
    this.socket.emit('call:reject', {
      callerId: this.targetUserId
    });
  }

  async handleCallAccepted(data) {
    document.getElementById('callStatus').textContent = 'Connected';
    this.createPeerConnection();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('call:offer', {
      targetUserId: this.targetUserId,
      offer: offer
    });
  }

  handleCallRejected() {
    alert('Call was rejected');
    this.endCall();
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.config);

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        document.getElementById('remoteVideo').srcObject = this.remoteStream;
      }
      this.remoteStream.addTrack(event.track);
      document.getElementById('callStatus').textContent = 'In Call';
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('call:ice-candidate', {
          targetUserId: this.targetUserId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection.iceConnectionState === 'disconnected' ||
          this.peerConnection.iceConnectionState === 'failed') {
        this.endCall();
      }
    };
  }

  async handleOffer(data) {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socket.emit('call:answer', {
      targetUserId: data.callerId,
      answer: answer
    });
  }

  async handleAnswer(data) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  async handleIceCandidate(data) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      document.getElementById('muteBtn').textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
    }
  }

  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      document.getElementById('cameraBtn').textContent = videoTrack.enabled ? 'Camera Off' : 'Camera On';
    }
  }

  async toggleScreenShare() {
    if (!this.peerConnection) {
      alert('No active call to share screen');
      return;
    }

    const shareBtn = document.getElementById('shareScreenBtn');

    if (!this.isScreenSharing) {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

        const screenTrack = this.screenStream.getVideoTracks()[0];
        
        this.originalVideoTrack = this.localStream.getVideoTracks()[0];

        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        document.getElementById('localVideo').srcObject = this.screenStream;
        
        this.isScreenSharing = true;
        shareBtn.textContent = 'Stop Sharing';
        shareBtn.classList.remove('btn-info');
        shareBtn.classList.add('btn-warning');
        document.getElementById('callStatus').textContent = 'Sharing Screen';

        screenTrack.onended = () => {
          this.stopScreenShare();
        };

      } catch (error) {
        console.error('Error starting screen share:', error);
        if (error.name === 'NotAllowedError') {
          alert('Screen sharing permission denied');
        } else {
          alert('Could not start screen sharing');
        }
      }
    } else {
      this.stopScreenShare();
    }
  }

  async stopScreenShare() {
    if (!this.isScreenSharing) return;

    try {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
      }

      const sender = this.peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender && this.originalVideoTrack) {
        await sender.replaceTrack(this.originalVideoTrack);
      }

      document.getElementById('localVideo').srcObject = this.localStream;

      this.isScreenSharing = false;
      this.screenStream = null;
      
      const shareBtn = document.getElementById('shareScreenBtn');
      shareBtn.textContent = 'Share Screen';
      shareBtn.classList.remove('btn-warning');
      shareBtn.classList.add('btn-info');
      document.getElementById('callStatus').textContent = 'In Call';

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  endCall() {
    if (this.isScreenSharing) {
      this.stopScreenShare();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.originalVideoTrack = null;
    this.isScreenSharing = false;

    document.getElementById('videoCallModal').style.display = 'none';
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;

    const shareBtn = document.getElementById('shareScreenBtn');
    if (shareBtn) {
      shareBtn.textContent = 'Share Screen';
      shareBtn.classList.remove('btn-warning');
      shareBtn.classList.add('btn-info');
    }

    if (this.targetUserId) {
      this.socket.emit('call:end', {
        targetUserId: this.targetUserId
      });
    }

    this.targetUserId = null;
  }
}
