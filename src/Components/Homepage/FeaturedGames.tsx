import React from 'react';
import styles from './FeaturedGames.module.css';

interface Game {
  name: string;
  description: string;
  link: string;
}

const GAMES: Game[] = [
  {
    name: 'Sudoku',
    description: 'Classic number puzzle. Three difficulty levels, conflict detection, and a timer.',
    link: '/games/sudoku',
  },
];

const FeaturedGames: React.FC = () => {
  return (
    <section className={styles.gamesSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Games</h2>
        <p className={styles.subtitle}>Playable in the browser</p>

        <div className={styles.gamesList}>
          {GAMES.map((game) => (
            <a key={game.link} href={game.link} className={styles.gameItem}>
              <div className={styles.gameContent}>
                <h3 className={styles.gameName}>→ {game.name}</h3>
                <p className={styles.gameDescription}>{game.description}</p>
              </div>
              <span className={styles.gameLink}>Play →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGames;
