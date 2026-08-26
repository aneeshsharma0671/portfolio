"use client";

import dynamic from 'next/dynamic';

const SudokuGame = dynamic(() => import('@/src/Components/SudokuGame/SudokuGame'), {
  ssr: false,
  loading: () => null,
});

export default function SudokuClient() {
  return <SudokuGame />;
}
