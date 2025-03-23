'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginMutation } from '@/lib/redux/api/authApi';
import { useAppDispatch } from '@/lib/redux/hooks';
import { loginSuccess } from '@/lib/redux/authSlice';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({ email, password }).unwrap();

      // Update Redux state
      dispatch(
        loginSuccess({
          user: result.user,
        })
      );

      toast.success('Login successful');
      router.push('/users');
    } catch (error: any) {
      toast.error(error.data?.message || 'Login failed');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <h1 className='text-3xl font-bold'>Login</h1>
      <form onSubmit={handleSubmit} className='flex flex-col space-y-4'>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className='border p-2'
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className='border p-2'
        />
        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className='mt-4'>
        Don&apos;t have an account?{' '}
        <Link href='/signup'>
          <Button variant='link'>Sign Up</Button>
        </Link>
      </p>
      {/* {error && <p className="text-red-500 mt-4">{error}</p>} */}
    </div>
  );
}
