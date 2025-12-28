# Dice Game Frontend

A Next.js frontend application for the Dice Game, built with TypeScript and Tailwind CSS.

## Features

- ✅ **Authentication**: Login and registration
- ✅ **Game Display**: Beautiful UI showing game state, scores, and dice
- ✅ **Game Actions**: Roll dice, hold, and start new games
- ✅ **Win Tracking**: Tracks how many times each player has won (persisted in localStorage)
- ✅ **Sound Effects**: Audio feedback for game actions (can be toggled)
- ✅ **Animations**: Visual feedback for dice rolls and special events
- ✅ **Responsive Design**: Works on desktop and mobile devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Make sure the backend server is running on port 3000 (or update the URL above).

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
front/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Home/login page
│   ├── game/           # Game page
│   └── layout.tsx      # Root layout with AuthProvider
├── components/         # React components
│   ├── AuthForm.tsx   # Login/register form
│   ├── Dice.tsx        # Dice display component
│   └── GameBoard.tsx   # Main game board
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/                # Utilities
│   ├── api.ts          # API client
│   ├── storage.ts      # LocalStorage utilities
│   └── sounds.ts       # Sound effects manager
└── types/              # TypeScript types
    └── index.ts        # Shared types
```

## Features Explained

### Win Tracking
Wins are tracked per user ID and stored in localStorage. The win count is displayed next to each player's name.

### Sound Effects
- **Roll**: Pleasant tone when rolling dice
- **Double Six**: Dramatic sound when rolling 6 & 6
- **Hold**: Confirmation sound when holding
- **Win**: Victory fanfare when a player wins

Sounds can be toggled on/off using the 🔊/🔇 button in the game interface.

### Animations
- Dice rolling animation when rolling
- Bounce animation for double six message
- Pulse animation on active player's card
- Smooth transitions throughout

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- All game logic lives on the backend - the frontend only displays state and sends actions
- Data persistence uses localStorage (wins tracking, preferences)
- The app requires authentication to play games
- For simulation purposes, you can create games with different usernames on the same page
