/**
 * =====================================================
 * FILE: managers/keyboard-manager.js
 * PURPOSE: Global keyboard shortcut handling with save functionality
 * DEPENDENCIES: SettingsManager, FileUploadManager, ReferenceMarker
 * EXPORTS: KeyboardManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('⌨️ Loading keyboard-manager.js...');

  // Enhanced keyboard shortcut constants
  const KEYBOARD_SHORTCUTS = {
    CLEAR_REFERENCE: 'c',
    SHOW_SETTINGS: 's',
    FILE_UPLOAD: 'f',
    TOGGLE_COUNTIES: 'o',
    TOGGLE_DIOCESES: 'i',
    TOGGLE_SIDEBAR: 't',
    SAVE_DATA: 'ctrl+s', // New save shortcut
    QUICK_SAVE: 'd' // Quick save with D key
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
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        
        // Handle Ctrl/Cmd+S for save
        if (isCtrlOrCmd && key === 's') {
          this.handleSaveData(e);
          return;
        }
        
        // Handle single key shortcuts
        switch (key) {
          case KEYBOARD_SHORTCUTS.CLEAR_REFERENCE:
            this.handleClearReference();
            break;
          case KEYBOARD_SHORTCUTS.SHOW_SETTINGS:
            if (!isCtrlOrCmd) { // Avoid conflict with Ctrl+S
              this.handleShowSettings(e);
            }
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
          case KEYBOARD_SHORTCUTS.QUICK_SAVE:
            this.handleQuickSave(e);
            break;
        }
      });
      
      console.log('⌨️ Enhanced keyboard shortcuts enabled (including save functionality)');
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

    handleSaveData(e) {
      e.preventDefault();
      
      console.log('💾 Save shortcut triggered (Ctrl/Cmd+S)');
      
      // Check if we have data to save
      const hasData = !!(window.geojsonData && window.geojsonData.features && window.geojsonData.features.length > 0);
      const hasUploadedData = !!(window.FileUploadManager && window.FileUploadManager.uploadedData);
      
      if (hasUploadedData || hasData) {
        // Use FileUploadManager if available
        if (window.FileUploadManager && window.FileUploadManager.downloadDataWithSettings) {
          try {
            window.FileUploadManager.downloadDataWithSettings();
            this.showSaveNotification('Data saved successfully! 💾', 'success');
          } catch (error) {
            console.error('Save failed:', error);
            this.showSaveNotification('Save failed: ' + error.message, 'error');
          }
        } else if (window.SettingsManager && window.SettingsManager.downloadCurrentDataWithSettings) {
          // Fallback to SettingsManager
          try {
            window.SettingsManager.downloadCurrentDataWithSettings();
            this.showSaveNotification('Data saved successfully! 💾', 'success');
          } catch (error) {
            console.error('Save failed:', error);
            this.showSaveNotification('Save failed: ' + error.message, 'error');
          }
        } else {
          this.showSaveNotification('Save functionality not available', 'warning');
        }
      } else {
        this.showSaveNotification('No data to save - upload a file first', 'warning');
      }
      
      if (this.eventBus) {
        this.eventBus.emit('keyboard:shortcut', { 
          key: 'save-data', 
          action: 'Save data triggered' 
        });
      }
    }

    handleQuickSave(e) {
      e.preventDefault();
      
      console.log('💾 Quick save shortcut triggered (D key)');
      
      // Same logic as Ctrl+S but with different notification
      const hasData = !!(window.geojsonData && window.geojsonData.features && window.geojsonData.features.length > 0);
      const hasUploadedData = !!(window.FileUploadManager && window.FileUploadManager.uploadedData);
      
      if (hasUploadedData || hasData) {
        if (window.FileUploadManager && window.FileUploadManager.downloadDataWithSettings) {
          try {
            window.FileUploadManager.downloadDataWithSettings();
            this.showSaveNotification('Quick save complete! ⚡', 'success');
          } catch (error) {
            console.error('Quick save failed:', error);
            this.showSaveNotification('Quick save failed: ' + error.message, 'error');
          }
        } else if (window.SettingsManager && window.SettingsManager.downloadCurrentDataWithSettings) {
          try {
            window.SettingsManager.downloadCurrentDataWithSettings();
            this.showSaveNotification('Quick save complete! ⚡', 'success');
          } catch (error) {
            console.error('Quick save failed:', error);
            this.showSaveNotification('Quick save failed: ' + error.message, 'error');
          }
        } else {
          this.showSaveNotification('Save functionality not available', 'warning');
        }
      } else {
        this.showSaveNotification('No data to save - upload a file first', 'warning');
      }
      
      if (this.eventBus) {
        this.eventBus.emit('keyboard:shortcut', { 
          key: 'quick-save', 
          action: 'Quick save triggered' 
        });
      }
    }

    showSaveNotification(message, type = 'info') {
      // Try to use existing notification systems
      if (window.SettingsManager && window.SettingsManager.showToast) {
        window.SettingsManager.showToast(message, type);
      } else if (window.notifications && window.notifications.notifySystemStatus) {
        window.notifications.notifySystemStatus(message);
      } else {
        // Fallback to simple notification
        this.showSimpleNotification(message, type);
      }
    }

    showSimpleNotification(message, type = 'info') {
      const colors = {
        success: '#22c55e',
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444'
      };
      
      // Remove any existing save notification
      const existingNotification = document.querySelector('.save-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      const notification = document.createElement('div');
      notification.className = 'save-notification';
      notification.innerHTML = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-size: 14px;
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        max-width: 320px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      });
      
      // Auto remove
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, 3000);
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
        [KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR]: 'Toggle sidebar position',
        [KEYBOARD_SHORTCUTS.SAVE_DATA]: 'Save data with settings (Ctrl/Cmd+S)',
        [KEYBOARD_SHORTCUTS.QUICK_SAVE]: 'Quick save data'
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

  console.log('✅ Enhanced Keyboard Manager loaded with save functionality');
})();