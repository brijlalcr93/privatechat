import type { NextConfig } from 'next';

function normalizeOrigin(origin: string) {
  const trimmed = origin.trim();
  if (!trimmed) return '';

  try {
    return new URL(trimmed).host;
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

const devOrigins = process.env.NEXT_PUBLIC_DEV_ORIGINS
  ? process.env.NEXT_PUBLIC_DEV_ORIGINS
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.20.10.3',
    '192.168.1.22',
    ...devOrigins,
  ],
};

export default nextConfig;
