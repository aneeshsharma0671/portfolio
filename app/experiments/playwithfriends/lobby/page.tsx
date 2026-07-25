import type { Metadata } from 'next';

import { PlayWithFriendsLobbyView } from '@/src/Components/Experiments/PlayWithFriends/PlayWithFriendsRouteViews';

export const metadata: Metadata = {
  title: 'Lobby | Play With Friends',
  description: 'Joined lobby for local or online Play With Friends sessions.',
};

export default function PlayWithFriendsLobbyRoutePage() {
  return <PlayWithFriendsLobbyView />;
}
