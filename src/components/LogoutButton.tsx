'use client';

import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { useAppDispatch } from '@/lib/redux/hooks';
import { logout } from '@/lib/redux/authSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogoutButton() {
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logout());
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return <Button onClick={handleLogout}>Logout</Button>;
} 