'use client';

import React, { useState, useEffect } from 'react';
import { GameState, DiceRoll } from '@/types';
import Dice from './Dice';
import { storage } from '@/lib/storage';

interface GameBoardProps {
  game: GameState;
  currentUserId: string;
  onRoll: () => Promise<void>;
  onHold: () => Promise<void>;
  onNewGame: () => Promise<void>;
  isRolling: boolean;
  lastRoll?: DiceRoll | null;
  isDoubleSix: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  currentUserId,
  onRoll,
  onHold,
  onNewGame,
  isRolling,
  lastRoll,
  isDoubleSix,
}) => {
  const [showDoubleSixMessage, setShowDoubleSixMessage] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);

  const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
  const isMyTurn = currentPlayer.userId === currentUserId;
  const isPlayer1 = game.player1.userId === currentUserId;
  const myScore = isPlayer1 ? game.player1Score : game.player2Score;
  const myRoundScore = isPlayer1 ? game.player1RoundScore : game.player2RoundScore;
  const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
  const opponentRoundScore = isPlayer1 ? game.player2RoundScore : game.player1RoundScore;
  const opponent = isPlayer1 ? game.player2 : game.player1;

  useEffect(() => {
    if (isDoubleSix) {
      setShowDoubleSixMessage(true);
      const timer = setTimeout(() => setShowDoubleSixMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDoubleSix]);

  useEffect(() => {
    if (isRolling) {
      setDiceRolling(true);
      const timer = setTimeout(() => setDiceRolling(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRolling, lastRoll]);

  const player1Wins = storage.getWinCount(game.player1.userId);
  const player2Wins = storage.getWinCount(game.player2.userId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Double Six Message */}
      {showDoubleSixMessage && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-lg text-center animate-bounce">
          <p className="text-xl font-bold">🎲 Double Six! Round score lost! 🎲</p>
        </div>
      )}

      {/* Game Over Message */}
      {game.status === 'finished' && game.winnerId && (
        <div className="mb-4 p-4 bg-green-500 text-white rounded-lg text-center">
          <p className="text-2xl font-bold">
            🎉 {game.winnerId === game.player1.id ? game.player1.username : game.player2.username}{' '}
            Wins! 🎉
          </p>
        </div>
      )}

      {/* Player Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Player 1 */}
        <div
          className={`
            p-6 rounded-lg border-2 transition-all
            ${
              game.currentPlayerId === game.player1.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{game.player1.username}</h3>
            {game.currentPlayerId === game.player1.id && (
              <span className="text-sm bg-blue-500 text-white px-2 py-1 rounded">Your Turn</span>
            )}
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">{game.player1Score}</div>
          <div className="text-sm text-gray-600">
            Round: <span className="font-semibold">{game.player1RoundScore}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Wins: {player1Wins}</div>
        </div>

        {/* Player 2 */}
        <div
          className={`
            p-6 rounded-lg border-2 transition-all
            ${
              game.currentPlayerId === game.player2.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{game.player2.username}</h3>
            {game.currentPlayerId === game.player2.id && (
              <span className="text-sm bg-blue-500 text-white px-2 py-1 rounded">Your Turn</span>
            )}
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">{game.player2Score}</div>
          <div className="text-sm text-gray-600">
            Round: <span className="font-semibold">{game.player2RoundScore}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Wins: {player2Wins}</div>
        </div>
      </div>

      {/* Dice Display */}
      <div className="bg-gray-100 p-8 rounded-lg mb-6">
        <div className="flex justify-center items-center gap-6 mb-4">
          {lastRoll ? (
            <>
              <Dice value={lastRoll.die1} isRolling={diceRolling} size="lg" />
              <Dice value={lastRoll.die2} isRolling={diceRolling} size="lg" />
            </>
          ) : (
            <>
              <Dice value={1} size="lg" />
              <Dice value={1} size="lg" />
            </>
          )}
        </div>
        {lastRoll && (
          <p className="text-center text-gray-600">
            Rolled: {lastRoll.die1} + {lastRoll.die2} = {lastRoll.die1 + lastRoll.die2}
          </p>
        )}
      </div>

      {/* Game Info */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-gray-700">
          Winning Score: <span className="font-bold">{game.winningScore}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {isMyTurn ? "It's your turn!" : `Waiting for ${currentPlayer.username}...`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {game.status === 'active' && isMyTurn && (
          <>
            <button
              onClick={onRoll}
              disabled={isRolling || showDoubleSixMessage}
              className={`
                px-6 py-3 bg-green-500 text-white rounded-lg font-semibold
                hover:bg-green-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isRolling ? 'animate-pulse' : ''}
              `}
            >
              {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
            </button>
            <button
              onClick={onHold}
              disabled={isRolling || showDoubleSixMessage}
              className={`
                px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold
                hover:bg-orange-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              📥 Hold
            </button>
          </>
        )}
        <button
          onClick={onNewGame}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          🔄 New Game
        </button>
      </div>
    </div>
  );
};

export default GameBoard;

