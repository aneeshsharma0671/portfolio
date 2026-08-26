import SudokuClient from './SudokuClient';
import type { Viewport } from 'next';

export const metadata = {
  title: 'Sudoku — The Sharma Project',
  description: 'A classic Sudoku puzzle game',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function SudokuPage() {
  return <SudokuClient />;
}
