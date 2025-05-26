// Extended document interface for proper typing
interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

// Extended element interface for proper typing
interface ExtendedHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export const checkFullscreenSupport = () => {
  const doc = document as ExtendedDocument;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
};

export const isFullscreen = () => {
  const doc = document as ExtendedDocument;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
};

export const requestFullscreen = async (element: HTMLElement): Promise<void> => {
  // Verify browser support
  if (!checkFullscreenSupport()) {
    throw new Error('Fullscreen API is not supported in this browser');
  }

  // Ensure element exists and is valid
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Invalid element provided for fullscreen');
  }

  // Check if we're already in fullscreen
  if (isFullscreen()) {
    return; // Already in fullscreen mode
  }

  // Remove any problematic attributes that might cause hydration issues
  ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'].forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });

  const el = element as ExtendedHTMLElement;
  let requestMethod: () => Promise<void>;
  
  // Determine which request method to use based on browser support
  if (typeof el.requestFullscreen === 'function') {
    requestMethod = () => el.requestFullscreen();
  } else if (typeof el.webkitRequestFullscreen === 'function') {
    requestMethod = () => el.webkitRequestFullscreen!();
  } else if (typeof el.mozRequestFullScreen === 'function') {
    requestMethod = () => el.mozRequestFullScreen!();
  } else if (typeof el.msRequestFullscreen === 'function') {
    requestMethod = () => el.msRequestFullscreen!();
  } else {
    throw new Error('Fullscreen API is not supported in this browser');
  }

  try {
    // Create a promise that resolves when fullscreen is actually entered
    const fullscreenPromise = new Promise<void>((resolve, reject) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          cleanup();
          reject(new Error('Fullscreen request timed out - Please check your browser settings and try again'));
        }
      }, 2000);

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        document.removeEventListener('fullscreenchange', onChange);
        document.removeEventListener('webkitfullscreenchange', onChange);
        document.removeEventListener('mozfullscreenchange', onChange);
        document.removeEventListener('MSFullscreenChange', onChange);
      };

      const onChange = () => {
        if (isFullscreen()) {
          resolved = true;
          cleanup();
          resolve();
        }
      };

      // Listen for fullscreen change events
      document.addEventListener('fullscreenchange', onChange);
      document.addEventListener('webkitfullscreenchange', onChange);
      document.addEventListener('mozfullscreenchange', onChange);
      document.addEventListener('MSFullscreenChange', onChange);
    });

    // Request fullscreen
    await requestMethod().catch(error => {
      // Handle specific browser security policy errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Browser security policy prevented fullscreen. Please ensure you\'re responding to any permission prompts.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Fullscreen is not supported in this context. Please check your browser settings.');
        } else if (error.name === 'TypeError') {
          // Handle cases where the element might have been modified by extensions
          throw new Error('Failed to enter fullscreen. Please disable browser extensions that might interfere with the exam.');
        }
      }
      throw error;
    });

    // Wait for fullscreen to be confirmed
    await fullscreenPromise;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Permission denied or browser security policy prevented fullscreen';
    
    throw new Error(`Failed to enter fullscreen mode: ${errorMessage}`);
  }
};

