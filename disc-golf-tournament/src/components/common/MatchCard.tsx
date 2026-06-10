import type { ReactNode } from 'react';
import { scoreText } from '../../lib/display';

interface MatchCardProps {
  eyebrow: string;
  title: string;
  player1: string;
  player2: string;
  player1Score: number | null;
  player2Score: number | null;
  winner: string;
  children?: ReactNode;
}

export function MatchCard({
  eyebrow,
  title,
  player1,
  player2,
  player1Score,
  player2Score,
  winner,
  children,
}: MatchCardProps) {
  const tied = player1Score !== null && player2Score !== null && player1Score === player2Score;

  return (
    <article className="match-card">
      <div className="match-card__topline">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div className="match-row">
        <span>{player1}</span>
        <strong>{scoreText(player1Score)}</strong>
      </div>
      <div className="match-row">
        <span>{player2}</span>
        <strong>{scoreText(player2Score)}</strong>
      </div>
      <div className={tied ? 'match-status match-status--warning' : 'match-status'}>
        {tied ? 'Tie needs organizer decision' : `Winner: ${winner}`}
      </div>
      {children}
    </article>
  );
}
