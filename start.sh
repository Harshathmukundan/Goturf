#!/bin/bash

echo "🧹 Cleaning up old processes to prevent EADDRINUSE errors..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🚀 Starting GoTurf Backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "🚀 Starting GoTurf Frontend..."
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Both servers are starting up!"
echo ""
echo "🌐 Frontend URL: http://localhost:5173"
echo "⚙️  Backend URL:  http://localhost:5001"
echo ""
echo "Logs are being written to backend.log and frontend.log in this folder."
echo "Press Ctrl+C to stop both servers."

trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait $BACKEND_PID
wait $FRONTEND_PID
