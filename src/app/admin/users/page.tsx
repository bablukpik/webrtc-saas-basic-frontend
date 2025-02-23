"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { socket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [callingUserId, setCallingUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        const currentUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = await currentUser.json();
        setCurrentUserRole(userData.role);
      } else {
        alert('Failed to fetch users');
      }
    };

    fetchUsers();
  }, [router]);

  const handleDeleteUser = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setUsers(users.filter(user => user.id !== id));
    } else {
      alert('Failed to delete user');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      const updatedUser = await res.json();
      setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));
    } else {
      alert('Failed to update user role');
    }
  };

  const handleCallUser = (userId: string) => {
    setCallingUserId(userId);
    console.log('Socket connection status:', socket.connected);
    console.log('Current user role:', currentUserRole);
    console.log('Recipient user ID:', userId);
    
    socket.emit('call', { 
      callerId: currentUserRole, 
      recipientId: userId 
    }, (response: any) => {
      console.log('Call event emitted, server response:', response);
    });

    setTimeout(() => {
      setCallingUserId(null);
      console.log('Call timed out after 30 seconds');
    }, 30000);
  };

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Actions</th>
            <th className="border px-4 py-2">Call</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="w-full p-2"
                  disabled={currentUserRole !== 'ADMIN'}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td className="border px-4 py-2">
                {currentUserRole === 'ADMIN' && (
                  <Button onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                )}
              </td>
              <td className="border px-4 py-2">
                <Button 
                  onClick={() => handleCallUser(user.id)} 
                  disabled={callingUserId === user.id}
                >
                  {callingUserId === user.id ? 'Calling...' : 'Call'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 