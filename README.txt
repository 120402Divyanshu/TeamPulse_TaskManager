# TeamPulse - Full Stack Team Task Manager

TeamPulse is a modern full-stack task management web application designed for teams to collaborate efficiently. It allows users to create projects, assign tasks, manage team members, and track progress with role-based access control.

---

## Features

### Authentication

* User Signup
* User Login
* JWT Authentication
* Password Encryption using bcryptjs

### Project Management

* Create Projects
* Edit Projects
* Delete Projects
* Add Team Members
* Manage Roles

### Task Management

* Create Tasks
* Assign Tasks to Team Members
* Update Task Status
* Set Due Dates
* Task Priorities
* Delete Tasks

### Dashboard

* Total Tasks
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Recent Activity

### Role-Based Access Control

Admin:

* Create/Delete Projects
* Add/Remove Members
* Assign/Reassign Tasks
* Delete Any Task

Member:

* View Assigned Tasks
* Update Task Status
* Participate in Team Projects

---

## Tech Stack

Frontend:

* React.js
* Vite
* Tailwind CSS
* Axios
* React Router DOM

Backend:

* Node.js
* Express.js
* JWT Authentication
* bcryptjs

Database:

* MongoDB Atlas
* Mongoose

Deployment:

* Railway

---

## Folder Structure

TeamPulse/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── dist/
│   └── package.json
│
├── server/
│   ├── src/
│   ├── scripts/
│   ├── .env
│   └── package.json
│
├── Dockerfile
├── railway.toml
├── nixpacks.toml
├── package.json
└── README.txt

---

## Installation Guide

1. Clone Repository

git clone https://github.com/120402Divyanshu/TeamPulse_TaskManager

2. Install Dependencies

npm install
npm install --prefix client
npm install --prefix server

3. Create Environment Variables

Create:

server/.env

Add:

MONGODB_URI=mongodb+srv://TeamPulse:Team123@cluster0.pk9wsff.mongodb.net/?appName=Cluster0
JWT_SECRET=teampulse_secret_2026_random_key
PORT=5000

4. Run Backend

npm run dev --prefix server

5. Run Frontend

npm run dev --prefix client

---

## API Routes

Authentication:
POST /api/auth/register
POST /api/auth/login

Projects:
GET /api/projects
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id

Tasks:
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:taskId
DELETE /api/tasks/:taskId

Dashboard:
GET /api/dashboard

---

## Deployment

Platform:
Railway

Steps:

1. Push code to GitHub
2. Create Railway Project
3. Connect GitHub Repo
4. Add Environment Variables
5. Deploy Project
6. Open Live URL

---


## Author

Name: Divyanshu Chauhan
Project: TeamPulse
Year: 2026

---

## Live Demo

teampulsetaskmanager-production.up.railway.app

---

## GitHub Repository

https://github.com/120402Divyanshu/TeamPulse_TaskManager
