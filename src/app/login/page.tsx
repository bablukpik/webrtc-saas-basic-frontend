"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      console.log('Token received:', token);
      localStorage.setItem('token', token);
      router.push('/dashboard'); // Changed from '/' to '/dashboard'
    } else {
      const { message } = await res.json();
      console.error('Login error:', message);
      alert(message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2"
        />
        <Button type="submit">Login</Button>
      </form>
      <p className="mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup">
          <Button variant="link">Sign Up</Button>
        </Link>
      </p>
    </div>
  );
} 