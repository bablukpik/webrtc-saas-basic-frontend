"use client";

import { Button } from '@/components/ui/button';

interface HeaderProps {
  userEmail: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">WebRTC Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{userEmail}</span>
          <Button onClick={onLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Header; 