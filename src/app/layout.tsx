import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// Toaster import removed, it's now in RootProviders
import { AuthProvider } from '@/contexts/AuthContext'; // AuthProvider might still be imported if not fully moved, but ThemeProvider is the primary one. Let's clean up. AuthProvider is in RootProviders.
// ThemeProvider import removed, it's now in RootProviders
import { RootProviders } from '@/components/RootProviders'; // New import

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LWV CLINIC E-DOC',
  description: 'Collaborative documentation for rehab therapy teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
