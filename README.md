# ✦ TaskFlow — Smart Kanban Task Manager

> An optimally designed, full-stack task management application built for focused, stress-free productivity.

---

##  Objective

Most task managers are either too simple or too overwhelming. TaskFlow bridges that gap — it gives you a clean, aesthetic Kanban board that actually *feels good to use*, combined with powerful features like real-time VSCode folder tracking, AI assistance, and smart prioritization. Built as an intern assignment project, it goes far beyond the basic requirements to deliver a production-quality experience.

---

##  The Problem It Solves

- Developers lose track of what they're working on across multiple projects
- Standard todo apps don't integrate with your actual coding workflow
- No easy way to visualize progress on coding tasks in real time
- Stress and context-switching kill productivity — there's no "calm" in most tools

TaskFlow solves all of this in one place.

---

##  Features

###  Authentication
- **Register & Login** with email and password
- **2FA via OTP** — a one-time password is sent to your email after login (powered by Resend)
- **JWT-based sessions** — stay logged in securely

###  Kanban Board
- **3 columns** — Todo, In Progress, Done
- **Drag & drop cards** between columns — no buttons needed, just grab and drop
- Cards **auto-sort by priority** within each column
- **Real-time progress bar** in the navbar showing % of tasks completed

###  Task Management
- Click the **+ button** to create a new task
- Each task supports:
  - **Title & Description**
  - **Stage** (Todo / In Progress / Done)
  - **Priority** (Low / Medium / High / Critical)
  - **Start Date & End Date** with a dark calendar picker
  - **Time left chip** — dynamically shows days remaining or "overdue" in color
  - **Next Step** — dropdown with presets or custom input (e.g. "Pass to QA team")
  - **VSCode Folder Tracker** — link a local folder to auto-track progress
- Click the **✏️ icon** on any card to edit it
- Click the **🗑️ icon** to archive it

###  Archive Bin
- Archived tasks are **not permanently deleted** — they move to the Archive
- Click **Archive** in the navbar to view them
- Each archived card shows **days remaining** before auto-deletion (10 days)
- Options to **Restore** or **Permanently Delete** each task
- Backend automatically purges tasks older than 10 days every 24 hours

###  VSCode Folder Tracker
Link any VSCode project folder to a task and track your coding progress automatically:

1. Create a task and fill in the **Folder Path** (right-click folder in VSCode → Copy Path)
2. Set **Target File Count** (e.g. 10 files = 100% complete)
3. Note your **Task ID** (open browser console → `fetch('http://localhost:8000/api/tasks/...')`)
4. In VSCode, open the `vscode-extension` folder
5. Press **F5** → select **VS Code Extension Development**
6. In the new Extension Host window, open your project folder
7. Press **Ctrl+Shift+P** → type **TaskFlow: Link folder to task**
8. Enter Task ID, target file count, and your JWT token (`localStorage.getItem('token')` in browser console)
9. Every time you **save a file**, progress updates on the card automatically
10. At 30% → card moves to **In Progress**; at 100% → card moves to **Done**

###  AI Assistant (TaskFlow Bot)
- Click the **✦ bubble** in the bottom right corner
- Powered by **Google Gemini** (free tier)
- Can help with:
  - Any app feature explanation
  - VSCode tracking setup walkthrough
  - Time management and prioritization advice
  - Stress relief and calm suggestions
  - Rubber duck debugging
- Supports **screenshot uploads** — click 📎 to attach an image
- Knows your current tasks and their status

###  Design & UX
- Deep dark theme with purple/blue gradients
- Glassmorphism cards with blur effects
- Spring animations on hover, drag, and modal open
- Floating animated background orbs
- Time-based greeting in navbar
- Toast notifications for every action
- Fully responsive

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Inline styles + injected CSS (no Tailwind needed) |
| Drag & Drop | HTML5 native drag events |
| Backend | Python + FastAPI |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose) + bcrypt |
| OTP | PyOTP + Resend (email delivery) |
| AI Assistant | Google Gemini API (free) |
| VSCode Extension | Custom VS Code Extension (vanilla JS) |
| Task Scheduler | APScheduler (auto-purge archives) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

##  Getting Started

### Prerequisites
- Node.js v18+
- Python 3.11+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager
```

### 2. Set up the backend
```bash
cd server
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in the `server` folder:
```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_secret_key
OTP_SECRET=your_otp_secret
RESEND_API_KEY=your_resend_key
```

Start the backend:
```bash
uvicorn main:app --reload
```
Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Set up the frontend
```bash
cd client
npm install
```

Create a `.env` file in the `client` folder:
```
VITE_GEMINI_KEY=your_gemini_api_key
```

Start the frontend:
```bash
npm run dev
```
Frontend runs at `http://localhost:5173`

### 4. Set up VSCode extension (optional)
```bash
cd vscode-extension
# Open in VSCode and press F5
```

---

##  Project Structure

```
task-manager/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBot.jsx  # AI assistant
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Board.jsx    # Main Kanban board
│   │   └── App.jsx
│   └── .env
├── server/                  # FastAPI backend
│   ├── models/
│   │   ├── user.py
│   │   └── task.py
│   ├── routes/
│   │   ├── auth.py
│   │   └── tasks.py
│   ├── middleware/
│   │   └── auth.py
│   ├── main.py
│   ├── database.py
│   └── .env
├── vscode-extension/        # VS Code extension
│   ├── extension.js
│   └── package.json
└── README.md
```

---

##  API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP + get JWT |
| GET | `/api/tasks/` | Get all tasks |
| POST | `/api/tasks/` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Archive task |
| GET | `/api/tasks/archive` | Get archived tasks |
| POST | `/api/tasks/archive/{id}/restore` | Restore task |
| DELETE | `/api/tasks/archive/{id}/delete` | Permanently delete |
| POST | `/api/tasks/{id}/progress` | Update progress (VSCode extension) |

---

##  Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `OTP_SECRET` | Secret for OTP generation |
| `RESEND_API_KEY` | Resend API key for email OTP |

### Frontend (`client/.env`)
| Variable | Description |
|---|---|
| `VITE_GEMINI_KEY` | Google Gemini API key for AI assistant |

---

##  Assumptions & Tradeoffs

- **JWT stored in localStorage** — simpler than httpOnly cookies, acceptable for this use case
- **OTP printed to terminal in dev** — in production, always delivered via email
- **No refresh tokens** — JWT expires in 7 days for simplicity
- **Supabase session pooler** — used instead of direct connection for IPv4 compatibility
- **Gemini free tier** — rate limited; for production use a paid tier or swap to another provider
- **VSCode extension runs in dev mode** — not packaged/published to marketplace
- **Progress tracking by file count** — simple and effective; could be extended to line count or test coverage

---

##  Technical Decisions

- **FastAPI over Django** — lighter, faster, modern async support, perfect for APIs
- **Supabase over self-hosted Postgres** — free managed DB, instant setup, great dashboard
- **React + Vite over CRA** — significantly faster dev experience
- **Native HTML5 drag over @dnd-kit** — simpler, no extra dependency, works perfectly for this use case
- **APScheduler for auto-purge** — runs inside the FastAPI process, no need for a separate cron job
- **Gemini over OpenAI** — free tier, no credit card required

---

## Built by Annika Dubey

Made with ❤️ as part of the INDPRO Intern Assignment.