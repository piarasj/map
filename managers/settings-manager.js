/**
 * =====================================================
 * FILE: managers/settings-manager.js (CORE LOGIC)
 * PURPOSE: Core settings management without UI dependencies
 * DEPENDENCIES: DataConfig, DistanceUtils
 * EXPORTS: SettingsManager (core functionality)
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('⚙️ Loading settings-manager.js (core)...');

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
     * CORE SETTINGS MANAGER - NO DOM DEPENDENCIES
     * Pure settings logic and data management
     */
    const SettingsManager = {

      defaultSettings: {
        distanceUnit: 'km',
        mapStyle: 'mapbox/light-v11',
        autoCenter: true,
        sidebarPosition: 'hidden',
        
        // Irish overlay settings
        showIrishCounties: false,
        irishCountiesOpacity: 0.1,
        irishCountiesStyle: 'filled',
        irishCountiesSource: 'data/counties-coloured.geojson',
        
        showIrishDioceses: false,
        irishDiocesesOpacity: 0.5,
        irishDiocesesStyle: 'filled',
        irishDiocesesSource: 'data/dioceses-coloured.geojson'
      },

      // Static application configuration
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

      // Data configuration for uploaded files
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

      settings: {},
      callbacks: new Set(),
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
            window.SidebarManager.onDatasetChange?.();
          }
        });
        
        console.log('✅ Core Settings Manager initialized');
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

      /**
       * Set a setting value
       */
      setSetting(key, value) {
        if (this.settings[key] !== value) {
          this.settings[key] = value;
          this.saveSettings();
          this.notifyCallbacks();
          
          // Handle distance unit changes
          if (key === 'distanceUnit') {
            console.log(`📏 Distance unit changed to: ${value}`);
            
            if (window.DistanceUtils) {
              window.DistanceUtils.setUnit(value);
            }
            
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
        
        // Remove existing position classes
        sidebar.classList.remove('sidebar-left', 'sidebar-right', 'sidebar-hidden');
        
        // Apply position class
        if (position === 'right') {
          sidebar.classList.add('sidebar-right');
          sidebar.style.display = 'flex';
          sidebar.style.visibility = 'visible';
        } else if (position === 'left') {
          sidebar.classList.add('sidebar-left');
          sidebar.style.display = 'flex';
          sidebar.style.visibility = 'visible';
        } else {
          sidebar.classList.add('sidebar-hidden');
          sidebar.style.display = 'none';
          sidebar.style.visibility = 'hidden';
        }
        
        this.addSidebarPositionCSS();
        
        // Trigger map resize
        if (typeof map !== 'undefined' && map && map.resize) {
          setTimeout(() => {
            map.resize();
          }, 300);
        }
        
        console.log(`✅ Sidebar positioned: ${position}`);
      },

      /**
       * Enhanced CSS for sidebar positioning
       */
      addSidebarPositionCSS() {
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
          
          .sidebar-hidden {
            display: none !important;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
          
          @media (min-width: 768px) {
            .sidebar-left ~ #map {
              margin-left: 320px;
              margin-right: 0;
            }
            
            .sidebar-right ~ #map {
              margin-right: 320px;
              margin-left: 0;
            }
            
            .sidebar-hidden ~ #map {
              margin-left: 0;
              margin-right: 0;
            }
          }
          
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
          
          .sidebar {
            transition: all 0.3s ease;
          }
          
          #map {
            transition: margin 0.3s ease;
          }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Sidebar positioning CSS added');
      },

      /**
       * Three-state sidebar cycling
       */
      cycleSidebarThrough3States() {
        const current = this.getSetting('sidebarPosition') || 'hidden';
        let next = '';
        
        if (current === 'hidden') {
          next = 'left';
        } else if (current === 'left') {
          next = 'right';
        } else {
          next = 'hidden';
        }
        
        this.setSetting('sidebarPosition', next);
        
        if (this.showToast) {
          const messages = {
            left: 'Sidebar: Left',
            right: 'Sidebar: Right',
            hidden: 'Sidebar: Hidden'
          };
          this.showToast(messages[next], 'info');
        }
        
        console.log(`🔄 Sidebar cycled: ${current} → ${next}`);
        return next;
      },

      /**
       * Helper method for file upload integration
       */
      showSidebarAfterDataUpload() {
        this.setSetting('sidebarPosition', 'right');
        
        if (this.showToast) {
          this.showToast('Data loaded - sidebar ready!', 'success');
        }
        
        console.log('📁 Sidebar shown after data upload');
      },

      /**
       * DOM-free toast notification
       */
      showToast(message, type = 'info') {
        console.log(`🔔 Toast: ${message} (${type})`);
        
        // Delegate to UI if available
        if (window.SettingsModal && window.SettingsModal.showToast) {
          window.SettingsModal.showToast(message, type);
          return;
        }
        
        // Fallback - dispatch event for other systems to handle
        window.dispatchEvent(new CustomEvent('mapalister:toast', {
          detail: { message, type }
        }));
      },

      /**
       * Reset settings to defaults
       */
      resetSettings() {
        this.settings = Object.assign({}, this.defaultSettings);
        this.saveSettings();
        this.notifyCallbacks();
        this.applySidebarPosition();
        
        this.showToast('Settings reset to defaults', 'success');
        console.log('✅ Settings reset to defaults');
      },

      /**
       * Handle overlay setting changes (delegates to overlays)
       */
      handleOverlaySettingChange(key, value) {
        if (window.SettingsOverlays) {
          window.SettingsOverlays.handleOverlaySettingChange(key, value);
        }
      },

      /**
       * Handle auto-center functionality
       */
      handleAutoCenterChange(enabled) {
        if (enabled && typeof geojsonData !== 'undefined' && geojsonData && typeof map !== 'undefined' && map) {
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
       * Color management
       */
      generateColorMapping(groupingValues) {
        const colors = this.staticConfig.defaultColors;
        const colorMap = {};
        
        groupingValues.forEach((value, index) => {
          colorMap[value] = colors[index % colors.length];
        });
        
        return colorMap;
      },

      /**
       * Get static config
       */
      getStaticConfig() {
        return { ...this.staticConfig };
      },

      /**
       * Get data config
       */
      getDataConfig() {
        return this.dataConfig.getCurrent();
      },

      /**
       * Get color mapping
       */
      getColorMapping() {
        const config = this.dataConfig.getCurrent();
        return this.generateColorMapping(config.defaultGroupingValues);
      },

      /**
       * Enhanced three-state toggles for overlays
       */
      toggleIrishCounties() {
        const currentlyEnabled = this.getSetting('showIrishCounties');
        const currentStyle = this.getSetting('irishCountiesStyle');
        
        if (!currentlyEnabled) {
          this.setSetting('showIrishCounties', true);
          this.setSetting('irishCountiesStyle', 'borders');
          this.showToast('Counties: Borders only', 'info');
        } else if (currentStyle === 'borders') {
          this.setSetting('irishCountiesStyle', 'filled');
          this.showToast('Counties: Filled areas', 'info');
        } else {
          this.setSetting('showIrishCounties', false);
          this.showToast('Counties: Off', 'info');
        }
      },

      toggleIrishDioceses() {
        const currentlyEnabled = this.getSetting('showIrishDioceses');
        const currentStyle = this.getSetting('irishDiocesesStyle');
        
        if (!currentlyEnabled) {
          this.setSetting('showIrishDioceses', true);
          this.setSetting('irishDiocesesStyle', 'borders');
          this.showToast('Dioceses: Borders only', 'info');
        } else if (currentStyle === 'borders') {
          this.setSetting('irishDiocesesStyle', 'filled');
          this.showToast('Dioceses: Filled areas', 'info');
        } else {
          this.setSetting('showIrishDioceses', false);
          this.showToast('Dioceses: Off', 'info');
        }
      },

      /**
       * Hook into dataset changes
       */
      onDatasetChange() {
        if (this.getSetting('autoCenter')) {
          setTimeout(() => {
            this.centerMapOnData();
          }, 500);
        }
      },

      /**
       * Create settings modal with proper inline styles
       */
      createSettingsModal() {
        console.log('🔧 Creating settings modal...');
        
        if (this.modalCreated) {
          console.log('🔧 Modal already created');
          return;
        }

        try {
          // Remove any existing modal first
          const existingModal = document.getElementById('settings-modal');
          if (existingModal) {
            existingModal.remove();
          }

          // Create working modal HTML with inline styles
          const modalHTML = `
            <div id="settings-modal" class="settings-modal" style="
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: rgba(0, 0, 0, 0.6) !important;
              display: none !important;
              align-items: center !important;
              justify-content: center !important;
              z-index: 999999 !important;
              font-family: 'Outfit', sans-serif !important;
            ">
              <div class="settings-modal-content" style="
                background: white !important;
                border-radius: 12px !important;
                max-width: 650px !important;
                width: 90% !important;
                max-height: 85vh !important;
                overflow-y: auto !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
                animation: modalSlideIn 0.3s ease-out !important;
              ">
                <div class="settings-header" style="
                  display: flex !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                  padding: 20px !important;
                  border-bottom: 2px solid #f1f5f9 !important;
                  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%) !important;
                  border-radius: 12px 12px 0 0 !important;
                ">
                  <h2 style="margin: 0 !important; color: #334155 !important; font-size: 1.4em !important; font-weight: 600 !important;">⚙️ MapaLister Settings</h2>
                  <button id="close-settings-btn" style="
                    background: none !important;
                    border: none !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    color: #666 !important;
                    width: 30px !important;
                    height: 30px !important;
                    border-radius: 6px !important;
                    transition: all 0.2s !important;
                  ">×</button>
                </div>
                
                <div class="settings-body" style="padding: 20px !important;">
                  
                  <!-- Map & Display Section -->
                  <div style="margin-bottom: 24px !important;">
                    <h3 style="margin: 0 0 12px 0 !important; color: #475569 !important; font-size: 16px !important; font-weight: 600 !important; border-bottom: 1px solid #e2e8f0 !important; padding-bottom: 6px !important;">
                      📍 Map & Display
                    </h3>
                    
                    <div style="display: flex !important; gap: 16px !important; margin-bottom: 12px !important;">
                      <div style="flex: 1 !important;">
                        <label style="display: block !important; margin-bottom: 6px !important; font-weight: 500 !important; color: #374151 !important; font-size: 14px !important;">
                          Distance Units:
                        </label>
                        <select id="distance-unit" style="width: 100% !important; padding: 8px !important; border: 2px solid #e5e7eb !important; border-radius: 6px !important; font-size: 14px !important;">
                          <option value="km">Kilometers (km)</option>
                          <option value="miles">Miles</option>
                        </select>
                      </div>
                      
                      <div style="flex: 1 !important;">
                        <label style="display: block !important; margin-bottom: 6px !important; font-weight: 500 !important; color: #374151 !important; font-size: 14px !important;">
                          Map Style:
                        </label>
                        <select id="map-style-setting" style="width: 100% !important; padding: 8px !important; border: 2px solid #e5e7eb !important; border-radius: 6px !important; font-size: 14px !important;">
                          <option value="mapbox/light-v11">Light</option>
                          <option value="mapbox/streets-v12">Streets</option>
                          <option value="mapbox/outdoors-v12">Outdoors</option>
                          <option value="mapbox/satellite-v9">Satellite</option>
                          <option value="mapbox/dark-v11">Dark</option>
                        </select>
                      </div>
                    </div>
                    
                    <label style="display: flex !important; align-items: center !important; margin-bottom: 12px !important; font-size: 14px !important;">
                      <input type="checkbox" id="auto-center" style="margin-right: 8px !important; transform: scale(1.1) !important;">
                      Auto-center map when data changes
                    </label>
                  </div>
                  
                  <!-- Interface Section -->
                  <div style="margin-bottom: 24px !important;">
                    <h3 style="margin: 0 0 12px 0 !important; color: #475569 !important; font-size: 16px !important; font-weight: 600 !important; border-bottom: 1px solid #e2e8f0 !important; padding-bottom: 6px !important;">
                      📱 Interface
                    </h3>
                    
                    <div style="margin-bottom: 12px !important;">
                      <label style="display: block !important; margin-bottom: 6px !important; font-weight: 500 !important; color: #374151 !important; font-size: 14px !important;">
                        Sidebar Position:
                      </label>
                      <select id="sidebar-position" style="width: 100% !important; padding: 8px !important; border: 2px solid #e5e7eb !important; border-radius: 6px !important; font-size: 14px !important;">
                        <option value="hidden">Hidden</option>
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                      </select>
                    </div>
                  </div>
                  
                  <!-- Irish Overlays Section -->
                  <div style="margin-bottom: 24px !important;">
                    <h3 style="margin: 0 0 12px 0 !important; color: #475569 !important; font-size: 16px !important; font-weight: 600 !important; border-bottom: 1px solid #e2e8f0 !important; padding-bottom: 6px !important;">
                      🗺️ Irish Overlays
                    </h3>
                    
                    <div style="display: flex !important; gap: 20px !important; margin-bottom: 16px !important;">
                      <div style="flex: 1 !important;">
                        <h4 style="margin: 0 0 8px 0 !important; color: #64748b !important; font-size: 14px !important; font-weight: 600 !important;">🏛️ Irish Counties</h4>
                        <label style="display: flex !important; align-items: center !important; margin-bottom: 8px !important; font-size: 14px !important;">
                          <input type="checkbox" id="show-irish-counties" style="margin-right: 8px !important; transform: scale(1.1) !important;">
                          Show county boundaries
                        </label>
                        
                        <div id="counties-sub-settings" style="margin-left: 16px !important; opacity: 0.6 !important; transition: opacity 0.3s !important;">
                          <div style="margin-bottom: 8px !important;">
                            <label style="display: block !important; margin-bottom: 4px !important; font-size: 13px !important; color: #64748b !important;">Style:</label>
                            <select id="counties-style" style="width: 100% !important; padding: 6px !important; border: 1px solid #d1d5db !important; border-radius: 4px !important; font-size: 13px !important;">
                              <option value="borders">Borders</option>
                              <option value="filled">Filled</option>
                              <option value="both">Both</option>
                            </select>
                          </div>
                          <div>
                            <label style="display: block !important; margin-bottom: 4px !important; font-size: 13px !important; color: #64748b !important;">
                              Opacity: <span id="counties-opacity-value" style="font-weight: bold !important; color: #10b981 !important;">30%</span>
                            </label>
                            <input type="range" id="counties-opacity" min="0" max="1" step="0.1" value="0.3" style="width: 100% !important;">
                          </div>
                        </div>
                      </div>
                      
                      <div style="flex: 1 !important;">
                        <h4 style="margin: 0 0 8px 0 !important; color: #64748b !important; font-size: 14px !important; font-weight: 600 !important;">⛪ Irish Dioceses</h4>
                        <label style="display: flex !important; align-items: center !important; margin-bottom: 8px !important; font-size: 14px !important;">
                          <input type="checkbox" id="show-irish-dioceses" style="margin-right: 8px !important; transform: scale(1.1) !important;">
                          Show diocese boundaries
                        </label>
                        
                        <div id="dioceses-sub-settings" style="margin-left: 16px !important; opacity: 0.6 !important; transition: opacity 0.3s !important;">
                          <div style="margin-bottom: 8px !important;">
                            <label style="display: block !important; margin-bottom: 4px !important; font-size: 13px !important; color: #64748b !important;">Style:</label>
                            <select id="dioceses-style" style="width: 100% !important; padding: 6px !important; border: 1px solid #d1d5db !important; border-radius: 4px !important; font-size: 13px !important;">
                              <option value="borders">Borders</option>
                              <option value="filled">Filled</option>
                              <option value="both">Both</option>
                            </select>
                          </div>
                          <div>
                            <label style="display: block !important; margin-bottom: 4px !important; font-size: 13px !important; color: #64748b !important;">
                              Opacity: <span id="dioceses-opacity-value" style="font-weight: bold !important; color: #10b981 !important;">50%</span>
                            </label>
                            <input type="range" id="dioceses-opacity" min="0" max="1" step="0.1" value="0.5" style="width: 100% !important;">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Keyboard Shortcuts -->
                  <div style="margin-bottom: 16px !important;">
                    <h3 style="margin: 0 0 12px 0 !important; color: #475569 !important; font-size: 16px !important; font-weight: 600 !important; border-bottom: 1px solid #e2e8f0 !important; padding-bottom: 6px !important;">
                      ⌨️ Keyboard Shortcuts
                    </h3>
                    
                    <div style="background: #f8fafc !important; padding: 12px !important; border-radius: 6px !important; font-size: 13px !important;">
                      <div style="display: grid !important; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important; gap: 8px !important;">
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">S</kbd>
                          <span>Settings</span>
                        </div>
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">C</kbd>
                          <span>Clear reference</span>
                        </div>
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">T</kbd>
                          <span>Toggle sidebar</span>
                        </div>
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">O</kbd>
                          <span>Toggle counties</span>
                        </div>
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">I</kbd>
                          <span>Toggle dioceses</span>
                        </div>
                        <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                          <kbd style="background: #374151 !important; color: white !important; padding: 2px 6px !important; border-radius: 3px !important; font-size: 11px !important; min-width: 20px !important; text-align: center !important;">F</kbd>
                          <span>Upload file</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                <div class="settings-footer" style="
                  padding: 16px 20px !important;
                  border-top: 2px solid #f1f5f9 !important;
                  display: flex !important;
                  gap: 10px !important;
                  justify-content: flex-end !important;
                  background: #f8fafc !important;
                  border-radius: 0 0 12px 12px !important;
                ">
                  <button id="reset-settings-btn" style="
                    padding: 10px 16px !important;
                    background: #ef4444 !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-weight: 500 !important;
                    font-size: 14px !important;
                    transition: all 0.2s !important;
                  ">Reset to Defaults</button>
                  <button id="close-settings-footer-btn" style="
                    padding: 10px 16px !important;
                    background: #3b82f6 !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-weight: 500 !important;
                    font-size: 14px !important;
                    transition: all 0.2s !important;
                  ">Close</button>
                </div>
              </div>
            </div>
          `;

          // Add animation CSS if not exists
          if (!document.getElementById('modal-animation-css')) {
            const animationCSS = document.createElement('style');
            animationCSS.id = 'modal-animation-css';
            animationCSS.textContent = `
              @keyframes modalSlideIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `;
            document.head.appendChild(animationCSS);
          }

          // Insert modal HTML
          document.body.insertAdjacentHTML('beforeend', modalHTML);
          console.log('✅ Modal HTML added');

          // Bind events for the modal
          this.bindSettingsEvents();
          
          // Mark as created
          this.modalCreated = true;
          console.log('✅ Modal creation complete');

        } catch (error) {
          console.error('❌ Error during modal creation:', error);
          throw error;
        }
      },

      /**
       * Bind events for settings modal
       */
      bindSettingsEvents() {
        console.log('🔧 Binding settings events...');
        
        try {
          // Close button events
          const closeBtn = document.getElementById('close-settings-btn');
          const closeFooterBtn = document.getElementById('close-settings-footer-btn');
          const resetBtn = document.getElementById('reset-settings-btn');
          
          if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSettings());
          }
          if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.closeSettings());
          }
          if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
          }

          // Distance unit change
          const distanceUnit = document.getElementById('distance-unit');
          if (distanceUnit) {
            distanceUnit.addEventListener('change', (e) => {
              this.setSetting('distanceUnit', e.target.value);
              console.log('✅ Distance unit changed to:', e.target.value);
            });
          }

          // Map style change
          const mapStyle = document.getElementById('map-style-setting');
          if (mapStyle) {
            mapStyle.addEventListener('change', (e) => {
              this.setSetting('mapStyle', e.target.value);
              console.log('✅ Map style changed to:', e.target.value);
            });
          }

          // Sidebar position change
          const sidebarPosition = document.getElementById('sidebar-position');
          if (sidebarPosition) {
            sidebarPosition.addEventListener('change', (e) => {
              this.setSetting('sidebarPosition', e.target.value);
              console.log('✅ Sidebar position changed to:', e.target.value);
            });
          }

          // Auto center change
          const autoCenter = document.getElementById('auto-center');
          if (autoCenter) {
            autoCenter.addEventListener('change', (e) => {
              this.setSetting('autoCenter', e.target.checked);
              console.log('✅ Auto center changed to:', e.target.checked);
            });
          }

          // Irish Counties checkbox
          const showCounties = document.getElementById('show-irish-counties');
          if (showCounties) {
            showCounties.addEventListener('change', (e) => {
              this.setSetting('showIrishCounties', e.target.checked);
              this.toggleCountiesSubSettings(e.target.checked);
              console.log('✅ Show counties changed to:', e.target.checked);
            });
          }

          // Counties style
          const countiesStyle = document.getElementById('counties-style');
          if (countiesStyle) {
            countiesStyle.addEventListener('change', (e) => {
              this.setSetting('irishCountiesStyle', e.target.value);
              console.log('✅ Counties style changed to:', e.target.value);
            });
          }

          // Counties opacity
          const countiesOpacity = document.getElementById('counties-opacity');
          const countiesOpacityValue = document.getElementById('counties-opacity-value');
          if (countiesOpacity && countiesOpacityValue) {
            countiesOpacity.addEventListener('input', (e) => {
              const value = parseFloat(e.target.value);
              countiesOpacityValue.textContent = Math.round(value * 100) + '%';
              this.setSetting('irishCountiesOpacity', value);
              console.log('✅ Counties opacity changed to:', value);
            });
          }

          // Irish Dioceses checkbox
          const showDioceses = document.getElementById('show-irish-dioceses');
          if (showDioceses) {
            showDioceses.addEventListener('change', (e) => {
              this.setSetting('showIrishDioceses', e.target.checked);
              this.toggleDiocesesSubSettings(e.target.checked);
              console.log('✅ Show dioceses changed to:', e.target.checked);
            });
          }

          // Dioceses style
          const diocesesStyle = document.getElementById('dioceses-style');
          if (diocesesStyle) {
            diocesesStyle.addEventListener('change', (e) => {
              this.setSetting('irishDiocesesStyle', e.target.value);
              console.log('✅ Dioceses style changed to:', e.target.value);
            });
          }

          // Dioceses opacity
          const diocesesOpacity = document.getElementById('dioceses-opacity');
          const diocesesOpacityValue = document.getElementById('dioceses-opacity-value');
          if (diocesesOpacity && diocesesOpacityValue) {
            diocesesOpacity.addEventListener('input', (e) => {
              const value = parseFloat(e.target.value);
              diocesesOpacityValue.textContent = Math.round(value * 100) + '%';
              this.setSetting('irishDiocesesOpacity', value);
              console.log('✅ Dioceses opacity changed to:', value);
            });
          }

          console.log('✅ All settings events bound successfully');
          
        } catch (error) {
          console.warn('⚠️ Error binding events:', error);
        }
      },

      /**
       * Show settings modal (FIXED VERSION)
       */
      showSettings() {
        console.log('🔧 showSettings called');
        
        if (!this.modalCreated) {
          this.createSettingsModal();
        }
        
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'flex';
          this.populateSettingsForm();
          console.log('✅ Modal displayed');
        } else {
          console.error('❌ Modal not found');
        }
      },

      /**
       * Close settings modal
       */
      closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'none';
          console.log('✅ Modal closed');
        }
      },

      /**
       * Populate settings form with current values
       */
      populateSettingsForm() {
        console.log('🔧 Populating form...');
        
        try {
          // Populate basic settings
          const distanceUnit = document.getElementById('distance-unit');
          const mapStyle = document.getElementById('map-style-setting');
          const sidebarPosition = document.getElementById('sidebar-position');
          const autoCenter = document.getElementById('auto-center');
          
          if (distanceUnit) distanceUnit.value = this.getSetting('distanceUnit') || 'km';
          if (mapStyle) mapStyle.value = this.getSetting('mapStyle') || 'mapbox/light-v11';
          if (sidebarPosition) sidebarPosition.value = this.getSetting('sidebarPosition') || 'hidden';
          if (autoCenter) autoCenter.checked = this.getSetting('autoCenter') || false;
          
          // Populate Irish overlays
          const showCounties = document.getElementById('show-irish-counties');
          const countiesStyle = document.getElementById('counties-style');
          const countiesOpacity = document.getElementById('counties-opacity');
          const countiesOpacityValue = document.getElementById('counties-opacity-value');
          
          if (showCounties) {
            showCounties.checked = this.getSetting('showIrishCounties') || false;
            this.toggleCountiesSubSettings(showCounties.checked);
          }
          if (countiesStyle) countiesStyle.value = this.getSetting('irishCountiesStyle') || 'filled';
          if (countiesOpacity && countiesOpacityValue) {
            const opacity = this.getSetting('irishCountiesOpacity') || 0.3;
            countiesOpacity.value = opacity;
            countiesOpacityValue.textContent = Math.round(opacity * 100) + '%';
          }
          
          const showDioceses = document.getElementById('show-irish-dioceses');
          const diocesesStyle = document.getElementById('dioceses-style');
          const diocesesOpacity = document.getElementById('dioceses-opacity');
          const diocesesOpacityValue = document.getElementById('dioceses-opacity-value');
          
          if (showDioceses) {
            showDioceses.checked = this.getSetting('showIrishDioceses') || false;
            this.toggleDiocesesSubSettings(showDioceses.checked);
          }
          if (diocesesStyle) diocesesStyle.value = this.getSetting('irishDiocesesStyle') || 'filled';
          if (diocesesOpacity && diocesesOpacityValue) {
            const opacity = this.getSetting('irishDiocesesOpacity') || 0.5;
            diocesesOpacity.value = opacity;
            diocesesOpacityValue.textContent = Math.round(opacity * 100) + '%';
          }
          
          console.log('✅ Form populated');
        } catch (error) {
          console.warn('⚠️ Error populating form:', error);
        }
      },

      /**
       * Toggle counties sub-settings visibility
       */
      toggleCountiesSubSettings(enabled) {
        const subSettings = document.getElementById('counties-sub-settings');
        if (subSettings) {
          subSettings.style.opacity = enabled ? '1' : '0.6';
        }
      },

      /**
       * Toggle dioceses sub-settings visibility
       */
      toggleDiocesesSubSettings(enabled) {
        const subSettings = document.getElementById('dioceses-sub-settings');
        if (subSettings) {
          subSettings.style.opacity = enabled ? '1' : '0.6';
        }
      }

    }; // END OF SettingsManager object

    // Export SettingsManager to window
    window.SettingsManager = SettingsManager;

    // Dispatch event to indicate SettingsManager is ready
    window.dispatchEvent(new CustomEvent('mapalister:settingsReady'));

    console.log('✅ Core SettingsManager loaded');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSettingsManager();
  }

})();