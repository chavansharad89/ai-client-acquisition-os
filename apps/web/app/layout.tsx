import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'AI Client Acquisition OS',
  description: 'Starter Kit -> Launch Kit -> Client Acquisition System',
};

// Root layout. Meta Pixel base code will be added here in Phase 3,
// coordinated with the server-side event_id strategy frozen per
// architecture §14 item 1.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="visually-hidden">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
