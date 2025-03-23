'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface FirstInteractionContextType {
  hasInteracted: boolean;
  setHasInteracted: (value: boolean) => void;
}

const FirstInteractionContext = createContext<FirstInteractionContextType>({
  hasInteracted: false,
  setHasInteracted: () => {},
});

// export const useFirstInteraction = () => useContext(FirstInteractionContext);
export const useFirstInteraction = () => {
  const context = useContext(FirstInteractionContext);
  if (!context) {
    throw new Error('useFirstInteraction must be used within an FirstInteractionProvider');
  }
  return context;
};

// Some browsers like Chrome and Edge require audio permission to be granted before a call can be accepted
// This provider is used to check if the user has interacted with the page
// If the user has interacted with the page, the audio permission is granted
// If the user has not interacted with the page, the audio permission is not granted
// This is used to show the "Please click anywhere on the page to enable audio for incoming calls" message
// Here is the known issue link: https://goo.gl/xX8pDD
export function FirstInteractionProvider({ children }: { children: React.ReactNode }) {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const value: FirstInteractionContextType = {
    hasInteracted,
    setHasInteracted,
  };

  return (
    <FirstInteractionContext.Provider value={value}>{children}</FirstInteractionContext.Provider>
  );
}
