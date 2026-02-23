# Skill Swap Platform - Professional Edition with Screen Sharing

A full-stack, production-ready peer-to-peer skill exchange platform with video calls, **screen sharing**, ratings, real-time features, and comprehensive admin controls.

## 🚀 NEW FEATURES IN FINAL VERSION

### **🎥 SCREEN SHARING FUNCTIONALITY**
- **Share Screen** button in video call interface
- Uses `navigator.mediaDevices.getDisplayMedia()`
- Dynamic track replacement with `RTCRtpSender.replaceTrack()`
- Automatic revert to camera when screen sharing stops
- Handles manual stop from browser UI
- Works alongside mute and camera toggle
- No duplicate peer connections
- Instant screen visibility for remote user
- Visual feedback (button changes to "Stop Sharing")

### 1. **Real-Time Online Status**
- Live tracking of online/offline users
- Green/gray indicators on user cards
- Automatic updates without page refresh
- Socket.IO powered real-time synchronization

### 2. **Star Rating System (1-5)**
- Rate users after completed swaps
- One rating per user per swap
- Average rating calculation
- Public reviews and testimonials
- Prevent duplicate/self-ratings

### 3. **Professional Video Calling**
- WebRTC peer-to-peer video calls
- Google STUN server integration
- In-call controls (mute, camera, screen share, end)
- Incoming call modals
- Accept/reject functionality
- Only available for accepted swaps

### 4. **Report System with Screenshots**
- Report inappropriate behavior
- Upload screenshot evidence
- Admin review panel
- Status tracking (pending/reviewed/resolved)
- Ban user directly from reports

### 5. **Block System**
- Block/unblock users
- Blocked users cannot:
  - Send messages
  - Start video calls
  - Send swap requests
- Automatic enforcement

### 6. **Enhanced Search**
- Live filtering (no page reload)
- Search by name and skills
- Sort by online status
- Real-time status updates
- Professional card design

### 7. **Comprehensive Admin Panel**
- User management (ban/unban/delete)
- Report moderation
- Rating oversight
- Online user monitoring
- System statistics

## 📋 TECH STACK

**Backend:**
- Node.js
- Express.js
- MySQL with foreign keys and constraints
- Socket.IO (real-time features)
- bcrypt (password hashing)
- express-session (authentication)
- express-validator (input validation)
- multer (file uploads)

**Frontend:**
- EJS (server-side rendering)
- Bootstrap 5 (responsive UI)
- Vanilla JavaScript
- WebRTC (video calls + screen sharing)

**Real-Time:**
- Socket.IO for chat, online status, and video signaling

## 🖥️ SCREEN SHARING DETAILS

### How It Works:
1. **Start Screen Share**: User clicks "Share Screen" button during call
2. **Browser Prompt**: Native browser screen picker appears
3. **Track Replacement**: Current video track replaced with screen track using `replaceTrack()`
4. **Remote Display**: Other user instantly sees shared screen
5. **Stop Share**: User clicks "Stop Sharing" or uses browser controls
6. **Auto Revert**: Automatically switches back to camera feed

### Technical Implementation:
```javascript
// Get screen stream
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'always' },
  audio: false
});

// Replace video track
const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
await sender.replaceTrack(screenStream.getVideoTracks()[0]);

// Handle manual stop from browser
screenTrack.onended = () => {
  stopScreenShare();
};
```

### Features:
- ✅ No new peer connection created
- ✅ Maintains existing signaling
- ✅ Works with mute/camera toggle
- ✅ Handles browser stop button
- ✅ Instant remote display
- ✅ Visual status indicators
- ✅ Automatic cleanup

## 🗄️ DATABASE SCHEMA

### Tables:
1. **users** - User accounts with online status
2. **profiles** - User profiles with average ratings
3. **requests** - Skill swap requests
4. **messages** - Chat messages
5. **ratings** - User ratings and reviews
6. **reports** - User reports with screenshots
7. **blocked_users** - Block relationships

