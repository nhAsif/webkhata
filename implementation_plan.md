# Tutor Management WebApp — Project Plan

**App name: WebKhata**
**Tutor:** Private SSC/JSC tutor, Bangladesh
**Students:** 20–50 active students
**Stack:** FastAPI + Uvicorn + SQLite + React (Vite)
**Host:** Radxa E20C (RK3528A quad-core Cortex-A53 @ 2.0 GHz, 2 GB LPDDR4, OpenWrt)
**Port:** 6540

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Radxa E20C (LAN)                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │         Uvicorn  :6540                      │    │
│  │                                             │    │
│  │   FastAPI app                               │    │
│  │   ├── /api/*        → REST API routes       │    │
│  │   └── /            → serves React build     │    │
│  │                                             │    │
│  │   SQLite DB  →  tutor.db (WAL mode)         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  React (Vite) → built to /static, served by FastAPI │
│                                                     │
│  cron → daily SQLite backup to /backups/            │
└─────────────────────────────────────────────────────┘
        │                        │
   Tutor browser            Parent/student browser
   (full access)            (read-only portal)
```

**Key decisions:**
- FastAPI serves both the API and the compiled React static files — single process, no Nginx needed
- SQLite lives as `tutor.db` in the project root — no database server, no extra RAM cost
- **SQLite WAL mode** enabled at DB init for concurrent read performance
- Uvicorn runs with `--workers 1` (ARM Cortex-A53, single worker is optimal for this load)
- No Docker — runs directly on OpenWrt as a `procd` service via `/etc/init.d/webkhata`
- Daily automated backup of `tutor.db` via cron + SQLite `.backup` API

---

## Project Structure

```
webkhata/
├── backend/
│   ├── main.py                  # FastAPI app entry point, mounts static files
│   ├── config.py                # Settings: SECRET_KEY, DB path, token expiry, etc.
│   ├── database.py              # SQLite connection, SQLAlchemy setup, WAL pragma
│   ├── models.py                # DB table definitions (ORM models)
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── auth.py                  # JWT login logic for tutor + parent
│   ├── middleware.py            # Error handling, request logging, rate limiting
│   ├── routers/
│   │   ├── students.py          # Student CRUD
│   │   ├── batches.py           # Batch/schedule management
│   │   ├── attendance.py        # Attendance marking & reports
│   │   ├── fees.py              # Fee records & payment tracking
│   │   ├── homework.py          # Homework assignment & submissions
│   │   ├── results.py           # Exam scores & grade reports
│   │   ├── dashboard.py         # Dashboard stats & alerts endpoint
│   │   └── parent.py            # Parent-facing read-only endpoints
│   ├── utils/
│   │   ├── grading.py           # Bangladesh grading logic
│   │   └── backup.py            # SQLite backup helper
│   ├── requirements.txt
│   └── tutor.db                 # SQLite database file (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Router setup
│   │   ├── api/
│   │   │   └── client.js        # Axios instance + interceptors (auth, error toast)
│   │   ├── hooks/
│   │   │   ├── useAuth.js       # Auth context hook
│   │   │   └── useApi.js        # Generic data-fetching hook
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # JWT storage + role-based routing
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + topbar shell
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── DataTable.jsx    # Reusable table with search/sort/pagination
│   │   │   ├── Modal.jsx        # Reusable modal (add/edit forms)
│   │   │   ├── StatCard.jsx     # Dashboard stat card
│   │   │   ├── EmptyState.jsx   # Friendly empty-state placeholder
│   │   │   └── Toast.jsx        # Success/error notification
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Students.jsx
│   │       ├── StudentProfile.jsx  # Individual student detail view
│   │       ├── Batches.jsx
│   │       ├── Attendance.jsx
│   │       ├── Fees.jsx
│   │       ├── Homework.jsx
│   │       ├── Results.jsx
│   │       └── parent/
│   │           ├── ParentLogin.jsx
│   │           ├── ParentDashboard.jsx
│   │           ├── ParentAttendance.jsx
│   │           ├── ParentFees.jsx
│   │           ├── ParentRoutine.jsx
│   │           ├── ParentHomework.jsx
│   │           └── ParentResults.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── scripts/
│   ├── install.sh               # OpenWrt install script (packaged in release zip)
│   ├── backup.sh                # Daily SQLite backup cron script
│   └── seed.py                  # Optional: seed DB with demo data
│
├── .github/
│   └── workflows/
│       └── release.yml          # Build & release zip on tag push
│
├── start.sh                     # Dev: runs uvicorn on port 6540
└── README.md
```

---

## Database Schema

> [!IMPORTANT]
> All tables include `created_at` and `updated_at` timestamps for audit trail.
> Foreign keys use `ON DELETE CASCADE` for `batch_students`, `attendance`, `homework_submissions`.
> Foreign keys use `ON DELETE RESTRICT` for `fees`, `results` (protect financial/academic data).

### `students`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | Auto-increment | |
| name | TEXT | NOT NULL | Full name |
| class_level | TEXT | NOT NULL, CHECK IN ('JSC', 'SSC') | |
| subjects | TEXT | NOT NULL | JSON array e.g. `["Math","English"]` |
| guardian_name | TEXT | NOT NULL | |
| guardian_phone | TEXT | NOT NULL | Used for parent login |
| address | TEXT | | |
| enrollment_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'inactive') | |
| parent_code | TEXT | UNIQUE, NOT NULL | Unique 6-char alphanumeric code for parent login |
| photo_path | TEXT | | Optional |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** `idx_students_status`, `idx_students_guardian_phone`, `idx_students_parent_code`

### `batches`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| name | TEXT | NOT NULL, UNIQUE | e.g. "SSC Math — Batch A" |
| subject | TEXT | NOT NULL | |
| schedule | TEXT | NOT NULL | JSON e.g. `["Sat","Mon","Wed"]` |
| time_slot | TEXT | NOT NULL | e.g. "5:00 PM" |
| status | TEXT | DEFAULT 'active', CHECK IN ('active', 'archived') | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### `batch_students`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| batch_id | FK → batches | ON DELETE CASCADE | |
| student_id | FK → students | ON DELETE CASCADE | |
| | | PRIMARY KEY (batch_id, student_id) | Composite PK |
| joined_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | When student was added to batch |

### `sessions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| batch_id | FK → batches | NOT NULL | |
| date | DATE | NOT NULL | |
| topic | TEXT | | What was covered |
| duration_minutes | INTEGER | DEFAULT 60 | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** `idx_sessions_batch_date` (batch_id, date)
**Unique:** `(batch_id, date)` — prevent duplicate sessions per batch per day

### `attendance`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| session_id | FK → sessions | ON DELETE CASCADE | |
| student_id | FK → students | ON DELETE CASCADE | |
| status | TEXT | NOT NULL, CHECK IN ('present', 'absent', 'late') | |
| | | UNIQUE (session_id, student_id) | No duplicate attendance records |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** `idx_attendance_student`, `idx_attendance_session`

### `fees`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| student_id | FK → students | ON DELETE RESTRICT | Protect financial records |
| month | TEXT | NOT NULL | e.g. "2025-06" (YYYY-MM format) |
| amount_due | REAL | NOT NULL, CHECK > 0 | |
| amount_paid | REAL | DEFAULT 0, CHECK >= 0 | |
| payment_date | DATE | | Nullable — set when payment recorded |
| payment_method | TEXT | CHECK IN ('cash', 'bkash', 'nagad', 'bank', NULL) | |
| status | TEXT | NOT NULL, DEFAULT 'unpaid', CHECK IN ('paid', 'unpaid', 'partial') | |
| notes | TEXT | | Optional |
| | | UNIQUE (student_id, month) | One fee record per student per month |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** `idx_fees_month_status`, `idx_fees_student`

### `homework`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| batch_id | FK → batches | NOT NULL | |
| title | TEXT | NOT NULL | |
| description | TEXT | | |
| assigned_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | |
| due_date | DATE | NOT NULL | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Validation:** `due_date >= assigned_date` (enforced in application layer)

### `homework_submissions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| homework_id | FK → homework | ON DELETE CASCADE | |
| student_id | FK → students | ON DELETE CASCADE | |
| status | TEXT | NOT NULL, DEFAULT 'not_submitted', CHECK IN ('submitted', 'not_submitted', 'late') | |
| feedback | TEXT | | Tutor's notes |
| | | UNIQUE (homework_id, student_id) | One submission per student per assignment |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### `results`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| student_id | FK → students | ON DELETE RESTRICT | Protect academic records |
| subject | TEXT | NOT NULL | |
| exam_name | TEXT | NOT NULL | e.g. "Class Test 1", "Half-Yearly" |
| exam_date | DATE | NOT NULL | |
| score | REAL | NOT NULL, CHECK >= 0 | |
| total_marks | REAL | NOT NULL, CHECK > 0 | |
| grade | TEXT | | Auto-calculated A+/A/A-/B/C/D/F |
| | | UNIQUE (student_id, subject, exam_name) | Prevent duplicate results |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Validation:** `score <= total_marks` (enforced in application layer)

### `users`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER PK | | |
| role | TEXT | NOT NULL, CHECK IN ('tutor', 'parent') | |
| username | TEXT | UNIQUE, NOT NULL | Tutor: "admin", Parent: phone number |
| password_hash | TEXT | NOT NULL | bcrypt hashed |
| student_id | FK → students | | Only for parent accounts, nullable |
| is_active | BOOLEAN | DEFAULT 1 | Can disable accounts without deletion |
| last_login | DATETIME | | Track last login time |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## SQLite Configuration

Applied once at database initialization in `database.py`:

```python
# database.py — key pragmas
SQLALCHEMY_DATABASE_URL = "sqlite:///./tutor.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,              # busy_timeout in seconds
    },
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=30000")    # 30s wait on lock
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA cache_size=-8000")       # 8MB cache
    cursor.close()
```

> [!NOTE]
> WAL mode allows concurrent readers while a write is in progress — essential for a web app serving both tutor and parent users simultaneously. With 20–50 students and ≤ 5 concurrent users, write contention will be negligible.

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Tutor login → returns JWT (12h expiry) |
| POST | `/api/auth/parent-login` | Parent login via phone + parent_code → JWT (24h, read-only) |
| POST | `/api/auth/change-password` | Change password (tutor only) |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Today's sessions, unpaid count, active students, monthly collection |
| GET | `/api/dashboard/alerts` | Low-attendance students, overdue fees, upcoming homework deadlines |

### Students
| Method | Path | Description |
|---|---|---|
| GET | `/api/students` | List all students (query: `?status=active&class_level=SSC&search=name`) |
| POST | `/api/students` | Add new student (auto-generates `parent_code`) |
| GET | `/api/students/{id}` | Get student detail (includes batches, attendance %, fee status) |
| PUT | `/api/students/{id}` | Update student |
| PATCH | `/api/students/{id}/status` | Archive/reactivate student (soft delete) |

### Batches & Sessions
| Method | Path | Description |
|---|---|---|
| GET | `/api/batches` | List all batches (query: `?status=active`) |
| POST | `/api/batches` | Create batch |
| PUT | `/api/batches/{id}` | Edit batch |
| DELETE | `/api/batches/{id}` | Archive batch (soft delete) |
| GET | `/api/batches/{id}/students` | List students in a batch |
| POST | `/api/batches/{id}/students` | Add student to batch |
| DELETE | `/api/batches/{id}/students/{sid}` | Remove student from batch |
| GET | `/api/batches/{id}/routine` | Get weekly routine for a batch |
| GET | `/api/sessions` | List sessions (query: `?batch_id=&from_date=&to_date=`) |
| POST | `/api/sessions` | Log a session |

### Attendance
| Method | Path | Description |
|---|---|---|
| POST | `/api/attendance` | Bulk mark attendance for a session (array of student statuses) |
| GET | `/api/attendance/{session_id}` | Get attendance for a session |
| GET | `/api/attendance/student/{id}` | Full attendance history for a student (query: `?from=&to=`) |
| GET | `/api/attendance/summary` | Monthly summary (query: `?month=2025-06`) |

### Fees
| Method | Path | Description |
|---|---|---|
| GET | `/api/fees` | List fee records (query: `?month=&status=&student_id=`) |
| POST | `/api/fees/generate` | Auto-generate fee records for all active students for a month |
| PUT | `/api/fees/{id}` | Record payment (update amount_paid, method, status) |
| GET | `/api/fees/student/{id}` | Fee history for one student |
| GET | `/api/fees/summary` | Monthly collection summary (query: `?month=2025-06`) |

### Homework
| Method | Path | Description |
|---|---|---|
| GET | `/api/homework` | List homework (query: `?batch_id=&from=&to=`) |
| POST | `/api/homework` | Create homework assignment (auto-creates submission records for batch students) |
| PUT | `/api/homework/{id}` | Edit homework details |
| GET | `/api/homework/{id}/submissions` | Get submissions for an assignment |
| PUT | `/api/homework/{id}/submissions` | Bulk update submission statuses + feedback |

### Results
| Method | Path | Description |
|---|---|---|
| POST | `/api/results` | Add exam result (auto-calculates grade) |
| POST | `/api/results/bulk` | Bulk add results for a batch exam |
| GET | `/api/results/student/{id}` | All results for a student |
| GET | `/api/results/batch/{id}` | Results for a batch (for comparison, query: `?exam_name=`) |
| PUT | `/api/results/{id}` | Edit a result (re-calculates grade) |

### Parent Portal (JWT-protected, read-only, scoped to own child)
| Method | Path | Description |
|---|---|---|
| GET | `/api/parent/profile` | Child's profile + batch info |
| GET | `/api/parent/attendance` | Child's attendance (query: `?month=`) |
| GET | `/api/parent/fees` | Child's fee status + history |
| GET | `/api/parent/routine` | Child's weekly class routine |
| GET | `/api/parent/homework` | Child's homework + submission statuses |
| GET | `/api/parent/results` | Child's exam results + grades |

---

## Bangladesh Grading Logic

Applied automatically when a result is saved (in `utils/grading.py`):

```
Percentage     Grade
80 – 100   →   A+
70 – 79    →   A
60 – 69    →   A-
50 – 59    →   B
40 – 49    →   C
33 – 39    →   D
 0 – 32    →   F
```

Implementation:
```python
def calculate_grade(score: float, total_marks: float) -> str:
    if total_marks <= 0:
        raise ValueError("total_marks must be positive")
    pct = (score / total_marks) * 100
    if pct >= 80: return "A+"
    if pct >= 70: return "A"
    if pct >= 60: return "A-"
    if pct >= 50: return "B"
    if pct >= 40: return "C"
    if pct >= 33: return "D"
    return "F"
```

---

## Batch Routine (Weekly Schedule)

The tutor follows a fixed weekly pattern:

| Days | Subjects |
|---|---|
| Saturday, Monday, Wednesday | Math, English, Science, Bangla |
| Sunday, Tuesday, Thursday | Math, English, BGS, Religion |
| Friday | Off |

This is stored per-batch in the `schedule` JSON field and rendered as a visual weekly timetable on both the tutor and parent views.

---

## Auth & Security

> [!WARNING]
> **`python-jose` is unmaintained and has known CVEs** (CVE-2024-33663, CVE-2024-33664).
> Use **`PyJWT`** instead for JWT encoding/decoding.

- **Tutor login:** username + password → JWT (expires 12h)
- **Parent/student login:** phone number + 6-char parent_code → JWT (expires 24h, read-only scope)
- All API routes protected via `Depends(get_current_user)`
- Parent JWT carries `role: parent` + `student_id` — enforced server-side so parents can only see their own child's data
- Passwords hashed with `bcrypt` via `passlib`
- **CORS locked to LAN** — only allow origins matching `http://192.168.*:6540` and `http://10.*:6540`
- **Rate limiting** on login endpoints: 5 attempts per minute per IP (prevent brute-force)
- **JWT secret** stored in `config.py` environment variable, not hardcoded
- No sensitive data in JWT payload (only `user_id`, `role`, `student_id`)

### First-Run Setup
On first launch, if no tutor user exists, the app auto-creates a default admin account:
- Username: `admin`
- Password: `changeme` (force password change on first login)

---

## Error Handling & Middleware

```python
# middleware.py
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Log the full traceback for debugging
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status": 500}
    )
```

All API responses follow a consistent shape:
- **Success:** `{ "data": ..., "message": "..." }`
- **Error:** `{ "error": "...", "status": 4xx/5xx }`

---

## Python Dependencies

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
pydantic==2.9.0
pydantic-settings==2.5.0         # Settings management from env vars
PyJWT[crypto]==2.9.0             # JWT (replaces vulnerable python-jose)
passlib[bcrypt]==1.7.4           # Password hashing
python-multipart==0.0.12         # Form data / file uploads
aiofiles==24.1.0                 # Static file serving
```

> [!CAUTION]
> Do **not** use `python-jose`. It is unmaintained and has critical CVEs.
> `PyJWT[crypto]` is the actively maintained replacement.

Install:
```bash
pip install -r requirements.txt
```

---

## Frontend Architecture

### Tech Stack
- **React 18** via Vite
- **React Router v6** — client-side routing
- **Axios** — API client with JWT interceptor
- **Recharts** — progress charts and trend lines
- **React Hot Toast** — notification toasts

### State Management
- **React Context** for auth state (JWT token, user role, student_id)
- **Component-level state** via `useState` / `useReducer` for forms and UI
- No Redux needed — app is read-heavy with simple CRUD patterns

### Routing Structure
```
/login                    → Login.jsx
/dashboard                → Dashboard.jsx
/students                 → Students.jsx (list)
/students/:id             → StudentProfile.jsx (detail)
/batches                  → Batches.jsx
/attendance               → Attendance.jsx
/fees                     → Fees.jsx
/homework                 → Homework.jsx
/results                  → Results.jsx

/parent/login             → ParentLogin.jsx
/parent                   → ParentDashboard.jsx
/parent/attendance        → ParentAttendance.jsx
/parent/fees              → ParentFees.jsx
/parent/routine           → ParentRoutine.jsx
/parent/homework          → ParentHomework.jsx
/parent/results           → ParentResults.jsx
```

### API Client Setup
```javascript
// api/client.js
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

---

## Frontend Pages & Features

### Tutor Pages
| Page | Key Features |
|---|---|
| **Login** | Simple form, redirects to dashboard, force password change on first login |
| **Dashboard** | Today's sessions, unpaid fees count, low-attendance alerts, quick stat cards (total students, monthly collection, attendance rate), recent activity feed |
| **Students** | Searchable/filterable table, add/edit modal, archive (soft delete), click-through to profile, inline status badge |
| **Student Profile** | Full detail view: personal info, batches enrolled, attendance calendar, fee history, exam results trend chart, routine |
| **Batches** | Batch cards with student count, session log, student roster per batch, weekly routine display, add/remove students |
| **Attendance** | Select batch → auto-load today's session → bulk toggle Present/Absent/Late for each student, monthly attendance grid view |
| **Fees** | Monthly dropdown, generate fees button, payment recording modal (amount, method, notes), overdue highlight, collection summary bar |
| **Homework** | Create assignment per batch, due date picker, submission tracker grid (student × status), feedback input |
| **Results** | Enter scores per student, auto-grade display, per-student progress chart (Recharts line chart), batch comparison table |

### Parent Portal
| Section | What Parents See |
|---|---|
| **Overview** | Child's name, class, enrolled batches, overall attendance % |
| **Attendance** | Monthly calendar view — color-coded present (green) / absent (red) / late (yellow) per day |
| **Fees** | Current month status (paid/unpaid/partial), amount due/paid, full payment history list |
| **Routine** | Weekly timetable: Sat/Mon/Wed → Math, English, Science, Bangla; Sun/Tue/Thu → Math, English, BGS, Religion |
| **Homework** | List of assignments with due dates, submission status badges (submitted ✓ / not submitted ✗ / late ⚠) |
| **Results** | Score history table, grade per exam, simple trend line chart showing improvement/decline |

### UI/UX Guidelines
- **Mobile-first** responsive design — parents will primarily use phones
- **Bangla-friendly typography** — use fonts that render Bangla script well (Noto Sans Bengali as fallback)
- **Dark theme** primary with a warm accent color palette
- **Minimal clicks** for high-frequency actions (attendance marking, fee recording)
- **Confirmation dialogs** for destructive actions (archive student, delete batch)
- **Loading skeletons** instead of spinners for better perceived performance
- **Empty states** with helpful messages and call-to-action buttons

---

## Deployment & Operations

### OpenWrt procd Service Script

`/etc/init.d/webkhata`:
```sh
#!/bin/sh /etc/rc.common

START=90
STOP=10
USE_PROCD=1

PROG=/usr/bin/python3
APP_DIR=/opt/webkhata/backend
APP_ARGS="$APP_DIR/main.py"

start_service() {
    procd_open_instance
    procd_set_param command $PROG -m uvicorn main:app --host 0.0.0.0 --port 6540 --workers 1 --app-dir /opt/webkhata/backend
    procd_set_param respawn 3600 5 5    # threshold=3600s, timeout=5s, retry=5
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_set_param pidfile /var/run/webkhata.pid
    procd_set_param env HOME=/opt/webkhata
    procd_close_instance
}
```

Enable and start:
```bash
chmod +x /etc/init.d/webkhata
/etc/init.d/webkhata enable
/etc/init.d/webkhata start
```

### Automated SQLite Backup

`scripts/backup.sh`:
```bash
#!/bin/sh

DB_PATH="/opt/webkhata/backend/tutor.db"
BACKUP_DIR="/opt/webkhata/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tutor_$TIMESTAMP.db"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# Use SQLite Online Backup API (safe during active writes)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Verify integrity
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    gzip "$BACKUP_FILE"
    echo "Backup OK: ${BACKUP_FILE}.gz"
else
    echo "ERROR: Backup integrity check failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Purge backups older than RETENTION_DAYS
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +$RETENTION_DAYS -delete
```

Cron entry (daily at 3 AM):
```
0 3 * * * /opt/webkhata/scripts/backup.sh >> /var/log/webkhata-backup.log 2>&1
```

### GitHub Actions — Build & Release

`.github/workflows/release.yml`:
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Build Vite frontend
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install and build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      # Assemble release package
      - name: Assemble release
        run: |
          mkdir -p release/backend/static
          cp -r backend/*.py backend/requirements.txt release/backend/
          cp -r backend/routers release/backend/
          cp -r backend/utils release/backend/
          cp -r frontend/dist/* release/backend/static/
          cp -r scripts release/
          cp README.md release/
          # Create install script
          cp scripts/install.sh release/install.sh
          chmod +x release/install.sh release/scripts/backup.sh

      - name: Create release zip
        run: |
          cd release
          zip -r ../webkhata-${{ github.ref_name }}.zip .

      # Create GitHub Release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: webkhata-${{ github.ref_name }}.zip
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Install Script for OpenWrt

`scripts/install.sh`:
```bash
#!/bin/sh
# WebKhata Installer for OpenWrt / Radxa E20C
set -e

INSTALL_DIR="/opt/webkhata"
SERVICE_NAME="webkhata"

echo "=== WebKhata Installer ==="

# Install Python3 if not present
if ! command -v python3 >/dev/null 2>&1; then
    echo "Installing Python3..."
    opkg update
    opkg install python3-light python3-pip python3-sqlite3
fi

# Create install directory
mkdir -p "$INSTALL_DIR"

# Copy application files
cp -r backend "$INSTALL_DIR/"
cp -r scripts "$INSTALL_DIR/"

# Install Python dependencies
cd "$INSTALL_DIR/backend"
pip3 install -r requirements.txt

# Pre-compile Python files for faster startup on ARM
python3 -m compileall "$INSTALL_DIR/backend/" -q

# Install init.d service
cat > /etc/init.d/$SERVICE_NAME << 'EOF'
#!/bin/sh /etc/rc.common
START=90
STOP=10
USE_PROCD=1

start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 6540 --workers 1 --app-dir /opt/webkhata/backend
    procd_set_param respawn 3600 5 5
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_set_param pidfile /var/run/webkhata.pid
    procd_close_instance
}
EOF
chmod +x /etc/init.d/$SERVICE_NAME

# Enable and start service
/etc/init.d/$SERVICE_NAME enable
/etc/init.d/$SERVICE_NAME start

# Setup daily backup cron
mkdir -p "$INSTALL_DIR/backups"
chmod +x "$INSTALL_DIR/scripts/backup.sh"
(crontab -l 2>/dev/null; echo "0 3 * * * $INSTALL_DIR/scripts/backup.sh >> /var/log/webkhata-backup.log 2>&1") | crontab -

echo "=== WebKhata installed and running on port 6540 ==="
echo "Access: http://$(ip addr show br-lan | grep 'inet ' | awk '{print $2}' | cut -d/ -f1):6540"
echo "Default login: admin / changeme"
```

---

## Running the App

### Development
```bash
# Backend (terminal 1)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 6540 --reload

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Vite dev server should proxy `/api` to `localhost:6540` — configure in `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:6540',
    },
  },
});
```

### Production (on Radxa E20C)
```bash
# Option 1: Use GitHub Release zip
wget https://github.com/<user>/webkhata/releases/latest/download/webkhata-<version>.zip
unzip webkhata-<version>.zip
chmod +x install.sh
./install.sh

# Option 2: Manual
cd frontend && npm ci && npm run build
mkdir -p ../backend/static
cp -r dist/* ../backend/static/
cd ../backend
uvicorn main:app --host 0.0.0.0 --port 6540 --workers 1
```

Access from any device on your LAN: `http://<radxa-ip>:6540`

---

## Estimated RAM Usage on Radxa E20C

| Component | RAM |
|---|---|
| Uvicorn + FastAPI (1 worker) | ~55–80 MB |
| SQLite (in-process, 8 MB cache) | ~10–12 MB |
| OS (OpenWrt) | ~150–200 MB |
| **Total** | **~215–292 MB** |

Well within the 2 GB limit. Leaves ~1.7 GB headroom for OS networking stack and buffering.

> [!TIP]
> Pre-compiling `.pyc` files via `python3 -m compileall` reduces startup time significantly on the Cortex-A53 — the install script handles this automatically.

---

## Build Phases

### Phase 1 — Core (Foundation)
**Goal:** Tutor can log in, manage students and batches, and mark attendance.

- [x] Project scaffolding (backend + frontend structure)
- [x] SQLite database setup with WAL mode + all pragmas
- [x] `users` + `students` + `batches` + `batch_students` tables
- [x] JWT auth (tutor login, protected routes, first-run admin creation)
- [x] Student CRUD (list, add, edit, archive)
- [x] Batch CRUD (create, edit, student roster management)
- [x] Session logging
- [x] Attendance marking (bulk present/absent/late per session)
- [x] Frontend: Login, Dashboard (skeleton), Students page, Batches page, Attendance page
- [x] `ProtectedRoute` + `AuthContext` + API client with interceptors

**Acceptance:** Tutor can log in → add students → create batches → assign students → log sessions → mark attendance.

---

### Phase 2 — Financial & Academic
**Goal:** Track fees and academic progress.

- [x] Fee records table + auto-generation per month
- [x] Payment recording (amount, method, partial/full)
- [x] Fee summary and overdue list
- [x] Homework table + submission tracking
- [x] Auto-create submissions when homework is assigned
- [x] Results table + auto-grading (Bangladesh scale)
- [x] Bulk result entry for batch exams
- [x] Frontend: Fees page, Homework page, Results page
- [x] Recharts integration for progress charts

**Acceptance:** Tutor can generate monthly fees → record payments → assign homework → track submissions → enter exam scores → view auto-grades.

---

### Phase 3 — Parent Portal
**Goal:** Parents can log in and see their child's data (read-only).

- [x] Parent login (phone + parent_code → scoped JWT)
- [x] Parent API endpoints (all read-only, scoped to own child)
- [x] Frontend: Parent login, Parent dashboard, Attendance calendar, Fee status, Routine timetable, Homework list, Results + trend chart
- [x] Mobile-responsive layout for parent portal (phone-first)

**Acceptance:** Parent logs in with phone + code → sees child's attendance calendar, fee status, weekly routine, homework submissions, and exam results with trend line.

---

### Phase 4 — Polish & Deployment
**Goal:** Production-ready, deployed on Radxa E20C.

- [x] Dashboard stat cards + alerts (low attendance, unpaid fees, upcoming deadlines)
- [x] Student profile page with combined view (attendance + fees + results)
- [x] Progress charts with Recharts (per-student trend, batch comparison)
- [x] Error handling middleware + consistent API error format
- [x] Loading skeletons + empty states + confirmation dialogs
- [x] Dark theme + responsive polish
- [x] OpenWrt init.d service script
- [x] Automated backup script + cron
- [ ] GitHub Actions release workflow
- [x] Install script for OpenWrt
- [ ] `README.md` with full setup instructions
- [x] Seed script for demo data

**Current Status Note:** The codebase has been fully scaffolded and populated with backend and frontend code. We encountered an issue during the `pip install` of `pydantic-core` because the local Python environment (3.14) is newer than the supported PyO3 version. The workaround is setting `PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1`, which was attempted but there may still be compilation issues. For the next AI tool, ensure the backend virtual environment is correctly built and test running both dev servers.

**Acceptance:** App runs on Radxa E20C as a procd service, auto-starts on boot, daily backups are running, and can be installed from a GitHub Release zip with a single command.

---

## Open Questions

> [!IMPORTANT]
> These need your input before we start coding:

1. **Fee amount:** Is the monthly fee the same for all students, or does it vary per student / per batch / per subject? Should the auto-generate endpoint accept a default amount or look it up per student?

2. **Multiple children per parent:** Can one parent have multiple children enrolled? If so, the parent login should show a child selector rather than being locked to one `student_id`.

3. **Photo upload:** The schema has `photo_path` — do you want actual photo upload support (file upload via the UI), or is this for a future phase? On an 8 GB eMMC, storage is limited.

4. **Bangla language:** Should the UI be in English, Bangla, or bilingual? This affects text content and font choices significantly.

5. **Exam types:** Are there fixed exam types (Class Test, Monthly, Half-Yearly, Annual) that we should make into a dropdown, or should it be free-text?

6. **Notifications:** Do you want any kind of notification system (e.g., a simple "message of the day" that parents see when they log in)?
