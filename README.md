# Bachelor's Thesis: Web Application for Restaurant Reservations

This repository contains the solution for the bachelor's thesis defended in the 6th semester at FPVaI UKF during the academic year 2025/2026. The project focuses on the development of a modern web application for managing and booking restaurant spaces.

The repository serves the following purposes:

- versioning and sharing source code,
- tracking progress and task distribution,
- preparing for the defense of the solution.

---

## Project Overview

The application belongs to the category of **Reservation Management Systems**.

---

## Technologies Used

### Frontend
- **React with typescript**
- **Tailwind CSS**

### Backend
- **FastAPI** – (REST API)
- **SQLAlchemy** – ORM for database interactions
- **Alembic** – database migration tool

---

## Local Setup (First Time)

### Prerequisites

- **Python 3.10+** — verify with `py --version`
- **Node.js 18+** — verify with `node --version`
- **XAMPP** — MySQL must be running on port 3306
- **Stripe CLI** — download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) and place the binary somewhere on your PATH (the `start.ps1` script expects it at `C:\Users\romaz\bin\stripe.exe`)

---

### 1. Clone the repository

```bash
git clone https://github.com/wwtanji/restaurant-reservation-system.git
cd restaurant-reservation-system
```

---

### 2. Backend

```bash
cd backend
```

Create a virtual environment and install dependencies:

```bash
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=mysql+pymysql://root:@localhost:3306/restaurant_db
SECRET_KEY=your_secret_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

Create the database in XAMPP (phpMyAdmin or MySQL CLI):

```sql
CREATE DATABASE restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run Alembic migrations to create all tables:

```bash
cd app/db
alembic upgrade head
cd ../..
```

---

### 3. Frontend

```bash
cd ../frontend
npm install
```

---

## Running the App

After the one-time setup above, use the provided script to start everything at once:

```powershell
.\start.ps1
```

This opens three terminal windows:

| Window | What it runs |
|--------|--------------|
| Backend | `uvicorn main:API --reload --env-file .env` on `http://localhost:8000` |
| Frontend | `npm start` on `http://localhost:3000` |
| Stripe CLI | Listens for webhook events and forwards them to the backend |

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Useful Links

- [React – Official Documentation](https://react.dev/learn)
- [FastAPI – Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS – Documentation](https://tailwindcss.com/docs)
- [SQLAlchemy – Documentation](https://docs.sqlalchemy.org/)
- [Alembic – Documentation](https://alembic.sqlalchemy.org/en/latest/)
- [Stripe CLI – Documentation](https://stripe.com/docs/stripe-cli)
