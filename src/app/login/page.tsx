"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginMutation } from '@/lib/redux/api';
import { useAppDispatch } from '@/lib/redux/hooks';
import { loginSuccess, loginFail } from '@/lib/redux/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  
  const cleanupLocalStorage = () => {
    // Check for invalid values in localStorage
    if (localStorage.getItem('userId') === 'undefined' || 
        localStorage.getItem('userId') === 'null') {
      console.log('Removing invalid userId from localStorage');
      localStorage.removeItem('userId');
    }
    
    if (localStorage.getItem('userEmail') === 'undefined' || 
        localStorage.getItem('userEmail') === 'null') {
      localStorage.removeItem('userEmail');
    }
    
    if (localStorage.getItem('userName') === 'undefined' || 
        localStorage.getItem('userName') === 'null') {
      localStorage.removeItem('userName');
    }
  };

  useEffect(() => {
    // Clean up any invalid localStorage entries on login page load
    cleanupLocalStorage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Login API response:', result);
      
      let userData;
      let token = '';
      
      if (result.token) {
        token = result.token;
      }
      
      // Format 1: { user: {...}, token: '...' }
      if (result.user && result.user.id) {
        userData = result.user;
      } 
      // Format 2: { id: '...', email: '...', token: '...' }
      else if (result.id) {
        userData = {
          id: result.id,
          email: result.email || email,
          name: result.name || result.email?.split('@')[0] || email.split('@')[0],
          role: result.role || 'USER',
        };
      }
      // Format 3: JWT token only
      else if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const tokenPayload = JSON.parse(atob(tokenParts[1]));
            console.log('JWT token payload:', tokenPayload);
            
            const userId = tokenPayload.id || tokenPayload.sub || tokenPayload.userId || tokenPayload.user_id;
            
            if (userId) {
              userData = {
                id: userId,
                email: tokenPayload.email || email,
                name: tokenPayload.name || email.split('@')[0],
                role: tokenPayload.role || 'USER',
              };
            }
          }
        } catch (e) {
          console.error('Failed to parse token payload:', e);
        }
      }
      
      // Final fallback - create a user ID if none exists
      if (!userData) {
        console.warn('Could not extract user data from response, creating fallback');
        const fallbackId = `user_${Date.now().toString(36)}`;
        userData = {
          id: fallbackId,
          email: email,
          name: email.split('@')[0],
          role: 'USER',
        };
      }
      
      console.log('Final extracted user data:', userData);
      
      // Make sure to verify userId is valid before storing
      if (userData.id && userData.id !== 'undefined' && userData.id !== 'null') {
        console.log('Storing verified user data in localStorage:', {
          id: userData.id,
          email: userData.email
        });
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name);
        
        // Store in Redux
        dispatch(loginSuccess({ 
          user: userData, 
          token: token || `fallback_token_${Date.now()}`
        }));
        
        // Navigate to dashboard - socket will be initialized by the provider
        router.push('/dashboard');
      } else {
        throw new Error('Invalid user ID received from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      dispatch(loginFail(errorMessage));
      setError(errorMessage);
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup">
          <Button variant="link">Sign Up</Button>
        </Link>
      </p>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
} 