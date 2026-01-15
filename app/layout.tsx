import type { Metadata } from 'next';
import '../src/App.css';

export const metadata: Metadata = {
  title: 'The Sharma Project',
  description: 'Portfolio of Aneesh Sharma',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
