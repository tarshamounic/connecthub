# ConnectHub

A college-level full-stack, real-time messaging application built with **React (Vite)** and **Spring Boot**, backed by **MySQL**. ConnectHub provides a public global room, live presence, member discovery, chat requests, and secure one-to-one private messaging over authenticated WebSockets.

## Features

- Registration and login with BCrypt password hashing and JWT authentication
- Protected frontend routes and protected REST/WebSocket destinations
- One global chat room with persisted history and real-time STOMP updates
- Presence states: **ONLINE** (connected), **OFFLINE** (disconnected), **LIVE** (active in chat within the last 90 seconds)
- Member discovery with name/username search and All / Online / Offline / LIVE filters
- Public member profiles with chat-request actions
- Private chat requests: send, incoming, outgoing, accept, reject, duplicate protection
- Private conversations unlocked only after a request is accepted, with server-side participant checks
- Settings page with profile details and secure logout
- Responsive purple/white interface with collapsible navigation and dashboard sidebars

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Context API, @stomp/stompjs, Lucide icons |
| Backend | Java 17, Spring Boot 3, Spring Web, Spring Security, Spring Data JPA, Spring WebSocket, JWT (jjwt), BCrypt |
| Database | MySQL 8 |

## Project Structure

```
connecthub/
├── backend/                  # Spring Boot application
│   └── src/main/java/com/connecthub/
│       ├── config/           # Security, CORS, WebSocket/STOMP config
│       ├── controller/       # REST controllers
│       ├── dto/              # Request/response records
│       ├── entity/           # JPA entities (5 tables)
│       ├── exception/        # API error handling
│       ├── repository/       # Spring Data JPA repositories
│       ├── security/         # JWT filter/service, authenticated principal
│       ├── service/          # Business logic + presence tracking
│       └── websocket/        # STOMP auth interceptor, presence events, messaging
├── frontend/                 # Vite React application
│   └── src/
│       ├── components/       # Sidebar, layout, avatars, cards, chat bubbles
│       ├── context/          # AuthContext, SocketContext
│       ├── hooks/            # useDebounce
│       ├── pages/            # All 10 application pages
│       ├── services/         # Axios API client and configuration
│       ├── styles/           # Shared responsive stylesheet
│       ├── utils/            # Formatting helpers
│       ├── App.jsx
│       └── main.jsx
├── database/schema.sql       # MySQL schema (5 tables)
└── README.md
```

## Prerequisites

- **JDK 17+** (`java -version`)
- **Node.js 18+** and npm
- **MySQL 8.0** running locally
- Maven is **not required** — the backend includes the Maven wrapper (`mvnw` / `mvnw.cmd`)

## 1. Database Setup

The backend defaults to:

| Setting | Value |
| --- | --- |
| Database | `connecthub` |
| User | `connecthub` |
| Password | `connecthub123` |

Create the database, user, and tables as a MySQL administrator:

```bash
mysql -u root -p < database/schema.sql
```

Alternatively, create only the database and user, and let Hibernate create the tables on first run (`ddl-auto: update`):

```sql
CREATE DATABASE IF NOT EXISTS connecthub CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'connecthub'@'localhost' IDENTIFIED BY 'connecthub123';
GRANT ALL PRIVILEGES ON connecthub.* TO 'connecthub'@'localhost';
FLUSH PRIVILEGES;
```

To use different credentials, set environment variables before starting the backend:

```bash
DB_URL="jdbc:mysql://localhost:3306/connecthub?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

## 2. Run the Backend

```bash
cd backend
./mvnw spring-boot:run          # macOS / Linux
mvnw.cmd spring-boot:run        # Windows
```

The API starts at **http://localhost:8090**.

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_PORT` | `8090` | HTTP port |
| `JWT_SECRET` | dev secret | JWT signing key (32+ characters) |
| `JWT_EXPIRATION_MS` | `604800000` | Token lifetime (7 days) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `WS_ALLOWED_ORIGINS` | same as CORS | WebSocket origin allow-list |

## 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

