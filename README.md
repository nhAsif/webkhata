# WebKhata

WebKhata is a Tutor Management WebApp built specifically for Private SSC/JSC tutors in Bangladesh.
It supports managing 20–50 active students with fee tracking, attendance, homework, and exam results, along with a parent portal.

## Tech Stack
- **Backend**: FastAPI + Uvicorn + SQLite
- **Frontend**: React 18 + Vite
- **Target Platform**: Radxa E20C running OpenWrt, but can be run on any Linux environment.

## Requirements
- Python 3.9+
- Node.js 18+

## Development Setup

### Backend
1. Create a virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 6540 --reload
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## Production Deployment (Radxa E20C / OpenWrt)
1. Download the latest release `.zip` from GitHub Releases.
2. Unzip the file on the Radxa E20C device.
3. Run the installation script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
4. Access the application on `http://<device-ip>:6540`.

## Features
- **Tutor Portal:** Dashboard, Student Management, Batch Management, Attendance tracking, Fee management, Homework assignments, Exam Results.
- **Parent Portal:** Read-only view of a child's attendance, fees, routine, homework, and exam results.
