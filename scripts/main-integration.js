/**
 * =====================================================
 * FILE: scripts/main-integration.js (CLEAN FINAL VERSION)
 * PURPOSE: Main application integration with file upload support
 * DEPENDENCIES: All other modules + FileUploadManager
 * EXPORTS: MapaListerApp
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🚀 Loading main-integration.js with file upload support...');

  // Global variables
  let map;
  let geojsonData;
  let mapboxAccessToken;

  /**
   * Main MapaLister Application Controller (Enhanced)
   */
  class MapaListerApp {
    constructor() {
      this.initialized = false;
      this.datasetManager = null;
      this.initializationAttempts = 0;
      this.maxAttempts = 10;
      this.currentDataSource = 'default';
      this.navigationControl = null;
      this.fullscreenControl = null;
      this.sidebarState = 'hidden'; // NEW: Track sidebar state
      this.overlayStatusUpdateInterval = null; // NEW: For status updates
    }

    async initialize() {
      if (this.initialized) {
        console.log('⚠️ Application already initialized');
        return;
      }

      console.log('🔄 Initializing MapaLister Application...');
      
      try {
        await this.waitForDependencies();
        
        if (window.SettingsManager) {
          window.SettingsManager.init();
          this.setupSettingsIntegration();
          // Respectfully ask settings manager to start with hidden sidebar
          window.SettingsManager.setSetting('sidebarPosition', 'hidden');
          this.sidebarState = 'hidden';
        }
        
        if (window.FileUploadManager) {
          window.FileUploadManager.init();
          this.setupFileUploadIntegration();
        }
        
        this.setupApplicationCSS();
        this.setupEnhancedKeyboardShortcuts();

        if (typeof mapboxgl !== 'undefined') {
          await this.initializeMap();
        } else {
          console.warn('⚠️ Mapbox GL JS not available - initializing data-only mode');
          await this.initializeDataOnly();
        }
        
        this.initialized = true;
        console.log('🎉 MapaLister Application initialized successfully!');
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        this.showInitializationError(error);
      }
    }

    setupSettingsIntegration() {
      if (!window.SettingsManager) return;
      
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
          }, 300);
        }
        
        if (window.ReferenceMarker && window.ReferenceMarker.exists() && window.SidebarManager) {
          window.SidebarManager.updateAllDistances();
        }
        
        // Handle sidebar position changes and move map controls
        if (settings.sidebarPosition && window.map && this.navigationControl && this.fullscreenControl) {
          // Remove existing controls
          try {
            window.map.removeControl(this.navigationControl);
            window.map.removeControl(this.fullscreenControl);
          } catch (e) {
            console.warn('Control removal failed:', e);
          }
          
          // Re-add controls on opposite side
          const controlPosition = settings.sidebarPosition === 'right' ? 'top-left' : 'top-right';
          window.map.addControl(this.navigationControl, controlPosition);
          window.map.addControl(this.fullscreenControl, controlPosition);
        }
      });      
      
      console.log('✅ Settings integration configured');
    }

    setupFileUploadIntegration() {
      if (!window.FileUploadManager) return;
      
      window.addEventListener('mapalister:dataUploaded', (event) => {
        console.log('📁 File uploaded event received:', event.detail);
        
        const { data, userData, fileName, featureCount } = event.detail;
        
        this.showSidebarAfterUpload();
        this.currentDataSource = 'uploaded';
        this.updateUIForUploadedData(fileName, featureCount);
   
        setTimeout(async () => {
          try {
            await this.processLoadedData(data, {
              filename: fileName,
              displayName: fileName,
              isUploaded: true
            });
            console.log('✅ Uploaded data processed and dataset manager initialized');
          } catch (error) {
            console.error('❌ Error processing uploaded data:', error);
          }
        }, 100);
   
        if (window.SettingsManager && window.SettingsManager.getSetting('autoCenter')) {
          setTimeout(() => {
            if (window.SettingsManager.centerMapOnData) {
              window.SettingsManager.centerMapOnData();
            }
          }, 1000);
        }
        
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          setTimeout(() => {
            if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
              console.log('🔄 Updating distances after file upload...');
              window.SidebarManager.updateAllDistances();
            }
          }, 500);
        }
      });
      
      console.log('✅ File upload integration configured');
    }
    
    // NEW: Override Settings Manager Sidebar Behavior
    overrideSettingsManagerSidebar() {
      if (!window.SettingsManager) return;
      
      // Store original method
      const originalApplySidebarPosition = window.SettingsManager.applySidebarPosition;
      
      // Override with our logic
      window.SettingsManager.applySidebarPosition = () => {
        // If we're in hidden state, don't let settings manager show it
        if (this.sidebarState === 'hidden') {
          console.log('🚫 Blocked settings manager from showing hidden sidebar');
          return;
        }
        
        // Otherwise, allow normal positioning
        originalApplySidebarPosition.call(window.SettingsManager);
      };
      
      console.log('✅ Settings manager sidebar behavior overridden');
    }

    // NEW: Force Sidebar Hidden (more aggressive)
    forceSidebarHidden() {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      
      // Remove ALL position classes
      sidebar.classList.remove('sidebar-left', 'sidebar-right');
      // Add hidden class
      sidebar.classList.add('sidebar-hidden');
      // Force hide with multiple methods
      sidebar.style.display = 'none !important';
      sidebar.style.visibility = 'hidden !important';
      sidebar.style.opacity = '0 !important';
      // Set our state
      this.sidebarState = 'hidden';
      
      console.log('💪 Sidebar FORCE hidden - all overrides applied');
    }
    initializeSidebarStates() {
      this.addSidebarStateCSS();
      
      // Force sidebar to be hidden on first load
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        // Remove any existing position classes
        sidebar.classList.remove('sidebar-left', 'sidebar-right');
        // Add hidden class
        sidebar.classList.add('sidebar-hidden');
        // Force hide with display none
        sidebar.style.display = 'none !important';
        // Set internal state
        this.sidebarState = 'hidden';
        
        console.log('✅ Sidebar forced to hidden state:', sidebar.className);
      } else {
        console.warn('⚠️ Sidebar element not found during initialization');
      }
      
      console.log('✅ Sidebar initialized in hidden state');
    }



    async waitForDependencies() {
      return new Promise((resolve, reject) => {
        const checkDependencies = () => {
          this.initializationAttempts++;
          
          const required = [
            'DataConfig',
            'DistanceUtils', 
            'ReferenceMarker',
            'MapManager',
            'SidebarManager',
            'SettingsManager',
            'FileUploadManager'
          ];
          
          const missing = required.filter(dep => typeof window[dep] === 'undefined');
          
          console.log(`📊 Dependency check ${this.initializationAttempts}/${this.maxAttempts}: Missing [${missing.join(', ')}]`);
          
          if (missing.length === 0) {
            console.log('✅ All dependencies loaded');
            resolve();
            return;
          }
          
          if (this.initializationAttempts >= this.maxAttempts) {
            reject(new Error(`Missing dependencies after ${this.maxAttempts} attempts: ${missing.join(', ')}`));
            return;
          }
          
          setTimeout(checkDependencies, 500);
        };
        
        checkDependencies();
      });
    }

    async processLoadedData(data, config) {
      if (map && window.MapManager) {
        this.datasetManager = new EnhancedDatasetFilterManager(map);
        await this.datasetManager.loadData(data);
        window.datasetFilterManager = this.datasetManager;
        this.setupDropdownEventListeners();
      } else {
        if (window.SidebarManager) {
          window.SidebarManager.build(data);
        }
      }
      
      this.updateUIElements(data, config);
      
      if (window.SettingsManager && window.SettingsManager.getSetting('autoCenter')) {
        setTimeout(() => {
          if (window.SettingsManager.centerMapOnData) {
            window.SettingsManager.centerMapOnData();
          }
        }, 1000);
      }
      
      setTimeout(() => {
        if (window.ReferenceMarker && window.ReferenceMarker.exists() && window.SidebarManager) {
          console.log('📊 Data loaded with existing reference marker - updating distances...');
          window.SidebarManager.updateAllDistances();
        }
      }, 500);
    }

    updateUIForUploadedData(fileName, featureCount) {
      const selectorText = document.getElementById('selectorText');
      if (selectorText) {
        selectorText.textContent = `📁 ${fileName} (${featureCount} features)`;
        selectorText.className = 'selector-text uploaded-data';
      }
      
      this.addUploadedIndicator();
      
      const datasetSelector = document.querySelector('.dataset-selector');
      if (datasetSelector) {
        datasetSelector.classList.add('has-upload');
      }
      
      console.log('✅ UI updated for uploaded data');
    }

    addUploadedIndicator() {
      const existingIndicator = document.getElementById('uploaded-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      const indicator = document.createElement('div');
      indicator.id = 'uploaded-indicator';
      indicator.innerHTML = '📁 Uploaded';
      indicator.style.cssText = `
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-left: 8px;
        display: inline-block;
        animation: uploadedPulse 2s ease-in-out infinite;
      `;
      
      const selectorButton = document.getElementById('selectorButton');
      if (selectorButton) {
        selectorButton.appendChild(indicator);
      }
    }

    setupEnhancedKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const isTypingInInput = (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.classList.contains('search-input') ||
          activeElement.contentEditable === 'true' ||
          activeElement.isContentEditable ||
          activeElement.closest('.search-container') !== null ||
          ['text', 'search', 'email', 'password', 'number', 'tel', 'url'].includes(activeElement.type)
        );
        
        if (isTypingInInput) return;
        
        // Clear reference marker (C key)
        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
            window.ReferenceMarker.clear();
            console.log('🔤 Shortcut C: Reference marker cleared');
          }
        }
        
        // Show settings (S key)
        if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.showSettings) {
            window.SettingsManager.showSettings();
            console.log('🔤 Shortcut S: Settings opened');
            e.preventDefault();
          }
        }
        
        // File upload (F key)
        if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.FileUploadManager && window.FileUploadManager.triggerFileUpload) {
            window.FileUploadManager.triggerFileUpload();
            console.log('🔤 Shortcut F: File upload triggered');
            e.preventDefault();
          }
        }
        
        // Toggle Irish counties (O key)
        if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.toggleIrishCounties) {
            window.SettingsManager.toggleIrishCounties();
            console.log('🔤 Shortcut O: Irish counties toggled');
            
            setTimeout(() => {
              this.updateWelcomeOverlayStatus();
            }, 100);
            
            e.preventDefault();
          }
        }

        // Toggle Irish dioceses (I key)
        if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.toggleIrishDioceses) {
            window.SettingsManager.toggleIrishDioceses();
            console.log('🔤 Shortcut I: Irish dioceses toggled');
            
            setTimeout(() => {
              this.updateWelcomeOverlayStatus();
            }, 100);
            
            e.preventDefault();
          }
        }

        // NEW: Enhanced sidebar toggle (T key) - Respectfully delegates to SettingsManager
        if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          this.enhancedSidebarToggle();
          e.preventDefault();
        }
      });
      
      console.log('⌨️ Enhanced keyboard shortcuts enabled');
    }

    // NEW: Enhanced Sidebar Toggle with Three States
    enhancedSidebarToggle() {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      
      const isHidden = sidebar.classList.contains('sidebar-hidden');
      const isLeft = sidebar.classList.contains('sidebar-left');
      const isRight = sidebar.classList.contains('sidebar-right');
      
      // Remove all position classes
      sidebar.classList.remove('sidebar-hidden', 'sidebar-left', 'sidebar-right');
      
      let newState = '';
      
      if (isHidden) {
        // Hidden -> Left
        sidebar.classList.add('sidebar-left');
        newState = 'left';
        this.showSidebarWithAnimation();
      } else if (isLeft) {
        // Left -> Right
        sidebar.classList.add('sidebar-right');
        newState = 'right';
      } else if (isRight || (!isLeft && !isRight)) {
        // Right -> Hidden (or default to hidden)
        sidebar.classList.add('sidebar-hidden');
        newState = 'hidden';
        this.hideSidebarWithAnimation();
      }
      
      this.sidebarState = newState;
      
      // Update settings if available and not hidden
      if (window.SettingsManager && newState !== 'hidden') {
        window.SettingsManager.setSetting('sidebarPosition', newState);
      }
      
      // Trigger map resize
      if (window.map && window.map.resize) {
        setTimeout(() => window.map.resize(), 300);
      }
      
      console.log(`🔄 Sidebar toggled to: ${newState}`);
      this.showSidebarStateToast(newState);
    }





    // NEW: Start Overlay Status Updates
    startOverlayStatusUpdates() {
      // Initial status update after a delay
      setTimeout(() => {
        this.updateWelcomeOverlayStatus();
      }, 1000);
      
      // Set up periodic updates
      this.overlayStatusUpdateInterval = setInterval(() => {
        this.updateWelcomeOverlayStatus();
      }, 2000);
    }

    // NEW: Stop Overlay Status Updates
    stopOverlayStatusUpdates() {
      if (this.overlayStatusUpdateInterval) {
        clearInterval(this.overlayStatusUpdateInterval);
        this.overlayStatusUpdateInterval = null;
      }
    }
    
    setupApplicationCSS() {
      if (document.querySelector('#mapalister-app-styles')) return;
      
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
      `;
      
      document.head.appendChild(style);
      console.log('✅ Enhanced application CSS loaded');
    }

    async initializeMap() {
      console.log('🗺️ Initializing map...');
      
      const token = this.getMapboxToken();
      if (!token) {
        console.warn('⚠️ No Mapbox token found - falling back to data-only mode');
        await this.initializeDataOnly();
        return;
      }
      
      mapboxgl.accessToken = token;
      window.mapboxAccessToken = token;
      
      const mapStyle = window.SettingsManager ? 
        window.SettingsManager.getSetting('mapStyle') : 
        'mapbox/light-v11';
         
      map = new mapboxgl.Map({
        container: 'map',
        style: `mapbox://styles/${mapStyle}`,
        center: [-7.5, 53.0],
        zoom: 6
      });

      // Add zoom and navigation controls
      // Position controls opposite to sidebar
      // Store controls as instance variables
      this.navigationControl = new mapboxgl.NavigationControl();
      this.fullscreenControl = new mapboxgl.FullscreenControl();

      // Position controls opposite to sidebar
      const sidebarPosition = window.SettingsManager ? 
        window.SettingsManager.getSetting('sidebarPosition') : 'right';
      const controlPosition = sidebarPosition === 'right' ? 'top-left' : 'top-right';

      map.addControl(this.navigationControl, controlPosition);
      map.addControl(this.fullscreenControl, controlPosition);
      window.map = map;
      
      map.on('load', async () => {
        console.log('🗺️ Map loaded successfully');
        
        this.setupRightClickHandler();
        this.showWelcomeExperience();
        
        if (window.SettingsManager && window.SettingsManager.initializeOverlays) {
          setTimeout(() => {
            window.SettingsManager.initializeOverlays();
          }, 500);
        }
      });
      
      map.on('error', (e) => {
        console.error('❌ Map error:', e);
        this.showMapError(e);
      });
    }

    getMapboxToken() {
      const sources = [
        () => mapboxgl.accessToken,
        () => window.mapboxAccessToken,
        () => window.MAPBOX_TOKEN,
        () => document.querySelector('meta[name="mapbox-token"]')?.getAttribute('content'),
        () => localStorage.getItem('mapbox-token')
      ];
      
      for (const getToken of sources) {
        try {
          const token = getToken();
          if (token && token.startsWith('pk.')) {
            console.log('✅ Mapbox token found');
            return token;
          }
        } catch (e) {
          // Continue to next source
        }
      }
      
      console.warn('⚠️ No valid Mapbox token found');
      return null;
    }

    async initializeDataOnly() {
      console.log('📊 Initializing data-only mode...');
      
      try {
        this.showAwaitingDataScreen();
      } catch (error) {
        console.error('❌ Data-only initialization failed:', error);
        this.showDataError(error);
      }
    }

    setupRightClickHandler() {
      if (!map) return;
      
      map.on('contextmenu', (e) => {
        e.preventDefault();
        
        const { lng, lat } = e.lngLat;
        console.log(`📍 Right-click detected at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        
        if (window.ReferenceMarker) {
          window.ReferenceMarker.set(lat, lng, 'Custom Reference Point');
          
          setTimeout(() => {
            if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
              console.log('🔄 Updating sidebar after right-click reference...');
              window.SidebarManager.updateAllDistances();
            }
          }, 200);
        }
      });

      map.getCanvasContainer().addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      
      console.log('✅ Right-click handler configured');
    }

    setupDropdownEventListeners() {
      const selectorButton = document.getElementById('selectorButton');
      const dropdownMenu = document.getElementById('dropdownMenu');

      if (!selectorButton || !dropdownMenu) {
        console.warn('⚠️ Dropdown elements not found');
        return;
      }

      selectorButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
        
        const arrow = document.getElementById('selectorArrow');
        if (arrow) {
          arrow.style.transform = dropdownMenu.classList.contains('active') ? 
            'rotate(180deg)' : 'rotate(0deg)';
        }
      });

      dropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item[data-value]');
        if (item && this.datasetManager) {
          const dataset = item.getAttribute('data-value');
          this.datasetManager.toggleDataset(dataset);
        }
      });

      document.addEventListener('click', (e) => {
        if (!selectorButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove('active');
          const arrow = document.getElementById('selectorArrow');
          if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
          }
        }
      });

      console.log('✅ Dropdown event listeners configured');
    }

    updateUIElements(data, config) {
      const selectorText = document.getElementById('selectorText');
      if (selectorText && !config.isUploaded) {
        if (this.datasetManager) {
          selectorText.textContent = 'All datasets';
        } else {
          selectorText.textContent = `${data.features.length} ${config.displayName.toLowerCase()} loaded`;
        }
        selectorText.className = 'selector-text';
      }
      
      console.log('✅ UI elements updated');
    }

    showAwaitingDataScreen() {
      const listings = document.getElementById('listings');
      if (listings) {
        listings.innerHTML = `
          <div class="awaiting-upload">
            <div class="upload-prompt">
              <div class="upload-icon">📁</div>
              <h2>Welcome to MapaLister</h2>
              <p>Upload your GeoJSON data file to get started</p>
              
              <button id="main-upload-btn" class="upload-main-btn">
                <span class="btn-icon">📁</span>
                <span>Choose GeoJSON File</span>
              </button>
            </div>
          </div>
        `;
        
        const uploadBtn = document.getElementById('main-upload-btn');
        if (uploadBtn && window.FileUploadManager) {
          uploadBtn.addEventListener('click', () => {
            window.FileUploadManager.triggerFileUpload();
          });
        }
      }
    }

    showWelcomeExperience() {
      // Ensure sidebar starts hidden through respectful coordination
      if (window.SettingsManager) {
        window.SettingsManager.setSetting('sidebarPosition', 'hidden');
        this.sidebarState = 'hidden';
        console.log('🤝 Welcome: Collaboratively set sidebar to hidden');
      }
      
      const welcomeHTML = `
        <div id="welcome-overlay" class="welcome-overlay">
          <div class="welcome-content">
            <div class="welcome-header">
              <div id="dynamicPinLogo" class="welcome-logo">
                <svg width="48" height="48" viewBox="0 0 32 32">
                  <path d="M 6 0 L 26 0 A 6 6 0 0 1 32 6 L 32 16 L 16 16 L 16 3 A 2 2 0 0 0 14 1 L 6 1 A 6 6 0 0 1 6 0" fill="#e11d48"/>
                  <path d="M 32 16 L 32 26 A 6 6 0 0 1 26 32 L 16 32 L 16 16" fill="#10b981"/>
                  <path d="M 16 32 L 6 32 A 6 6 0 0 1 0 26 L 0 16 L 16 16" fill="#3b82f6"/>
                  <path d="M 0 16 L 0 6 A 6 6 0 0 1 6 0 L 16 0 L 16 16" fill="#f59e0b"/>
                  <rect x="3" y="3" width="26" height="26" rx="2" fill="white"/>
                  <text x="16" y="25.4" text-anchor="middle" font-size="23.4" dominant-baseline="baseline" class="pin-emoji">📍</text>
                </svg>
                <circle id="notificationDot" cx="35" cy="8" r="6" fill="#ef4444" style="opacity: 0;"/>
              </div>
              <div class="welcome-brand">
                <span class="map">Map</span><span class="a">a</span><span class="list">List</span><span class="er">er</span>
              </div>
            </div>

            <div class="welcome-description">
              <h2>Interactive Map Explorer</h2>
              <p>Taking list, showing maps. You're seeing Irish counties and dioceses as an example - you haven't loaded any markers.<br>Hover over a filled area to see its description. Use the buttons below or the shortcut keys to show area, borders or none - o for counties, i for dioceses.
</p>
            </div>

            <div class="interactive-demo">
              <h3>🗺️ Interactive Overlays</h3>
              <div class="overlay-demo">
                <div class="overlay-control" data-target="counties">
                  <div class="overlay-indicator counties">🏛️</div>
                  <div class="overlay-info">
                    <div class="overlay-name">Irish C<u>o</u>unties</div>
                    <div class="overlay-status" id="counties-status">Loading...</div>
                    <div class="overlay-hint">Press <code>o</code> to cycle</div>
                  </div>
                </div>

                <div class="overlay-control" data-target="dioceses">
                  <div class="overlay-indicator dioceses">⛪</div>
                  <div class="overlay-info">
                    <div class="overlay-name">Irish D<u>i</u>oceses</div>
                    <div class="overlay-status" id="dioceses-status">Loading...</div>
                    <div class="overlay-hint">Press <code>i</code> to cycle</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="keyboard-shortcuts">
              <h4>⌨️ Quick Keys</h4>
              <div class="shortcuts-grid">
                <div class="shortcut"><code>S</code> Settings</div>
                <div class="shortcut"><code>T</code> Toggle view</div>
                <div class="shortcut"><code>C</code> Clear reference</div>
                <div class="shortcut"><code>F</code> Upload file</div>
              </div>
            </div>

            <div class="data-upload-section">
              <div class="upload-prompt">
                <h4>📊 Analyze Your Data</h4>
                <p>Upload GeoJSON to add interactive markers and distance calculations</p>
                <button id="upload-demo-btn" class="upload-btn-subtle">
                  <span>📁</span> Upload GeoJSON
                </button>
              </div>
            </div>
          </div>

          <div class="welcome-footer">
            <button id="dismiss-welcome" class="explore-btn">Continue Exploring</button>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', welcomeHTML);
      this.addWelcomeStyles();
      this.bindWelcomeEvents();
      
      // Start overlay status updates
      this.startOverlayStatusUpdates();
      
      console.log('✨ Enhanced welcome experience loaded');
    }

    showSidebarAfterUpload() {
      // Stop overlay status updates
      this.stopOverlayStatusUpdates();
      
      // Dismiss welcome overlay first
      this.dismissWelcomeOverlay();
      
      // Respectfully ask settings manager to handle post-upload sidebar display
      if (window.SettingsManager && window.SettingsManager.showSidebarAfterDataUpload) {
        window.SettingsManager.showSidebarAfterDataUpload();
        this.sidebarState = 'right';
      } else {
        // Graceful fallback if enhanced method not available
        console.warn('⚠️ Enhanced settings manager not available, using fallback');
        if (window.SettingsManager) {
          window.SettingsManager.setSetting('sidebarPosition', 'right');
          this.sidebarState = 'right';
        }
      }
      
      console.log('🤝 Collaborative sidebar display after upload completed');
    }

    addWelcomeStyles() {
      if (document.getElementById('welcome-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'welcome-styles';
      style.textContent = `
        .welcome-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 380px;
          max-height: calc(100vh - 40px);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          z-index: 1000;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
          animation: welcomeSlideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
        }
        
        @keyframes welcomeSlideIn {
          0% { 
            opacity: 0; 
            transform: translateX(100%) scale(0.9); 
            filter: blur(4px);
          }
          100% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
            filter: blur(0);
          }
        }
        
        .welcome-overlay.closing {
          animation: welcomeSlideOut 0.4s ease-in forwards;
        }
        
        @keyframes welcomeSlideOut {
          0% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateX(100%) scale(0.95); 
          }
        }
        
        .welcome-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        
        .welcome-content::-webkit-scrollbar {
          width: 4px;
        }
        
        .welcome-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .welcome-content::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 2px;
        }
        
        .welcome-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(241, 245, 249, 0.8);
        }
        
        .welcome-logo svg {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          transition: transform 0.3s ease;
        }
        
        .welcome-logo:hover svg {
          transform: scale(1.05) rotate(2deg);
        }
        
        .welcome-brand {
          font-size: 1.6em;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        
        .welcome-brand .map { color: #e11d48; }
        .welcome-brand .a { color: #f59e0b; margin: 0 -0.05em; }
        .welcome-brand .list { color: #3b82f6; }
        .welcome-brand .er { color: #10b981; margin-left: -0.05em; }
        
        .welcome-description {
          margin-bottom: 24px;
        }
        
        .welcome-description h2 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.4em;
          font-weight: 600;
          line-height: 1.2;
        }
        
        .welcome-description p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }
        
        .interactive-demo {
          margin-bottom: 20px;
        }
        
        .interactive-demo h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        
        .overlay-demo {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .overlay-control {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        .overlay-control:hover {
          background: rgba(241, 245, 249, 0.9);
          border-color: rgba(203, 213, 225, 0.8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .overlay-indicator {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .overlay-control:hover .overlay-indicator {
          transform: scale(1.1);
        }
        
        .overlay-indicator.dioceses {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.2));
        }
        
        .overlay-indicator.counties {
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
          letter-spacing: 0.3px;
        }
        
        .overlay-status.active {
          background: rgba(34, 197, 94, 0.2);
          color: #166534;
        }
        
        .overlay-status.borders {
          background: rgba(245, 158, 11, 0.2);
          color: #d97706;
        }
        
        .overlay-status.inactive {
          background: rgba(156, 163, 175, 0.2);
          color: #6b7280;
        }
        
        .overlay-hint {
          font-size: 10px;
          color: #9ca3af;
          font-style: italic;
        }
        
        .keyboard-shortcuts {
          margin-bottom: 20px;
        }
        
        .keyboard-shortcuts h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
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
          margin-bottom: 16px;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        .upload-prompt h4 {
          margin: 0 0 6px 0;
          color: #0369a1;
          font-size: 14px;
          font-weight: 600;
        }
        
        .upload-prompt p {
          margin: 0 0 12px 0;
          color: #0284c7;
          font-size: 12px;
          line-height: 1.4;
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
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
        }
        
        .upload-btn-subtle:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-1px);
        }
        
        .welcome-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(241, 245, 249, 0.8);
          background: rgba(248, 250, 252, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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
          font-family: 'Outfit', sans-serif;
        }
        
        .explore-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        
        @media (max-width: 768px) {
          .welcome-overlay {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
            max-height: calc(100vh - 20px);
          }
          
          .welcome-content {
            padding: 20px;
          }
          
          .shortcuts-grid {
            grid-template-columns: 1fr;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
 
    bindWelcomeEvents() {
      const uploadBtn = document.getElementById('upload-demo-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
          if (window.FileUploadManager && window.FileUploadManager.triggerFileUpload) {
            window.FileUploadManager.triggerFileUpload();
          }
        });
      }
      
      const dismissBtn = document.getElementById('dismiss-welcome');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          this.dismissWelcomeOverlay();
        });
      }
      
      document.querySelectorAll('.overlay-control').forEach(control => {
        control.addEventListener('click', function() {
          const target = this.getAttribute('data-target');
          
          if (target === 'counties' && window.SettingsManager && window.SettingsManager.toggleIrishCounties) {
            window.SettingsManager.toggleIrishCounties();
          } else if (target === 'dioceses' && window.SettingsManager && window.SettingsManager.toggleIrishDioceses) {
            window.SettingsManager.toggleIrishDioceses();
          }
          
          // Visual feedback animation
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = 'scale(1)';
          }, 150);
        });
      });
    }

    dismissWelcomeOverlay() {
      const overlay = document.getElementById('welcome-overlay');
      if (overlay) {
        overlay.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => {
          overlay.remove();
        }, 400);
      }
    }

    updateWelcomeOverlayStatus() {
      if (!document.getElementById('welcome-overlay')) return;
      
      // Check multiple possible setting key names since the exact keys are unclear
      let countiesState = 'off';
      let diocesesState = 'off';
      
      if (window.SettingsManager) {
        // Try different possible key names for counties
        const possibleCountiesKeys = [
          'irishCountiesMode', 'irishCounties', 'showIrishCounties', 
          'countiesMode', 'counties', 'overlayCounties', 'countiesDisplay'
        ];
        
        for (const key of possibleCountiesKeys) {
          const value = window.SettingsManager.getSetting(key);
          console.log(`Checking counties key "${key}":`, value);
          if (value !== undefined && value !== null && value !== false && value !== 'off') {
            // Handle different value types
            if (value === true || value === 'on' || value === 'borders' || value === 'outline') {
              countiesState = 'borders';
            } else if (value === 'fill' || value === 'filled' || value === 'solid' || value === 'area') {
              countiesState = 'fill';
            } else if (typeof value === 'string' && value !== 'off') {
              countiesState = value; // Use whatever string value it is
            }
            console.log(`Counties: Found "${key}" = "${value}" → mapped to "${countiesState}"`);
            break;
          }
        }
        
        // Try different possible key names for dioceses  
        const possibleDiocesesKeys = [
          'irishDiocesesMode', 'irishDioceses', 'showIrishDioceses',
          'diocesesMode', 'dioceses', 'overlayDioceses', 'diocesesDisplay'
        ];
        
        for (const key of possibleDiocesesKeys) {
          const value = window.SettingsManager.getSetting(key);
          console.log(`Checking dioceses key "${key}":`, value);
          if (value !== undefined && value !== null && value !== false && value !== 'off') {
            // Handle different value types
            if (value === true || value === 'on' || value === 'borders' || value === 'outline') {
              diocesesState = 'borders';
            } else if (value === 'fill' || value === 'filled' || value === 'solid' || value === 'area') {
              diocesesState = 'fill';
            } else if (typeof value === 'string' && value !== 'off') {
              diocesesState = value; // Use whatever string value it is
            }
            console.log(`Dioceses: Found "${key}" = "${value}" → mapped to "${diocesesState}"`);
            break;
          }
        }
        
        console.log('🔍 Detected states - Counties:', countiesState, 'Dioceses:', diocesesState);
      }
      
      // Update counties status
      this.updateSingleOverlayStatus('counties', countiesState);
      
      // Update dioceses status  
      this.updateSingleOverlayStatus('dioceses', diocesesState);
    }

    updateSingleOverlayStatus(target, state) {
      const statusElement = document.querySelector(`[data-target="${target}"] .overlay-status`);
      if (!statusElement) return;
      
      // Map the three states to display text and CSS classes
      const stateConfig = {
        'off': { 
          text: 'OFF', 
          class: 'inactive',
          description: 'Hidden'
        },
        'borders': { 
          text: 'BORDERS', 
          class: 'borders',
          description: 'Outline only'
        },
        'fill': { 
          text: 'AREA', 
          class: 'active',
          description: 'Solid areas'
        }
      };
      
      const config = stateConfig[state] || stateConfig['off'];
      
      statusElement.textContent = config.text;
      statusElement.className = `overlay-status ${config.class}`;
      statusElement.title = config.description; // Tooltip for clarity
    }

    showMapError(error) {
      console.error('Map error details:', error);
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            background: #fee2e2;
            color: #dc2626;
            text-align: center;
            padding: 40px 20px;
            font-family: 'Outfit', sans-serif;
          ">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="margin: 0 0 16px 0; font-weight: 600;">Map Error</h2>
            <p style="margin: 0 0 12px 0; font-size: 14px; max-width: 400px;">
              ${error.message || 'Failed to initialize map'}
            </p>
            <button onclick="location.reload()" style="
              margin-top: 16px;
              padding: 8px 16px;
              background: #dc2626;
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

    showDataError(error) {
      const listings = document.getElementById('listings');
      if (listings) {
        listings.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #dc2626;">
            <h3>🚫 Data Loading Error</h3>
            <p>Failed to load data</p>
            <p style="font-size: 0.9em; color: #666; margin: 10px 0;">${error.message}</p>
            <button onclick="location.reload()" style="
              margin-top: 10px; 
              padding: 8px 16px; 
              background: #3b82f6; 
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

    showInitializationError(error) {
      console.error('Initialization error:', error);
      
      const container = document.getElementById('listings') || document.getElementById('map');
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #dc2626;">
            <h3>⚠️ Initialization Error</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
              margin-top: 10px; 
              padding: 8px 16px; 
              background: #dc2626; 
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

  } // End of MapaListerApp class


  /**
   * Enhanced Dataset Filter Manager
   */
  class EnhancedDatasetFilterManager {
    constructor(map) {
      this.map = map;
      this.allData = null;
      this.activeDatasets = new Set();
      this.datasetConfig = {};
    }


async loadData(geojsonData) {
  console.log('📊 Processing data for dataset manager...', geojsonData.features?.length, 'features');
  
  this.allData = geojsonData;
  this.datasetConfig = window.DataConfig.buildDatasetConfig(geojsonData, { includeCounts: true });
  const datasets = window.DataConfig.findAvailableDatasets(geojsonData);
  console.log('📂 Found datasets:', datasets);
      
      this.updateDropdown(datasets);
      this.activeDatasets = new Set(datasets);
      
      if (this.map && window.MapManager) {
        window.MapManager.initialize(this.map, this.getFilteredData());
      }
      
      this.updateSidebar();
      console.log(`✅ ${geojsonData.features.length} contacts loaded successfully`);
      
      return datasets;
    }


    getFilteredData() {
      if (!this.allData) return null;

      const config = window.SettingsManager ? window.SettingsManager.getDataConfig() : { groupingProperty: 'dataset' };
      const filteredFeatures = this.allData.features.filter(feature => 
        this.activeDatasets.has(feature.properties?.[config.groupingProperty])
      );

      return {
        type: 'FeatureCollection',
        features: filteredFeatures
      };
    }

    updateDropdown(datasets) {
      const dropdown = document.getElementById('dropdownMenu');
      if (!dropdown) return;

      dropdown.innerHTML = '';
      
      datasets.forEach(dataset => {
        const config = this.datasetConfig[dataset];
        const count = this.allData.features.filter(f => 
          f.properties?.[window.SettingsManager?.getDataConfig()?.groupingProperty || 'dataset'] === dataset
        ).length;
        
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('data-value', dataset);
        
        const isActive = this.activeDatasets.has(dataset);
        
        item.innerHTML = `
          <div class="checkbox-wrapper">
            <div class="checkbox ${isActive ? 'checked' : ''}"></div>
          </div>
          <span class="dataset-label">${config.label}</span>
          <span class="dataset-count">${count}</span>
          <div style="background-color: ${config.color}; width: 12px; height: 12px; border-radius: 50%; margin-left: auto;"></div>
        `;
        
        dropdown.appendChild(item);
      });
      
      this.updateSelectorText();
    }

    toggleDataset(dataset) {
      if (this.activeDatasets.has(dataset)) {
        this.activeDatasets.delete(dataset);
      } else {
        this.activeDatasets.add(dataset);
      }
      
      this.updateDropdownCheckboxes();
      this.updateMap();
      this.updateSidebar();
      this.updateSelectorText();
      
      console.log(`📊 Dataset toggled: ${dataset}`);
    }

    updateDropdownCheckboxes() {
      document.querySelectorAll('.dropdown-item[data-value]').forEach(item => {
        const dataset = item.getAttribute('data-value');
        const checkbox = item.querySelector('.checkbox');
        
        if (this.activeDatasets.has(dataset)) {
          checkbox.classList.add('checked');
        } else {
          checkbox.classList.remove('checked');
        }
      });
    }

    updateSelectorText() {
      const selectorText = document.getElementById('selectorText');
      if (!selectorText) return;

      const activeCount = this.activeDatasets.size;
      if (activeCount === 0) {
        selectorText.textContent = 'No datasets selected';
        selectorText.className = 'selector-text placeholder';
      } else {
        const labels = Array.from(this.activeDatasets).map(dataset => 
          this.datasetConfig[dataset]?.shortLabel || window.DataConfig.generateShortLabel(dataset)

        );
        
        if (labels.length <= 2) {
          selectorText.textContent = labels.join(', ');
        } else {
          selectorText.textContent = `${labels.length} datasets selected`;
        }
        selectorText.className = 'selector-text';
      }
    }

    updateMap() {
      if (window.MapManager && window.MapManager.updateMarkers) {
        const filteredData = this.getFilteredData();
        window.MapManager.updateMarkers(this.map, filteredData);
      }
    }

    updateSidebar() {
      if (this.allData && window.SidebarManager) {
        const filteredData = this.getFilteredData();
        window.SidebarManager.build(filteredData);
        
        window.geojsonData = filteredData;
        
        if (window.SettingsManager && window.SettingsManager.onDatasetChange) {
          window.SettingsManager.onDatasetChange();
        }
      }
    }
  }

  // Create and export application instance
  const app = new MapaListerApp();
  window.MapaListerApp = app;
  window.EnhancedDatasetFilterManager = EnhancedDatasetFilterManager;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
  } else {
    setTimeout(() => app.initialize(), 100);
  }

  console.log('✅ Enhanced main-integration.js loaded successfully with file upload support');

})();