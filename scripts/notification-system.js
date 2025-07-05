/**
 * MapaLister Enhanced Notification System
 * Handles logo notifications with unsaved changes tracking
 */

class NotificationSystem {
  constructor() {
    this.hasNotification = false;
    this.notificationCount = 0;
    this.autoHideTimeout = null;
    
    // Cache DOM elements
    this.logoElement = null;
    this.notificationDot = null;
    this.pinEmoji = null;
    
    // Unsaved changes tracking
    this.hasUnsavedChanges = false;
    this.changesSinceUpload = new Set();
    // Additional tracking for beforeunload management
this.beforeunloadDisabled = false;
    this.init();
  }
  
  init() {
    try {
      // Cache DOM elements
      this.logoElement = document.getElementById('dynamicPinLogo');
      this.notificationDot = document.getElementById('notificationDot');
      this.pinEmoji = document.querySelector('.pin-emoji');
      
      // Set up logo click handler
      this.setupLogoHandler();
      
      // Initialize change tracking
      this.initChangeTracking();
      
      console.log('✅ Enhanced notification system initialized');
    } catch (error) {
      console.warn('⚠️ Notification system initialization failed:', error);
    }
  }
  
  setupLogoHandler() {
    if (!this.logoElement) return;
    
    try {
      this.logoElement.addEventListener('click', () => {
        this.toggleNotification();
      });
    } catch (error) {
      console.warn('⚠️ Logo click handler setup failed:', error);
    }
  }
  
initChangeTracking() {
    try {
      // Better settings manager integration with polling
      const checkSettingsManager = () => {
        if (window.SettingsManager && window.SettingsManager.onSettingsChange) {
          window.SettingsManager.onSettingsChange(() => {
            this.markUnsavedChange('settings');
          });
          console.log('✅ Settings change tracking enabled');
          return true;
        }
        return false;
      };
      
      // Try immediately, then poll if not available
      if (!checkSettingsManager()) {
        const pollInterval = setInterval(() => {
          if (checkSettingsManager()) {
            clearInterval(pollInterval);
          }
        }, 500);
        
        // Stop polling after 10 seconds
        setTimeout(() => clearInterval(pollInterval), 10000);
      }

      // Store bound handlers for cleanup
      this.boundHandlers = {
        referenceSet: () => this.markUnsavedChange('reference_marker'),
        referenceCleared: () => this.markUnsavedChange('reference_marker'),
        filterChanged: () => this.markUnsavedChange('data_filter'),
        dataSaved: () => this.markChangesSaved(),
        beforeUnload: (e) => {
  if (this.hasUnsavedChanges) {
    // Set a more helpful browser message
    const message = 'You have unsaved changes. Click "Stay on Page" to save them first.';
    e.preventDefault();
    e.returnValue = message;
    return message;
  }
}
};
      
      // Add event listeners with bound handlers
      window.addEventListener('mapalister:referenceSet', this.boundHandlers.referenceSet);
      window.addEventListener('mapalister:referenceCleared', this.boundHandlers.referenceCleared);
      window.addEventListener('mapalister:filterChanged', this.boundHandlers.filterChanged);
      window.addEventListener('mapalister:dataSaved', this.boundHandlers.dataSaved);
      window.addEventListener('beforeunload', this.boundHandlers.beforeUnload);
      
      // NEW: Intercept page navigation attempts
      this.interceptNavigationAttempts();
      
      console.log('✅ Enhanced change tracking with custom dialog initialized');
    } catch (error) {
      console.warn('⚠️ Change tracking failed:', error);
    }
  }
  
  // Core notification methods
  showNotification(options = {}) {
    try {
      const {
        message = '',
        count = null,
        autoHide = true,
        duration = 5000
      } = options;
      
      this.hasNotification = true;
      this.notificationCount = count || this.notificationCount + 1;
      
      this.updateLogoNotification(true);
        
      if (autoHide) {
        this.setAutoHide(duration);
      }
        
      console.log('📢 Notification shown:', { message, count, autoHide });
    } catch (error) {
      console.warn('⚠️ Show notification failed:', error);
    }
  }
  
