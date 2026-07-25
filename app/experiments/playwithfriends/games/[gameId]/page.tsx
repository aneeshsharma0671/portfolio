import type { Metadata } from 'next';

import { PlayWithFriendsGameView } from '@/src/Components/Experiments/PlayWithFriends/PlayWithFriendsRouteViews';
type PlayWithFriendsGameRoutePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Game | Play With Friends',
  description: 'Active Play With Friends game table.',
};

export default async function PlayWithFriendsGameRoutePage({
  params,
}: PlayWithFriendsGameRoutePageProps) {
  const { gameId } = await params;

  return <PlayWithFriendsGameView gameId={gameId} />;
}
