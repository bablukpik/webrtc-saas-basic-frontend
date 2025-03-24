'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const router = useRouter();
  const currentPath = usePathname();

  return (
    <aside className='w-64 bg-gray-900 text-white p-4 shadow-lg border-r border-gray-700'>
      <h2 className='text-lg font-bold mb-4'>Navigation</h2>
      <ul className='space-y-2'>
        <li>
          <Button
            variant='link'
            className={`w-full text-left ${
              currentPath === '/dashboard' ? 'text-blue-400' : 'text-gray-200'
            } hover:bg-gray-700 rounded-md p-2`}
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
        </li>
        <li>
          <Button
            variant='link'
            className={`w-full text-left ${
              currentPath === '/users' ? 'text-blue-400' : 'text-gray-200'
            } hover:bg-gray-700 rounded-md p-2`}
            onClick={() => router.push('/users')}
          >
            User Management
          </Button>
        </li>
        {/* Add more navigation items as needed */}
      </ul>
    </aside>
  );
};

export default Sidebar;