  hideNotification() {
    try {
      this.hasNotification = false;
      this.notificationCount = 0;
      
      this.updateLogoNotification(false);
      
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
        this.autoHideTimeout = null;
      }
      
      console.log('📢 Notification hidden');
    } catch (error) {
      console.warn('⚠️ Hide notification failed:', error);
    }
  }
  
  setAutoHide(duration) {
    try {
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
      }
      
      this.autoHideTimeout = setTimeout(() => {
        this.hideNotification();
      }, duration);
    } catch (error) {
      console.warn('⚠️ Auto-hide setup failed:', error);
    }
  }
  
  toggleNotification() {
    try {
      if (this.hasNotification) {
        this.hideNotification();
      } else {
        this.showNotification({ message: 'Test notification' });
      }
    } catch (error) {
      console.warn('⚠️ Toggle notification failed:', error);
    }
  }
  
  // Logo notification methods
  updateLogoNotification(show) {
    if (!this.notificationDot) return;
    
    try {
      if (this.hasUnsavedChanges) {
        // Unsaved changes take priority - yellow pulsing
        this.notificationDot.setAttribute('fill', '#f59e0b');
        this.notificationDot.style.opacity = '1';
        this.notificationDot.style.animation = 'unsavedPulse 2s ease-in-out infinite';
      } else if (show) {
        // Regular notification - red
        this.notificationDot.setAttribute('fill', '#ef4444');
        this.notificationDot.style.opacity = '1';
        this.notificationDot.style.animation = 'none';
      } else {
        // No notifications
        this.notificationDot.style.opacity = '0';
        this.notificationDot.style.animation = 'none';
      }
    } catch (error) {
      console.warn('⚠️ Logo notification update failed:', error);
    }
  }
  
  triggerBounce() {
    if (!this.pinEmoji) return;
    
    try {
      this.pinEmoji.classList.remove('pin-drop-bounce');
      void this.pinEmoji.offsetWidth;
      this.pinEmoji.classList.add('pin-drop-bounce');
    } catch (error) {
      console.warn('⚠️ Bounce animation failed:', error);
    }
  }
  
  // Unsaved changes methods
  markUnsavedChange(changeType) {
    try {
      this.hasUnsavedChanges = true;
      this.changesSinceUpload.add(changeType);
      
      // Update logo to show unsaved state
      this.updateLogoNotification(false);
      
      // Show toast notification for unsaved changes
      if (window.SettingsManager && window.SettingsManager.showToast) {
        const changeCount = this.changesSinceUpload.size;
        const message = changeCount === 1 ? 
          `📝 Unsaved ${changeType.replace('_', ' ')} changes` : 
//          `📝 ${changeCount} unsaved changes`;
        
        window.SettingsManager.showToast(message, 'warning');
      }
      
      console.log(`📝 Marked unsaved change: ${changeType}`);
    } catch (error) {
      console.warn('⚠️ Failed to mark unsaved change:', error);
    }
  }
  
  markChangesSaved() {
    try {
      this.hasUnsavedChanges = false;
      this.changesSinceUpload.clear();
      
      // Update logo to normal state
      this.updateLogoNotification(false);
      
      // Show save confirmation
      if (window.SettingsManager && window.SettingsManager.showToast) {
        window.SettingsManager.showToast('💾 Changes saved successfully', 'success');
      }
      
      console.log('✅ Changes marked as saved');
    } catch (error) {
      console.warn('⚠️ Failed to mark changes as saved:', error);
    }
  }
  
 getUnsavedChangesSummary() {
    if (!this.hasUnsavedChanges) {
      return {
        hasChanges: false,
        changeCount: 0,
        changes: []
      };
    }
    
    const changeLabels = {
      'settings': 'Settings modified',
      'reference_marker': 'Reference point changed',
      'data_filter': 'Data filters adjusted'
    };
    
    const changes = Array.from(this.changesSinceUpload).map(change => ({
      type: change,
      label: changeLabels[change] || change.replace('_', ' ')
    }));
    
    return {
      hasChanges: true,
      changeCount: changes.length,
      changes
    };
  }

  /**
   * Cleanup method for proper memory management
   */
  destroy() {
    try {
      // Clear timeouts
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
        this.autoHideTimeout = null;
      }
      
      // Remove event listeners if we stored them
      if (this.boundHandlers) {
        window.removeEventListener('mapalister:referenceSet', this.boundHandlers.referenceSet);
        window.removeEventListener('mapalister:referenceCleared', this.boundHandlers.referenceCleared);
        window.removeEventListener('mapalister:filterChanged', this.boundHandlers.filterChanged);
        window.removeEventListener('mapalister:dataSaved', this.boundHandlers.dataSaved);
        window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
      }
      
      // Clean up dynamic elements
      const dialog = document.getElementById('unsaved-changes-dialog');
      if (dialog) dialog.remove();
      
      const notifications = document.querySelectorAll('.persistent-notification');
      notifications.forEach(n => n.remove());
      
      console.log('✅ Notification system cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }
  
  /**
   * NEW: Show beautiful custom unsaved changes dialog
   */
  showUnsavedChangesDialog() {
    // Remove any existing dialog
    const existingDialog = document.getElementById('unsaved-changes-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    const changesSummary = this.getUnsavedChangesSummary();
    const changesText = changesSummary.changes.map(c => c.label).join(', ');
    
    const dialog = document.createElement('div');
    dialog.id = 'unsaved-changes-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      animation: dialogFadeIn 0.3s ease-out;
    `;
    
    dialog.innerHTML = `
      <div class="unsaved-dialog-content" style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: dialogSlideIn 0.3s ease-out;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        
        <h2 style="
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        ">Unsaved Changes Detected</h2>
        
        <p style="
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 16px;
          line-height: 1.5;
        ">You have ${changesSummary.changeCount} unsaved change${changesSummary.changeCount > 1 ? 's' : ''}:</p>
        
        <div style="
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        ">
          <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">📝 Changes:</div>
          <div style="color: #92400e; font-size: 14px;">${changesText}</div>
        </div>
        
        <div style="
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        ">
          <div style="font-weight: 600; color: #0369a1; margin-bottom: 8px;">💾 How to Save:</div>
          <div style="color: #0369a1; font-size: 14px;">
            • Press <kbd style="background: #1f2937; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">D</kbd> key to download with settings<br>
            • Or use the save button if you have uploaded data
          </div>
        </div>
        
        <div style="
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        ">
          <button id="save-changes-btn" style="
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            💾 Save Changes
          </button>
          
          <button id="continue-anyway-btn" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            Leave Anyway
          </button>
          
          <button id="stay-here-btn" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            Stay Here
          </button>
        </div>
        
        <p style="
          margin: 20px 0 0 0;
          color: #9ca3af;
          font-size: 12px;
        ">💡 Tip: Save regularly to preserve your work</p>
      </div>
    `;
    
    // Add CSS animations if not already added
    if (!document.getElementById('dialog-animations')) {
      const style = document.createElement('style');
      style.id = 'dialog-animations';
      style.textContent = `
        @keyframes dialogFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes dialogSlideIn {
          0% { transform: translateY(-50px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes dialogSlideOut {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(0.9); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(dialog);
    
    // Bind button events
    document.getElementById('save-changes-btn').onclick = () => {
      this.handleSaveFromDialog();
    };
    
    document.getElementById('continue-anyway-btn').onclick = () => {
      this.handleLeaveAnyway();
    };
    
    document.getElementById('stay-here-btn').onclick = () => {
      this.handleStayHere();
    };
    
    // Close on background click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.handleStayHere();
      }
    });
  }

  /**
   * NEW: Handle save from dialog
   */
  handleSaveFromDialog() {
    try {
      if (window.FileUploadManager && 
          window.FileUploadManager.uploadedData && 
          window.FileUploadManager.downloadDataWithSettings) {
        
        window.FileUploadManager.downloadDataWithSettings();
        this.markChangesSaved();
        this.closeUnsavedChangesDialog();
        
        if (window.SettingsManager && window.SettingsManager.showToast) {
          window.SettingsManager.showToast('💾 Changes saved successfully!', 'success');
        }
        
      } else {
        this.closeUnsavedChangesDialog();
        
        if (window.SettingsManager && window.SettingsManager.showToast) {
          window.SettingsManager.showToast(
            '⚠️ No uploaded data to save. Settings will be lost on refresh.', 
            'warning'
          );
        }
      }
    } catch (error) {
      console.error('❌ Failed to save from dialog:', error);
      
      if (window.SettingsManager && window.SettingsManager.showToast) {
        window.SettingsManager.showToast('❌ Save failed. Please try again.', 'error');
      }
    }
  }

  /**
   * NEW: Handle leave anyway
   */
  handleLeaveAnyway() {
  // Disable all change tracking
  this.hasUnsavedChanges = false;
  this.changesSinceUpload.clear();
  
  // Remove beforeunload handler completely
  if (this.boundHandlers && this.boundHandlers.beforeUnload) {
    window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
  }
  
  this.closeUnsavedChangesDialog();
  
  // Force reload without any prevention
  setTimeout(() => {
    window.location.reload(true);
  }, 100);
}

  /**
   * NEW: Handle stay here
   */
  handleStayHere() {
    this.closeUnsavedChangesDialog();
    
    if (window.SettingsManager && window.SettingsManager.showToast) {
      window.SettingsManager.showToast('✅ Staying on page. Remember to save your changes!', 'info');
    }
  }

  /**
   * NEW: Close unsaved changes dialog
   */
  closeUnsavedChangesDialog() {
    const dialog = document.getElementById('unsaved-changes-dialog');
    if (dialog) {
      const content = dialog.querySelector('.unsaved-dialog-content');
      if (content) {
        content.style.animation = 'dialogSlideOut 0.3s ease-out';
      }
      
      setTimeout(() => {
        if (dialog.parentNode) {
          dialog.remove();
        }
      }, 300);
    }
  }

  /**
   * Intercept navigation attempts for better UX
   */
   
   
   interceptNavigationAttempts() {
  // Set up initial history state
  if (window.history && window.history.pushState) {
    history.replaceState({ unsavedChanges: false }, '', window.location.href);
  }
  
  // Handle back/forward navigation - DISABLE beforeunload temporarily
  window.addEventListener('popstate', (e) => {
    if (this.hasUnsavedChanges) {
      // Temporarily disable beforeunload to prevent double dialogs
      this.temporarilyDisableBeforeunload();
      
      // Push state back immediately
      history.pushState({ unsavedChanges: true }, '', window.location.href);
      
      // Show custom dialog
      setTimeout(() => {
        this.showUnsavedChangesDialog();
        // Re-enable beforeunload after dialog
        this.reEnableBeforeunload();
      }, 10);
    }
  });
  
  // Handle keyboard shortcuts with highest priority
  document.addEventListener('keydown', (e) => {
    if (!this.hasUnsavedChanges) return;
    
    let shouldIntercept = false;
    
    // F5 key (keyCode 116)
    if (e.keyCode === 116 || e.key === 'F5') {
      shouldIntercept = true;
    }
    
    // Ctrl+R (keyCode 82)
    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 82 || e.key === 'r' || e.key === 'R')) {
      shouldIntercept = true;
    }
    
    // Ctrl+W (keyCode 87) - limited browser support
    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 87 || e.key === 'w' || e.key === 'W')) {
      shouldIntercept = true;
    }
    
    if (shouldIntercept) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Temporarily disable beforeunload
      this.temporarilyDisableBeforeunload();
      
      // Show custom dialog
      setTimeout(() => {
        this.showUnsavedChangesDialog();
        // Re-enable beforeunload
        this.reEnableBeforeunload();
      }, 10);
      
      return false;
    }
  }, true); // Use capture phase for earliest interception
  
  console.log('✅ Enhanced navigation interception initialized');
}


