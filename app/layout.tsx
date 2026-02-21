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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
