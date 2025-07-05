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
        }
        
        if (window.FileUploadManager) {
          window.FileUploadManager.init();
          this.setupFileUploadIntegration();
        }
        
        this.setupApplicationCSS();
        this.setupKeyboardShortcuts();
        
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

    setupKeyboardShortcuts() {
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
          activeElement.type === 'text' ||
          activeElement.type === 'search' ||
          activeElement.type === 'email' ||
          activeElement.type === 'password' ||
          activeElement.type === 'number' ||
          activeElement.type === 'tel' ||
          activeElement.type === 'url'
        );
        
        if (isTypingInInput) {
          return;
        }
        
        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
            window.ReferenceMarker.clear();
            console.log('🔤 Shortcut C: Reference marker cleared');
          }
        }
        
        if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.showSettings) {
            window.SettingsManager.showSettings();
            console.log('🔤 Shortcut S: Settings opened');
            e.preventDefault();
          }
        }
        
        if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.FileUploadManager && window.FileUploadManager.triggerFileUpload) {
            window.FileUploadManager.triggerFileUpload();
            console.log('🔤 Shortcut F: File upload triggered');
            e.preventDefault();
          }
        }
        
        if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.toggleIrishCounties) {
            window.SettingsManager.toggleIrishCounties();
            console.log('🔤 Shortcut O: Irish counties toggled');
            
            // Update welcome overlay status if visible
            setTimeout(() => {
              this.updateWelcomeOverlayStatus();
            }, 100);
            
            e.preventDefault();
          }
        }

        if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (window.SettingsManager && window.SettingsManager.toggleIrishDioceses) {
            window.SettingsManager.toggleIrishDioceses();
            console.log('🔤 Shortcut I: Irish dioceses toggled');
            
            // Update welcome overlay status if visible
            setTimeout(() => {
              this.updateWelcomeOverlayStatus();
            }, 100);
            
            e.preventDefault();
          }
        }

        // Press 'T' key to cycle sidebar: left -> right -> hide
        if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            const currentPosition = window.SettingsManager ? 
              window.SettingsManager.getSetting('sidebarPosition') : 'right';
            
            if (sidebar.classList.contains('sidebar-hidden')) {
              // Hidden -> Show on left
              sidebar.classList.remove('sidebar-hidden');
              sidebar.classList.add('sidebar-left');
              sidebar.classList.remove('sidebar-right');
              if (window.SettingsManager) {
                window.SettingsManager.setSetting('sidebarPosition', 'left');
              }
              console.log('🔤 Shortcut T: Sidebar shown on left');
            } else if (currentPosition === 'left') {
              // Left -> Right
              sidebar.classList.remove('sidebar-left');
              sidebar.classList.add('sidebar-right');
              if (window.SettingsManager) {
                window.SettingsManager.setSetting('sidebarPosition', 'right');
              }
              console.log('🔤 Shortcut T: Sidebar moved to right');
            } else {
              // Right -> Hide
              sidebar.classList.add('sidebar-hidden');
              sidebar.classList.remove('sidebar-left', 'sidebar-right');
              console.log('🔤 Shortcut T: Sidebar hidden');
            }
            
            // Trigger map resize
            if (window.map && window.map.resize) {
              setTimeout(() => window.map.resize(), 300);
            }
            
            e.preventDefault();
          }
        }
      });
      
      console.log('⌨️ Enhanced keyboard shortcuts enabled');
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
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = 'none';
      }
      
      const welcomeHTML = `
        <div id="welcome-overlay" class="welcome-overlay">
          <div class="welcome-header">
            <div class="welcome-logo">
              <svg width="40" height="40" viewBox="0 0 32 32">
                <path d="M 6 0 L 26 0 A 6 6 0 0 1 32 6 L 32 16 L 16 16 L 16 3 A 2 2 0 0 0 14 1 L 6 1 A 6 6 0 0 1 6 0" fill="#e11d48"/>
                <path d="M 32 16 L 32 26 A 6 6 0 0 1 26 32 L 16 32 L 16 16" fill="#10b981"/>
                <path d="M 16 32 L 6 32 A 6 6 0 0 1 0 26 L 0 16 L 16 16" fill="#3b82f6"/>
                <path d="M 0 16 L 0 6 A 6 6 0 0 1 6 0 L 16 0 L 16 16" fill="#f59e0b"/>
                <rect x="3" y="3" width="26" height="26" rx="2" fill="white"/>
                <text x="16" y="25.4" text-anchor="middle" font-size="23.4" dominant-baseline="baseline">📍</text>
              </svg>
            </div>
            <div class="welcome-brand">
              <span class="map">Map</span><span class="a">a</span><span class="list">List</span><span class="er">er</span>
            </div>
          </div>

          <div class="welcome-content">
            <h2>Welcome to MapaLister</h2>
            <p class="welcome-description">
              Taking list, showing maps. 
              You're seeing Irish counties and dioceses  as an example - you haven't loaded any markers. <br>
            Hover over a filled are to see its description. Use the buttons below or the shortcut keys to show area, borders or none - <code>o</code> for counties, <code>i</code> for dioceses.
            </p>

            <div class="demo-section">
              <h3>🗺️ Try the Interactive Overlays</h3>
              <div class="overlay-demo">
                <div class="overlay-control" data-target="counties">
                  <div class="overlay-indicator counties">🏛️</div>
                  <div class="overlay-info">
                    <div class="overlay-name">Irish C<u>o</u>unties</div>
                    <div class="overlay-toggle-hint">Press <code>o</code> to cycle: borders → filled → off</div>
                  </div>
                </div>

                <div class="overlay-control" data-target="dioceses">
                  <div class="overlay-indicator dioceses">⛪</div>
                  <div class="overlay-info">
                    <div class="overlay-name">Irish D<u>i</u>oceses</div>
                    <div class="overlay-toggle-hint">Press <code>i</code> to cycle: borders → filled → off</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="demo-section upload-section">
              <h3>📁 Get Started with Your Data</h3>
              <p>Upload a GeoJSON file to see your data with powerful filtering and distance calculations.</p>
              <button id="upload-demo-btn" class="upload-btn">
                <span>📁</span> Choose GeoJSON File
              </button>
              <div class="upload-hint">Or drag & drop your .geojson file anywhere</div>
            </div>
          </div>

          <div class="welcome-footer">
            <button id="dismiss-welcome" class="dismiss-btn">✨ Explore the Map</button>
            <div class="footer-note">This overlay will disappear when you upload data</div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', welcomeHTML);
      this.addWelcomeStyles();
      this.bindWelcomeEvents(); // This now includes status initialization
      
      console.log('✨ Welcome experience loaded');
    }

    showSidebarAfterUpload() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = 'block';
        sidebar.style.animation = 'slideInLeft 0.6s ease-out';
      }
      
      this.dismissWelcomeOverlay();
      console.log('📱 Sidebar shown after data upload');
    }

    addWelcomeStyles() {
      if (document.getElementById('welcome-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'welcome-styles';
      style.textContent = `
        .welcome-overlay {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          height: 100vh;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-left: 2px solid #e2e8f0;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          overflow-y: auto;
          font-family: 'Outfit', sans-serif;
          animation: slideInRight 0.6s ease-out;
        }
        
        .welcome-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border-bottom: 2px solid #f1f5f9;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        }
        
        .welcome-brand {
          font-size: 1.4em;
          font-weight: 600;
          letter-spacing: -0.015em;
        }
        
        .welcome-brand .map { color: #e11d48; }
        .welcome-brand .a { color: #f59e0b; }
        .welcome-brand .list { color: #3b82f6; }
        .welcome-brand .er { color: #10b981; }
        
        .welcome-content {
          padding: 20px;
        }
        
        .welcome-content h2 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.5em;
          font-weight: 600;
        }
        
        .welcome-description {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        
        .demo-section {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .demo-section h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        
        .overlay-demo {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .overlay-control {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .overlay-control:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        
        .overlay-indicator {
          font-size: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .overlay-indicator.dioceses {
          background: rgba(139, 92, 246, 0.1);
        }
        
        .overlay-indicator.counties {
          background: rgba(59, 130, 246, 0.1);
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
        
        .overlay-toggle-hint {
          font-size: 11px;
          color: #6b7280;
        }
        
        .overlay-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: none; /* Hide status indicators */
        }
        
        .overlay-status.active {
          background: #dcfce7;
          color: #166534;
        }
        
        .overlay-status.inactive {
          background: #fee2e2;
          color: #dc2626;
        }

        .overlay-status.borders {
          background: #fef3c7;
          color: #d97706;
        }
        
        .upload-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 16px;
          margin: 0 -4px;
        }
        
        .upload-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          justify-content: center;
          margin-bottom: 8px;
        }
        
        .upload-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .upload-hint {
          text-align: center;
          font-size: 11px;
          color: #0369a1;
          font-style: italic;
        }
        
        .welcome-footer {
          padding: 20px;
          border-top: 2px solid #f1f5f9;
          background: #f8fafc;
          text-align: center;
        }
        
        .dismiss-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }
        
        .dismiss-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .footer-note {
          font-size: 11px;
          color: #6b7280;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .welcome-overlay {
            width: 100%;
            left: 0;
            right: 0;
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
      this.buildDatasetConfig(geojsonData);
      const datasets = this.findAvailableDatasets(geojsonData);
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

    buildDatasetConfig(geojsonData) {
      const config = window.SettingsManager ? window.SettingsManager.getDataConfig() : { groupingProperty: 'dataset' };
      const colorMapping = window.SettingsManager ? window.SettingsManager.getColorMapping() : {};
      
      this.datasetConfig = {};
      
      const groupingValues = new Set();
      geojsonData.features.forEach(feature => {
        const value = feature.properties?.[config.groupingProperty];
        if (value) {
          groupingValues.add(value);
        }
      });
      
      Array.from(groupingValues).forEach(value => {
        this.datasetConfig[value] = {
          color: colorMapping[value] || '#6b7280',
          label: value,
          shortLabel: this.generateShortLabel(value)
        };
      });
      
      console.log('📊 Dataset configuration built:', this.datasetConfig);
    }

    generateShortLabel(value) {
      if (value.length <= 3) {
        return value.toUpperCase();
      }
      
      return value.split(/[\s-_]+/)
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
    }

    findAvailableDatasets(geojsonData) {
      const config = window.SettingsManager ? window.SettingsManager.getDataConfig() : { groupingProperty: 'dataset' };
      const datasets = new Set();
      
      geojsonData.features.forEach(feature => {
        const value = feature.properties?.[config.groupingProperty];
        if (value && this.datasetConfig[value]) {
          datasets.add(value);
        }
      });
      
      return Array.from(datasets);
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
          this.datasetConfig[dataset]?.shortLabel || dataset
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