All tables include:
- Foreign key constraints
- ON DELETE CASCADE
- Proper indexes
- Data validation

## 📦 INSTALLATION

### Prerequisites
- Node.js v14+
- MySQL v5.7+
- Modern browser with WebRTC + Screen Capture API support

### Steps

1. **Extract the ZIP**
```bash
unzip skill-swap-platform-pro-final.zip
cd skill-swap-platform-pro-final
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Database**
```bash
mysql -u root -p < schema.sql
```

4. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skill_swap_pro_db
SESSION_SECRET=your_very_long_random_secret_key
MAX_FILE_SIZE=5242880
STUN_SERVER=stun:stun.l.google.com:19302
```

5. **Create Admin Account**
```sql
USE skill_swap_pro_db;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

6. **Start Server**
```bash
npm start
```

Visit: `http://localhost:3000`

## 🔒 SECURITY FEATURES

- ✅ bcrypt password hashing (10 rounds)
- ✅ Session-based authentication
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ File type validation
- ✅ Rate limiting ready
- ✅ Unauthorized access prevention
- ✅ CSRF protection ready

## 🎯 KEY FEATURES EXPLAINED

### Screen Sharing System
- Uses WebRTC `getDisplayMedia()` API
- Replaces video track dynamically during call
- No interruption to audio or connection
- Remote user sees screen instantly
- Automatic fallback to camera on stop
- Handles browser "Stop Sharing" button
- Visual status: button changes color/text
- Compatible with all call controls

### Video Call System
- Uses WebRTC for peer-to-peer connection
- Socket.IO for signaling (ICE, SDP)
- Google STUN server for NAT traversal
- Supports mute, camera, screen share, end
- Only works between users with accepted swaps

### Online Status System
- Tracks user connection via Socket.IO
- Updates in real-time on search page
- Visual indicators (green = online, gray = offline)
- Automatic cleanup on disconnect

### Rating System
- 1-5 star rating
- Optional text review
- One rating per swap
- Prevents self-rating
- Prevents duplicate ratings
- Updates user average automatically

### Report System
- Text description (required, max 1000 chars)
- Screenshot upload (optional, max 5MB)
- Admin can review, update status, ban user
- File validation (JPEG, PNG, GIF only)

### Block System
- Mutual blocking enforcement
- Prevents all interactions
- Cannot send messages
- Cannot video call
- Cannot send swap requests

## 📁 PROJECT STRUCTURE

```
skill-swap-platform-pro-final/
├── config/
│   ├── db.js                 # Database connection
│   └── multer.js             # File upload config
├── middleware/
│   ├── authMiddleware.js     # Authentication
│   ├── adminMiddleware.js    # Admin authorization
│   └── blockMiddleware.js    # Block checking
├── models/
│   ├── User.js               # User model with online status
│   ├── Profile.js            # Profile with ratings
│   ├── Request.js            # Swap requests
│   ├── Message.js            # Chat messages
│   ├── Rating.js             # Rating system
│   ├── Report.js             # Report system
│   └── BlockedUser.js        # Block system
├── routes/
│   ├── auth.js               # Login/logout
│   ├── home.js               # Landing page
│   ├── dashboard.js          # User dashboard
│   ├── profile.js            # Profiles, ratings, blocking
│   ├── chat.js               # Chat and reports
│   └── admin.js              # Admin panel
├── sockets/
│   ├── chatHandler.js        # Chat socket logic
│   ├── videoHandler.js       # Video call signaling
│   └── onlineHandler.js      # Online status tracking
├── views/                    # EJS templates
├── public/
│   ├── css/styles.css        # Custom styles
│   ├── js/main.js            # Utilities
│   ├── js/webrtc.js          # Video call + screen share
│   └── js/search.js          # Live search
├── server.js                 # Main application
├── schema.sql                # Database schema
└── package.json
```

## 🔧 API/SOCKET EVENTS

### Socket.IO Events

**Chat:**
- `joinRoom` - Join chat room
- `sendMessage` - Send chat message
- `newMessage` - Receive message

