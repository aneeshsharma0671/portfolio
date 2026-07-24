import { Suspense } from 'react';
import type { Metadata } from 'next';

import PlayWithFriendsExperience from '@/src/Components/Experiments/PlayWithFriends';

export const metadata: Metadata = {
  title: 'Play With Friends | The Sharma Project',
  description: 'A local lobby prototype for browser games with friends.',
};

export default function PlayWithFriendsRoutePage() {
  return (
    <Suspense>
      <PlayWithFriendsExperience />
    </Suspense>
  );
}
