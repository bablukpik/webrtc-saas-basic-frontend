'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { publicRoutes } from '@/utils/auth';
import Sidebar from './Sidebar';
import Header from './Header';
import { useGetCurrentUserQuery } from '@/lib/redux/api/usersApi';
import { useLogoutMutation } from '@/lib/redux/api/authApi';

interface LayoutContentProps {
  children: ReactNode;
}

export const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  // Skip query on public pages
  const { data: user, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: isPublicRoute,
  });
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isPublicRoute) {
    return <main>{children}</main>;
  }

  if (isLoading) {
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>;
  }

  return (
    <div className='flex'>
      <Sidebar />
      <div className='flex-1'>
        <Header userEmail={user?.email} onLogout={handleLogout} />
        <main className='p-4'>{children}</main>
      </div>
    </div>
  );
};