**Online Status:**
- `userStatusUpdate` - User went online/offline
- `getOnlineUsers` - Request online users list
- `onlineUsersList` - Receive online users

**Video Call:**
- `call:initiate` - Start call
- `call:incoming` - Receive call
- `call:accept` - Accept call
- `call:reject` - Reject call
- `call:offer` - WebRTC offer
- `call:answer` - WebRTC answer
- `call:ice-candidate` - ICE candidate
- `call:end` - End call

## 🚀 DEPLOYMENT

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET`
- [ ] Enable HTTPS/SSL (required for screen sharing)
- [ ] Configure secure cookies
- [ ] Set up database backups
- [ ] Configure firewall
- [ ] Use PM2 process manager
- [ ] Set up reverse proxy (nginx)
- [ ] Enable rate limiting
- [ ] Monitor logs

### PM2 Example
```bash
npm install -g pm2
pm2 start server.js --name skill-swap-pro
pm2 save
pm2 startup
```

## 📝 USAGE GUIDE

### For Users
1. Register → Complete profile (add skills)
2. Search users → Filter by online status
3. Send swap request → Wait for acceptance
4. Chat → Coordinate learning
5. Video call → Have sessions
6. **Share screen** → Show your work/teach effectively
7. Rate user → Leave review after completion

### Video Call Controls
- **Mute/Unmute**: Toggle microphone
- **Camera On/Off**: Toggle video feed
- **Share Screen**: Share your screen (click again to stop)
- **End Call**: Terminate the call

### For Admins
1. Login with admin account
2. View statistics on dashboard
3. Manage users (ban/unban/delete)
4. Review reports → Take action
5. Monitor ratings → Ensure quality

## ⚠️ IMPORTANT NOTES

1. **Screen Sharing Requirements**
   - HTTPS required in production
   - Chrome 72+, Firefox 66+, Safari 13+, Edge 79+
   - User must grant permission
   - Works only during active call

2. **WebRTC Browser Support**
   - Chrome, Firefox, Safari, Edge (modern versions)
   - Requires HTTPS in production
   - May need TURN server for some networks

3. **File Uploads**
   - Screenshots stored in `public/uploads/reports/`
   - Max size: 5MB (configurable)
   - Allowed: JPEG, PNG, GIF

4. **Online Status**
   - Updates when user logs in/out
   - Heartbeat via Socket.IO connection
   - Cleared on disconnect

5. **Ratings**
   - Only after accepted swap
   - One rating per swap
   - Cannot rate self
   - Updates average automatically

## 🐛 TROUBLESHOOTING

**Screen sharing not working?**
- Ensure HTTPS is enabled (required)
- Check browser support and version
- Verify screen capture permission granted
- Check browser console for errors

**Video calls not working?**
- Check WebRTC browser support
- Verify camera/microphone permissions
- Check firewall settings
- May need TURN server for corporate networks

**Screen share stops immediately?**
- User may have cancelled browser prompt
- Check "Don't show again" wasn't selected
- Try refreshing and starting new call

**Online status not updating?**
- Verify Socket.IO connection
- Check browser console for errors
- Ensure user is logged in

**File upload failing?**
- Check file size (max 5MB)
- Verify file type (JPEG/PNG/GIF only)
- Check folder permissions

## 🎓 TEACHING WITH SCREEN SHARING

Screen sharing is perfect for:
- **Code Reviews**: Share your IDE while teaching programming
- **Design Tutorials**: Show Photoshop/Figma workflows
- **Document Editing**: Collaborate on documents in real-time
- **Web Browsing**: Guide through research or resources
- **Presentation**: Share slides during teaching sessions
- **Troubleshooting**: Help debug issues together

## 📄 LICENSE

MIT License

## 👨‍💻 SUPPORT

For issues, questions, or feature requests, please contact support or open an issue.

---

**🎉 PROJECT COMPLETE - FULLY PRODUCTION READY WITH SCREEN SHARING! 🎉**
