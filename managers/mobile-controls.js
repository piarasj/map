/**
 * =====================================================
 * FILE: managers/mobile-controls.js
 * PURPOSE: Touch-friendly controls for mobile/tablet devices
 * DEPENDENCIES: SettingsManager, FileUploadManager, ReferenceMarker, LucideUtils
 * EXPORTS: MobileControls
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📱 Loading mobile-controls.js...');

  const MobileControls = {
    fabOpen: false,
    controlsElement: null,
    isMobile: false,

    /**
     * Initialize mobile controls
     */
    init() {
      // Detect if device is touch-enabled or mobile
      this.isMobile = this.detectMobile();
      
      if (!this.isMobile) {
        console.log('📱 Desktop detected - mobile controls hidden by default');
        // Still create controls but hide them - user can show with keyboard shortcut M
      }
      
      this.createControls();
      this.setupEventListeners();
      
      console.log('✅ Mobile controls initialized');
    },

    /**
     * Detect if device is mobile/tablet or touch-enabled
     */
    detectMobile() {
      const isTouchDevice = ('ontouchstart' in window) || 
                           (navigator.maxTouchPoints > 0) || 
                           (navigator.msMaxTouchPoints > 0);
      
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const isSmallScreen = window.innerWidth <= 768;
      
      return isTouchDevice || isMobileUA || isSmallScreen;
    },

    /**
     * Create the floating action button and menu
     */
    createControls() {
      const container = document.createElement('div');
      container.id = 'mobile-controls';
      container.className = this.isMobile ? 'mobile-controls visible' : 'mobile-controls';
      
      container.innerHTML = `
        <style>
          .mobile-controls {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999;
            font-family: 'Outfit', sans-serif;
            transition: opacity 0.3s ease;
          }
          
          .mobile-controls:not(.visible) {
            opacity: 0;
            pointer-events: none;
          }
          
          .mobile-controls.visible {
            opacity: 1;
            pointer-events: all;
          }
          
          .fab-button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s ease;
            position: relative;
          }
          
          .fab-button:active {
            transform: scale(0.95);
          }
          
          .fab-button.open {
            transform: rotate(45deg);
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          
          .fab-menu {
            position: absolute;
            bottom: 70px;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(12px);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            padding: 8px;
            min-width: 220px;
            opacity: 0;
            transform: translateY(10px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
          }
          
          .fab-menu.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
          }
          
          .fab-menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            transition: all 0.2s ease;
          }
          
          .fab-menu-item:active {
            background: #f3f4f6;
            transform: scale(0.98);
          }
          
          .fab-menu-item-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .fab-menu-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 4px 0;
          }
          
          .fab-menu-section {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #9ca3af;
            padding: 8px 16px 4px;
            letter-spacing: 0.5px;
          }
          
          @media (max-width: 768px) {
            .mobile-controls {
              bottom: 80px;
            }
            
            .fab-menu {
              right: -10px;
              min-width: 240px;
            }
          }
        </style>
        
        <button class="fab-button" id="fabButton" aria-label="Open menu">
          ✨
        </button>
        
        <div class="fab-menu" id="fabMenu">
          <div class="fab-menu-section">Quick Actions</div>
          
          <button class="fab-menu-item" data-action="save">
            <span class="fab-menu-item-icon">💾</span>
            <span>Save Data</span>
          </button>
          
          <button class="fab-menu-item" data-action="upload">
            <span class="fab-menu-item-icon">📁</span>
            <span>Upload File</span>
          </button>
          
          <button class="fab-menu-item" data-action="settings">
            <span class="fab-menu-item-icon">⚙️</span>
            <span>Settings</span>
          </button>
          
          <div class="fab-menu-divider"></div>
          <div class="fab-menu-section">Overlays</div>
          
          <button class="fab-menu-item" data-action="parishes">
            <span class="fab-menu-item-icon">📍</span>
            <span>Toggle Parishes</span>
          </button>
          
          <button class="fab-menu-item" data-action="dioceses">
            <span class="fab-menu-item-icon">⛪</span>
            <span>Toggle Dioceses</span>
          </button>
          
          <button class="fab-menu-item" data-action="counties">
            <span class="fab-menu-item-icon">🏛️</span>
            <span>Toggle Counties</span>
          </button>
          
          <button class="fab-menu-item" data-action="offices">
            <span class="fab-menu-item-icon">⛪</span>
            <span>Toggle Offices</span>
          </button>
          
          <div class="fab-menu-divider"></div>
          
          <button class="fab-menu-item" data-action="clear-reference">
            <span class="fab-menu-item-icon">🔄</span>
            <span>Clear Reference</span>
          </button>
          
          <button class="fab-menu-item" data-action="toggle-sidebar">
            <span class="fab-menu-item-icon">↔️</span>
            <span>Toggle Sidebar</span>
          </button>
        </div>
      `;
      
      document.body.appendChild(container);
      this.controlsElement = container;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      const fabButton = document.getElementById('fabButton');
      const fabMenu = document.getElementById('fabMenu');
      
      // Toggle menu
      fabButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.fabOpen && !this.controlsElement.contains(e.target)) {
          this.closeMenu();
        }
      });
      
      // Handle menu item clicks
      const menuItems = document.querySelectorAll('.fab-menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          this.handleAction(action);
          this.closeMenu();
        });
      });
      
      // Add keyboard shortcut 'M' to toggle mobile controls visibility
      document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'm' && !this.isTypingInInput(e.target)) {
          this.toggleVisibility();
        }
      });
    },

    /**
     * Toggle menu open/close
     */
    toggleMenu() {
      this.fabOpen = !this.fabOpen;
      const fabButton = document.getElementById('fabButton');
      const fabMenu = document.getElementById('fabMenu');
      
      if (this.fabOpen) {
        fabButton.classList.add('open');
        fabMenu.classList.add('open');
      } else {
        fabButton.classList.remove('open');
        fabMenu.classList.remove('open');
      }
    },

    /**
     * Close menu
     */
    closeMenu() {
      this.fabOpen = false;
      const fabButton = document.getElementById('fabButton');
      const fabMenu = document.getElementById('fabMenu');
      
      fabButton.classList.remove('open');
      fabMenu.classList.remove('open');
    },

    /**
     * Toggle mobile controls visibility
     */
    toggleVisibility() {
      if (this.controlsElement) {
        this.controlsElement.classList.toggle('visible');
        const isVisible = this.controlsElement.classList.contains('visible');
        console.log(`📱 Mobile controls ${isVisible ? 'shown' : 'hidden'}`);
        
        if (window.SettingsManager?.showToast) {
          window.SettingsManager.showToast(
            `Mobile controls ${isVisible ? 'shown' : 'hidden'}`,
            'info'
          );
        }
      }
    },

    /**
     * Handle action buttons
     */
    handleAction(action) {
      console.log(`📱 Mobile action: ${action}`);
      
      switch (action) {
        case 'save':
          if (window.FileUploadManager?.downloadDataWithSettings) {
            window.FileUploadManager.downloadDataWithSettings();
          }
          break;
          
        case 'upload':
          if (window.FileUploadManager?.triggerFileUpload) {
            window.FileUploadManager.triggerFileUpload();
          }
          break;
          
        case 'settings':
          if (window.SettingsManager?.showSettings) {
            window.SettingsManager.showSettings();
          }
          break;
          
        case 'parishes':
          if (window.SettingsManager?.toggleIrishParishes) {
            window.SettingsManager.toggleIrishParishes();
          }
          break;
          
        case 'dioceses':
          if (window.SettingsManager?.toggleIrishDioceses) {
            window.SettingsManager.toggleIrishDioceses();
          }
          break;
          
        case 'counties':
          if (window.SettingsManager?.toggleIrishCounties) {
            window.SettingsManager.toggleIrishCounties();
          }
          break;
          
        case 'offices':
          const currentlyEnabled = window.SettingsManager?.getSetting('showDiocesanOffices');
          if (window.SettingsManager) {
            window.SettingsManager.setSetting('showDiocesanOffices', !currentlyEnabled);
          }
          break;
          
        case 'clear-reference':
          if (window.ReferenceMarker?.exists()) {
            window.ReferenceMarker.clear();
          }
          break;
          
        case 'toggle-sidebar':
          if (window.MapaListerApp?.sidebarController) {
            window.MapaListerApp.sidebarController.toggle();
          }
          break;
      }
    },

    /**
     * Check if user is typing in an input
     */
    isTypingInInput(element) {
      const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
      return (
        typingElements.includes(element.tagName) ||
        element.contentEditable === 'true' ||
        element.isContentEditable
      );
    }
  };

  // Export to global scope
  window.MobileControls = MobileControls;
  
  console.log('✅ Mobile controls loaded');
})();
