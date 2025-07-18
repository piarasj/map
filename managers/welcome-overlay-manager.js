/**
 * =====================================================
 * FILE: managers/welcome-overlay-manager.js (SIMPLIFIED TWO-STATE VERSION)
 * PURPOSE: Welcome overlay with simplified two-state toggles (off/on with fills)
 * DEPENDENCIES: SettingsManager, FileUploadManager, LucideUtils
 * EXPORTS: WelcomeOverlayManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('✨ Loading welcome-overlay-manager.js...');

  // ==================== WELCOME OVERLAY MANAGER ====================
  class WelcomeOverlayManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.overlayElement = null;
      this.statusUpdateInterval = null;
    }

    init() {
      console.log('✨ Welcome Overlay Manager initialized');
    }

    show() {
      if (this.overlayElement) return;
      
      this.overlayElement = this.createElement();
      document.body.appendChild(this.overlayElement);
      this.addStyles();
      this.bindEvents();
      this.startStatusUpdates();
      
      // Initialize Lucide icons after content is added
      if (window.LucideUtils) {
        setTimeout(() => {
          LucideUtils.init();
        }, 50);
      }
      
      console.log('✨ Welcome overlay displayed');
    }

    createElement() {
      const overlay = document.createElement('div');
      overlay.id = 'welcome-overlay';
      overlay.className = 'welcome-overlay';
      overlay.innerHTML = this.getTemplate();
      return overlay;
    }

    getTemplate() {
      return `
        <div class="welcome-content">
          <button id="close-welcome" class="welcome-close-btn" aria-label="Close welcome overlay">
            ${window.LucideUtils ? LucideUtils.icon('x', { size: 16 }) : '×'}
          </button>
          
          <div class="welcome-header">
            <div class="welcome-logo">
              <svg width="48" height="48" viewBox="0 0 32 32">
                <path d="M 6 0 L 26 0 A 6 6 0 0 1 32 6 L 32 16 L 16 16 L 16 3 A 2 2 0 0 0 14 1 L 6 1 A 6 6 0 0 1 6 0" fill="#e11d48"/>
                <path d="M 32 16 L 32 26 A 6 6 0 0 1 26 32 L 16 32 L 16 16" fill="#10b981"/>
                <path d="M 16 32 L 6 32 A 6 6 0 0 1 0 26 L 0 16 L 16 16" fill="#3b82f6"/>
                <path d="M 0 16 L 0 6 A 6 6 0 0 1 6 0 L 16 0 L 16 16" fill="#f59e0b"/>
                <rect x="3" y="3" width="26" height="26" rx="2" fill="white"/>
                <text x="16" y="25.4" text-anchor="middle" font-size="23.4" dominant-baseline="baseline" class="pin-emoji">📍</text>
              </svg>
            </div>
            <div class="welcome-brand">
              <span class="map">Map</span><span class="a">a</span><span class="list">List</span><span class="er">er</span>
            </div>
          </div>

          <div class="welcome-description">
            <h2>Interactive Map Explorer</h2>
            <p>Taking list, showing maps. You're seeing Irish counties and dioceses as an example - you haven't loaded any markers.</p>
          </div>

          <div class="interactive-demo">
            <h3>${window.LucideUtils ? LucideUtils.icon('map', { size: 16 }) : '🗺️'} Interactive Overlays</h3>
            <div class="overlay-demo">
              <div class="overlay-control" data-target="counties">
                <div class="overlay-indicator counties">
                  ${window.LucideUtils ? LucideUtils.icon('landmark', { size: 20 }) : '🏛️'}
                </div>
                <div class="overlay-info">
                  <div class="overlay-name">Irish C<u>o</u>unties</div>
                  <div class="overlay-status" id="counties-status">Loading...</div>
                  <div class="overlay-hint">Press <code>o</code> to toggle Area > Borders > Off </div>
                </div>
              </div>
              <div class="overlay-control" data-target="dioceses">
                <div class="overlay-indicator dioceses">
                  ${window.LucideUtils ? LucideUtils.icon('church', { size: 20 }) : '⛪'}
                </div>
                <div class="overlay-info">
                  <div class="overlay-name">Irish D<u>i</u>oceses</div>
                  <div class="overlay-status" id="dioceses-status">Loading...</div>
                  <div class="overlay-hint">Press <code>i</code> to toggle Area > Borders > Off </div>
                </div>
              </div>
            </div>
          </div>

          <div class="keyboard-shortcuts">
            <h4>${window.LucideUtils ? LucideUtils.icon('keyboard', { size: 14 }) : '⌨️'} Quick Keys</h4>
            <div class="shortcuts-grid">
 
<div class="container">
        <div class="shortcut clickable" onclick="
          console.log('Settings clicked - checking SettingsManager...');
          console.log('SettingsManager exists:', !!window.SettingsManager);
          console.log('showSettings method exists:', !!(window.SettingsManager?.showSettings));
          if (window.SettingsManager?.showSettings) {
            window.SettingsManager.showSettings();
            console.log('Settings modal opened');
          } else {
            console.error('SettingsManager or showSettings method not available');
            alert('Settings not available yet - please wait a moment and try again');
          }
        ">
            <code>S</code> Settings
        </div>
        <div class="shortcut non-clickable">
            <code>T</code> Toggle sidebar
        </div>
        <div class="shortcut non-clickable">
            <code>C</code> Clear reference
        </div>
        <div class="shortcut clickable" onclick="if(window.FileUploadManager?.triggerFileUpload) window.FileUploadManager.triggerFileUpload();">
            <code>F</code> Upload file
        </div>
        <div class="shortcut clickable" onclick="if(window.SettingsManager?.toggleIrishCounties) window.SettingsManager.toggleIrishCounties();">
            <code>O</code> Toggle counties
        </div>
        <div class="shortcut clickable" onclick="if(window.SettingsManager?.toggleIrishDioceses) window.SettingsManager.toggleIrishDioceses();">
            <code>I</code> Toggle dioceses
        </div>
    </div> 
 
            </div>
          </div>


        </div>

        <div class="welcome-footer">
          <button id="dismiss-welcome" class="explore-btn">Continue Exploring</button>
        </div>
      `;
    }

    addStyles() {
      if (document.getElementById('welcome-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'welcome-styles';
      style.textContent = `
        .welcome-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 380px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 40px);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
          animation: welcomeSlideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
        }
        
        .welcome-close-btn {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          width: 28px !important;
          height: 28px !important;
          border: 1px solid rgba(107, 114, 128, 0.5) !important;
          background: rgba(255, 255, 255, 0.95) !important;
          color: #374151 !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          z-index: 1002 !important;
        }
        
        .welcome-close-btn:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
        
        @keyframes welcomeSlideIn {
          0% { opacity: 0; transform: translateX(100%) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        
        .welcome-overlay.closing {
          animation: welcomeSlideOut 0.4s ease-in forwards;
        }
        
        @keyframes welcomeSlideOut {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(100%) scale(0.95); }
        }
        
        .welcome-content {
          flex: 1;
          padding: 24px;
          padding-top: 40px;
          overflow-y: auto;
        }
        
        .welcome-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(241, 245, 249, 0.8);
        }
        
        .welcome-brand {
          font-size: 1.6em;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        
        .welcome-brand .map { color: #e11d48; }
        .welcome-brand .a { color: #f59e0b; }
        .welcome-brand .list { color: #3b82f6; }
        .welcome-brand .er { color: #10b981; }
        
        .welcome-description h2 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.4em;
          font-weight: 600;
        }
        
        .welcome-description p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }
        
        .interactive-demo {
          margin: 20px 0;
        }
        
        .interactive-demo h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .overlay-control {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .overlay-control:hover {
          background: rgba(241, 245, 249, 0.9);
          transform: translateY(-1px);
        }
        
        .overlay-indicator {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2));
        }
        
        .overlay-info {
          flex: 1;
        }
        
        .overlay-name {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .overlay-status {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .overlay-status.on {
          background: rgba(34, 197, 94, 0.2);
          color: #166534;
        }
        
        .overlay-status.off {
          background: rgba(156, 163, 175, 0.2);
          color: #6b7280;
        }
        
        .overlay-hint {
          font-size: 10px;
          color: #9ca3af;
          font-style: italic;
        }
        
        .keyboard-shortcuts h4 {
          margin: 20px 0 8px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .shortcuts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .shortcut {
          font-size: 11px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .shortcut code {
          background: rgba(55, 65, 81, 0.1);
          border: 1px solid rgba(209, 213, 219, 0.6);
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 10px;
          font-family: monospace;
          font-weight: 600;
        }
        
        .data-upload-section {
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.8), rgba(224, 242, 254, 0.6));
          border: 1px solid rgba(186, 230, 253, 0.6);
          border-radius: 10px;
          padding: 16px;
          margin: 16px 0;
        }
        
        .upload-prompt h4 {
          margin: 0 0 6px 0;
          color: #0369a1;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .upload-prompt p {
          margin: 0 0 12px 0;
          color: #0284c7;
          font-size: 12px;
        }
        
        .upload-btn-subtle {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(59, 130, 246, 0.1);
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-btn-subtle:hover {
          background: rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }
        
        .welcome-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(241, 245, 249, 0.8);
          background: rgba(248, 250, 252, 0.6);
        }
        
        .explore-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .explore-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
        }
        
        /* Responsive adjustments for smaller screens */
        @media (max-width: 480px) {
          .welcome-overlay {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
          }
        }
      `;
      
      document.head.appendChild(style);
    }

    bindEvents() {
      const closeBtn = this.overlayElement.querySelector('#close-welcome');
      const dismissBtn = this.overlayElement.querySelector('#dismiss-welcome');
      const uploadBtn = this.overlayElement.querySelector('#upload-demo-btn');
      
      closeBtn?.addEventListener('click', () => this.dismiss());
      dismissBtn?.addEventListener('click', () => this.dismiss());
      uploadBtn?.addEventListener('click', () => {
        if (window.FileUploadManager?.triggerFileUpload) {
          window.FileUploadManager.triggerFileUpload();
        }
      });

      // Overlay controls - simplified to toggle between off/on
      this.overlayElement.querySelectorAll('.overlay-control').forEach(control => {
        control.addEventListener('click', () => {
          const target = control.getAttribute('data-target');
          this.handleOverlayToggle(target);
        });
      });
    }

    handleOverlayToggle(target) {
      if (target === 'counties' && window.SettingsManager) {
        // Simplified two-state toggle for counties
        const currentlyEnabled = window.SettingsManager.getSetting('showIrishCounties');
        if (currentlyEnabled) {
          // Turn off
          window.SettingsManager.setSetting('showIrishCounties', false);
        } else {
          // Turn on with filled style
          window.SettingsManager.setSetting('showIrishCounties', true);
          window.SettingsManager.setSetting('irishCountiesStyle', 'filled');
        }
      } else if (target === 'dioceses' && window.SettingsManager) {
        // Simplified two-state toggle for dioceses
        const currentlyEnabled = window.SettingsManager.getSetting('showIrishDioceses');
        if (currentlyEnabled) {
          // Turn off
          window.SettingsManager.setSetting('showIrishDioceses', false);
        } else {
          // Turn on with filled style
          window.SettingsManager.setSetting('showIrishDioceses', true);
          window.SettingsManager.setSetting('irishDiocesesStyle', 'filled');
        }
      }
    }

    dismiss() {
      if (!this.overlayElement) return;
      
      this.stopStatusUpdates();
      this.overlayElement.classList.add('closing');
      
      setTimeout(() => {
        this.overlayElement?.remove();
        this.overlayElement = null;
      }, 300);
      
      if (this.eventBus) {
        this.eventBus.emit('welcome:dismissed');
      }
    }

    startStatusUpdates() {
      setTimeout(() => this.updateStatus(), 1000);
      this.statusUpdateInterval = setInterval(
        () => this.updateStatus(), 
        2000
      );
    }

    stopStatusUpdates() {
      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }
    }

    updateStatus() {
      if (!this.overlayElement) return;
      
      const overlaySettings = this.getOverlaySettings();
      this.updateOverlayStatus('counties', overlaySettings.counties);
      this.updateOverlayStatus('dioceses', overlaySettings.dioceses);
    }

    getOverlaySettings() {
      if (!window.SettingsManager) return { counties: false, dioceses: false };
      
      // Simplified: just check if overlays are enabled (true/false)
      const countiesEnabled = window.SettingsManager.getSetting('showIrishCounties');
      const diocesesEnabled = window.SettingsManager.getSetting('showIrishDioceses');
      
      return {
        counties: countiesEnabled,
        dioceses: diocesesEnabled
      };
    }

    updateOverlayStatus(target, isEnabled) {
      const statusElement = this.overlayElement?.querySelector(`#${target}-status`);
      if (!statusElement) return;
      
      // Simplified two-state display
      if (isEnabled) {
        statusElement.textContent = 'ON';
        statusElement.className = 'overlay-status on';
      } else {
        statusElement.textContent = 'OFF';
        statusElement.className = 'overlay-status off';
      }
    }
  }

  // Export to global scope
  window.WelcomeOverlayManager = WelcomeOverlayManager;

  console.log('✅ Welcome Overlay Manager loaded with simplified two-state toggles');
})();