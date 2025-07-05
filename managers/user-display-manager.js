/**
 * Enhanced Sidebar with User Name Display
 * Extends existing SidebarManager functionality
 */

const UserDisplayManager = {
  currentUser: null,
  userDisplayElement: null,

  /**
   * Initialize user display system
   */
  init() {
    this.createUserDisplay();
    this.loadSavedUser();
    
    // Listen for file upload events to extract user data
    window.addEventListener('mapalister:dataUploaded', (event) => {
      this.handleUploadedUserData(event.detail.userData);
    });
    
    console.log('✅ User display manager initialized');
  },

  /**
   * Create user display element in sidebar
   */
  createUserDisplay() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Find insertion point (after app logo, before dataset selector)
    const appLogo = document.querySelector('.app-logo');
    const datasetSelector = document.querySelector('.dataset-selector');
    
    if (appLogo && datasetSelector) {
      const userDisplay = document.createElement('div');
      userDisplay.className = 'user-display';
      userDisplay.id = 'user-display';
      userDisplay.style.cssText = `
        padding: 12px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        display: none; /* Hidden by default */
      `;
      
      // Insert between logo and dataset selector
      sidebar.insertBefore(userDisplay, datasetSelector);
      this.userDisplayElement = userDisplay;
      
      console.log('✅ User display element created');
    }
  },

  /**
   * Handle user data from uploaded files
   */
  handleUploadedUserData(userData) {
    if (!userData) return;

    // Extract user information from various possible locations
    const userName = this.extractUserName(userData);
    const userEmail = this.extractUserEmail(userData);
    
    if (userName || userEmail) {
      this.setUser({
        name: userName,
        email: userEmail,
        source: 'uploaded',
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Extract user name from userData using consistent keys
   */
  extractUserName(userData) {
    const firstName = userData.userFirstName;
    const lastName = userData.userLastName;
    
    if (firstName && lastName) {
      return `${firstName.trim()} ${lastName.trim()}`;
    } else if (firstName) {
      return firstName.trim();
    } else if (lastName) {
      return lastName.trim();
    }
    
    return null;
  },

  /**
   * Extract user email from userData using consistent key
   */
  extractUserEmail(userData) {
    const email = userData.userEmail;
    
    if (email && this.isValidEmail(email)) {
      return email.trim();
    }
    
    return null;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Set current user and update display
   */
  setUser(userInfo) {
    this.currentUser = userInfo;
    this.updateDisplay();
    this.saveUser();
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('mapalister:userChanged', {
      detail: { user: userInfo }
    }));
    
    console.log('👤 User set:', userInfo);
  },

  /**
   * Update the user display element
   */
  updateDisplay() {
    if (!this.userDisplayElement || !this.currentUser) {
      this.hideDisplay();
      return;
    }

    const { name, email, source } = this.currentUser;
    
    // Use the extracted name directly, or fall back to a cleaned email
    const displayName = name || this.extractNameFromEmail(email) || 'Current User';
    
    // Create user display HTML with clickable profile area
    this.userDisplayElement.innerHTML = `
      <div class="user-info">
        <div class="user-profile-section" onclick="window.UserDisplayManager?.openSettings()" style="
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          flex: 1;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
          <div class="user-avatar">
            <span class="user-initial">${this.getUserInitial(displayName)}</span>
          </div>
          <div class="user-details">
            <div class="user-name" title="Click to open settings">${displayName}</div>
            ${email ? `<div class="user-email">${email}</div>` : ''}
            <div class="user-source">📁 From ${source === 'uploaded' ? 'uploaded file' : 'manual entry'}</div>
          </div>
        </div>
        <button class="user-clear" onclick="window.UserDisplayManager?.clearUser()" title="Clear user">×</button>
      </div>
    `;
    
    // Add user display styles if not present
    this.addUserDisplayStyles();
    
    // Show the display
    this.userDisplayElement.style.display = 'block';
  },

  /**
   * Extract name from email address (fallback)
   */
  extractNameFromEmail(email) {
    if (!email) return null;
    
    // Extract the part before @ and clean it up
    const namePart = email.split('@')[0];
    
    // Replace common separators with spaces and capitalize
    return namePart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Open settings when user profile is clicked
   */
  openSettings() {
    console.log('👤 Opening settings from user profile click');
    
    // Try to open settings through SettingsManager
    if (window.SettingsManager && typeof window.SettingsManager.showSettings === 'function') {
      window.SettingsManager.showSettings();
    } else {
      // Fallback: show a simple notification
      this.showSimpleToast('Settings not available', 'warning');
      console.warn('SettingsManager not found or showSettings method not available');
    }
  },

  /**
   * Get user initial for avatar
   */
  getUserInitial(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  },

  /**
   * Hide user display
   */
  hideDisplay() {
    if (this.userDisplayElement) {
      this.userDisplayElement.style.display = 'none';
    }
  },

  /**
   * Clear current user
   */
  clearUser() {
    this.currentUser = null;
    this.hideDisplay();
    this.removeUserFromStorage();
    
    window.dispatchEvent(new CustomEvent('mapalister:userCleared'));
    console.log('👤 User cleared');
  },

  /**
   * Save user to localStorage
   */
  saveUser() {
    if (this.currentUser) {
      try {
        localStorage.setItem('mapalister-current-user', JSON.stringify(this.currentUser));
      } catch (error) {
        console.warn('Failed to save user data:', error);
      }
    }
  },

  /**
   * Load saved user from localStorage
   */
  loadSavedUser() {
    try {
      const saved = localStorage.getItem('mapalister-current-user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        this.updateDisplay();
        console.log('👤 Loaded saved user:', this.currentUser.name || this.currentUser.email);
      }
    } catch (error) {
      console.warn('Failed to load saved user:', error);
    }
  },

  /**
   * Remove user from localStorage
   */
  removeUserFromStorage() {
    try {
      localStorage.removeItem('mapalister-current-user');
    } catch (error) {
      console.warn('Failed to remove user data:', error);
    }
  },

  /**
   * Simple toast notification
   */
  showSimpleToast(message, type = 'info') {
    const colors = {
      success: '#22c55e',
      info: '#3b82f6', 
      warning: '#f59e0b',
      error: '#ef4444'
    };
    
    // Remove any existing toast
    const existingToast = document.querySelector('.user-display-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'user-display-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
      max-width: 200px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 2000);
  },

  /**
   * Add CSS styles for user display
   */
  addUserDisplayStyles() {
    if (document.getElementById('user-display-styles')) return;

    const style = document.createElement('style');
    style.id = 'user-display-styles';
    style.textContent = `
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
      }
      
      .user-profile-section {
        /* Styles are inline for better hover control */
      }
      
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .user-initial {
        color: white;
        font-weight: 600;
        font-size: 14px;
      }
      
      .user-details {
        flex: 1;
        min-width: 0;
      }
      
      .user-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 14px;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .user-email {
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .user-source {
        color: #9ca3af;
        font-size: 11px;
        font-style: italic;
      }
      
      .user-clear {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .user-clear:hover {
        background: #f3f4f6;
        color: #dc2626;
      }
      
      /* Hover effect for clickable profile */
      .user-profile-section:hover .user-name {
        color: #3b82f6;
      }
      
      .user-profile-section:hover .user-avatar {
        transform: scale(1.05);
      }
      
      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .user-display {
          padding: 10px 15px;
        }
        
        .user-name {
          font-size: 13px;
        }
        
        .user-email {
          font-size: 11px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Export and initialize
window.UserDisplayManager = UserDisplayManager;

// Auto-initialize when dependencies are ready
function initUserDisplay() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UserDisplayManager.init());
  } else {
    UserDisplayManager.init();
  }
}

initUserDisplay();