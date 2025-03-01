'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ReactNode, useEffect } from 'react';
import { loginSuccess } from './authSlice';

export const ReduxProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Clean up any invalid localStorage values first
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userId') === 'undefined' || 
          localStorage.getItem('userId') === 'null') {
        console.log('Removing invalid userId from localStorage');
        localStorage.removeItem('userId');
      }
    }
    
    // Bootstrap user data from localStorage before initializing socket
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole') || 'USER';

      // Verify we have valid data before bootstrapping
      if (token && userId && userId !== 'undefined' && userId !== 'null') {
        console.log('Bootstrapping user data from localStorage:', { 
          userId, 
          userName: userName || '[not set]' 
        });
        
        // Dispatch login success with data from localStorage
        store.dispatch(
          loginSuccess({
            user: {
              id: userId,
              email: userEmail || '',
              name: userName || userEmail?.split('@')[0] || 'User',
              role: userRole,
            },
            token,
          })
        );
        
      } else {
        console.log('Not initializing socket - no valid user data in localStorage');
      }
    }
  }, []);
  
  return <Provider store={store}>{children}</Provider>;
}; 