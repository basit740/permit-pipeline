import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Permit Pipeline · Milestone 1 visual proof',
  description:
    'Visual engineering prototype of a regulation ingestion pipeline for Dutch construction permit checks. Sample data is illustrative.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