If the backend runs elsewhere, create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8090/api
VITE_WS_URL=ws://localhost:8090/ws
```

## Using ConnectHub

1. Register two different accounts (for example in a normal window and a private window).
2. Sign in and send a message in **Global Chat** — both accounts receive it instantly.
3. Open **Discover Users**, search for the other member and send a chat request.
4. The recipient receives a live notification and can accept it from **Chat Requests**.
5. Once accepted, both members can open **Private Messages** and chat one-to-one.
6. Users who send messages or open a chat become **LIVE** for 90 seconds; connected idle users are **ONLINE**; closed connections are **OFFLINE**.
7. Use **Settings → Log out** to clear the JWT session and disconnect WebSockets.

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account, returns JWT + profile |
| POST | `/api/auth/login` | Sign in with username or email |
| GET | `/api/auth/me` | Current authenticated profile |
| GET | `/api/users` | List members (`search`, `filter=ALL\|ONLINE\|OFFLINE\|LIVE`) |
| GET | `/api/users/search?q=` | Search members |
| GET | `/api/users/online` | Connected members (ONLINE + LIVE) |
| GET | `/api/users/live` | LIVE members |
| GET | `/api/users/{id}` | Public profile + request relation |
| GET | `/api/global/messages` | Latest 100 global messages |
| POST | `/api/global/messages` | Send to global room (REST fallback) |
| POST | `/api/requests/send/{userId}` | Send a private chat request |
| GET | `/api/requests/incoming` | Requests received |
| GET | `/api/requests/outgoing` | Requests sent |
| PUT | `/api/requests/{id}/accept` | Accept a pending request |
| PUT | `/api/requests/{id}/reject` | Reject a pending request |
| GET | `/api/conversations` | Accepted private conversations |
| GET | `/api/conversations/{id}` | Conversation details |
| GET | `/api/conversations/{id}/messages` | Latest 100 private messages |
| POST | `/api/conversations/{id}/messages` | Send private message (REST fallback) |
| GET | `/api/settings/profile` | Profile for the settings page |

All endpoints except `/api/auth/register` and `/api/auth/login` require:

```
Authorization: Bearer <token>
```

## WebSocket (STOMP)

- Endpoint: `ws://localhost:8090/ws` (native WebSocket)
- CONNECT header: `Authorization: Bearer <token>` (validated by a channel interceptor)
- Client sends only to `/app/*` destinations; direct broker publishing is rejected

| Direction | Destination | Payload |
| --- | --- | --- |
| Subscribe | `/topic/global` | New global messages |
| Subscribe | `/topic/presence` | `{ userId, status }` presence events |
| Subscribe | `/user/queue/private` | Private message delivery |
| Subscribe | `/user/queue/requests` | Chat request / accept / reject notifications |
| Subscribe | `/user/queue/errors` | Validation or authorization errors |
| Send | `/app/global.send` | `{ content }` |
| Send | `/app/private.send` | `{ conversationId, content }` |
| Send | `/app/presence.active` | `{}` marks the user LIVE |

Presence is tracked per WebSocket session. A user is ONLINE while at least one STOMP session is connected, becomes LIVE when active in a chat, and returns to ONLINE after 90 seconds of inactivity. Server-side conversation membership is checked for every private REST and WebSocket message.

## Security Notes

- Passwords are hashed with BCrypt (never stored or returned in plain text).
- JWT tokens are required for every protected REST request and WebSocket CONNECT.
- Private conversations are restricted to their two participants; unauthorized access returns 403.
- Email addresses appear only in the account owner's settings response, not on public profiles.
- Change `JWT_SECRET` and database credentials before deploying beyond a local prototype.

## Troubleshooting

- **`Cannot reach the ConnectHub server`** — start the backend on port 8090 and check `VITE_API_URL`.
- **MySQL access denied** — verify `DB_USERNAME` / `DB_PASSWORD` and that the `connecthub` user was granted access to the `connecthub` schema.
- **Live updates stuck on “Connecting”** — check that the backend is reachable at `ws://localhost:8090/ws` and that the frontend origin is allowed by `WS_ALLOWED_ORIGINS`.
- **Chat button instead shows “Request pending”** — private messaging only unlocks after the recipient accepts the chat request.
