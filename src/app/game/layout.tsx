import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '观战台',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
