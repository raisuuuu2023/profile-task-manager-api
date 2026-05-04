# Profile Task Manager API

A REST API built with Node.js, Express.js, and MySQL.
Features user authentication with JWT and role-based access control.

## Tech Stack

- Node.js + Express.js
- MySQL (raw queries, no ORM)
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing

## Setup

### 1. Install dependencies
npm install

### 2. Create MySQL database
Run this in MySQL:
CREATE DATABASE task_manager_db;

Then run the full schema from the Database Schema section below.

### 3. Create .env file
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=task_manager_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

### 4. Start the server
npm run dev

## API Endpoints

### Auth routes (public)
POST /api/auth/register — create account
POST /api/auth/login    — login and get token

### Task routes (protected — requires Bearer token)
GET    /api/tasks          — get tasks (own tasks / all if admin)
GET    /api/tasks/:id      — get one task
POST   /api/tasks          — create task
PUT    /api/tasks/:id      — update task
PATCH  /api/tasks/:id      — partial update
DELETE /api/tasks/:id      — delete task
GET    /api/tasks/admin/all — admin only: all tasks with user info

## Roles
- user  — can only view/edit/delete their own tasks
- admin — can view and manage all tasks

## How to test (Postman)
1. Register a user: POST /api/auth/register
2. Login: POST /api/auth/login — copy the token
3. In Postman go to Authorization tab — select Bearer Token — paste token
4. Now call any task route