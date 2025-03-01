'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { ReduxProvider } from '@/lib/redux/provider';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/socket-provider';
import { WebRTCProvider } from '@/providers/webrtc-provider';

const inter = Inter({ subsets: ['latin'] });

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Define public routes where we don't want to show the sidebar and header
  const isPublicRoute = ['/', '/login', '/signup'].includes(pathname);

  useEffect(() => {
    // Access localStorage only on the client side
    const email = localStorage.getItem('userEmail');
    setUserEmail(email || '');
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <html lang='en'>
      <body className={cn(inter.className, 'min-h-screen bg-background')}>
        <ReduxProvider>
          <SocketProvider>
            <WebRTCProvider>
              {isPublicRoute ? (
                // Render only the content for public routes
                <main>{children}</main>
              ) : (
                // Render the dashboard layout with sidebar and header
                <div className='flex'>
                  <Sidebar />
                  <div className='flex-1'>
                    <Header userEmail={userEmail} onLogout={handleLogout} />
                    <main className='p-4'>{children}</main>
                  </div>
                </div>
              )}
              <Toaster richColors position="top-center" />
            </WebRTCProvider>
          </SocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
};

export default Layout;
