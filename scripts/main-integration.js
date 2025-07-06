/**
 * =====================================================
 * FILE: scripts/main-integration.js (REFACTORED VERSION)
 * PURPOSE: Clean, maintainable application integration
 * DEPENDENCIES: All other modules + FileUploadManager
 * EXPORTS: MapaListerApp
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🚀 Loading refactored main-integration.js...');

  // ==================== CONSTANTS ====================
  const TIMING = {
    DEPENDENCY_CHECK_INTERVAL: 500,
    MAX_INITIALIZATION_ATTEMPTS: 10,
    ANIMATION_DURATION: 300,
    DISTANCE_UPDATE_DELAY: 500,
    MAP_RESIZE_DELAY: 300,
    OVERLAY_UPDATE_INTERVAL: 2000,
    DATA_PROCESSING_DELAY: 100,
    SETTINGS_UPDATE_DELAY: 300,
    AUTO_CENTER_DELAY: 1000
  };

  const UI_STATES = {
    SIDEBAR: {
      HIDDEN: 'hidden',
      LEFT: 'left', 
      RIGHT: 'right'
    },
    OVERLAY_STATUS: {
      ACTIVE: 'active',
      BORDERS: 'borders', 
      INACTIVE: 'inactive'
    }
  };

  const REQUIRED_DEPENDENCIES = [
    'DataConfig',
    'DistanceUtils', 
    'ReferenceMarker',
    'UnifiedMapManager',
    'SidebarManager',
    'SettingsManager',
    'FileUploadManager'
  ];

  const KEYBOARD_SHORTCUTS = {
    CLEAR_REFERENCE: 'c',
    SHOW_SETTINGS: 's',
    FILE_UPLOAD: 'f',
    TOGGLE_COUNTIES: 'o',
    TOGGLE_DIOCESES: 'i',
    TOGGLE_SIDEBAR: 't'
  };

  // ==================== EVENT BUS ====================
  class AppEventBus {
    constructor() {
      this.listeners = new Map();
    }

    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }

    emit(event, data) {
      const callbacks = this.listeners.get(event) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    off(event, callback) {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // ==================== ERROR HANDLER ====================
  class ErrorHandler {
    static handleInitializationError(error, context = '') {
      console.error(`❌ Initialization Error ${context}:`, error);
      
      if (error.message?.includes('dependencies')) {
        this.showDependencyError(error);
      } else if (error.message?.includes('Map')) {
        this.showMapError(error);
      } else {
        this.showGenericError(error);
      }
    }

    static showDependencyError(error) {
      const container = document.getElementById('listings') || document.getElementById('map');
      if (container) {
        container.innerHTML = this.createErrorHTML(
          '📦 Dependency Error',
          'Some required modules failed to load',
          error.message
        );
      }
    }

    static showMapError(error) {
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.innerHTML = this.createErrorHTML(
          '🗺️ Map Error',
          'Failed to initialize map',
          error.message,
          '#fee2e2',
          '#dc2626'
        );
      }
    }

    static showGenericError(error) {
      const container = document.getElementById('listings') || document.getElementById('map');
      if (container) {
        container.innerHTML = this.createErrorHTML(
          '⚠️ Application Error',
          'Something went wrong',
          error.message
        );
      }
    }

    static createErrorHTML(title, description, details, bgColor = '#fee2e2', textColor = '#dc2626') {
      return `
        <div style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          background: ${bgColor};
          color: ${textColor};
          text-align: center;
          padding: 40px 20px;
          font-family: 'Outfit', sans-serif;
        ">
          <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
          <h2 style="margin: 0 0 16px 0; font-weight: 600;">${title}</h2>
          <p style="margin: 0 0 12px 0; font-size: 14px; max-width: 400px;">${description}</p>
          ${details ? `<p style="font-size: 0.9em; color: #666; margin: 10px 0;">${details}</p>` : ''}
          <button onclick="location.reload()" style="
            margin-top: 16px;
            padding: 8px 16px;
            background: ${textColor};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
          ">
            🔄 Retry
          </button>
        </div>
      `;
    }
  }

  // ==================== SIDEBAR CONTROLLER ====================
  class SidebarController {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.state = UI_STATES.SIDEBAR.HIDDEN;
      this.element = null;
    }

    initialize() {
      this.element = document.querySelector('.sidebar');
      if (this.element) {
        this.setState(UI_STATES.SIDEBAR.HIDDEN, false);
        console.log('✅ Sidebar controller initialized');
      }
    }

    setState(newState, updateSettings = true) {
      if (!this.element || !Object.values(UI_STATES.SIDEBAR).includes(newState)) {
        return;
      }

      // Remove all state classes
      Object.values(UI_STATES.SIDEBAR).forEach(state => {
        this.element.classList.remove(`sidebar-${state}`);
      });

      // Add new state class
      this.element.classList.add(`sidebar-${newState}`);
      this.state = newState;

      // Handle visibility
      if (newState === UI_STATES.SIDEBAR.HIDDEN) {
        this.element.style.display = 'none';
        this.element.style.visibility = 'hidden';
        this.element.style.opacity = '0';
      } else {
        this.element.style.display = '';
        this.element.style.visibility = 'visible';
        this.element.style.opacity = '1';
      }

      // Update settings if requested
      if (updateSettings && window.SettingsManager && newState !== UI_STATES.SIDEBAR.HIDDEN) {
        window.SettingsManager.setSetting('sidebarPosition', newState);
      }

      this.eventBus.emit('sidebar:stateChanged', { state: newState });
      console.log(`🔄 Sidebar state changed to: ${newState}`);
    }

    toggle() {
      const states = [UI_STATES.SIDEBAR.HIDDEN, UI_STATES.SIDEBAR.LEFT, UI_STATES.SIDEBAR.RIGHT];
      const currentIndex = states.indexOf(this.state);
      const nextIndex = (currentIndex + 1) % states.length;
      const nextState = states[nextIndex];
      
      this.setState(nextState);
      this.showStateToast(nextState);
      
      // Trigger map resize
      if (window.map && window.map.resize) {
        setTimeout(() => window.map.resize(), TIMING.MAP_RESIZE_DELAY);
      }
    }

    showStateToast(state) {
      const messages = {
        [UI_STATES.SIDEBAR.HIDDEN]: 'Sidebar Hidden',
        [UI_STATES.SIDEBAR.LEFT]: 'Sidebar Left',
        [UI_STATES.SIDEBAR.RIGHT]: 'Sidebar Right'
      };
      
      // Simple toast implementation
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
      `;
      toast.textContent = messages[state];
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 2000);
    }

    showAfterUpload() {
      this.setState(UI_STATES.SIDEBAR.RIGHT);
    }
  }

  // ==================== DEPENDENCY MANAGER ====================
  class DependencyManager {
    static async waitForDependencies() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkDependencies = () => {
          attempts++;
          
          const missing = REQUIRED_DEPENDENCIES.filter(dep => typeof window[dep] === 'undefined');
          
          console.log(`📊 Dependency check ${attempts}/${TIMING.MAX_INITIALIZATION_ATTEMPTS}: Missing [${missing.join(', ')}]`);
          
          if (missing.length === 0) {
            console.log('✅ All dependencies loaded');
            resolve();
            return;
          }
          
          if (attempts >= TIMING.MAX_INITIALIZATION_ATTEMPTS) {
            reject(new Error(`Missing dependencies after ${TIMING.MAX_INITIALIZATION_ATTEMPTS} attempts: ${missing.join(', ')}`));
            return;
          }
          
          setTimeout(checkDependencies, TIMING.DEPENDENCY_CHECK_INTERVAL);
        };
        
        checkDependencies();
      });
    }
  }

  // ==================== MAIN APPLICATION CLASS ====================
  class MapaListerApp {
    constructor() {
      this.initialized = false;
      this.eventBus = new AppEventBus();
      this.styleManager = null;
      
      // Initialize controllers
      this.sidebarController = new SidebarController(this.eventBus);
      
      // Use existing window objects instead of creating new instances
      this.welcomeOverlay = null; // Will be initialized later
      this.keyboardManager = null; // Will be initialized later
      this.mapManager = null; // Will be created as UnifiedMapManager instance
      this.dataManager = null; // Will reference existing window.DataManager
      
      this.setupEventBusListeners();
    }

    setupEventBusListeners() {
      this.eventBus.on('sidebar:toggle', () => {
        this.sidebarController.toggle();
      });
      
      this.eventBus.on('welcome:dismissed', () => {
        console.log('Welcome overlay dismissed');
      });
      
      this.eventBus.on('data:loaded', (data) => {
        console.log('Data loaded event received:', data);
      });
      
      this.eventBus.on('overlay:toggled', () => {
        // Update welcome overlay status if it's visible
        if (this.welcomeOverlay && this.welcomeOverlay.overlayElement) {
          setTimeout(() => {
            if (this.welcomeOverlay.updateStatus) {
              this.welcomeOverlay.updateStatus();
            }
          }, 100);
        }
      });

      // Keyboard shortcut events (handled by KeyboardManager instance)
      this.eventBus.on('keyboard:shortcut', (data) => {
        console.log(`⌨️ Keyboard shortcut received: ${data.key} - ${data.action}`);
      });
    }

    async initialize() {
      if (this.initialized) {
        console.log('⚠️ Application already initialized');
        return;
      }

      console.log('🔄 Initializing MapaLister Application...');
      
      try {
        await DependencyManager.waitForDependencies();
        await this.initializeComponents();
        await this.setupIntegrations();
        
        this.initialized = true;
        console.log('🎉 MapaLister Application initialized successfully!');
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        ErrorHandler.handleInitializationError(error, 'main application');
      }
    }

    async initializeComponents() {
      // Setup styles first
      if (window.StyleManager) {
        this.styleManager = new window.StyleManager(this.eventBus);
        this.styleManager.init();
      }
      
      // Initialize controllers
      this.sidebarController.initialize();
      
      // Initialize keyboard manager
      if (window.KeyboardManager) {
        // Create instance of the keyboard manager class
        this.keyboardManager = new window.KeyboardManager(this.eventBus);
        this.keyboardManager.init();
        
        // Debug: Check what methods are actually available
        if (window.SettingsManager) {
          console.log('🔍 SettingsManager methods:', Object.getOwnPropertyNames(window.SettingsManager).filter(name => typeof window.SettingsManager[name] === 'function'));
        } else {
          console.log('🔍 SettingsManager: Not available');
        }
        
        if (window.FileUploadManager) {
          console.log('🔍 FileUploadManager methods:', Object.getOwnPropertyNames(window.FileUploadManager).filter(name => typeof window.FileUploadManager[name] === 'function'));
        } else {
          console.log('🔍 FileUploadManager: Not available');
        }
        
        console.log('✅ Keyboard manager instance created and initialized');
      }
      
      // Initialize data manager
      if (window.DataManager) {
        this.dataManager = window.DataManager;
        if (this.dataManager.init) {
          this.dataManager.init();
        }
      }
      
      // Initialize welcome overlay
      if (window.WelcomeOverlayManager) {
        this.welcomeOverlay = new window.WelcomeOverlayManager(this.eventBus);
      }
      
      // Initialize map or data-only mode
      if (typeof mapboxgl !== 'undefined' && window.UnifiedMapManager) {
        this.mapManager = new window.UnifiedMapManager(this.eventBus);
        window.unifiedMapManagerInstance = this.mapManager; // Store reference for legacy MapManager
        
        const mapInitialized = await this.mapManager.initialize();
        if (mapInitialized) {
          if (this.welcomeOverlay && this.welcomeOverlay.show) {
            this.welcomeOverlay.show();
          }
          
          // Initialize overlays after map loads
          if (window.SettingsManager?.initializeOverlays) {
            setTimeout(() => {
              window.SettingsManager.initializeOverlays();
            }, 500);
          }
        }
      } else {
        console.warn('⚠️ Mapbox GL JS not available - initializing data-only mode');
        if (this.dataManager && this.dataManager.showAwaitingDataScreen) {
          this.dataManager.showAwaitingDataScreen();
        }
      }
    }

    async setupIntegrations() {
      this.setupSettingsIntegration();
      this.setupFileUploadIntegration();
    }

    setupSettingsIntegration() {
      if (!window.SettingsManager) return;
      
      window.SettingsManager.init();
      window.SettingsManager.setSetting('sidebarPosition', 'hidden');
      
      window.SettingsManager.onSettingsChange((settings) => {
        console.log('⚙️ Settings changed, updating components...', settings);
        
        if (window.DistanceUtils && settings.distanceUnit) {
          window.DistanceUtils.setUnit(settings.distanceUnit);
        }
        
        if (settings.autoCenter && window.geojsonData && window.SidebarManager) {
          setTimeout(() => {
            if (window.SettingsManager.centerMapOnData) {
              window.SettingsManager.centerMapOnData();
            }
          }, TIMING.SETTINGS_UPDATE_DELAY);
        }
        
        if (window.ReferenceMarker?.exists() && window.SidebarManager) {
          window.SidebarManager.updateAllDistances();
        }
        
        // Handle sidebar position changes
        if (settings.sidebarPosition && this.mapManager && this.mapManager.updateControlPositions) {
          this.mapManager.updateControlPositions();
        }
      });
      
      console.log('✅ Settings integration configured');
    }

    setupFileUploadIntegration() {
      if (!window.FileUploadManager) return;
      
      window.FileUploadManager.init();
      
      window.addEventListener('mapalister:dataUploaded', (event) => {
        console.log('📁 File uploaded event received:', event.detail);
        
        const { data, userData, fileName, featureCount } = event.detail;
        
        // Dismiss welcome overlay and show sidebar
        if (this.welcomeOverlay && this.welcomeOverlay.dismiss) {
          this.welcomeOverlay.dismiss();
        }
        this.sidebarController.showAfterUpload();
        
        // Update UI for uploaded data
        if (this.dataManager && this.dataManager.processUploadedData) {
          this.dataManager.processUploadedData(data, fileName, featureCount);
        }
   
        // Process the data
        setTimeout(async () => {
          try {
            if (this.dataManager && this.dataManager.processLoadedData) {
              await this.dataManager.processLoadedData(data, {
                filename: fileName,
                displayName: fileName,
                isUploaded: true
              });
              console.log('✅ Uploaded data processed and dataset manager initialized');
            }
          } catch (error) {
            console.error('❌ Error processing uploaded data:', error);
          }
        }, TIMING.DATA_PROCESSING_DELAY);
   
        // Auto-center if enabled
        if (window.SettingsManager?.getSetting('autoCenter')) {
          setTimeout(() => {
            if (window.SettingsManager.centerMapOnData) {
              window.SettingsManager.centerMapOnData();
            }
          }, TIMING.AUTO_CENTER_DELAY);
        }
        
        // Update distances if reference marker exists
        if (window.ReferenceMarker?.exists()) {
          setTimeout(() => {
            if (window.SidebarManager?.updateAllDistances) {
              console.log('🔄 Updating distances after file upload...');
              window.SidebarManager.updateAllDistances();
            }
          }, TIMING.DISTANCE_UPDATE_DELAY);
        }
      });
      
      console.log('✅ File upload integration configured');
    }
  }

  // ==================== EXPORTS & INITIALIZATION ====================
  
  // Create and export application instance
  const app = new MapaListerApp();
  window.MapaListerApp = app;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
  } else {
    setTimeout(() => app.initialize(), 100);
  }

  console.log('✅ Refactored main-integration.js loaded successfully');

})();