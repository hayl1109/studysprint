# StudySprint by Hayl

A Pomodoro timer where every completed focus session grows a tree in your own forest.

Built for **Horizon** (Hack Club).

Sign in, set a focus length, and start a session. When it ends, a tree gets added to your forest and your streak goes up. Alongside the timer there's a task list, a notes page, and a leaderboard if you want to compare totals with other people using the app.

## Features

- **Timer** — customizable focus and break lengths, with a fullscreen mode
- **Forest** — a tree for every completed session, tagged by subject
- **Streak** — tracks consecutive days with a completed session
- **Tasks** — a simple to-do list for the day
- **Notes** — a freeform notes page for session logs or anything else
- **Lofi player** — a 24/7 background stream you can toggle on or off
- **Leaderboard** — see how your total focus minutes and streak compare to others
- **Dark mode**

## Tech

- React
- Firebase Auth (Google sign-in) and Firestore (leaderboard sync)
- Tailwind CSS
- `canvas-confetti` for session-complete celebration
- `lucide-react` for icons

## Running it locally

```bash
git clone https://github.com/hayl1109/studysprint.git
cd studysprint
npm install
```

You'll need a free [Firebase](https://firebase.google.com) project with:
- Authentication → Google sign-in enabled
- Firestore → a `users` collection, with rules that let signed-in users read the collection and write only their own document:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Drop your Firebase config into `src/firebase.js`, then:

```bash
npm start
```

## What's not finished

- Forests aren't shareable yet — that's a planned next step, not a current feature
- The leaderboard needs the Firestore rules above to work; without them it'll show a permissions error

## Notes on data

Tasks, notes, and session history are saved to your browser's local storage. Your name, photo, total focus minutes, and streak are also synced to Firestore so they can show up on the leaderboard.

## License

MIT
