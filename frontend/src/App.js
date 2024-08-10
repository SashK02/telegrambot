import React, { useState, useEffect, useCallback } from "react";
import {
  auth,
  db,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
} from "./firebase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState(0);
  const [uid, setUid] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [rocketFlying, setRocketFlying] = useState(false);
  const [rocketMultiplier, setRocketMultiplier] = useState(0.1);
  const [gameOver, setGameOver] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [rewards, setRewards] = useState(["Free Spin", "Free Spin", "Free Spin"]);
  const [rewardIndex, setRewardIndex] = useState(0);
  const [isFreeSpin, setIsFreeSpin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBalance(docSnap.data().balance);
        } else {
          await setDoc(docRef, { balance: 1000 });
          setBalance(1000);
        }
      } else {
        setUser(null);
        setBalance(0);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsFreeSpin(true); // Free spin available when the timer reaches 0
    }
  }, [timeLeft]);

  const updateBalance = useCallback(async (newBalance) => {
    setBalance(newBalance);
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { balance: newBalance }, { merge: true });
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (rocketFlying) {
      interval = setInterval(() => {
        setRocketMultiplier((prev) => +(prev + 0.03).toFixed(2));
        if (
          (rocketMultiplier < 3 && Math.random() < 0.05) ||
          (rocketMultiplier >= 3 && rocketMultiplier < 5 && Math.random() < 0.1) ||
          (rocketMultiplier >= 5 && Math.random() < 0.2)
        ) {
          setGameOver(true);
          setRocketFlying(false);
          updateBalance(balance - betAmount);
          clearInterval(interval);
        }
      }, 150);
    }
    return () => clearInterval(interval);
  }, [rocketFlying, rocketMultiplier, balance, betAmount, updateBalance]);

  const handleSpin = () => {
    if (spinning) return;

    const currentSpinCost = isFreeSpin ? 0 : betAmount;

    if (balance >= currentSpinCost || currentSpinCost === 0) {
      if (currentSpinCost > 0) {
        updateBalance(balance - currentSpinCost);
      }
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
        const result = Math.random() < 0.5 ? -betAmount : betAmount * 2;
        updateBalance(balance + result);
        if (isFreeSpin) {
          setTimeLeft(300); // Reset the timer after using the free spin
          setIsFreeSpin(false); // Mark that the free spin has been used
        }
      }, 2000);
    } else {
      alert("You don't have enough balance to spin.");
    }
  };

  const handleDeposit = () => {
    if (!user) {
      alert("You must be logged in to deposit money.");
      return;
    }

    const amount = prompt("Enter the amount you want to deposit: ");
    if (amount && !isNaN(amount) && amount > 0) {
      window.location.href = `https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/create-checkout-session?amount=${amount}&userId=${uid}`;
    }
  };

  const handleRocketStart = () => {
    if (rocketFlying || betAmount <= 0 || betAmount > balance) return;
    setRocketMultiplier(0.1);
    setGameOver(false);
    setRocketFlying(true);
  };

  const handleCashOut = () => {
    if (rocketFlying) {
      const winnings = +(rocketMultiplier * betAmount).toFixed(2);
      updateBalance(balance + winnings);
      setRocketFlying(false);
      setBetAmount(1);
    }
  };

  const claimReward = () => {
    if (rewardIndex < rewards.length) {
      setTimeLeft(300); // Reset timer to start counting down again
      setIsFreeSpin(true); // Ensure that the next spin is free
      setRewardIndex(rewardIndex + 1);
    } else {
      alert("No more rewards available.");
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUid(result.user.uid);
    } catch (error) {
      console.error("Error during Google sign-in:", error.message);
    }
  };

  const handleSignInWithEmail = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUid(result.user.uid);
    } catch (error) {
      console.error("Error during email sign-in:", error.message);
    }
  };

  const handleSignUpWithEmail = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setUid(result.user.uid);
    } catch (error) {
      console.error("Error during email sign-up:", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUid("");
    } catch (error) {
      console.error("Error during sign-out:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 via-red-600 to-yellow-500 text-white flex flex-col justify-between">
      <header className="bg-black text-center p-4">
        <h1 className="text-5xl font-bold text-yellow-300">Casino Royale</h1>
      </header>

      <main className="flex-1 p-5 mb-32 text-center">
        {!user ? (
          <div>
            <h2 className="text-3xl font-bold mb-5">Sign In to Start Winning!</h2>
            <div className="mb-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4 p-4 rounded bg-black text-yellow-300 text-center w-full"
                placeholder="Email"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4 p-4 rounded bg-black text-yellow-300 text-center w-full"
                placeholder="Password"
              />
              <button
                onClick={handleSignInWithGoogle}
                className="bg-red-800 text-white py-3 px-5 rounded-full mb-5 text-xl"
              >
                Sign In with Google
              </button>
              <button
                onClick={handleSignInWithEmail}
                className="bg-blue-800 text-white py-3 px-5 rounded-full mb-5 text-xl"
              >
                Sign In with Email
              </button>
              <button
                onClick={handleSignUpWithEmail}
                className="bg-green-800 text-white py-3 px-5 rounded-full text-xl"
              >
                Sign Up with Email
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl mb-5">
              Welcome, {user.displayName || user.email}
            </h2>
            <div className="text-4xl font-bold mb-5">
              Balance: {balance.toFixed(2)}€
            </div>

            <div className="mb-5">
              <h2 className="text-3xl mb-2">Next Free Spin In:</h2>
              <div className="text-4xl font-bold">{timeLeft}s</div>
            </div>

            <div className="flex justify-center items-center mb-10">
              <div
                className={`w-32 h-32 border-4 border-yellow-300 rounded-full ${
                  spinning ? "animate-spin" : ""
                }`}
              >
                <div className="flex justify-center items-center h-full">
                  <span className="text-2xl">
                    {spinning ? "..." : balance.toFixed(2) + "€"}
                  </span>
                </div>
              </div>
            </div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="mb-4 p-4 rounded bg-black text-yellow-300 text-center w-full"
              placeholder="Enter spin amount"
            />
            <button
              onClick={handleSpin}
              className={`bg-purple-800 text-white py-3 px-5 rounded-full hover:bg-purple-900 transition-all mb-5 text-xl`}
            >
              {isFreeSpin ? "Free Spin" : `Spin (${betAmount}€)`}
            </button>

            <div className="mt-10">
              <h2 className="text-4xl font-bold text-yellow-300 mb-5">
                Rocket Game 🚀
              </h2>
              <div className="mb-5">
                <div className="relative h-64 bg-black rounded-lg overflow-hidden">
                  {rocketFlying && !gameOver && (
                    <div
                      className="absolute bottom-0 left-0 transform translate-x-0 translate-y-0"
                      style={{
                        bottom: `${rocketMultiplier * 10}%`,
                        left: `${rocketMultiplier * 10}%`,
                      }}
                    >
                      <span className="text-6xl">🚀</span>
                    </div>
                  )}
                  {gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-600 text-4xl font-bold">
                      BOOM!
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold mt-4">
                  Multiplier: x{rocketMultiplier.toFixed(2)}
                </div>
              </div>
              <button
                onClick={handleRocketStart}
                className="bg-blue-800 text-white py-3 px-5 rounded-full hover:bg-blue-900 transition-all mb-5 mr-2 text-xl"
              >
                Start Rocket
              </button>
              <button
                onClick={handleCashOut}
                disabled={!rocketFlying}
                className={`bg-green-800 text-white py-3 px-5 rounded-full hover:bg-green-900 transition-all mb-5 text-xl ${
                  !rocketFlying ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Cash Out
              </button>
            </div>

            <div className="mt-10">
              <h3 className="text-3xl font-bold text-yellow-300">
                Rewards & Promotions
              </h3>
              {rewardIndex < rewards.length ? (
                <ul className="mt-4">
                  {rewards.slice(rewardIndex).map((reward, index) => (
                    <li key={index} className="text-lg text-green-500">
                      {reward}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-gray-400">
                  No rewards yet. Keep playing to earn rewards!
                </p>
              )}
              <button
                onClick={claimReward}
                className="bg-yellow-800 text-black py-3 px-5 rounded-full hover:bg-yellow-900 transition-all mt-5 text-xl"
              >
                Claim Reward
              </button>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-purple-800 text-white py-3 px-5 rounded-full mb-5 text-xl"
            >
              Sign Out
            </button>
          </div>
        )}
      </main>

      <footer
        className="bg-black p-4 text-center fixed bottom-0 left-0 right-0 flex justify-around"
        style={{ paddingBottom: "60px" }}
      >
        <button className="text-yellow-300 font-bold text-xl" onClick={handleDeposit}>
          Deposit Money
        </button>
        <button
          className="text-yellow-300 font-bold text-xl"
          onClick={() => setShowMenu(!showMenu)}
        >
          &#9776; Menu
        </button>
      </footer>

      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
          <ul className="space-y-4 text-center">
            <li
              className="text-lg text-white"
              onClick={() => setShowMenu(false)}
            >
              Home
            </li>
            <li
              className="text-lg text-white"
              onClick={() => setShowMenu(false)}
            >
              Games
            </li>
            <li
              className="text-lg text-white"
              onClick={() => setShowMenu(false)}
            >
              Promotions
            </li>
            <li
              className="text-lg text-white"
              onClick={() => setShowMenu(false)}
            >
              Contact
            </li>
          </ul>
          <button
            className="text-yellow-300 font-bold mt-8 text-xl"
            onClick={() => setShowMenu(false)}
          >
            Close Menu
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
