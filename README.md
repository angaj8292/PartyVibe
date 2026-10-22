# PartyVibe 🎤
> A Complete, Modern Social Voice-Party Web Application.

PartyVibe allows users to create and join live public voice party rooms with up to 8 seats on stage. Users on seats converse via live audio (LiveKit), listeners participate via real-time STOMP chat, send animated virtual gifts powered by an in-app coins wallet, level up their VIP status, follow each other into rooms, and build their social Gift Wall.

---

## 🌟 Key Features

1. **Authentication & Social Profiles**:
   - Secure registration & login with BCrypt password hashing & JWT tokens.
   - Comprehensive profile: username, avatar, bio, age, gender, birthday, followers count, following count, mutual friends count, VIP level, coins balance, and Gift Wall.
   - Follow/unfollow, recommended users, mutual follow ("Friends" badge).

2. **Party Rooms**:
   - Create public or password-protected rooms with categories (*Party*, *Karaoke*, *Music*, *Chat*, *Gaming*, *Chill*).
   - Trending rooms discovery with listener counts, host badges, and remaining seats.
   - "Following" tab displays rooms where followed creators are currently live.

3. **Stage & Seat Management (8 Seats)**:
   - 8 interactive seats per room with host indicators.
   - Real-time seat assignment: take seat, leave seat.
   - Host controls: lock/unlock seats, mute/unmute seats, kick occupants off seats.
   - Pessimistic locking in database (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) prevents seat race conditions.

4. **Real-time LiveKit Voice Integration**:
   - LiveKit access token generation with official `livekit-server-sdk-java`.
   - **Publish permission strictly enforced**: only users who hold an active stage seat receive `canPublish: true`. Listeners receive subscribe-only tokens (`canPublish: false`).
   - Dynamic speaking indicators with visual audio waves around avatars.
   - In-app microphone mute/unmute toggle.

5. **Virtual Gifts & Animated Celebrations**:
   - Catalog of virtual gifts: *Rose (10)*, *Bubble Tea (50)*, *Love Heart (100)*, *Acoustic Guitar (300)*, *Birthday Cake (500)*, *Sports Car (1000)*, *Luxury Yacht (3000)*, *Golden Crown (5000)*, *Space Rocket (10000)*.
   - Real-time STOMP broadcast of gift events to the room with full-screen floating animations and confetti bursts.
   - Receiver receives earnings and gift stats on their profile **Gift Wall**.
   - VIP level automatically calculated from total coins spent (VIP 0 to VIP 8).

6. **Transactional Wallet & Top-Up with Payment Gateways**:
   - In-app test coins top-up and checkout modal.
   - Payment options: UPI (Google Pay, PhonePe, Paytm, QR Code scan), Credit/Debit Cards, Net Banking, and instant sandbox simulation.
   - Fully transactional coin deductions with check against negative balance and double-spending.

7. **Background Room Music Player & Device Downloaded Songs**:
   - Synchronized audio player in room header with spinning vinyl disc animation.
   - Play downloaded songs directly from local device (phone/PC) with instant local playback and room sync via `POST /api/rooms/{id}/music/upload`.
   - Curated party playlist + custom MP3 audio URL streams.
   - Real-time STOMP synchronization for all listeners in the voice party room.

8. **Profile Avatar Customization & Device Image Upload**:
   - Upload photos directly from phone/laptop storage via `POST /api/users/avatar/upload` (`multipart/form-data`).
   - Preset avatars gallery (Neon DJ, Pop Star, Retro Gamer, Cyber King).
   - Custom web image link preview and instant real-time avatar updates.

9. **Slide-over App Side Menu (10 Feature Centers)**:
   - Accessible via hamburger menu in top Navbar and Profile page:
     1. **Square**: Community feed, party vibes, hashtag moments.
     2. **Privilege Pack**: VIP passes (Bronze, Silver, Royal Diamond) with daily rewards.
     3. **Privilege Shop**: Avatar frames, room entrance sports cars, chat bubbles.
     4. **Fan club**: Creator fan clubs, club badges, member rankings.
     5. **User Level Center**: Level EXP bar, level perks, and milestone benefits.
     6. **Share with Your Friends**: Referral codes, invite link, WhatsApp & Telegram share.
     7. **Special Gift Record**: Detailed ledger of luxury and special gifts sent/received (`GET /api/gifts/records`).
     8. **Settings**: Voice noise suppression, stereo audio, privacy, and account logout.
     9. **Help Center**: Interactive FAQs and 24/7 support.
     10. **Rules and Policies**: Safe party guidelines, room etiquette, and privacy terms.

10. **Safety & Moderation**:
   - Room owners can ban disruptive users from the room (banned users are immediately evicted and forbidden from rejoining or chatting).
   - User blocking system (prevents interactions between blocked parties).
   - Profanity filter masks inappropriate words in chat with asterisks (`***`).
   - User and room reporting system.

---

## 🛠️ Tech Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Maven, Spring Web, Spring Security, Spring WebSocket (STOMP + SockJS), Spring Data JPA, Lombok, JJWT 0.12.5, LiveKit Server SDK 0.10.0, SpringDoc OpenAPI (Swagger UI).
- **Database**: 
  - `dev` profile: In-Memory H2 with PostgreSQL dialect (runs completely without Docker).
  - `prod` profile: PostgreSQL 16.
- **Voice**: LiveKit Server (dev mode or Docker).
- **Frontend**: React 18, Vite 5, Tailwind CSS, React Router v6, Axios, `@stomp/stompjs`, `sockjs-client`, `livekit-client`, `lucide-react`, `canvas-confetti`.

---

## 🚀 Running the Project

