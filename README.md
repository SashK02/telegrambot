#5E Project

## Overview

This repository contains both the frontend and backend code for the 5E project. The project includes a web-based gambling game hosted on Firebase and a Telegram bot that manages user interactions and payments.

### Frontend

- **Tech Stack**: React, Firebase, TailwindCSS
- **Hosting**: The frontend is hosted on Firebase.
- **Key Functionalities**:
  - User authentication via email, password, and Google Sign-In (note: Google Sign-In may not work on Telegram mini-apps due to OAuth restrictions).
  - Users can play games like spinning the wheel and rocket betting, with Firebase managing user balances.
  - Integration with Stripe for handling payments.
  - State management and interaction with Firebase to update user balances and handle game logic.

### Backend

- **Tech Stack**: Node.js, Express, Firebase Firestore, Telegram Bot API, Stripe API
- **Hosting**: The backend is hosted on Heroku.
- **Key Functionalities**:
  - Provides endpoints for handling Stripe payments.
  - Manages user balances through Telegram interactions.
  - Integrates with Firebase Firestore to store and manage user data.
  - Sends updates and responses to users via Telegram bot.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SashK02/5E.git
cd 5E
```
Frontend Setup
- cd frontend
- npm install
- create .env file with secret keys
- npm run start
- firebase init
- npm run build
- firebase deploy

Backend Setup
- cd backend
- npm install
- create .env file with secret keys
- node index.js
Deploy to heroku
- git add .
- git commit -m "Initial commit"
- git push heroku master

How It Works
Frontend
Firebase Integration:

The frontend interacts with Firebase for user authentication and database management.
Firebase Firestore is used to store user data such as balances, bets, and game results.
Users can sign in using email and password or Google. The app also supports signing up for new accounts. Password reset functionality is currently only available through the Firebase console.
Game Logic:

The app features games such as a spinning wheel and rocket betting where users can place bets.
User interactions and state management are handled using React hooks.
Stripe Payments:

Users can deposit money using Stripe. The payment process is initiated from the frontend, and once the payment is successful, the backend updates the user’s balance in Firebase.
Deployment:

The frontend is built using React and TailwindCSS and is deployed on Firebase Hosting.
Backend
Telegram Bot:

The Telegram bot interacts with users, allowing them to check their balance, place bets, and deposit money.
User balances are tracked and updated through interactions with the bot.
Stripe Integration:

The backend handles Stripe payments, creating checkout sessions and updating the user’s balance in Firebase upon successful payment.
Firebase Firestore:

The backend uses Firebase Firestore to store and manage user data, including balances and payment histories.
Deployment:

The backend is hosted on Heroku and is responsible for handling Stripe payments and communicating with the Telegram bot.
Libraries Used
Frontend
React: JavaScript library for building user interfaces.
Firebase: For authentication, database, and hosting.
TailwindCSS: Utility-first CSS framework.
Stripe: Payment processing.
Backend
Node.js: JavaScript runtime environment.
Express: Web framework for Node.js.
Firebase: For database management.
node-telegram-bot-api: Library for interacting with the Telegram Bot API.
Stripe: Payment processing.
Hosting
Frontend: Hosted on Firebase (URL provided after deployment).
Backend: Hosted on Heroku at https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/.

Telegram bot can be found on link https://t.me/MrGamblerBot by username @MrGamblerBot






