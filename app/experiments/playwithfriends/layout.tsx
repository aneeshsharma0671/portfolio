import type { ReactNode } from 'react';

import PlayWithFriendsRouteShell from '@/src/Components/Experiments/PlayWithFriends/PlayWithFriendsRouteShell';

export default function PlayWithFriendsRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlayWithFriendsRouteShell>{children}</PlayWithFriendsRouteShell>;
}
