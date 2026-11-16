import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/noto-sans-telugu';
import '@fontsource-variable/anek-telugu';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'OnlineLand Admin',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#1456C8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
