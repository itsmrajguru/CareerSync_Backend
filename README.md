# Node.js Backend Setup Guide

This backend is a direct 1:1 port of your Django backend. It works with your existing React frontend without **any** changes.

## 1. Database Connection (MongoDB)

You need a running MongoDB database.

### Option A: Local MongoDB (Easiest)
1.  **Install**: Download [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2.  **Run**: Start the server (usually runs automatically on Windows as a service).
3.  **Config**: The `.env` file is already set to:
    ```env
    MONGO_URI=mongodb://127.0.0.1:27017/careersync
    ```

### Option B: MongoDB Atlas (Cloud)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a Cluster (Free Tier).
3.  Click **Connect** -> **Connect your application**.
4.  Copy the connection string (looks like `mongodb+srv://<user>:<password>@cluster0...`).
5.  Open `backend-node/.env` and replace `MONGO_URI`:
    ```env
    MONGO_URI=mongodb+srv://mangesh:YOUR_PASSWORD@cluster0.exmpl.mongodb.net/careersync
    ```

## 2. API Keys (Adzuna)

For Job Search to work, you need Adzuna keys.

1.  Open `backend-node/.env`.
2.  Fill in these values:
    ```env
    ADZUNA_APP_ID=your_actual_app_id
    ADZUNA_APP_KEY=your_actual_app_key
    ```

## 3. Running the Server

1.  Open a terminal in `backend-node/`.
2.  Run:
    ```bash
    npm run dev
    ```
3.  You should see:
    ```
    Server running on port 8000
    MongoDB Connected: ...
    ```

## 4. Connecting Frontend

**You do not need to do anything.**

Your React frontend is hardcoded to look at `http://127.0.0.1:8000/api`.
Since this Node server runs on `8000` and has the exact same routes (`/api/login/`, `/api/jobs/`, etc.), it will just work.

### Troubleshooting
-   **Error: connect ECONNREFUSED**: MongoDB is not running.
-   **Error: IP not whitelisted**: Your current IP address is blocked by MongoDB Atlas.
    1.  Go to [MongoDB Atlas Network Access](https://cloud.mongodb.com).
    2.  Add IP: `0.0.0.0/0` (Allow Anywhere).
    3.  Wait 1-2 minutes.
-   **Login Failed**: If you are trying to log in with a user created in Django, it won't work. **You must Sign Up again**.