/**
 * Temporarily disable beforeunload to prevent double dialogs
 */
temporarilyDisableBeforeunload() {
  if (this.boundHandlers && this.boundHandlers.beforeUnload) {
    window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
    this.beforeunloadDisabled = true;
  }
}

/**
 * Re-enable beforeunload after custom dialog
 */
reEnableBeforeunload() {
  if (this.boundHandlers && this.boundHandlers.beforeUnload && this.beforeunloadDisabled) {
    setTimeout(() => {
      window.addEventListener('beforeunload', this.boundHandlers.beforeUnload);
      this.beforeunloadDisabled = false;
    }, 100);
  }
}
   
   
  // Public API methods for different notification types
  notifyDataUpdate(message = 'Data updated') {
    try {
      this.showNotification({ 
        message, 
        autoHide: true, 
        duration: 3000 
      });
      this.triggerBounce();
    } catch (error) {
      console.warn('⚠️ Data update notification failed:', error);
    }
  }
  
  notifyFilterChange(activeFilters) {
    try {
      if (activeFilters > 0) {
        this.showNotification({ 
          message: `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active`,
          count: activeFilters,
          autoHide: false 
        });
      } else {
        this.hideNotification();
      }
    } catch (error) {
      console.warn('⚠️ Filter change notification failed:', error);
    }
  }
  
  notifyLocationUpdate() {
    try {
      console.log('📍 Location updated - distances will be recalculated');
      this.triggerBounce();
      
      // Mark as unsaved change since reference point changed
      this.markUnsavedChange('reference_marker');
    } catch (error) {
      console.warn('⚠️ Location update notification failed:', error);
    }
  }

  notifyError(message = 'Error occurred') {
    try {
      this.showNotification({ 
        message, 
        autoHide: true, 
        duration: 5000 
      });
      
      // Show toast error as well
      if (window.SettingsManager && window.SettingsManager.showToast) {
        window.SettingsManager.showToast(message, 'error');
      }
    } catch (error) {
      console.warn('⚠️ Error notification failed:', error);
    }
  }
 
  notifySystemStatus(message, persistent = false) {
    try {
      this.showNotification({ 
        message, 
        autoHide: !persistent, 
        duration: persistent ? 0 : 4000 
      });
      
      // Show toast as well
      if (window.SettingsManager && window.SettingsManager.showToast) {
        window.SettingsManager.showToast(message, 'info');
      }
    } catch (error) {
      console.warn('⚠️ System status notification failed:', error);
    }
  }
  
  notifyUnsavedChanges(hasChanges = true) {
    if (hasChanges) {
      this.markUnsavedChange('manual');
    } else {
      this.markChangesSaved();
    }
  }
  
  // Show persistent notification (appears on screen)
  showPersistentNotification(message, type = 'warning', duration = 0) {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'persistent-notification';
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${this.getNotificationColor(type)};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
      `;
      
      notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>${message}</div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none; border: none; color: white; cursor: pointer;
            font-size: 16px; margin-left: 12px; padding: 0; line-height: 1;
          ">&times;</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove if duration specified
      if (duration > 0) {
        setTimeout(() => {
          if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
              if (notification.parentElement) {
                notification.remove();
              }
            }, 300);
          }
        }, duration);
      }
      
    } catch (error) {
      console.warn('⚠️ Persistent notification failed:', error);
    }
  }
  
  // Get notification color based on type
  getNotificationColor(type) {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b', 
      error: '#ef4444',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }
}

// CSS for animations
const notificationCSS = `
@keyframes pinDropBounce {
  0% { transform: translateY(-20px); opacity: 0; }
  15% { transform: translateY(-20px); opacity: 1; }
  35% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  65% { transform: translateY(0px); }
  80% { transform: translateY(-3px); }
  90% { transform: translateY(0px); }
  95% { transform: translateY(-1px); }
  100% { transform: translateY(0px); }
}

@-webkit-keyframes pinDropBounce {
  0% { -webkit-transform: translateY(-20px); transform: translateY(-20px); opacity: 0; }
  15% { -webkit-transform: translateY(-20px); transform: translateY(-20px); opacity: 1; }
  35% { -webkit-transform: translateY(0px); transform: translateY(0px); }
  50% { -webkit-transform: translateY(-8px); transform: translateY(-8px); }
  65% { -webkit-transform: translateY(0px); transform: translateY(0px); }
  80% { -webkit-transform: translateY(-3px); transform: translateY(-3px); }
  90% { -webkit-transform: translateY(0px); transform: translateY(0px); }
  95% { -webkit-transform: translateY(-1px); transform: translateY(-1px); }
  100% { -webkit-transform: translateY(0px); transform: translateY(0px); }
}

@keyframes unsavedPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes slideInRight {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

.pin-drop-bounce {
  -webkit-animation: pinDropBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  animation: pinDropBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.persistent-notification {
  transition: all 0.3s ease;
}

.persistent-notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .persistent-notification {
    left: 20px;
    right: 20px;
    max-width: none;
    font-size: 13px;
  }
}

/* Safari-specific fixes */
.safari-browser .pin-drop-bounce {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
`;

// Initialize system
let notificationSystem;



function initNotificationSystem() {
  try {
    // Clean up existing system first
    if (notificationSystem && typeof notificationSystem.destroy === 'function') {
      notificationSystem.destroy();
    }
    
    // Inject CSS
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = notificationCSS;
      document.head.appendChild(style);
      
      // Apply Safari-specific body class
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        document.body.classList.add('safari-browser');
        console.log('🧭 Safari detected - applied notification compatibility fixes');
      }
    }
    
    // Create system instance
    notificationSystem = new NotificationSystem();
    window.NotificationSystem = notificationSystem;
    window.notifications = notificationSystem;
    console.log('✅ Enhanced notification system initialized and exported');

  } catch (error) {
    console.warn('⚠️ Failed to initialize notification system:', error);
    // Create fallback
    window.notifications = {
      notifyDataUpdate: () => console.log('📊 Data updated'),
      notifyFilterChange: () => console.log('🔍 Filter changed'),
      notifyLocationUpdate: () => console.log('📍 Location updated'),
      notifyError: (msg) => console.error('❌', msg),
      notifySystemStatus: (msg) => console.log('🔧', msg),
      notifyUnsavedChanges: () => console.log('📝 Unsaved changes'),
      markUnsavedChange: () => console.log('📝 Change marked'),
      markChangesSaved: () => console.log('💾 Changes saved'),
      showNotification: () => {},
      hideNotification: () => {},
      triggerBounce: () => {},
      showPersistentNotification: () => {}
    };
  }
}

// Auto-bounce on load
function bouncePinOnLoad() {
  try {
    const pin = document.querySelector('#dynamicPinLogo .pin-emoji');
    if (!pin) {
      console.warn('⚠️ Pin emoji element not found');
      return;
    }

    // Add bounce animation class
    pin.classList.add('pin-drop-bounce');
    
    // Remove the class after animation completes to allow re-triggering
    pin.addEventListener('animationend', function() {
      pin.classList.remove('pin-drop-bounce');
    }, { once: true });
  } catch (error) {
    console.warn('⚠️ Pin bounce failed:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initNotificationSystem();
    setTimeout(bouncePinOnLoad, 200);
  });
} else {
  initNotificationSystem();
  setTimeout(bouncePinOnLoad, 200);
}

// Export for manual triggering
window.triggerPinBounce = bouncePinOnLoad;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}

console.log('✅ Enhanced notification system loaded');