 /**
 * =====================================================
 * FILE: managers/settings-manager.js
 * PURPOSE: Enhanced settings management with Irish overlays and three-state sidebar positioning
 * DEPENDENCIES: DataConfig, DistanceUtils, SidebarManager, MapManager
 * EXPORTS: SettingsManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('⚙️ Loading settings-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    if (typeof DistanceUtils === 'undefined') missing.push('DistanceUtils');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ SettingsManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initSettingsManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    return;
  }

  function initSettingsManager() {
    /**
     * ENHANCED SETTINGS MANAGER FOR MAPALISTER
     * Integrates full settings modal with Irish overlays and three-state sidebar positioning
     */
    const SettingsManager = {

      defaultSettings: {
        distanceUnit: 'km',
        mapStyle: 'mapbox/light-v11',
        autoCenter: true,
        sidebarPosition: 'hidden', // Enhanced: Start hidden for clean exploration
        
        // Irish overlay settings - ENGAGING INITIAL DISPLAY
        showIrishCounties: true,        // ON by default for engagement
        irishCountiesOpacity: 0.1,      // 10% opacity as requested
        irishCountiesStyle: 'filled',   // Show fills, not just borders
        irishCountiesSource: 'data/counties-coloured.geojson',
        
        showIrishDioceses: true,        // ON by default for engagement  
        irishDiocesesOpacity: 0.5,      // 50% opacity as requested
        irishDiocesesStyle: 'filled',   // Show fills, not just borders
        irishDiocesesSource: 'data/dioceses-coloured.geojson'
      },

      // Static application configuration (replaces app-config.js)
      staticConfig: {
        defaultMapStyle: 'mapbox/light-v11',
        defaultZoom: 6,
        defaultCenter: [-7.5, 53.0],
        mapStyles: {
          'mapbox/light-v11': 'Light',
          'mapbox/streets-v12': 'Streets', 
          'mapbox/outdoors-v12': 'Outdoors',
          'mapbox/satellite-v9': 'Satellite',
          'mapbox/dark-v11': 'Dark'
        },
        defaultColors: [
          '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
          '#6b7280', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
        ]
      },

      // Data configuration for uploaded files (replaces DataConfig)
      dataConfig: {
        current: {
          filename: null,
          displayName: 'Contacts',
          sourceKey: 'uploaded',
          groupingProperty: 'dataset',
          groupingDisplayName: 'Dataset',
          defaultGroupingValues: []
        },
        
        update(newConfig) {
          const oldConfig = { ...this.current };
          this.current = { ...this.current, ...newConfig };
          console.log('Data configuration updated:', this.current);
          
          window.dispatchEvent(new CustomEvent('mapalister:configChanged', {
            detail: { oldConfig, newConfig: this.current }
          }));
        },
        
        getCurrent() {
          return { ...this.current };
        }
      },

      // Color management (replaces DataConfig color functions)
      generateColorMapping(groupingValues) {
        const colors = this.staticConfig.defaultColors;
        const colorMap = {};
        
        groupingValues.forEach((value, index) => {
          colorMap[value] = colors[index % colors.length];
        });
        
        return colorMap;
      },

      // New method: Get static config
      getStaticConfig() {
        return { ...this.staticConfig };
      },

      // New method: Get data config  
      getDataConfig() {
        return this.dataConfig.getCurrent();
      },

      // New method: Get color mapping
      getColorMapping() {
        const config = this.dataConfig.getCurrent();
        return this.generateColorMapping(config.defaultGroupingValues);
      },

      settings: {},
      callbacks: new Set(),
      countiesLayerLoaded: false,
      diocesesLayerLoaded: false,
      modalCreated: false,

      /**
       * Initialize settings manager
       */
      init() {
        this.settings = this.loadSettings();
        this.applySidebarPosition();
        
        // Setup settings change listener for auto-center
        this.onSettingsChange((settings) => {
          if (settings.autoCenter && window.SidebarManager) {
            // Trigger auto-center when settings change
            window.SidebarManager.onDatasetChange?.();
          }
        });
        
        console.log('✅ Enhanced Settings Manager initialized');
      },

      /**
       * Load settings from localStorage
       */
      loadSettings() {
        try {
          const saved = localStorage.getItem('mapalister-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            return Object.assign({}, this.defaultSettings, parsed);
          }
        } catch (error) {
          console.warn('Failed to load settings:', error);
        }
        return Object.assign({}, this.defaultSettings);
      },

      /**
       * Enhanced sidebar position application with three-state support
       */
      applySidebarPosition() {
        const sidebar = document.querySelector('.sidebar');
        const mapContainer = document.getElementById('map');
        
        if (!sidebar || !mapContainer) {
          console.warn('⚠️ Sidebar or map container not found');
          return;
        }
        
        const position = this.getSetting('sidebarPosition') || 'hidden';
        
        console.log(`📱 Applying sidebar position: ${position}`);
        
        // Remove existing position classes (including hidden state)
        sidebar.classList.remove('sidebar-left', 'sidebar-right', 'sidebar-hidden');
        
        // Apply position class with graceful hidden state handling
        if (position === 'right') {
          sidebar.classList.add('sidebar-right');
          sidebar.style.display = 'flex';
          sidebar.style.visibility = 'visible';
        } else if (position === 'left') {
          sidebar.classList.add('sidebar-left');
          sidebar.style.display = 'flex';
          sidebar.style.visibility = 'visible';
        } else { // Enhanced: Graceful hidden state
          sidebar.classList.add('sidebar-hidden');
          sidebar.style.display = 'none';
          sidebar.style.visibility = 'hidden';
        }
        
        // Add the necessary CSS if it doesn't exist
        this.addSidebarPositionCSS();
        
        // Trigger map resize if map exists (for proper rendering)
        if (typeof map !== 'undefined' && map && map.resize) {
          setTimeout(() => {
            map.resize();
          }, 300);
        }
        
        console.log(`✅ Sidebar positioned: ${position}`);
      },
      
      /**
       * Enhanced CSS for sidebar positioning with hidden state support
       */
      addSidebarPositionCSS() {
        // Check if CSS already exists
        if (document.getElementById('sidebar-position-css')) return;
        
        const style = document.createElement('style');
        style.id = 'sidebar-position-css';
        style.textContent = `
          .sidebar-left {
            left: 0;
            right: auto;
          }
          
          .sidebar-right {
            right: 0;
            left: auto;
          }
          
          /* Enhanced: Graceful hidden state support */
          .sidebar-hidden {
            display: none !important;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
          
          /* Adjust map container for sidebar positioning */
          @media (min-width: 768px) {
            .sidebar-left ~ #map {
              margin-left: 320px;
              margin-right: 0;
            }
            
            .sidebar-right ~ #map {
              margin-right: 320px;
              margin-left: 0;
            }
            
            /* Enhanced: Map margins for hidden state */
            .sidebar-hidden ~ #map {
              margin-left: 0;
              margin-right: 0;
            }
          }
          
          /* Mobile responsiveness */
          @media (max-width: 767px) {
            .sidebar-left,
            .sidebar-right,
            .sidebar-hidden {
              left: 0;
              right: 0;
              width: 100%;
            }
            
            .sidebar-left ~ #map,
            .sidebar-right ~ #map,
            .sidebar-hidden ~ #map {
              margin-left: 0;
              margin-right: 0;
            }
          }
          
          /* Add smooth transitions */
          .sidebar {
            transition: all 0.3s ease;
          }
          
          #map {
            transition: margin 0.3s ease;
          }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Enhanced sidebar positioning CSS added');
      },

      /**
       * Enhanced: Three-state sidebar cycling
       */
      cycleSidebarThrough3States() {
        const current = this.getSetting('sidebarPosition') || 'hidden';
        let next = '';
        
        // Elegant three-state cycle: hidden → left → right → hidden
        if (current === 'hidden') {
          next = 'left';
        } else if (current === 'left') {
          next = 'right';
        } else {
          next = 'hidden';
        }
        
        this.setSetting('sidebarPosition', next);
        
        // Use excellent toast system for user feedback
        if (this.showToast) {
          const messages = {
            left: '📱 Sidebar: Left',
            right: '📱 Sidebar: Right',
            hidden: '📱 Sidebar: Hidden'
          };
          this.showToast(messages[next], 'info');
        }
        
        console.log(`🔄 Sidebar cycled: ${current} → ${next}`);
        return next;
      },

      /**
       * Enhanced: Helper method for file upload integration
       */
      showSidebarAfterDataUpload() {
        // Show sidebar on right after data upload for immediate productivity
        this.setSetting('sidebarPosition', 'right');
        
        if (this.showToast) {
          this.showToast('📊 Data loaded - sidebar ready!', 'success');
        }
        
        console.log('📁 Sidebar shown after data upload');
      },

      /**
       * Save settings to localStorage
       */
      saveSettings() {
        try {
          localStorage.setItem('mapalister-settings', JSON.stringify(this.settings));
        } catch (error) {
          console.warn('Failed to save settings:', error);
        }
      },

      /**
       * Get a setting value
       */
      getSetting(key) {
        return this.settings[key];
      },

      addDiocesesPopupCSS() {
        const existingStyle = document.getElementById('diocese-popup-styles');
        if (existingStyle) return;
        
        const style = document.createElement('style');
        style.id = 'diocese-popup-styles';
        style.textContent = `
          /* Enhanced Diocese Popup Styles */
          .diocese-popup .mapboxgl-popup-content {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(12px);
            border-radius: 8px !important;
            padding: 0 !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid rgba(139, 92, 246, 0.2) !important;
            transition: all 0.2s ease;
            animation: diocesePopupIn 0.2s ease-out;
          }
          
          .diocese-popup .mapboxgl-popup-tip {
            border-top-color: rgba(255, 255, 255, 0.98) !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          @keyframes diocesePopupIn {
            0% { 
              opacity: 0; 
              transform: translateY(10px) scale(0.9); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          
          /* Smooth cursor transitions */
          #map {
            transition: cursor 0.1s ease;
          }
          
          /* Enhanced visibility for diocese boundaries on hover */
          .mapboxgl-canvas:hover ~ .diocese-popup {
            pointer-events: none;
          }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Diocese popup CSS styles added');
      },

      addCountiesPopupCSS() {
        const existingStyle = document.getElementById('county-popup-styles');
        if (existingStyle) return;
        
        const style = document.createElement('style');
        style.id = 'county-popup-styles';
        style.textContent = `
          /* Enhanced County Popup Styles */
          .county-popup .mapboxgl-popup-content {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(12px);
            border-radius: 8px !important;
            padding: 0 !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid rgba(59, 130, 246, 0.2) !important;
            transition: all 0.2s ease;
            animation: countyPopupIn 0.2s ease-out;
          }
          
          .county-popup .mapboxgl-popup-tip {
            border-top-color: rgba(255, 255, 255, 0.98) !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          @keyframes countyPopupIn {
            0% { 
              opacity: 0; 
              transform: translateY(10px) scale(0.9); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          
          /* Smooth cursor transitions for counties */
          #map {
            transition: cursor 0.1s ease;
          }
          
          /* Enhanced visibility for county boundaries on hover */
          .mapboxgl-canvas:hover ~ .county-popup {
            pointer-events: none;
          }
        `;
        
        document.head.appendChild(style);
        console.log('✅ County popup CSS styles added');
      },

      /**
       * Set a setting value
       */
      setSetting(key, value) {
        if (this.settings[key] !== value) {
          this.settings[key] = value;
          this.saveSettings();
          this.notifyCallbacks();
          
          // ADDITION: Handle distance unit changes specifically
          if (key === 'distanceUnit') {
            console.log(`📏 Distance unit changed to: ${value}`);
            
            // Update DistanceUtils
            if (window.DistanceUtils) {
              window.DistanceUtils.setUnit(value);
            }
            
            // Force sidebar rebuild to show new units
            setTimeout(() => {
              if (window.SidebarManager && window.geojsonData) {
                console.log('🔄 Rebuilding sidebar for new distance units...');
                window.SidebarManager.build(window.geojsonData);
              }
            }, 100);
          }
                
          // Handle specific setting changes
          if (key.startsWith('irishCounties') || 
              key.startsWith('irishDioceses') || 
              key === 'showIrishCounties' || 
              key === 'showIrishDioceses') {
            this.handleOverlaySettingChange(key, value);
          } else if (key === 'mapStyle' && typeof map !== 'undefined' && map) {
            map.setStyle(`mapbox://styles/${value}`);
          } else if (key === 'sidebarPosition') {
            this.applySidebarPosition();
          } else if (key === 'autoCenter') {
            this.handleAutoCenterChange(value);
          }
        }
      },

      /**
       * Toggle sidebar position (for testing/hotkey)
       */
      toggleSidebarPosition() {
        const currentPosition = this.getSetting('sidebarPosition') || 'left';
        const newPosition = currentPosition === 'left' ? 'right' : 'left';
        
        this.setSetting('sidebarPosition', newPosition);
        
        console.log(`🔄 Sidebar toggled from ${currentPosition} to ${newPosition}`);
      },

      /**
       * Handle auto-center functionality properly
       */
      handleAutoCenterChange(enabled) {
        if (enabled && typeof geojsonData !== 'undefined' && geojsonData && typeof map !== 'undefined' && map) {
          // Implement proper auto-center
          this.centerMapOnData();
        }
      },

      /**
       * Center map on current data
       */
      centerMapOnData() {
        if (!map || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
          return;
        }

        try {
          const bounds = new mapboxgl.LngLatBounds();
          let validCoordinates = 0;

          geojsonData.features.forEach(feature => {
            if (feature.geometry && 
                feature.geometry.coordinates && 
                Array.isArray(feature.geometry.coordinates) &&
                feature.geometry.coordinates.length >= 2) {
              bounds.extend(feature.geometry.coordinates);
              validCoordinates++;
            }
          });

          if (validCoordinates > 0 && !bounds.isEmpty()) {
            map.fitBounds(bounds, { 
              padding: 50,
              maxZoom: 15,
              duration: 1000
            });
            
            console.log(`📍 Auto-centered map to fit ${validCoordinates} markers`);
          }
        } catch (e) {
          console.warn('⚠️ Failed to auto-center map:', e);
        }
      },

      /**
       * Handle overlay-specific setting changes
       */
      handleOverlaySettingChange(key, value) {
        if (typeof map !== 'undefined' && map) {
          switch (key) {
            case 'showIrishCounties':
              if (value) {
                this.loadIrishCounties();
              } else {
                this.hideIrishCounties();
              }
              break;
            case 'showIrishDioceses':
              if (value) {
                this.loadIrishDioceses();
              } else {
                this.hideIrishDioceses();
              }
              break;
            case 'irishCountiesOpacity':
              this.updateCountiesOpacity(value);
              break;
            case 'irishCountiesStyle':
              this.updateCountiesStyle(value);
              break;
            case 'irishDiocesesOpacity':
              this.updateDiocesesOpacity(value);
              break;
            case 'irishDiocesesStyle':
              this.updateDiocesesStyle(value);
              break;
          }
        }
      },

      /**
       * Setup map style change listener to restore overlays
       */
      setupMapStyleListener() {
        if (!map) return;
        
        // Remove existing listener if it exists
        if (this._styleDataHandler) {
          map.off('styledata', this._styleDataHandler);
        }
        
        // Create new handler
        this._styleDataHandler = () => {
          console.log('🎨 Map style changed - checking overlays...');
          
          // Wait for style to fully load
          if (map.isStyleLoaded()) {
            console.log('✅ Style loaded, restoring overlays...');
            
            // Reset layer loaded flags
            this.countiesLayerLoaded = false;
            this.diocesesLayerLoaded = false;
            
            // Restore overlays with proper delays
            if (this.getSetting('showIrishCounties')) {
              console.log('🔄 Restoring Irish counties after style change...');
              setTimeout(() => this.loadIrishCounties(), 500);
            }
            
            if (this.getSetting('showIrishDioceses')) {
              console.log('🔄 Restoring Irish dioceses after style change...');
              setTimeout(() => this.loadIrishDioceses(), 700);
            }
          }
        };
        
        map.on('styledata', this._styleDataHandler);
        console.log('✅ Map style listener setup for overlays');
      },

      /**
       * Load and display Irish counties
       */
      async loadIrishCounties() {
        console.log('🏛️ Loading Irish counties...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for counties overlay');
          return;
        }

        // If already loaded, just show the layers
        if (this.countiesLayerLoaded) {
          this.showIrishCounties();
          return;
        }

        try {
          const url = this.getSetting('irishCountiesSource');
          console.log(`📂 Fetching counties from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const countiesData = await response.json();
          console.log('✅ Counties data loaded:', countiesData.features?.length, 'features');
          
          // Validate GeoJSON structure
          if (!countiesData.type || countiesData.type !== 'FeatureCollection' || !countiesData.features) {
            throw new Error('Invalid GeoJSON structure for counties');
          }
          
          // Remove existing layers and source safely
          this.removeCountiesLayers();
          
          // Add source
          map.addSource('irish-counties', {
            type: 'geojson',
            data: countiesData
          });
          
          // Add fill layer
          map.addLayer({
            id: 'irish-counties-fill',
            type: 'fill',
            source: 'irish-counties',
            paint: {
              'fill-color': [
                'case',
                ['has', 'fill'], ['get', 'fill'],
                ['has', 'color'], ['get', 'color'],
                '#3b82f6' // default color
              ],
              'fill-opacity': this.getSetting('irishCountiesOpacity')
            }
          });
          
          // Add border layer
          map.addLayer({
            id: 'irish-counties-border',
            type: 'line',
            source: 'irish-counties',
            paint: {
              'line-color': [
                'case',
                ['has', 'stroke'], ['get', 'stroke'],
                ['has', 'stroke-color'], ['get', 'stroke-color'],
                '#1e293b' // default border color
              ],
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
          
          // Setup hover effects
          this.setupCountiesHover();
          
          // Mark as loaded and apply current style settings
          this.countiesLayerLoaded = true;
          this.updateCountiesStyle(this.getSetting('irishCountiesStyle'));
          
          console.log('✅ Irish counties loaded successfully');
          
          // Show success toast
          if (this.showToast) {
            this.showToast('🏛️ Irish counties loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Irish counties:', error);
          
          // Show user-friendly error
          if (this.showToast) {
            this.showToast(`❌ Counties failed: ${error.message}`, 'error');
          }
          
          // Reset setting if file not found
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            console.log('🔄 Disabling counties overlay due to file not found');
            this.setSetting('showIrishCounties', false);
          }
        }
      },

      /**
       * Load and display Irish dioceses
       */
      async loadIrishDioceses() {
        console.log('⛪ Loading Irish dioceses...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for dioceses overlay');
          return;
        }

        // If already loaded, just show the layers
        if (this.diocesesLayerLoaded) {
          this.showIrishDioceses();
          return;
        }

        try {
          const url = this.getSetting('irishDiocesesSource');
          console.log(`📂 Fetching dioceses from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const diocesesData = await response.json();
          console.log('✅ Dioceses data loaded:', diocesesData.features?.length, 'features');
          
          // Validate GeoJSON structure
          if (!diocesesData.type || diocesesData.type !== 'FeatureCollection' || !diocesesData.features) {
            throw new Error('Invalid GeoJSON structure for dioceses');
          }
          
          // Remove existing layers and source safely
          this.removeDiocesesLayers();
          
          // Add source
          map.addSource('irish-dioceses', {
            type: 'geojson',
            data: diocesesData
          });
          
          // Add fill layer
          map.addLayer({
            id: 'irish-dioceses-fill',
            type: 'fill',
            source: 'irish-dioceses',
            paint: {
              'fill-color': [
                'case',
                ['has', 'fill'], ['get', 'fill'],
                ['has', 'color'], ['get', 'color'],
                '#8b5cf6' // default color (purple)
              ],
              'fill-opacity': this.getSetting('irishDiocesesOpacity')
            }
          });
          
          // Add border layer
          map.addLayer({
            id: 'irish-dioceses-border',
            type: 'line',
            source: 'irish-dioceses',
            paint: {
              'line-color': [
                'case',
                ['has', 'stroke'], ['get', 'stroke'],
                ['has', 'stroke-color'], ['get', 'stroke-color'],
                '#4c1d95' // default border color (dark purple)
              ],
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
          
          // Setup hover effects
          this.setupDiocesesHover();
          
          // Mark as loaded and apply current style settings
          this.diocesesLayerLoaded = true;
          this.updateDiocesesStyle(this.getSetting('irishDiocesesStyle'));
          
          console.log('✅ Irish dioceses loaded successfully');
          
          // Show success toast
          if (this.showToast) {
            this.showToast('⛪ Irish dioceses loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Irish dioceses:', error);
          
          // Show user-friendly error
          if (this.showToast) {
            this.showToast(`❌ Dioceses failed: ${error.message}`, 'error');
          }
          
          // Reset setting if file not found
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            console.log('🔄 Disabling dioceses overlay due to file not found');
            this.setSetting('showIrishDioceses', false);
          }
        }
      },

      /**
       * Safely remove counties layers
       */
      removeCountiesLayers() {
        if (!map) return;
        
        try {
          // Remove layers first (order matters!)
          if (map.getLayer('irish-counties-fill')) {
            map.removeLayer('irish-counties-fill');
            console.log('🗑️ Removed counties fill layer');
          }
          if (map.getLayer('irish-counties-border')) {
            map.removeLayer('irish-counties-border');
            console.log('🗑️ Removed counties border layer');
          }
          
          // Remove source last
          if (map.getSource('irish-counties')) {
            map.removeSource('irish-counties');
            console.log('🗑️ Removed counties source');
          }
        } catch (error) {
          console.warn('⚠️ Error removing counties layers:', error);
        }
      },

      /**
       * Safely remove dioceses layers
       */
      removeDiocesesLayers() {
        if (!map) return;
        
        try {
          // Remove layers first (order matters!)
          if (map.getLayer('irish-dioceses-fill')) {
            map.removeLayer('irish-dioceses-fill');
            console.log('🗑️ Removed dioceses fill layer');
          }
          if (map.getLayer('irish-dioceses-border')) {
            map.removeLayer('irish-dioceses-border');
            console.log('🗑️ Removed dioceses border layer');
          }
          
          // Remove source last
          if (map.getSource('irish-dioceses')) {
            map.removeSource('irish-dioceses');
            console.log('🗑️ Removed dioceses source');
          }
        } catch (error) {
          console.warn('⚠️ Error removing dioceses layers:', error);
        }
      },

/**
 * Setup hover effects for counties with better error handling
 */
setupCountiesHover() {
  if (!map || !map.getLayer('irish-counties-fill')) return;
  
  // Remove existing popup if it exists (prevents duplicates)
  if (this.countiesPopup) {
    this.countiesPopup.remove();
  }
  
  // Enhanced popup with smooth transitions (similar to dioceses)
  this.countiesPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'overlay-popup county-popup',
    anchor: 'top',     // Changed from 'bottom' to 'top'
    offset: [0, 10]    // Changed from [0, -10] to [0, 10]
  });  
  
  // Track current hovered feature to prevent unnecessary updates
  let currentHoveredFeature = null;
  let popupTimeout = null;
  
  // Enhanced mouse move event with smooth county detection
  const handleMouseMove = (e) => {
    // IMPORTANT: Check if counties are in filled state
    const countiesStyle = this.getSetting('irishCountiesStyle');
    const countiesEnabled = this.getSetting('showIrishCounties');
    
    // Only show popup if counties are enabled AND in filled or both state
    if (!countiesEnabled || (countiesStyle !== 'filled' && countiesStyle !== 'both')) {
      // Counties not in filled state - don't show popup
      if (this.countiesPopup && this.countiesPopup.isOpen()) {
        this.countiesPopup.remove();
      }
      return;
    }
    
    // Clear any pending hide timeout
    if (popupTimeout) {
      clearTimeout(popupTimeout);
      popupTimeout = null;
    }
    
    // Query features at current mouse position
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['irish-counties-fill']
    });
    
    if (features.length > 0) {
      const feature = features[0];
      const featureId = feature.id || feature.properties.id || 
                       feature.properties.COUNTY || feature.properties.name;
      
      // Only update if we're over a different feature
      if (currentHoveredFeature !== featureId) {
        currentHoveredFeature = featureId;
        map.getCanvas().style.cursor = 'pointer';
        
        const properties = feature.properties;
        
        // Use specific Irish and English county names
        const countyEnglish = (properties.COUNTY || 'County')
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase()); // Proper case
        const countyIrish = properties.CONTAE || ''; // Irish name
        
        // Get province information from PROVINCE key
        const province = properties.PROVINCE || '';
        
        // Create display name with both languages
        const countyDisplay = countyIrish ? 
          `${countyEnglish} • ${countyIrish}` : 
          countyEnglish;
        
        // Create province display text
        const provinceDisplay = province ? 
          `Province of ${province}` : 
          '';
        
        // Enhanced popup content with province information
        const popupContent = `
          <div style="
            font-family: 'Outfit', sans-serif;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(12px);
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.2);
            min-width: 120px;
            text-align: center;
          ">
            <div style="
              font-weight: 600; 
              color: #1e40af; 
              font-size: 14px; 
              margin-bottom: ${provinceDisplay ? '2px' : '4px'};
              text-shadow: 0 1px 2px rgba(255,255,255,0.8);
            ">🏛️ ${countyDisplay}</div>
            ${provinceDisplay ? `
              <div style="
                color: #64748b; 
                font-size: 10px; 
                font-weight: 500;
                opacity: 0.9;
                margin-bottom: 4px;
              ">${provinceDisplay}</div>
            ` : ''}
            <div style="
              color: #3b82f6; 
              font-size: 11px; 
              font-weight: 500;
              opacity: 0.8;
            ">Civil ● County</div>
          </div>
        `;
        
        this.countiesPopup
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      } else {
        // Same feature, just update position smoothly
        this.countiesPopup.setLngLat(e.lngLat);
      }
    } else {
      // No features under cursor - hide popup with delay
      this.hideCountiesPopupWithDelay();
    }
  };
  
  // Method to hide popup with delay (prevents flickering)
  const hideCountiesPopupWithDelay = () => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    
    popupTimeout = setTimeout(() => {
      if (this.countiesPopup) {
        this.countiesPopup.remove();
      }
      currentHoveredFeature = null;
      map.getCanvas().style.cursor = '';
    }, 150); // Small delay to prevent flickering between polygons
  };
  
  // Bind events to both fill and border layers for better coverage
  const layers = ['irish-counties-fill', 'irish-counties-border'];
  
  layers.forEach(layerId => {
    if (map.getLayer(layerId)) {
      // Mouse move for smooth tracking
      map.on('mousemove', layerId, handleMouseMove);
      
      // Mouse leave with delay
      map.on('mouseleave', layerId, () => {
        hideCountiesPopupWithDelay();
      });
    }
  });
  
  // Additional map-level mousemove to handle gaps between polygons
  map.on('mousemove', (e) => {
    if (currentHoveredFeature) {
      // Check if we're still over a county feature
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['irish-counties-fill']
      });
      
      if (features.length === 0) {
        // Not over any county - hide popup
        hideCountiesPopupWithDelay();
      }
    }
  });
  
  // Store the hide method for cleanup
  this.hideCountiesPopupWithDelay = hideCountiesPopupWithDelay;
  
  console.log('✅ Enhanced counties hover effects configured with conditional popup and province display');
},
      /**
       * Setup hover effects for dioceses with better error handling
       */
      setupDiocesesHover() {
        if (!map || !map.getLayer('irish-dioceses-fill')) return;
        
        // Remove existing popup if it exists (prevents duplicates)
        if (this.diocesesPopup) {
          this.diocesesPopup.remove();
        }
        
        // Enhanced popup with smooth transitions
        this.diocesesPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'overlay-popup diocese-popup',
          anchor: 'bottom',
          offset: [0, -10] // Slight offset to prevent flickering
        });
        
        // Track current hovered feature to prevent unnecessary updates
        let currentHoveredFeature = null;
        let popupTimeout = null;
        
        // Enhanced mouse enter event with smooth diocese detection
        const handleMouseMove = (e) => {
          // Clear any pending hide timeout
          if (popupTimeout) {
            clearTimeout(popupTimeout);
            popupTimeout = null;
          }
          
          // Query features at current mouse position
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['irish-dioceses-fill']
          });
          
          if (features.length > 0) {
            const feature = features[0];
            const featureId = feature.id || feature.properties.id || 
                             feature.properties.diocese || feature.properties.name;
            
            // Only update if we're over a different feature
            if (currentHoveredFeature !== featureId) {
              currentHoveredFeature = featureId;
              map.getCanvas().style.cursor = 'pointer';
              
              const properties = feature.properties;
              
              // Try different property names for diocese name (flexible detection)
              const dioceseName = properties.diocese ||
                                 properties.Diocese ||
                                 properties.DIOCESE ||
                                 properties.name ||
                                 properties.NAME ||
                                 properties.title ||
                                 properties.TITLE ||
                                 properties.dioceseName ||
                                 properties.DioceseName ||
                                 'Irish Diocese';
              
              // Get province information from province key
              const province = properties.province || '';
              
              // Get administration information if available
              const administration = properties.administration || '';
              
              // Create province display text
              const provinceDisplay = province ? 
                `Province of ${province}` : 
                '';
              
              // Enhanced popup content with province and administration info
              const popupContent = `
                <div style="
                  font-family: 'Outfit', sans-serif;
                  background: rgba(255, 255, 255, 0.98);
                  backdrop-filter: blur(12px);
                  border-radius: 8px;
                  padding: 12px 16px;
                  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                  border: 1px solid rgba(139, 92, 246, 0.2);
                  min-width: 120px;
                  text-align: center;
                ">
                  <div style="
                    font-weight: 600; 
                    color: #4c1d95; 
                    font-size: 14px; 
                    margin-bottom: ${provinceDisplay || administration ? '2px' : '4px'};
                    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                  ">⛪ ${dioceseName}</div>
                  ${provinceDisplay ? `
                    <div style="
                      color: #64748b; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.9;
                      margin-bottom: ${administration ? '2px' : '4px'};
                    ">${provinceDisplay}</div>
                  ` : ''}
                  ${administration ? `
                    <div style="
                      color: #7c3aed; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.85;
                      margin-bottom: 4px;
                      font-style: italic;
                    ">${administration}</div>
                  ` : ''}
                  <div style="
                    color: #6b46c1; 
                    font-size: 11px; 
                    font-weight: 500;
                    opacity: 0.8;
                  ">Ecclesiastical ● Diocese</div>
                </div>
              `;
              
              this.diocesesPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
            } else {
              // Same feature, just update position smoothly
              this.diocesesPopup.setLngLat(e.lngLat);
            }
          } else {
            // No features under cursor - hide popup with delay
            this.hideDiocesesPopupWithDelay();
          }
        };
        
        // Method to hide popup with delay (prevents flickering)
        const hideDiocesesPopupWithDelay = () => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
          }
          
          popupTimeout = setTimeout(() => {
            if (this.diocesesPopup) {
              this.diocesesPopup.remove();
            }
            currentHoveredFeature = null;
            map.getCanvas().style.cursor = '';
          }, 150); // Small delay to prevent flickering between polygons
        };
        
        // Bind events to both fill and border layers for better coverage
        const layers = ['irish-dioceses-fill', 'irish-dioceses-border'];
        
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            // Mouse move for smooth tracking
            map.on('mousemove', layerId, handleMouseMove);
            
            // Mouse leave with delay
            map.on('mouseleave', layerId, () => {
              hideDiocesesPopupWithDelay();
            });
          }
        });
        
        // Additional map-level mousemove to handle gaps between polygons
        map.on('mousemove', (e) => {
          if (currentHoveredFeature) {
            // Check if we're still over a diocese feature
            const features = map.queryRenderedFeatures(e.point, {
              layers: ['irish-dioceses-fill']
            });
            
            if (features.length === 0) {
              // Not over any diocese - hide popup
              hideDiocesesPopupWithDelay();
            }
          }
        });
        
        // Store the hide method for cleanup
        this.hideDiocesesPopupWithDelay = hideDiocesesPopupWithDelay;
        
        console.log('✅ Enhanced dioceses hover effects configured with province and administration display');
      },

      /**
       * Show/Hide methods for overlays with better visibility control
       */
      showIrishCounties() {
        if (!map || !this.countiesLayerLoaded) return;
        
        const style = this.getSetting('irishCountiesStyle');
        
        try {
          if (style === 'filled' || style === 'both') {
            map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          }
          
          if (style === 'borders' || style === 'both') {
            map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          }
          
          console.log('✅ Counties visibility updated:', style);
        } catch (error) {
          console.error('❌ Error showing counties:', error);
        }
      },

      hideIrishCounties() {
        if (!map || !this.countiesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          console.log('✅ Counties hidden');
        } catch (error) {
          console.error('❌ Error hiding counties:', error);
        }
      },

      showIrishDioceses() {
        if (!map || !this.diocesesLayerLoaded) return;
        
        const style = this.getSetting('irishDiocesesStyle');
        
        try {
          if (style === 'filled' || style === 'both') {
            map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          }
          
          if (style === 'borders' || style === 'both') {
            map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          }
          
          console.log('✅ Dioceses visibility updated:', style);
        } catch (error) {
          console.error('❌ Error showing dioceses:', error);
        }
      },

      hideIrishDioceses() {
        if (!map || !this.diocesesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          console.log('✅ Dioceses hidden');
        } catch (error) {
          console.error('❌ Error hiding dioceses:', error);
        }
      },

      /**
       * Update overlay styles with better error handling
       */
      updateCountiesStyle(style) {
        if (!map || !this.countiesLayerLoaded) return;
        
        try {
          // First hide all layers to ensure clean state
          map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          
          // Then show based on style preference
          switch (style) {
            case 'filled':
              map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
              break;
            case 'borders':
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
              break;
            case 'both':
              map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
              break;
            default:
              console.warn('⚠️ Unknown counties style:', style);
              // Default to borders if unknown style
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
          }
          
          console.log('✅ Counties style updated:', style);
        } catch (error) {
          console.error('❌ Error updating counties style:', error);
        }
      },

      updateDiocesesStyle(style) {
        if (!map || !this.diocesesLayerLoaded) return;
        
        try {
          // First hide all layers to ensure clean state
          map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          
          // Then show based on style preference
          switch (style) {
            case 'filled':
              map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
              break;
            case 'borders':
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
              break;
            case 'both':
              map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
              break;
            default:
              console.warn('⚠️ Unknown dioceses style:', style);
              // Default to borders if unknown style
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
          }
          
          console.log('✅ Dioceses style updated:', style);
        } catch (error) {
          console.error('❌ Error updating dioceses style:', error);
        }
      },

      /**
       * Update overlay opacity with better error handling
       */
      updateCountiesOpacity(opacity) {
        if (!map || !this.countiesLayerLoaded) return;
        
        // Validate opacity value
        const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.3));
        
        try {
          map.setPaintProperty('irish-counties-fill', 'fill-opacity', validOpacity);
          console.log('✅ Counties opacity updated:', validOpacity);
        } catch (error) {
          console.error('❌ Error updating counties opacity:', error);
        }
      },

      updateDiocesesOpacity(opacity) {
        if (!map || !this.diocesesLayerLoaded) return;
        
        // Validate opacity value
        const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.3));
        
        try {
          map.setPaintProperty('irish-dioceses-fill', 'fill-opacity', validOpacity);
          console.log('✅ Dioceses opacity updated:', validOpacity);
        } catch (error) {
          console.error('❌ Error updating dioceses opacity:', error);
        }
      },

      /**
       * Enhanced three-state toggle for Irish counties
       * States: borders -> filled -> off -> borders (cycles)
       */
      toggleIrishCounties() {
        const currentlyEnabled = this.getSetting('showIrishCounties');
        const currentStyle = this.getSetting('irishCountiesStyle');
        
        if (!currentlyEnabled) {
          // State 1: Turn on with borders
          this.setSetting('showIrishCounties', true);
          this.setSetting('irishCountiesStyle', 'borders');
          console.log('🏛️ Irish counties: BORDERS enabled');
          if (this.showToast) {
            this.showToast('🏛️ Counties: Borders only', 'info');
          }
        } else if (currentStyle === 'borders') {
          // State 2: Switch to filled
          this.setSetting('irishCountiesStyle', 'filled');
          console.log('🏛️ Irish counties: FILLED enabled');
          if (this.showToast) {
            this.showToast('🏛️ Counties: Filled areas', 'info');
          }
        } else {
          // State 3: Turn off completely
          this.setSetting('showIrishCounties', false);
          console.log('🏛️ Irish counties: DISABLED');
          if (this.showToast) {
            this.showToast('🏛️ Counties: Off', 'info');
          }
        }
      },

      /**
       * Enhanced three-state toggle for Irish dioceses
       * States: borders -> filled -> off -> borders (cycles)
       */
      toggleIrishDioceses() {
        const currentlyEnabled = this.getSetting('showIrishDioceses');
        const currentStyle = this.getSetting('irishDiocesesStyle');
        
        if (!currentlyEnabled) {
          // State 1: Turn on with borders
          this.setSetting('showIrishDioceses', true);
          this.setSetting('irishDiocesesStyle', 'borders');
          console.log('⛪ Irish dioceses: BORDERS enabled');
          if (this.showToast) {
            this.showToast('⛪ Dioceses: Borders only', 'info');
          }
        } else if (currentStyle === 'borders') {
          // State 2: Switch to filled
          this.setSetting('irishDiocesesStyle', 'filled');
          console.log('⛪ Irish dioceses: FILLED enabled');
          if (this.showToast) {
            this.showToast('⛪ Dioceses: Filled areas', 'info');
          }
        } else {
          // State 3: Turn off completely
          this.setSetting('showIrishDioceses', false);
          console.log('⛪ Irish dioceses: DISABLED');
          if (this.showToast) {
            this.showToast('⛪ Dioceses: Off', 'info');
          }
        }
      },

      /**
       * Show settings modal
       */
      showSettings() {
        if (!this.modalCreated) {
          this.createSettingsModal();
        }
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'flex';
          this.populateSettingsForm();
        }
      },

      /**
       * Close settings modal
       */
      closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      },

      /**
       * Create simplified settings modal
       */
      createSettingsModal() {
        if (this.modalCreated) return;

        const modalHTML = `
          <div id="settings-modal" class="settings-modal" style="display: none;">
            <div class="settings-modal-content">
              <div class="settings-header">
                <div class="settings-title-container">
                  <svg id="settingsLogo" width="32" height="32" viewBox="0 0 32 32" class="settings-pin-logo">
                    <g>
                      <path d="M 6 0 L 26 0 A 6 6 0 0 1 32 6 L 32 16 L 16 16 L 16 3 A 2 2 0 0 0 14 1 L 6 1 A 6 6 0 0 1 6 0" fill="#e11d48"/>
                      <path d="M 32 16 L 32 26 A 6 6 0 0 1 26 32 L 16 32 L 16 16" fill="#f59e0b"/>
                      <path d="M 16 32 L 6 32 A 6 6 0 0 1 0 26 L 0 16 L 16 16" fill="#10b981"/>
                      <path d="M 0 16 L 0 6 A 6 6 0 0 1 6 0 L 16 0 L 16 16" fill="#3b82f6"/>
                      <rect x="3" y="3" width="26" height="26" rx="2" fill="white"/>
                      <text x="16" y="25.4" text-anchor="middle" font-size="23.4" dominant-baseline="baseline" class="settings-pin-emoji">⚙️</text>
                    </g>
                  </svg>
                  <div class="settings-brand-text">
                    <span class="map">Map</span><span class="a">a</span><span class="list">List</span><span class="er">er</span>
                  </div>
                  <h2 class="settings-title">Settings</h2>
                </div>
                <button class="settings-close" onclick="SettingsManager.closeSettings()">&times;</button>
              </div>
              <div class="settings-body">
                <div class="settings-section">
                  <h3>📍 Map & Display</h3>
                  <div class="settings-row">
                    <div class="setting-item half-width">
                      <label for="distance-unit">Distance Units:</label>
                      <select id="distance-unit">
                        <option value="km">Kilometers (km)</option>
                        <option value="miles">Miles</option>
                      </select>
                    </div>
                    <div class="setting-item half-width">
                      <label for="map-style-setting">Map Style:</label>
                      <select id="map-style-setting">
                        <option value="mapbox/light-v11">Light</option>
                        <option value="mapbox/streets-v12">Streets</option>
                        <option value="mapbox/outdoors-v12">Outdoors</option>
                        <option value="mapbox/satellite-v9">Satellite</option>
                        <option value="mapbox/dark-v11">Dark</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="settings-section">
                  <h3>📱 Interface</h3>
                  <div class="settings-row">
                    <div class="setting-item half-width">
                      <label for="sidebar-position">Sidebar Position:</label>
                      <select id="sidebar-position">
                        <option value="hidden">Hidden</option>
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                      </select>
                    </div>
                    <div class="setting-item half-width">
                      <label><input type="checkbox" id="auto-center"> Auto-center map when data changes</label>
                    </div>
                  </div>
                </div>
                <div class="settings-section">
                  <h3>🗺️ Irish Overlays</h3>
                  <div class="settings-row">
                    <div class="setting-item half-width">
                      <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">🏛️ Irish Counties</h4>
                      <label><input type="checkbox" id="show-irish-counties"> Show county boundaries</label>
                      <div class="overlay-sub-setting counties-sub-setting">
                        <label for="counties-style">Style:</label>
                        <select id="counties-style">
                          <option value="borders">Borders</option>
                          <option value="filled">Filled</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div class="overlay-sub-setting counties-sub-setting">
                        <label for="counties-opacity">Opacity: <span id="counties-opacity-value">30%</span></label>
                        <input type="range" id="counties-opacity" min="0" max="1" step="0.1" value="0.3">
                      </div>
                    </div>
                    <div class="setting-item half-width">
                      <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">⛪ Irish Dioceses</h4>
                      <label><input type="checkbox" id="show-irish-dioceses"> Show diocese boundaries</label>
                      <div class="overlay-sub-setting dioceses-sub-setting">
                        <label for="dioceses-style">Style:</label>
                        <select id="dioceses-style">
                          <option value="borders">Borders</option>
                          <option value="filled">Filled</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div class="overlay-sub-setting dioceses-sub-setting">
                        <label for="dioceses-opacity">Opacity: <span id="dioceses-opacity-value">30%</span></label>
                        <input type="range" id="dioceses-opacity" min="0" max="1" step="0.1" value="0.3">
                      </div>
                    </div>
                  </div>
                  <div class="settings-note">
                    <p><strong>💡 Keyboard shortcuts:</strong> <code>C</code> Clear reference, <code>S</code> Settings, <code>T</code> Toggle sidebar, <code>O</code> Counties, <code>I</code> Dioceses</p>
                  </div>
                </div>
              </div>
              <div class="settings-footer">
                <button onclick="SettingsManager.resetSettings()" style="background: #ef4444; color: white; border-color: #dc2626;">Reset to Defaults</button>
                <button onclick="SettingsManager.closeSettings()" style="background: #3b82f6; color: white; border-color: #2563eb;">Close</button>
              </div>
            </div>
          </div>
        `;

        // Enhanced CSS
        const style = document.createElement('style');
        style.textContent = `
          .settings-modal { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; 
            justify-content: center; z-index: 1000; font-family: 'Outfit', sans-serif;
          }
          .settings-modal-content { 
            background: white; border-radius: 12px; max-width: 640px; width: 90%; 
            max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
          }
          .settings-header { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 20px; border-bottom: 2px solid #f1f5f9; 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
            border-radius: 12px 12px 0 0; 
          }
          .settings-title-container { display: flex; align-items: center; gap: 12px; }
          .settings-pin-logo { cursor: pointer; transition: transform 0.2s ease; flex-shrink: 0; }
          .settings-pin-logo:hover { transform: scale(1.05); }
          .settings-brand-text { 
            font-size: 1.2em; font-weight: 600; letter-spacing: -0.015em; 
            line-height: 1; display: flex; align-items: center; 
          }
          .settings-brand-text .map { color: #e11d48; } 
          .settings-brand-text .a { color: #f59e0b; } 
          .settings-brand-text .list { color: #3b82f6; }
          .settings-brand-text .er { color: #10b981; }
          .settings-title { margin: 0; color: #334155; font-size: 1.4em; font-weight: 600; }
          .settings-close { 
            background: none; border: none; font-size: 24px; cursor: pointer; 
            color: #666; width: 30px; height: 30px; display: flex; align-items: center; 
            justify-content: center; border-radius: 6px; 
          }
          .settings-close:hover { background: #f1f5f9; color: #dc2626; }
          .settings-body { padding: 20px; }
          .settings-section { margin-bottom: 20px; }
          .settings-section h3 { 
            margin: 0 0 15px 0; color: #475569; font-size: 16px; font-weight: 600; 
            border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;
          }
          .settings-row { display: flex; gap: 16px; margin-bottom: 12px; }
          .half-width { flex: 1; }
          .setting-item { margin-bottom: 12px; }
          .setting-item label { 
            display: block; margin-bottom: 6px; font-weight: 500; 
            color: #374151; font-size: 14px; 
          }
          .setting-item select, .setting-item input[type="range"] { 
            width: 100%; padding: 8px; border: 2px solid #e5e7eb; 
            border-radius: 6px; font-size: 14px; background: white; 
          }
          .setting-item input[type="checkbox"] { margin-right: 8px; }
          .overlay-sub-setting { 
            margin-left: 16px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 8px; 
          }
          .overlay-sub-setting.enabled { opacity: 1; }
          .counties-sub-setting, .dioceses-sub-setting { 
            margin-left: 16px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 8px; 
          }
          .counties-sub-setting.enabled, .dioceses-sub-setting.enabled { opacity: 1; }
          #counties-opacity-value, #dioceses-opacity-value { 
            font-weight: bold; color: #10b981; 
          }
          .settings-note { 
            background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; 
            padding: 12px; margin: 12px 0; font-size: 13px; 
          }
          .settings-note p { margin: 0 0 8px 0; color: #0369a1; }
          .settings-note code { 
            background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 3px; 
            padding: 2px 4px; font-size: 11px; font-family: monospace; 
          }
          .settings-footer { 
            padding: 16px 20px; border-top: 2px solid #f1f5f9; display: flex; 
            gap: 10px; justify-content: flex-end; background: #f8fafc; 
            border-radius: 0 0 12px 12px; 
          }
          .settings-footer button { 
            padding: 10px 16px; border: 2px solid; border-radius: 6px; 
            cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s ease;
          }
          .settings-footer button:hover { transform: translateY(-1px); }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindSettingsEvents();
        this.setupSettingsLogo();
        this.modalCreated = true;
      },

      /**
       * Setup settings logo interactions
       */
      setupSettingsLogo() {
        const settingsLogo = document.getElementById('settingsLogo');
        if (settingsLogo) {
          settingsLogo.addEventListener('click', () => {
            const pinEmoji = settingsLogo.querySelector('.settings-pin-emoji');
            if (pinEmoji) {
              // Animate the settings gear
              pinEmoji.style.animation = 'none';
              setTimeout(() => {
                pinEmoji.style.animation = 'spin 1s ease-in-out';
              }, 10);
            }
          });
        }
      },

      /**
       * Bind settings events
       */
      bindSettingsEvents() {
        // Select settings
        const selectSettings = {
          'distance-unit': 'distanceUnit',
          'map-style-setting': 'mapStyle',
          'sidebar-position': 'sidebarPosition',
          'counties-style': 'irishCountiesStyle',
          'dioceses-style': 'irishDiocesesStyle'
        };
        
        for (const id in selectSettings) {
          if (selectSettings.hasOwnProperty(id)) {
            const element = document.getElementById(id);
            const key = selectSettings[id];
            if (element) {
              element.addEventListener('change', (e) => {
                this.setSetting(key, e.target.value);
              });
            }
          }
        }

        // Checkbox settings
        const checkboxSettings = {
          'auto-center': 'autoCenter',
          'show-irish-counties': 'showIrishCounties',
          'show-irish-dioceses': 'showIrishDioceses'
        };
        
        for (const id in checkboxSettings) {
          if (checkboxSettings.hasOwnProperty(id)) {
            const element = document.getElementById(id);
            const key = checkboxSettings[id];
            if (element) {
              element.addEventListener('change', (e) => {
                this.setSetting(key, e.target.checked);
                
                // Toggle sub-settings
                if (id === 'show-irish-counties') {
                  this.toggleCountiesSubSettings(e.target.checked);
                }
                if (id === 'show-irish-dioceses') {
                  this.toggleDiocesesSubSettings(e.target.checked);
                }
              });
            }
          }
        }

        // Counties opacity slider
        const countiesOpacitySlider = document.getElementById('counties-opacity');
        if (countiesOpacitySlider) {
          countiesOpacitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('counties-opacity-value');
            if (valueDisplay) {
              valueDisplay.textContent = Math.round(value * 100) + '%';
            }
            this.setSetting('irishCountiesOpacity', value);
          });
        }

        // Dioceses opacity slider
        const diocesesOpacitySlider = document.getElementById('dioceses-opacity');
        if (diocesesOpacitySlider) {
          diocesesOpacitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('dioceses-opacity-value');
            if (valueDisplay) {
              valueDisplay.textContent = Math.round(value * 100) + '%';
            }
            this.setSetting('irishDiocesesOpacity', value);
          });
        }
      },

      /**
       * Toggle counties sub-settings visibility
       */
      toggleCountiesSubSettings(enabled) {
        const subSettings = document.querySelectorAll('.counties-sub-setting');
        subSettings.forEach(setting => {
          if (enabled) {
            setting.classList.add('enabled');
          } else {
            setting.classList.remove('enabled');
          }
        });
      },

      /**
       * Toggle dioceses sub-settings visibility
       */
      toggleDiocesesSubSettings(enabled) {
        const subSettings = document.querySelectorAll('.dioceses-sub-setting');
        subSettings.forEach(setting => {
          if (enabled) {
            setting.classList.add('enabled');
          } else {
            setting.classList.remove('enabled');
          }
        });
      },

      /**
       * Populate settings form with current values
       */
      populateSettingsForm() {
        // Standard settings
        const distanceUnit = document.getElementById('distance-unit');
        const mapStyle = document.getElementById('map-style-setting');
        const sidebarPosition = document.getElementById('sidebar-position');
        
        if (distanceUnit) distanceUnit.value = this.getSetting('distanceUnit');
        if (mapStyle) mapStyle.value = this.getSetting('mapStyle');
        if (sidebarPosition) sidebarPosition.value = this.getSetting('sidebarPosition');
        
        const autoCenter = document.getElementById('auto-center');
        if (autoCenter) autoCenter.checked = this.getSetting('autoCenter');

        // Counties settings
        const showCounties = document.getElementById('show-irish-counties');
        const countiesStyle = document.getElementById('counties-style');
        const countiesOpacity = document.getElementById('counties-opacity');
        const countiesOpacityValue = document.getElementById('counties-opacity-value');

        if (showCounties) {
          showCounties.checked = this.getSetting('showIrishCounties');
          this.toggleCountiesSubSettings(showCounties.checked);
        }
        if (countiesStyle) countiesStyle.value = this.getSetting('irishCountiesStyle');
        if (countiesOpacity) {
          const opacity = this.getSetting('irishCountiesOpacity');
          countiesOpacity.value = opacity;
          if (countiesOpacityValue) countiesOpacityValue.textContent = Math.round(opacity * 100) + '%';
        }

        // Dioceses settings
        const showDioceses = document.getElementById('show-irish-dioceses');
        const diocesesStyle = document.getElementById('dioceses-style');
        const diocesesOpacity = document.getElementById('dioceses-opacity');
        const diocesesOpacityValue = document.getElementById('dioceses-opacity-value');

        if (showDioceses) {
          showDioceses.checked = this.getSetting('showIrishDioceses');
          this.toggleDiocesesSubSettings(showDioceses.checked);
        }
        if (diocesesStyle) diocesesStyle.value = this.getSetting('irishDiocesesStyle');
        if (diocesesOpacity) {
          const opacity = this.getSetting('irishDiocesesOpacity');
          diocesesOpacity.value = opacity;
          if (diocesesOpacityValue) diocesesOpacityValue.textContent = Math.round(opacity * 100) + '%';
        }
      },

      /**
       * Reset settings to defaults
       */
      resetSettings() {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
          this.settings = Object.assign({}, this.defaultSettings);
          this.saveSettings();
          this.notifyCallbacks();
          
          // Apply sidebar position after reset
          this.applySidebarPosition();
          
          // Repopulate form
          this.populateSettingsForm();
          
          // Show confirmation
          this.showToast('Settings reset to defaults', 'success');
          
          console.log('✅ Settings reset to defaults');
        }
      },

      /**
       * Show toast notification
       */
      showToast(message, type = 'info') {
        const colors = {
          success: '#22c55e',
          info: '#3b82f6',
          warning: '#f59e0b',
          error: '#ef4444'
        };
        
        const toast = document.createElement('div');
        toast.innerHTML = message;
        toast.style.cssText = `
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
          animation: slideInRight 0.3s ease-out;
        `;
        
        // Add slide animation if not already added
        if (!document.getElementById('toast-animations')) {
          const slideStyle = document.createElement('style');
          slideStyle.id = 'toast-animations';
          slideStyle.textContent = `
            @keyframes slideInRight {
              0% { transform: translateX(100%); opacity: 0; }
              100% { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
              0% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(100%); opacity: 0; }
            }
          `;
          document.head.appendChild(slideStyle);
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }
        }, 3000);
      },

      /**
       * Overlay management shortcuts for easy access
       */
      showOverlayHelp() {
        if (this.showToast) {
          this.showToast(`
            🗺️ Irish Overlays Available:
            • Counties: Administrative boundaries
            • Dioceses: Religious boundaries  
            • Toggle in Settings (S key)
          `, 'info');
        }
      },

      /**
       * Add settings change listener
       */
      onSettingsChange(callback) {
        this.callbacks.add(callback);
      },

      /**
       * Notify all callbacks
       */
      notifyCallbacks() {
        this.callbacks.forEach(callback => {
          try {
            callback(this.settings);
          } catch (error) {
            console.error('Settings callback error:', error);
          }
        });
      },

      /**
       * Initialize overlays on map load - improved timing
       */
      initializeOverlays() {
        if (!map) {
          console.warn('⚠️ Cannot initialize overlays - no map available');
          return;
        }
        
        // Wait for map to be fully loaded
        if (!map.isStyleLoaded()) {
          console.log('⏳ Waiting for map style to load before initializing overlays...');
          map.once('styledata', () => {
            if (map.isStyleLoaded()) {
              this.initializeOverlays();
            }
          });
          return;
        }
        
        console.log('🗺️ Initializing overlays...');
        
        this.addDiocesesPopupCSS();
        this.addCountiesPopupCSS();
        
        // Setup the style change listener first
        this.setupMapStyleListener();
        
        // Check user settings and load overlays with proper delays
        const countiesEnabled = this.getSetting('showIrishCounties');
        const diocesesEnabled = this.getSetting('showIrishDioceses');
        
        console.log(`📋 Overlay settings: Counties=${countiesEnabled}, Dioceses=${diocesesEnabled}`);
        
        // Load counties overlay if enabled
        if (countiesEnabled) {
          console.log('🏛️ Auto-loading Irish counties...');
          setTimeout(() => {
            this.loadIrishCounties().then(() => {
              console.log('✅ Counties auto-load completed');
            }).catch((error) => {
              console.error('❌ Counties auto-load failed:', error);
            });
          }, 1000);
        }
        
        // Load dioceses overlay if enabled (with longer delay)
        if (diocesesEnabled) {
          console.log('⛪ Auto-loading Irish dioceses...');
          setTimeout(() => {
            this.loadIrishDioceses().then(() => {
              console.log('✅ Dioceses auto-load completed');
            }).catch((error) => {
              console.error('❌ Dioceses auto-load failed:', error);
            });
          }, 1200);
        }
        
        // Show initialization complete message
        const overlaysToLoad = (countiesEnabled ? 1 : 0) + (diocesesEnabled ? 1 : 0);
        if (overlaysToLoad > 0) {
          console.log(`✅ Overlay initialization complete - loading ${overlaysToLoad} overlay(s)`);
          
          // Show user feedback after all overlays should be loaded
          setTimeout(() => {
            if (this.showToast) {
              const message = overlaysToLoad === 1 ? 
                '🗺️ Overlay loaded' : 
                '🗺️ Overlays loaded';
              this.showToast(message, 'success');
            }
          }, 2000);
        } else {
          console.log('✅ Overlay initialization complete - no overlays enabled');
        }
      },

      /**
       * Hook into dataset changes to handle auto-center
       */
      onDatasetChange() {
        if (this.getSetting('autoCenter')) {
          setTimeout(() => {
            this.centerMapOnData();
          }, 500); // Small delay to let dataset changes settle
        }
      }
    };

    // Export SettingsManager to window
    window.SettingsManager = SettingsManager;

    // Dispatch event to indicate SettingsManager is ready
    window.dispatchEvent(new CustomEvent('mapalister:settingsReady'));

    console.log('✅ SettingsManager loaded and exported to window');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSettingsManager();
  }

})();