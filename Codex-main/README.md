🧭 SATORP Trainee Management System (Codex)

A complete full-stack web application designed to manage and streamline the co-op trainee experience at SATORP.
It allows administrators, advisors, and trainees to manage accounts, track training progress, assign tasks, and centralize communication — all in one secure platform.

🚀 Tech Stack
Layer	Technology
Frontend	React + TypeScript + Tailwind CSS
Backend	Node.js + Express.js
Database	Microsoft SQL Server (MSSQL)
Auth	JWT (JSON Web Token)
ORM / DB Driver	mssql (SQL queries using parameterized inputs)
🧩 Features
🔐 Authentication

Secure JWT-based login and logout.

Role-based access (Admin / Advisor / Trainee).

Encrypted passwords using bcrypt.js.

👥 User Management

Admins can create, update, and deactivate users.

Separate dashboards for each role.

🎓 Trainee Management

Manage trainee information and training periods.

Assign advisors to trainees.

Track trainee progress and training status.

🧾 Task Management

Assign tasks to trainees and update task status.

Mark tasks as completed or pending.

View all assigned and completed tasks per trainee.

📂 Document Hub

Upload, view, and download shared documents (e.g., reports, learning materials).

💬 Communication

Messaging and chat sessions between trainees and advisors (coming soon).

🏗️ Project Structure
Codex-main/
├── backend/                # Express.js + SQL Server API
│   ├── config/             # Database and environment setup
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth & role-based access
│   ├── routes/             # API endpoints
│   ├── server.js           # Entry point
│   └── package.json
│
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth provider
│   │   ├── pages/          # React pages (Login, Dashboard, etc.)
│   │   ├── services/       # API wrappers
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets (logo, favicon)
│   └── package.json
│
└── README.md

⚙️ Setup Instructions
🧠 Prerequisites

Make sure you have installed:

Node.js (v18+ recommended)

SQL Server (local or remote)

npm (comes with Node.js)

SSMS (SQL Server Management Studio)

🗄️ 1. Database Setup

Open SQL Server Management Studio (SSMS).

Create a new database named:

CREATE DATABASE SATORP_TraineeSystem;


Run the provided SQL schema script (/backend/database.sql or /backend/scripts/init_db.sql) to create tables such as:

Users

Trainees

Tasks

Documents

Verify your tables and test the connection with:

SELECT * FROM Users;

🔙 2. Backend Setup

Navigate to the backend folder:

cd backend


Install dependencies:

npm install


Create a .env file in the /backend folder:

PORT=5000
JWT_SECRET=your_secret_key
SQL_USER=your_sql_username
SQL_PASSWORD=your_sql_password
SQL_DATABASE=SATORP_TraineeSystem
SQL_SERVER=localhost
SQL_ENCRYPT=false


Start the backend server:

npm start


You should see:

✅ SQL Server connection established
✅ Server running on http://localhost:5000

💻 3. Frontend Setup

Navigate to the client folder:

cd ../client


Install dependencies:

npm install


Run the app in development mode:

npm start


Open http://localhost:3000
 in your browser.

For production build:

npm run build
npx serve -s build

👤 Demo Accounts
Role	Email	Password
Admin	admin@satorp.com
	password
Advisor	advisor@satorp.com
	password
Trainee	trainee@satorp.com
	password
🔒 Environment Variables (Backend)
Variable	Description
PORT	Backend server port
JWT_SECRET	Secret key for signing JWTs
SQL_USER	SQL Server username
SQL_PASSWORD	SQL Server password
SQL_DATABASE	Database name
SQL_SERVER	SQL Server instance name
SQL_ENCRYPT	Set false for local DB connections
🧠 API Overview
Endpoint	Method	Description	Auth
/api/auth/login	POST	Login user and return token	❌
/api/auth/register	POST	Create new user (Admin only)	✅
/api/auth/profile	GET	Get current user profile	✅
/api/trainees	GET/POST/PUT/DELETE	Manage trainee data	✅ (Admin)
/api/tasks	GET/POST/PUT/DELETE	Manage tasks	✅ (Admin/Advisor)
🧰 Developer Tips

If your login doesn’t work, check:

The Users table column names (Email, PasswordHash, Role, IsActive).

.env connection credentials.

Console logs in both backend and frontend.

To reset the system, drop and recreate your database.

🏢 About

SATORP Trainee Hub (Codex) is a digital transformation project developed to enhance the onboarding and training experience for co-op trainees within the ICT Department.
The system helps improve efficiency, reduce manual tracking, and provide clear insights into trainee progress and performance.

🧑‍💻 Author

Moutaz Ahmed
ICT Department — SATORP
📧 moutaz@example.com
 (replace with your email)
🚗 Proud Mustang Owner 🐎
