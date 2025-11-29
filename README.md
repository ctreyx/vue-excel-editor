# Vue Excel Editor

A Vue 3 project for online Excel editing with multi-person collaboration support.

## Features

- **Online Excel Editing**: Powered by Luckysheet.
- **Excel Import**: Support importing `.xlsx` files using LuckyExcel.
- **Real-time Collaboration**: Multi-user editing support using Socket.io.

## Project Setup

### Prerequisites

- Node.js installed.

### Installation

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

## Running the Project

You need to run both the frontend and the backend servers.

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd server
npm start
```

The server will run on `http://localhost:3000`.

### 2. Start the Frontend Development Server

Open another terminal and run:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` in multiple browser tabs or windows.
2. Edit a cell in one tab, and it should update in the other tabs in real-time.
3. Use the "Choose File" button to import an existing Excel file.

## Technologies

- Vue 3
- TypeScript
- Vite
- Luckysheet
- LuckyExcel
- Socket.io
- Express

