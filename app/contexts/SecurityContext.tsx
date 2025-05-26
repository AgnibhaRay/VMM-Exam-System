'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityManager, SecurityViolation, isFullscreen, requestFullscreen, exitFullscreen, checkFullscreenSupport } from '../utils/securityUtils';

interface SecurityContextType {
  isSecureMode: boolean;
  violations: SecurityViolation[];
  enableSecureMode: (element: HTMLElement) => Promise<void>;
  disableSecureMode: () => Promise<void>;
  addViolation: (violation: SecurityViolation) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [securityManager] = useState(() => new SecurityManager(3));
  const [violations, setViolations] = useState<SecurityViolation[]>([]);

  useEffect(() => {
    securityManager.onViolation((newViolations) => {
      setViolations([...newViolations]);
    });
  }, [securityManager]);

  const addViolation = (violation: SecurityViolation) => {
    return securityManager.addViolation(violation);
  };

  const handleFullscreenChange = () => {
    if (!isFullscreen() && isSecureMode) {
      addViolation({
        type: 'fullscreen_exit',
        timestamp: new Date(),
        details: 'Exited fullscreen mode'
      });
    }
  };

  const preventRightClick = (event: MouseEvent) => {
    if (isSecureMode) {
      event.preventDefault();
      addViolation({
        type: 'right_click',
        timestamp: new Date(),
        details: 'Attempted to use right click'
      });
    }
  };

  const preventKeyboardShortcuts = (event: KeyboardEvent) => {
    if (isSecureMode && (
      (event.ctrlKey && 'cvpsuiCVPSUI'.includes(event.key)) ||
      event.key === 'F12' ||
      (event.altKey && (event.key === 'Tab' || event.key === 'PrintScreen'))
    )) {
      event.preventDefault();
      addViolation({
        type: 'key_combination',
        timestamp: new Date(),
        details: `Attempted to use keyboard shortcut: ${event.ctrlKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`
      });
    }
  };

  const verifyFullscreenState = async (): Promise<boolean> => {
    // Wait a short moment for fullscreen to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if we're actually in fullscreen mode
    if (!isFullscreen()) {
      return false;
    }

    return true;
  };

  const enableSecureMode = async (element: HTMLElement) => {
    try {
      // First verify fullscreen support
      if (!checkFullscreenSupport()) {
        throw new Error('Fullscreen mode is not supported by your browser');
      }

      // Request fullscreen mode if not already in it
      if (!isFullscreen()) {
        await requestFullscreen(element);
        
        // Verify fullscreen was successfully enabled
        const isFullscreenEnabled = await verifyFullscreenState();
        if (!isFullscreenEnabled) {
          throw new Error('Failed to enter fullscreen mode. Please ensure you have granted the necessary permissions.');
        }
      }

      // Set up security measures
      document.addEventListener('contextmenu', preventRightClick);
      document.addEventListener('keydown', preventKeyboardShortcuts);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      setIsSecureMode(true);
    } catch (error) {
      // Clean up if anything goes wrong
      try {
        if (isFullscreen()) {
          await exitFullscreen();
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      // Reset listeners just in case
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      // Re-throw the original error
      throw error;
    }
  };

  // ... enableSecureMode implementation above ...

  const disableSecureMode = async () => {
    // First remove all event listeners to prevent any race conditions
    const cleanup = () => {
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };

    try {
      // Try to exit fullscreen if we're in it
      if (isFullscreen()) {
        await exitFullscreen();
        
        // Double check we actually exited fullscreen
        if (isFullscreen()) {
          throw new Error('Failed to exit fullscreen mode');
        }
      }
      
      // Clean up event listeners and update state
      cleanup();
      
      // Finally update the secure mode state
      setIsSecureMode(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to disable secure mode:', errorMessage);
      throw error; // Propagate the error back
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isSecureMode,
        violations,
        enableSecureMode,
        disableSecureMode,
        addViolation,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}
