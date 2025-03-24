'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { ReduxProvider } from '@/lib/redux/provider';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/socket-provider';
import { WebRTCProvider } from '@/providers/webrtc-provider';
import { LayoutContent } from '@/components/LayoutContent';
import '@/styles/globals.css';
import { FirstInteractionProvider } from '@/providers/first-interaction';

const inter = Inter({ subsets: ['latin'] });

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <html lang='en'>
      <body className={cn(inter.className, 'min-h-screen bg-background')}>
        <ReduxProvider>
          <FirstInteractionProvider>
            <SocketProvider>
              <WebRTCProvider>
                <LayoutContent>{children}</LayoutContent>
                <Toaster richColors position='top-center' />
              </WebRTCProvider>
            </SocketProvider>
          </FirstInteractionProvider>
        </ReduxProvider>
      </body>
    </html>
  );
};

export default Layout;
