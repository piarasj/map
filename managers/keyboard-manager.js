/**
 * =====================================================
 * FILE: managers/keyboard-manager.js
 * PURPOSE: Global keyboard shortcut handling
 * DEPENDENCIES: SettingsManager, FileUploadManager, ReferenceMarker
 * EXPORTS: KeyboardManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('⌨️ Loading keyboard-manager.js...');

  // Keyboard shortcut constants
  const KEYBOARD_SHORTCUTS = {
    CLEAR_REFERENCE: 'c',
    SHOW_SETTINGS: 's',
    FILE_UPLOAD: 'f',
    TOGGLE_COUNTIES: 'o',
    TOGGLE_DIOCESES: 'i',
    TOGGLE_SIDEBAR: 't'
  };

  // ==================== KEYBOARD MANAGER ====================
  class KeyboardManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.setupEventListener();
    }

    init() {
      console.log('⌨️ Keyboard Manager initialized');
    }

    setupEventListener() {
      document.addEventListener('keydown', (e) => {
        if (this.isTypingInInput(e.target)) return;
        
        const key = e.key.toLowerCase();
        
        switch (key) {
          case KEYBOARD_SHORTCUTS.CLEAR_REFERENCE:
            this.handleClearReference();
            break;
          case KEYBOARD_SHORTCUTS.SHOW_SETTINGS:
            this.handleShowSettings(e);
            break;
          case KEYBOARD_SHORTCUTS.FILE_UPLOAD:
            this.handleFileUpload(e);
            break;
          case KEYBOARD_SHORTCUTS.TOGGLE_COUNTIES:
            this.handleToggleCounties(e);
            break;
          case KEYBOARD_SHORTCUTS.TOGGLE_DIOCESES:
            this.handleToggleDioceses(e);
            break;
          case KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR:
            this.handleToggleSidebar(e);
            break;
        }
      });
      
      console.log('⌨️ Keyboard shortcuts enabled');
    }

    isTypingInInput(element) {
      const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
      const typingTypes = ['text', 'search', 'email', 'password', 'number', 'tel', 'url'];
      
      return (
        typingElements.includes(element.tagName) ||
        element.contentEditable === 'true' ||
        element.isContentEditable ||
        element.classList.contains('search-input') ||
        element.closest('.search-container') !== null ||
        typingTypes.includes(element.type)
      );
    }

    handleClearReference() {
      if (window.ReferenceMarker?.exists()) {
        window.ReferenceMarker.clear();
        console.log('🔤 Shortcut C: Reference marker cleared');
        
        if (this.eventBus) {
          this.eventBus.emit('keyboard:shortcut', { 
            key: 'clear-reference', 
            action: 'Reference marker cleared' 
          });
        }
      }
    }

    handleShowSettings(e) {
      if (window.SettingsManager?.showSettings) {
        window.SettingsManager.showSettings();
        console.log('🔤 Shortcut S: Settings opened');
        e.preventDefault();
        
        if (this.eventBus) {
          this.eventBus.emit('keyboard:shortcut', { 
            key: 'show-settings', 
            action: 'Settings opened' 
          });
        }
      }
    }

    handleFileUpload(e) {
      if (window.FileUploadManager?.triggerFileUpload) {
        window.FileUploadManager.triggerFileUpload();
        console.log('🔤 Shortcut F: File upload triggered');
        e.preventDefault();
        
        if (this.eventBus) {
          this.eventBus.emit('keyboard:shortcut', { 
            key: 'file-upload', 
            action: 'File upload triggered' 
          });
        }
      }
    }

    handleToggleCounties(e) {
      if (window.SettingsManager?.toggleIrishCounties) {
        window.SettingsManager.toggleIrishCounties();
        console.log('🔤 Shortcut O: Irish counties toggled');
        e.preventDefault();
        
        if (this.eventBus) {
          this.eventBus.emit('keyboard:shortcut', { 
            key: 'toggle-counties', 
            action: 'Irish counties toggled' 
          });
          this.eventBus.emit('overlay:toggled', { type: 'counties' });
        }
      }
    }

    handleToggleDioceses(e) {
      if (window.SettingsManager?.toggleIrishDioceses) {
        window.SettingsManager.toggleIrishDioceses();
        console.log('🔤 Shortcut I: Irish dioceses toggled');
        e.preventDefault();
        
        if (this.eventBus) {
          this.eventBus.emit('keyboard:shortcut', { 
            key: 'toggle-dioceses', 
            action: 'Irish dioceses toggled' 
          });
          this.eventBus.emit('overlay:toggled', { type: 'dioceses' });
        }
      }
    }

    handleToggleSidebar(e) {
      console.log('🔤 Shortcut T: Sidebar toggle triggered');
      e.preventDefault();
      
      if (this.eventBus) {
        this.eventBus.emit('keyboard:shortcut', { 
          key: 'toggle-sidebar', 
          action: 'Sidebar toggle triggered' 
        });
        this.eventBus.emit('sidebar:toggle');
      }
    }

    // Get available shortcuts for help display
    getShortcuts() {
      return {
        [KEYBOARD_SHORTCUTS.CLEAR_REFERENCE]: 'Clear reference marker',
        [KEYBOARD_SHORTCUTS.SHOW_SETTINGS]: 'Show settings',
        [KEYBOARD_SHORTCUTS.FILE_UPLOAD]: 'Upload file',
        [KEYBOARD_SHORTCUTS.TOGGLE_COUNTIES]: 'Toggle Irish counties',
        [KEYBOARD_SHORTCUTS.TOGGLE_DIOCESES]: 'Toggle Irish dioceses',
        [KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR]: 'Toggle sidebar position'
      };
    }

    // Disable shortcuts (useful for modals/overlays)
    disable() {
      this.disabled = true;
    }

    // Re-enable shortcuts
    enable() {
      this.disabled = false;
    }
  }

  // Export to global scope
  window.KeyboardManager = KeyboardManager;

  console.log('✅ Keyboard Manager loaded');
})();