export const exitFullscreen = async (): Promise<void> => {
  const doc = document as ExtendedDocument;
  
  if (!isFullscreen()) {
    return; // Not in fullscreen mode
  }

  try {
    // Create a promise that resolves when fullscreen is actually exited
    const exitPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Fullscreen exit timed out'));
      }, 2000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('mozfullscreenchange', onFullscreenChange);
        document.removeEventListener('MSFullscreenChange', onFullscreenChange);
      };

      const onFullscreenChange = () => {
        if (!isFullscreen()) {
          cleanup();
          resolve();
        }
      };

      // Listen for the fullscreen change event
      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      document.addEventListener('mozfullscreenchange', onFullscreenChange);
      document.addEventListener('MSFullscreenChange', onFullscreenChange);
    });

    // Try the standard API first, then fall back to vendor prefixes
    let exitMethod: () => Promise<void>;
    if (typeof doc.exitFullscreen === 'function') {
      exitMethod = () => doc.exitFullscreen();
    } else if (typeof doc.webkitExitFullscreen === 'function') {
      exitMethod = () => doc.webkitExitFullscreen!();
    } else if (typeof doc.mozCancelFullScreen === 'function') {
      exitMethod = () => doc.mozCancelFullScreen!();
    } else if (typeof doc.msExitFullscreen === 'function') {
      exitMethod = () => doc.msExitFullscreen!();
    } else {
      throw new Error('No fullscreen exit method available');
    }

    // Execute the exit method and handle potential errors
    await exitMethod().catch(error => {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Browser security policy prevented exiting fullscreen.');
        }
      }
      throw error;
    });

    // Wait for fullscreen to actually be exited
    await exitPromise;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to exit fullscreen';
    
    throw new Error(`Failed to exit fullscreen mode: ${errorMessage}`);
  }
};

export interface SecurityViolation {
  type: 'tab_switch' | 'fullscreen_exit' | 'key_combination' | 'right_click' | 'copy_paste';
  timestamp: Date;
  details?: string;
}

export class SecurityManager {
  private violations: SecurityViolation[] = [];
  private maxViolations: number = 3;
  private onViolationCallback?: (violations: SecurityViolation[]) => void;

  constructor(maxViolations: number = 3) {
    this.maxViolations = maxViolations;
  }

  public addViolation(violation: SecurityViolation) {
    this.violations.push(violation);
    if (this.onViolationCallback) {
      this.onViolationCallback(this.violations);
    }
    return this.violations.length >= this.maxViolations;
  }

  public getViolations() {
    return [...this.violations];
  }

  public onViolation(callback: (violations: SecurityViolation[]) => void) {
    this.onViolationCallback = callback;
  }

  public clear() {
    this.violations = [];
  }
}

export const preventRightClick = (event: MouseEvent) => {
  event.preventDefault();
  return false;
};

export const preventKeyboardShortcuts = (event: KeyboardEvent) => {
  // Known problematic shortcuts that should be prevented
  const restrictedKeys = [
    // Common copy/paste/print
    'c', 'v', 'p', 'C', 'V', 'P',
    // Save and inspect
    's', 'S', 'i', 'I', 'u', 'U',
    // Function keys
    'F3', 'F4', 'F5', 'F6', 'F7', 'F10', 'F11', 'F12',
    // Navigation
    'Tab', 'Escape',
    // Print screen and other system keys
    'PrintScreen', 'Insert', 'Delete',
    // Browser specific
    'r', 'R',  // Refresh
    'n', 'N',  // New window
    't', 'T',  // New tab
    'w', 'W',  // Close tab
    'h', 'H',  // History
    'j', 'J',  // Downloads
    'a', 'A',  // Select all
    'd', 'D',  // Bookmark
    'f', 'F',  // Find
    'b', 'B',  // Bold text in some editors
    'k', 'K',  // Various shortcuts
    'l', 'L',  // Location/address bar
    'm', 'M',  // Menu access
    'y', 'Y'   // History
  ];

  const needsPrevention = (
    // Ctrl/Cmd + Key combinations
    ((event.ctrlKey || event.metaKey) && restrictedKeys.includes(event.key)) ||
    // Alt + Key combinations
    (event.altKey && restrictedKeys.includes(event.key)) ||
    // Shift + Function keys
    (event.shiftKey && event.key.startsWith('F')) ||
    // Direct function keys
    event.key.startsWith('F') ||
    // PrintScreen key
    event.key === 'PrintScreen' ||
    // Alt + Tab
    (event.altKey && event.key === 'Tab') ||
    // Windows key + Tab/arrows (Meta key)
    (event.metaKey && ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) ||
    // Prevent tab navigation
    (!event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'Tab') ||
    // Prevent escape key
    event.key === 'Escape'
  );

  if (needsPrevention) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  return true;
};
