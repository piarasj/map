/**
 * =====================================================
 * FILE: managers/style-manager.js
 * PURPOSE: Application CSS and styling management
 * DEPENDENCIES: None
 * EXPORTS: StyleManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎨 Loading style-manager.js...');

  // ==================== STYLE MANAGER ====================
  class StyleManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.stylesLoaded = new Set();
    }

    init() {
      this.setupApplicationCSS();
      console.log('🎨 Style Manager initialized');
    }

    setupApplicationCSS() {
      if (this.stylesLoaded.has('application-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'mapalister-app-styles';
      style.textContent = `
        .item:hover {
          background-color: #f8fafc;
        }
        
        .item.active {
          background-color: #e3f2fd;
        }
        
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
          font-style: italic;
        }
        
        .selector-text.uploaded-data {
          color: #10b981 !important;
          font-weight: 600;
        }
        
        .dataset-selector.has-upload {
          border-color: #10b981;
          background: linear-gradient(135deg, #f0fdf4, #ffffff);
        }
        
        .uploaded-indicator {
          animation: uploadedPulse 2s ease-in-out infinite;
        }
        
        @keyframes uploadedPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes slideInLeft {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        .sidebar-left {
          left: 0;
          right: auto;
          animation: slideInLeft 0.3s ease-out;
        }
        
        .sidebar-right {
          right: 0;
          left: auto;
          animation: slideInRight 0.3s ease-out;
        }
        
        .sidebar-hidden {
          transform: translateX(100%);
          opacity: 0;
          pointer-events: none;
        }
        
        .awaiting-upload {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px 20px;
        }
        
        .upload-prompt {
          text-align: center;
          max-width: 400px;
        }
        
        .upload-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        
        .upload-main-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 20px;
        }
        
        .upload-main-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }
      `;
      
      document.head.appendChild(style);
      this.stylesLoaded.add('application-styles');
      console.log('✅ Application CSS loaded');
    }

    // Add theme support
    setTheme(themeName) {
      document.body.setAttribute('data-theme', themeName);
      
      if (this.eventBus) {
        this.eventBus.emit('theme:changed', { theme: themeName });
      }
    }

    // Add custom CSS
    addCustomCSS(id, cssText) {
      if (this.stylesLoaded.has(id)) return;
      
      const style = document.createElement('style');
      style.id = id;
      style.textContent = cssText;
      document.head.appendChild(style);
      
      this.stylesLoaded.add(id);
      console.log(`✅ Custom CSS loaded: ${id}`);
    }

    // Remove custom CSS
    removeCustomCSS(id) {
      const style = document.getElementById(id);
      if (style) {
        style.remove();
        this.stylesLoaded.delete(id);
        console.log(`🗑️ Custom CSS removed: ${id}`);
      }
    }

    // Get loaded styles
    getLoadedStyles() {
      return Array.from(this.stylesLoaded);
    }
  }

  // Export to global scope
  window.StyleManager = StyleManager;

  console.log('✅ Style Manager loaded');
})();