import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDdGNwkRuHVpGikKhJGrl9rT6XCbKE7VZI",
  authDomain: "teaairdrop.firebaseapp.com",
  databaseURL: "https://teaairdrop-default-rtdb.firebaseio.com",
  projectId: "teaairdrop",
  storageBucket: "teaairdrop.firebasestorage.app",
  messagingSenderId: "119617029635",
  appId: "1:119617029635:web:b50fb70fcf55321adcf036"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const getToday = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [coins, setCoins] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState("");
  const [scratchesLeft, setScratchesLeft] = useState(5);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const handleLogin = async () => {
    if (!username) return alert("Enter username");
    const userRef = ref(db, "users/" + username);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        coins: 0,
        tapCount: 0,
        lastCheckIn: "",
        scratchesLeft: 5,
        puzzleSolved: false,
      });
    }
    const data = (await get(userRef)).val();
    setCoins(data.coins || 0);
    setTapCount(data.tapCount || 0);
    setLastCheckIn(data.lastCheckIn || "");
    setScratchesLeft(data.scratchesLeft ?? 5);
    setPuzzleSolved(data.puzzleSolved || false);
    setLoggedIn(true);
  };

  const updateUser = updates => {
    update(ref(db, "users/" + username), updates);
  };

  const handleTap = () => {
    const newCoins = coins + 0.0001;
    const newTaps = tapCount + 1;
    setCoins(newCoins);
    setTapCount(newTaps);
    updateUser({ coins: newCoins, tapCount: newTaps });
  };

  const handleCheckIn = () => {
    const today = getToday();
    if (lastCheckIn === today) return alert("Already checked in today!");
    const newCoins = coins + 0.02;
    setCoins(newCoins);
    setLastCheckIn(today);
    updateUser({ coins: newCoins, lastCheckIn: today });
  };

  const handleScratch = () => {
    if (scratchesLeft <= 0) return alert("No scratches left today!");
    const rand = Math.floor(Math.random() * 100);
    const reward = rand < 90 ? Math.floor(Math.random() * 4) + 1 : 10;
    const newCoins = coins + reward;
    setCoins(newCoins);
    setScratchesLeft(scratchesLeft - 1);
    updateUser({ coins: newCoins, scratchesLeft: scratchesLeft - 1 });
  };

  const handleSolvePuzzle = () => {
    if (puzzleSolved) return alert("Already solved!");
    const newCoins = coins + 0.05;
    setCoins(newCoins);
    setPuzzleSolved(true);
    updateUser({ coins: newCoins, puzzleSolved: true });
  };

  useEffect(() => {
    const lbRef = ref(db, "users");
    onValue(lbRef, snapshot => {
      const data = snapshot.val();
      const list = Object.entries(data || {}).map(([name, val]) => ({
        username: name,
        coins: val.coins || 0,
      }));
      list.sort((a, b) => b.coins - a.coins);
      setLeaderboard(list.slice(0, 20));
    });
  }, []);

  if (!loggedIn)
    return (
      <div className="p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">☕ TEA Coin Game</h1>
        <input
          className="border p-2 rounded"
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <br />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleLogin}>
          Start Game
        </button>
      </div>
    );

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6 text-center">
      <h1 className="text-2xl font-bold">Welcome, {username}</h1>

      <img
        src="/tea-logo.png"
        alt="TEA"
        className="w-32 h-32 mx-auto cursor-pointer"
        onClick={handleTap}
      />
      <p>Tap Count: {tapCount}</p>

      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCheckIn}>
        Daily Check-In
      </button>

      <div>
        <p>Scratches Left: {scratchesLeft}</p>
        <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={handleScratch}>
          Scratch
        </button>
      </div>

      <div>
        <button className="bg-orange-500 text-white px-4 py-2 rounded" onClick={handleSolvePuzzle}>
          {puzzleSolved ? "Puzzle Solved ✅" : "Solve Puzzle"}
        </button>
      </div>

      <p className="font-bold text-lg">Balance: {coins.toFixed(4)} TEA</p>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">🏆 Leaderboard</h2>
        {leaderboard.map((u, i) => (
          <p key={u.username}>
            #{i + 1} - {u.username}: {u.coins.toFixed(4)} TEA
          </p>
        ))}
      </div>
    </div>
  );
}
