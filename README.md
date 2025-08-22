Helpdesk - My Assignment
📌 Overview

This project is my implementation of the Smart Helpdesk with Agentic Triage assignment.
Due to time constraints, the User flows (UI) are fully implemented, while Agent and Admin flows are available only at the backend API level.

Frontend: React + Vite (User UI only)

Backend: Node.js + Express + MongoDB Memory Server (in-memory DB for simplicity)

Agentic Workflow: Implemented as deterministic stub (classify → retrieve KB → draft reply → auto-close or assign)

Auth: JWT-based authentication (Users only via UI; Agent/Admin can be tested via API tools like Thunderclient)

📂 Project Structure
Helpdesk-MyAssignment/
│── helpdesk-frontend/   # React Vite frontend (User UI)
│── helpdesk-backend/    # Express backend with MongoMemoryServer
│── .env                 # Environment variables
│── .gitignore

⚙️ Setup Instructions
1️⃣ Clone the repo
git clone https://github.com/adonimanish/Helpdesk-MyAssignment.git
cd Helpdesk-MyAssignment

2️⃣ Backend Setup
cd helpdesk-backend
npm install
npm start


This starts the backend on http://localhost:3000

Backend .env
AUTO_CLOSE_ENABLED=true
CONFIDENCE_THRESHOLD=0.78
SLA_HOURS=24
STUB_MODE=true

3️⃣ Frontend Setup
cd ../helpdesk-frontend
npm install
npm run dev

This starts the frontend on http://localhost:5173


✅ Features Implemented

User UI

Register/Login

Create tickets

View ticket status and agent replies

Agentic Workflow

Ticket classification (rule-based keywords)

Retrieve top KB articles

Draft reply with references

Confidence-based auto-close

Audit logging

Backend APIs for

Auth (register/login)

KB management (CRUD)

Ticket lifecycle

Agent triage (stub-based)

Audit logs

⚠️ Limitations (Time Constraints)

No separate UI for Agent/Admin (backend APIs exist; testable via Postman/Thunderclient).

DB is in-memory (mongodb-memory-server), so data resets on restart.

Basic testing done; not full coverage.

🚀 How to Demo

Run backend + frontend.

Register as a new User.

Login using test credentials:

email: test@example.com  
password: password123


Create a ticket.

Ticket will be triaged automatically (auto-close if confidence ≥ threshold, else waiting_human).

View ticket details + agent reply.

📌 Important Note

App runs with STUB_MODE=true → no API key required.

Admin/Agent APIs are implemented and can be tested via REST client even without UI.