'use client';

import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/providers/webrtc-provider';
import { toast } from 'sonner';
import {
  useGetAllUsersQuery,
  useGetCurrentUserQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from '@/lib/redux/api/usersApi';

export default function UserManagement() {
  const { initiateCall, isCallInProgress, callingUserId, cancelCall } = useWebRTC();

  // RTK Query hooks
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useGetAllUsersQuery();
  const { data: currentUser } = useGetCurrentUserQuery();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  if (usersError) {
    toast.error('Failed to fetch users');
  }

  const handleDeleteUser = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      await deleteUser(id).unwrap();
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateUserRole({ id, role: newRole }).unwrap();
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleCallClick = (userId: string) => {
    try {
      initiateCall(userId);
    } catch (error: any) {
      toast.error('Call Failed', {
        description: 'Unable to start call. Please check your camera and microphone permissions.',
      });
    }
  };

  if (isLoadingUsers) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>User Management</h1>
      <table className='min-w-full'>
        <thead>
          <tr>
            <th className='border px-4 py-2'>Name</th>
            <th className='border px-4 py-2'>Email</th>
            <th className='border px-4 py-2'>Role</th>
            <th className='border px-4 py-2'>Actions</th>
            <th className='border px-4 py-2'>Call</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className='border px-4 py-2'>{user.name}</td>
              <td className='border px-4 py-2'>{user.email}</td>
              <td className='border px-4 py-2'>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className='w-full p-2'
                  disabled={currentUser?.role !== 'ADMIN'}
                >
                  <option value='USER'>User</option>
                  <option value='ADMIN'>Admin</option>
                </select>
              </td>
              <td className='border px-4 py-2'>
                {currentUser?.role === 'ADMIN' && (
                  <Button onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                )}
              </td>
              <td className='border px-4 py-2'>
                {callingUserId === user.id ? (
                  <Button
                    onClick={cancelCall}
                    variant='destructive'
                    className='flex items-center'
                  >
                    <span className='animate-pulse mr-2'>●</span>
                    Cancel Call
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCallClick(user.id)}
                    disabled={isCallInProgress}
                  >
                    Call
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