### Option A: Local Dev Run (Without Docker - Fastest)

#### 1. Start LiveKit Server (Dev Mode)
```bash
livekit-server --dev
```
*(Runs on `ws://localhost:7880` with API Key `devkey` and Secret `secret`)*.

#### 2. Start Backend (Dev Profile with H2)
```bash
cd backend
mvn clean install
java -jar target/partyvibe-backend-1.0.0.jar --spring.profiles.active=dev
```
- Server starts at `http://localhost:8080`.
- Swagger UI available at `http://localhost:8080/swagger-ui.html`.
- OpenAPI JSON available at `http://localhost:8080/v3/api-docs`.
- H2 Console available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:partyvibedb`, user: `sa`, empty password).

#### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend starts at `http://localhost:5173`.
- 1-Click demo accounts are available on the login page: `alice`, `bob`, `charlie`, `david` (password: `password123`).

---

### Option B: Full Stack Docker Compose Run

```bash
docker compose up --build
```
This boots all 4 containers:
1. `partyvibe-postgres` (PostgreSQL 16 on port 5432)
2. `partyvibe-livekit` (LiveKit Server on ports 7880, 7881, 7882)
3. `partyvibe-backend` (Spring Boot 3 on port 8080)
4. `partyvibe-frontend` (Nginx + React SPA on port 5173)

---

## 🧪 Testing and Verification

### 1. Run Unit & Integration Tests (Maven)
```bash
mvn test -f backend/pom.xml
```
Executes:
- `GiftServiceTest`: verifies coin spending, receiver credit, transaction recording, and self-gifting prevention.
- `WalletServiceTest`: verifies top-up, transactional spending, VIP recalculation, and insufficient coin checks.
- `SeatServiceTest`: verifies seat allocation, occupied seat prevention, locked seat rejection, and host lock/mute/kick controls.
- `PartyVibeIntegrationTest`: end-to-end integration test (User login -> Room creation -> Participant join -> Test top-up -> Gift sending -> Gift wall check -> LiveKit token permission check).

### 2. Run Automated E2E Verification Script
With the backend running, execute:
```bash
powershell -ExecutionPolicy Bypass -File test-e2e.ps1
```
This tests all 10 acceptance scenarios:
1. Registering Users A, B, and C.
2. User A creates a voice party room.
3. Users B and C join and see live viewer count.
4. User B takes Seat 2; verifies LiveKit token (`canPublish: true` for B, `canPublish: false` for listener C).
5. Room chat with profanity filtering.
6. Owner seat management (muting, kicking, and locking seats).
7. Following, mutual following, and "Friends" status.
8. Test coins top-up, virtual gift sending, gift wall recording, and VIP recalculation.
9. Insufficient coins clean rejection (HTTP 402).
10. Room banning (evicted from room, cannot rejoin) and user blocking.

---

## 📡 REST API & WebSocket Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Users & Profiles (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Current user profile |
| `PUT` | `/api/users/me` | Update bio, age, gender, avatar |
| `GET` | `/api/users/{id}` | User profile by ID |
| `GET` | `/api/users/search?q={query}` | Search users |
| `GET` | `/api/users/recommended` | Recommended users to follow |
| `GET` | `/api/users/{id}/gift-wall` | Aggregated gifts received |
| `POST` | `/api/users/{id}/follow` | Toggle follow / unfollow |
| `GET` | `/api/users/{id}/followers` | List followers |
| `GET` | `/api/users/{id}/following` | List following |
| `GET` | `/api/users/{id}/friends` | List mutual friends |

### Party Rooms (`/api/rooms`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rooms` | Create voice room |
| `GET` | `/api/rooms` | List trending rooms (category filtered) |
| `GET` | `/api/rooms/following` | Rooms where followed users are |
| `GET` | `/api/rooms/{id}` | Room details & seats |
| `POST` | `/api/rooms/{id}/join` | Join room as listener |
| `POST` | `/api/rooms/{id}/leave` | Leave room |
| `GET` | `/api/rooms/{id}/livekit-token` | LiveKit token (publish if seated) |
| `POST` | `/api/rooms/{id}/seats` | Seat actions (TAKE, LEAVE, LOCK, MUTE, KICK) |
| `GET` | `/api/rooms/{id}/messages` | Room chat messages |
| `POST` | `/api/rooms/{id}/messages` | Send room chat message |
| `POST` | `/api/rooms/{id}/ban` | Host bans a user from room |
| `DELETE` | `/api/rooms/{id}/ban/{userId}` | Host unbans a user |

### Gifts & Wallet (`/api/gifts`, `/api/wallet`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gifts` | Virtual gift catalog |
| `POST` | `/api/gifts/send` | Send gift to user in room |
| `GET` | `/api/wallet` | Coins balance and recent transactions |
| `POST` | `/api/wallet/test-topup` | Top-up test coins |

### WebSocket STOMP
- **Endpoint**: `/ws` (with SockJS fallback)
- **App Prefix**: `/app`
- **Topics**:
  - `/topic/room.{roomId}`: Chat messages (`CHAT_MESSAGE`), Seat updates (`SEATS_UPDATED`), Gift alerts (`GIFT_SENT`), Viewer counts (`VIEWER_COUNT`), Join/leave notices (`USER_JOINED`, `USER_LEFT`).
  - `/topic/presence`: Presence updates.

---

## 🔒 Security & Concurrency
- Passwords hashed with BCrypt.
- Passwords excluded from all responses via `@JsonIgnore`.
- JWT authenticated in STOMP `CONNECT` frame via `WebSocketAuthInterceptor`.
- Pessimistic write locks (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on seats prevent concurrency conflicts.
- Transactional coin operations prevent double spending or negative balances.
