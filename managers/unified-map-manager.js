/**
 * =====================================================
 * FILE: managers/unified-map-manager.js
 * PURPOSE: Unified map initialization and marker management
 * DEPENDENCIES: DataConfig, SettingsManager, ReferenceMarker, PopupUtils
 * EXPORTS: UnifiedMapManager (class) and MapManager (object)
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🗺️ Loading unified-map-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    if (typeof PopupUtils === 'undefined') missing.push('PopupUtils');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ UnifiedMapManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initUnifiedMapManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    window.addEventListener('mapalister:popupUtilsReady', retryInit);
    return;
  }

  function initUnifiedMapManager() {
    
    // ==================== UNIFIED MAP MANAGER CLASS ====================
    class UnifiedMapManager {
      constructor(eventBus) {
        this.eventBus = eventBus;
        this.map = null;
        this.navigationControl = null;
        this.fullscreenControl = null;
        this.markersLoaded = false;
        this.hoverPopup = null;
        this.currentConfig = null;
      }

      init() {
        console.log('🗺️ Unified Map Manager initialized');
      }

      async initialize() {
        const token = this.getMapboxToken();
        if (!token) {
          console.warn('⚠️ No Mapbox token found - skipping map initialization');
          return false;
        }
        
        mapboxgl.accessToken = token;
        window.mapboxAccessToken = token;
        
        const mapStyle = window.SettingsManager?.getSetting('mapStyle') || 'mapbox/light-v11';
        
        this.map = new mapboxgl.Map({
          container: 'map',
          style: `mapbox://styles/${mapStyle}`,
          center: [-7.5, 53.0],
          zoom: 6
        });

        this.setupControls();
        this.setupEventHandlers();
        
        window.map = this.map;
        
        return new Promise((resolve, reject) => {
          this.map.on('load', () => {
            console.log('🗺️ Map loaded successfully');
            this.setupRightClickHandler();
            
            if (this.eventBus) {
              this.eventBus.emit('map:loaded', { map: this.map });
            }
            
            resolve(true);
          });
          
          this.map.on('error', (e) => {
            console.error('❌ Map error:', e);
            reject(e);
          });
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

      setupControls() {
        this.navigationControl = new mapboxgl.NavigationControl();
        this.fullscreenControl = new mapboxgl.FullscreenControl();
        
        this.updateControlPositions();
      }

      updateControlPositions() {
        if (!this.map || !this.navigationControl || !this.fullscreenControl) return;
        
        // Remove existing controls
        try {
          this.map.removeControl(this.navigationControl);
          this.map.removeControl(this.fullscreenControl);
        } catch (e) {
          // Controls may not be added yet
        }
        
        // Position controls opposite to sidebar
        const sidebarPosition = window.SettingsManager?.getSetting('sidebarPosition') || 'right';
        const controlPosition = sidebarPosition === 'right' ? 'top-left' : 'top-right';
        
        this.map.addControl(this.navigationControl, controlPosition);
        this.map.addControl(this.fullscreenControl, controlPosition);
        
        console.log(`🎮 Map controls positioned: ${controlPosition}`);
      }

      setupEventHandlers() {
        if (!this.eventBus) return;
        
        // Listen for sidebar state changes
        this.eventBus.on('sidebar:stateChanged', (data) => {
          if (data.state !== 'hidden') {
            this.updateControlPositions();
          }
          
          // Simple approach: Just resize and refit bounds
          setTimeout(() => {
            if (this.map && this.map.resize) {
              this.map.resize();
              console.log('🗺️ Map resized for sidebar change');
              
              // Simple refit with sidebar-aware padding
              this.simpleRefitForSidebar(data.state);
            }
          }, 350); // Wait for sidebar animation
        });

        // Listen for settings changes
        this.eventBus.on('settings:changed', (settings) => {
          if (settings.mapStyle && this.map) {
            this.map.setStyle(`mapbox://styles/${settings.mapStyle}`);
          }
        });
      }

      /**
       * Super simple approach - just refit the bounds with appropriate padding
       * No center adjustment, no complex calculations, just ensure data is visible
       */
      simpleRefitForSidebar(sidebarState) {
        if (!this.map || !window.geojsonData || !window.geojsonData.features) {
          console.log('🗺️ No map or data for refit');
          return;
        }
        
        try {
          const bounds = new mapboxgl.LngLatBounds();
          let validFeatures = 0;

          // Collect all coordinates
          window.geojsonData.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              const [lng, lat] = feature.geometry.coordinates;
              if (lng && lat && !isNaN(lng) && !isNaN(lat)) {
                bounds.extend([lng, lat]);
                validFeatures++;
              }
            }
          });

          if (validFeatures === 0 || bounds.isEmpty()) {
            console.log('🗺️ No valid features found for refit');
            return;
          }

          // Simple padding logic
          let padding = 80; // base padding
          let extraPadding = 0;
          
          if (sidebarState === 'left' || sidebarState === 'right') {
            extraPadding = 340; // sidebar width + margin
          }
          
          const paddingConfig = {
            top: padding,
            bottom: padding,
            left: sidebarState === 'left' ? extraPadding : padding,
            right: sidebarState === 'right' ? extraPadding : padding
          };
          
          console.log(`🗺️ Refitting ${validFeatures} features with padding:`, paddingConfig);
          
          this.map.fitBounds(bounds, {
            padding: paddingConfig,
            maxZoom: 10, // Conservative max zoom
            duration: 800
          });
          
          console.log(`✅ Simple refit complete for ${sidebarState} sidebar`);
          
        } catch (error) {
          console.error('❌ Simple refit failed:', error);
        }
      }

      setupRightClickHandler() {
        if (!this.map) return;
        
        this.map.on('contextmenu', (e) => {
          e.preventDefault();
          
          const { lng, lat } = e.lngLat;
          console.log(`📍 Right-click detected at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          
          if (window.ReferenceMarker) {
            window.ReferenceMarker.set(lat, lng, 'Custom Reference Point');
            
            // Emit event for other components
            if (this.eventBus) {
              this.eventBus.emit('reference:set', { lat, lng, name: 'Custom Reference Point' });
            }
            
            setTimeout(() => {
              if (window.SidebarManager?.updateAllDistances) {
                console.log('🔄 Updating sidebar after right-click reference...');
                window.SidebarManager.updateAllDistances();
              }
            }, 200);
          }
        });

        this.map.getCanvasContainer().addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
        
        console.log('✅ Right-click handler configured');
      }

      // ==================== MARKER MANAGEMENT METHODS ====================
      
      /**
       * Initialize MapManager with map and data
       * @param {Object} mapInstance - Mapbox map instance (optional, uses this.map if not provided)
       * @param {Object} geojsonData - GeoJSON data
       * @returns {boolean} Success status
       */
      initializeMarkers(mapInstance, geojsonData) {
        const map = mapInstance || this.map;
        console.log('🚀 UnifiedMapManager: Initializing markers with dynamic config');
        
        if (!map || !geojsonData) {
          console.error('❌ UnifiedMapManager: Cannot initialize - missing map or data');
          return false;
        }
        
        // Get current configuration
        this.currentConfig = DataConfig.getCurrentConfig();
        
        // Analyze the data
        const dataAnalysis = DataConfig.analyzeData(geojsonData);
        console.log('📊 Data analysis:', dataAnalysis);
        
        // Add markers to map
        this.addMarkersToMap(map, geojsonData, dataAnalysis);
        
        // Setup interactions
        this.setupHoverPopups(map);
        this.setupClickInteractions(map);
        
        console.log('✅ UnifiedMapManager: Marker initialization complete');
        return true;
      }

      /**
       * Add markers to map with dynamic configuration
       * @param {Object} map - Mapbox map instance
       * @param {Object} geojsonData - GeoJSON data
       * @param {Object} dataAnalysis - Data analysis results
       */
      addMarkersToMap(map, geojsonData, dataAnalysis = null) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const sourceKey = config.sourceKey;
        const layerKey = `${sourceKey}-markers`;
        
        console.log(`📍 Adding markers: source="${sourceKey}", layer="${layerKey}"`);
        
        // Remove existing layers and source
        this.removeExistingLayers(map);
        
        // Add source with dynamic name
        map.addSource(sourceKey, {
          type: 'geojson',
          data: geojsonData
        });
        
        // Build dynamic color expression
        const colorExpression = this.buildDynamicColorExpression(config.groupingProperty);
        
        // Add marker layer with dataset-based colors
        map.addLayer({
          id: layerKey,
          type: 'circle',
          source: sourceKey,
          paint: {
            'circle-color': colorExpression,
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5, 6,
              10, 10,
              15, 14
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        this.markersLoaded = true;
        const featureCount = dataAnalysis?.totalFeatures || geojsonData.features?.length || 0;
        console.log(`✅ UnifiedMapManager: ${featureCount} markers added successfully`);
      }

      /**
       * Build dynamic color expression for paint property
       * @param {string} groupingProperty - Property to group by
       * @returns {Array} Mapbox expression array
       */
      buildDynamicColorExpression(groupingProperty) {
        const colors = DataConfig.getColorMapping();
        const expression = ['case'];
        
        // Add conditions for each grouping value
        Object.entries(colors).forEach(([value, color]) => {
          expression.push(['==', ['get', groupingProperty], value]);
          expression.push(color);
        });
        
        // Default color (fallback)
        expression.push('#6b7280');
        
        return expression;
      }

      /**
       * Remove existing layers with dynamic names
       * @param {Object} map - Mapbox map instance
       */
      removeExistingLayers(map) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const sourceKey = config.sourceKey;
        const layersToRemove = [
          `${sourceKey}-markers`,
          `${sourceKey}-clusters`, 
          `${sourceKey}-cluster-count`
        ];
        
        layersToRemove.forEach(layerId => {
          if (map.getLayer(layerId)) {
            try {
              map.removeLayer(layerId);
              console.log(`🗑️ Removed layer: ${layerId}`);
            } catch (e) {
              console.warn(`⚠️ Could not remove layer ${layerId}:`, e);
            }
          }
        });
        
        if (map.getSource(sourceKey)) {
          try {
            map.removeSource(sourceKey);
            console.log(`🗑️ Removed source: ${sourceKey}`);
          } catch (e) {
            console.warn(`⚠️ Could not remove source ${sourceKey}:`, e);
          }
        }
      }

      /**
       * Setup hover popups with clean layer separation
       * @param {Object} map - Mapbox map instance
       */
      setupHoverPopups(map) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const layerKey = `${config.sourceKey}-markers`;
        
        console.log(`🖱️ UnifiedMapManager: Setting up hover popups for layer: ${layerKey}`);
        
        // Check if this is a contact/deacon layer that should use PopupUtils
        const isContactLayer = this.isContactOrDeaconLayer(layerKey);
        
        console.log(`🔍 UNIFIED-MAP-MANAGER: Layer "${layerKey}" isContactLayer: ${isContactLayer}`);
        
        if (isContactLayer) {
          console.log(`🎯 Layer ${layerKey} is a contact/deacon layer - NO HOVER POPUPS (enhanced on click only)`);
          
          // For contact/deacon layers, ONLY setup cursor changes - NO POPUPS ON HOVER
          map.on('mouseenter', layerKey, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', layerKey, () => {
            map.getCanvas().style.cursor = '';
          });
          
          console.log('✅ Contact/deacon layer configured for click-only enhanced popups');
          return;
        }
        
        // For diocese/county layers, show simple hover popups
        console.log(`🗺️ Layer ${layerKey} is a background layer - using simple hover popups`);
        
        map.on('mouseenter', layerKey, (e) => {
          console.log('🎯 Mouse entered diocese/county layer - showing simple popup');
          
          // Change cursor
          map.getCanvas().style.cursor = 'pointer';
          
          // Get feature data
          const features = map.queryRenderedFeatures(e.point, {
            layers: [layerKey]
          });
          
          if (!features.length) return;
          
          let feature = features[0];
          const coordinates = feature.geometry.coordinates.slice();
          
          // Ensure popup appears over the correct copy of the feature
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          
          // Create simple hover popup for diocese/county layers
          this.hoverPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'hover-popup background-layer-popup'
          });
          
          const content = this.createSimpleBackgroundPopup(feature);
          this.hoverPopup
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(map);
          
          if (window.LucideUtils) {
            setTimeout(() => LucideUtils.init(), 10);
          }
        });

        map.on('mouseleave', layerKey, () => {
          console.log('🎯 Mouse left diocese/county layer');
          
          // Reset cursor
          map.getCanvas().style.cursor = '';
          
          // Close hover popup
          if (this.hoverPopup) {
            this.hoverPopup.remove();
          }
        });
        
        console.log('✅ Diocese/county layer hover popups configured');
      }

      /**
       * Setup click interactions with clean layer separation
       * @param {Object} map - Mapbox map instance
       */
      setupClickInteractions(map) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const layerKey = `${config.sourceKey}-markers`;
        
        console.log(`👆 UnifiedMapManager: Setting up click interactions for layer: ${layerKey}`);
        
        // Check if this is a contact/deacon layer that should use PopupUtils
        const isContactLayer = this.isContactOrDeaconLayer(layerKey);
        
        console.log(`🔍 UNIFIED-MAP-MANAGER: Click setup for "${layerKey}" isContactLayer: ${isContactLayer}`);
        console.log(`🔍 UNIFIED-MAP-MANAGER: About to add click handler for layer: ${layerKey}`);
        
        map.on('click', layerKey, (e) => {
          if (e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates;
            
            // Always handle the marker click for sidebar updates
            this.handleMarkerClick(feature);
            
            if (isContactLayer) {
              // For contact/deacon layers: show enhanced popup with notes
              console.log('🎯 Contact/deacon marker clicked - showing enhanced popup');
              
              // Use PopupUtils for enhanced popup with notes
              if (window.PopupUtils) {
                console.log('🎯 UNIFIED-MAP-MANAGER: Calling PopupUtils.showEnhancedPopup');
                window.PopupUtils.showEnhancedPopup(map, feature, coordinates);
                console.log('🎯 UNIFIED-MAP-MANAGER: PopupUtils call completed');
              } else {
                console.warn('⚠️ PopupUtils not available for enhanced popup');
              }
            } else {
              // For diocese/county layers: show simple popup (same as hover)
              console.log('🗺️ Diocese/county clicked - showing simple popup');
              
              // Close any existing hover popup first
              if (this.hoverPopup) {
                this.hoverPopup.remove();
              }
              
              // Create simple click popup that stays open
              this.hoverPopup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                className: 'click-popup background-layer-popup'
              });
              
              const content = this.createSimpleBackgroundPopup(feature);
              this.hoverPopup
                .setLngLat(coordinates)
                .setHTML(content)
                .addTo(map);
              
              if (window.LucideUtils) {
                setTimeout(() => LucideUtils.init(), 10);
              }
            }
          }
        });
        
        console.log('✅ Click interactions configured with clean layer separation');
      }

      /**
       * Create enhanced popup content with dynamic configuration
       * @param {Object} feature - GeoJSON feature
       * @returns {string} HTML content
       */
      createEnhancedPopupContent(feature) {
        if (window.PopupUtils) {
          return window.PopupUtils.createEnhancedPopupContent(feature);
        } else {
          // Fallback if PopupUtils not loaded
          console.warn('⚠️ PopupUtils not available, using basic popup');
          const properties = feature.properties;
          const name = this.extractPropertyValue(properties, ['name', 'Name', 'title', 'Title'], 'Contact');
          return `<div style="padding: 10px; font-family: sans-serif;">
            <h4 style="margin: 0 0 8px 0;">${name}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">PopupUtils not loaded - basic display only</p>
          </div>`;
        }
      }

      /**
       * Handle marker click
       * @param {Object} feature - GeoJSON feature
       */
      handleMarkerClick(feature) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        console.log(`📍 Marker clicked in ${config.displayName} data:`, feature.properties);
        
        const properties = feature.properties;
        const name = properties.name || properties.Name || 'Contact';
        
        // Update sidebar selection if available
        if (typeof SidebarManager !== 'undefined' && SidebarManager.setActiveItem) {
          const contactId = properties.id || properties.contact_id || name;
          SidebarManager.setActiveItem(contactId);
        }
        
        // Emit event
        window.dispatchEvent(new CustomEvent('mapalister:markerClick', {
          detail: { feature, properties, name }
        }));
      }

      /**
       * Update markers with new data
       * @param {Object} map - Mapbox map instance (optional)
       * @param {Object} geojsonData - New GeoJSON data
       * @returns {boolean} Success status
       */
      updateMarkers(map, geojsonData) {
        const mapInstance = map || this.map;
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const sourceKey = config.sourceKey;
        
        console.log(`🔄 UnifiedMapManager: Updating markers for source: ${sourceKey}`);
        
        if (!mapInstance || !geojsonData) {
          console.error('❌ UnifiedMapManager: Cannot update - missing map or data');
          return false;
        }
        
        const source = mapInstance.getSource(sourceKey);
        if (source) {
          source.setData(geojsonData);
          console.log('✅ UnifiedMapManager: Markers updated successfully');
          return true;
        } else {
          // Re-analyze data and add markers
          const dataAnalysis = DataConfig.analyzeData(geojsonData);
          this.addMarkersToMap(mapInstance, geojsonData, dataAnalysis);
          return true;
        }
      }

      // ==================== MAP UTILITY METHODS ====================

      /**
       * Center map on data
       * @param {Object} geojsonData - GeoJSON data
       */
      centerMapOnData(geojsonData) {
        const map = this.map;
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
            
            if (this.eventBus) {
              this.eventBus.emit('map:centered', { markerCount: validCoordinates });
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to auto-center map:', e);
        }
      }

      /**
       * Auto-zoom to fit all markers
       * @param {Object} map - Mapbox map instance (optional)
       * @param {Object} geojsonData - GeoJSON data
       */
      autoZoomToFitMarkers(map, geojsonData) {
        const mapInstance = map || this.map;
        if (!mapInstance || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
          return;
        }
        
        try {
          const bounds = new mapboxgl.LngLatBounds();
          let validCoordinates = 0;

          geojsonData.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              bounds.extend(feature.geometry.coordinates);
              validCoordinates++;
            }
          });

          if (validCoordinates > 0 && !bounds.isEmpty()) {
            mapInstance.fitBounds(bounds, {
              padding: 50,
              maxZoom: 12,
              duration: 1000
            });
            
            console.log(`✅ UnifiedMapManager: Auto-zoom complete (${validCoordinates} markers)`);
          }
        } catch (error) {
          console.error('❌ UnifiedMapManager: Auto-zoom failed:', error);
        }
      }

      /**
       * Fly to specific coordinates
       * @param {Array} coordinates - [lng, lat]
       * @param {number} zoom - Zoom level
       */
      flyTo(coordinates, zoom = 14) {
        if (!this.map || !coordinates || coordinates.length < 2) return;
        
        const [lng, lat] = coordinates;
        this.map.flyTo({
          center: [lng, lat],
          zoom: zoom,
          duration: 1000
        });
        
        console.log(`✈️ Flying to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }

      // ==================== UTILITY METHODS ====================

      /**
       * Check if a layer is a contact or deacon layer that should use PopupUtils
       * @param {string} layerKey - Layer identifier
       * @returns {boolean} True if it's a contact/deacon layer
       */
      isContactOrDeaconLayer(layerKey) {
        const contactLayerPatterns = [
          'contact', 'deacon', 'priest', 'clergy', 'people', 'person',
          'geojson', 'markers', 'uploaded', 'user-data'
        ];
        
        const backgroundLayerPatterns = [
          'irish-', 'diocese', 'county', 'counties', 'boundary', 'admin'
        ];
        
        const layerLower = layerKey.toLowerCase();
        
        // If it matches background patterns, it's NOT a contact layer
        if (backgroundLayerPatterns.some(pattern => layerLower.includes(pattern))) {
          return false;
        }
        
        // If it matches contact patterns, it IS a contact layer
        if (contactLayerPatterns.some(pattern => layerLower.includes(pattern))) {
          return true;
        }
        
        // Default: assume it's a contact layer if uncertain
        return true;
      }

      /**
       * Create simple popup content for background layers (dioceses, counties)
       * @param {Object} feature - GeoJSON feature
       * @returns {string} HTML content
       */
      createSimpleBackgroundPopup(feature) {
        const properties = feature.properties;
        
        // Extract name with common property fallbacks
        const name = this.extractPropertyValue(properties, [
          'name', 'Name', 'NAME', 'title', 'Title', 'TITLE',
          'county', 'County', 'COUNTY', 'diocese', 'Diocese', 'DIOCESE'
        ], 'Area');
        
        // Extract type/category if available
        const type = this.extractPropertyValue(properties, [
          'type', 'Type', 'TYPE', 'category', 'Category', 'CATEGORY'
        ], null);
        
        return `
          <div style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 180px;
            max-width: 250px;
            padding: 12px;
          ">
            <div style="
              font-weight: 600;
              font-size: 14px;
              color: #111827;
              margin-bottom: ${type ? '4px' : '0'};
              line-height: 1.3;
            ">${name}</div>
            ${type ? `
              <div style="
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
              ">${type}</div>
            ` : ''}
          </div>
        `;
      }

      /**
       * Extract property value with fallbacks
       * @param {Object} properties - Feature properties
       * @param {Array} keys - Array of possible property keys
       * @param {*} defaultValue - Default value if none found
       * @returns {*} Property value or default
       */
      extractPropertyValue(properties, keys, defaultValue) {
        for (const key of keys) {
          if (properties[key] !== undefined && properties[key] !== null && properties[key] !== '') {
            return properties[key];
          }
        }
        return defaultValue;
      }

      /**
       * Get dataset color with dynamic configuration
       * @param {string} groupValue - Group value
       * @returns {string} Color hex code
       */
      getDatasetColor(groupValue) {
        const colors = DataConfig.getColorMapping();
        return colors[groupValue] || '#6b7280';
      }

      // ==================== GETTER METHODS ====================

      /**
       * Get current map instance
       * @returns {Object} Mapbox map instance
       */
      getMap() {
        return this.map;
      }

      /**
       * Check if map is loaded
       * @returns {boolean} Map loaded status
       */
      isLoaded() {
        return this.map && this.map.loaded();
      }

      /**
       * Resize map (useful after layout changes)
       */
      resize() {
        if (this.map && this.map.resize) {
          this.map.resize();
        }
      }

      /**
       * Set map style
       * @param {string} style - Map style
       */
      setStyle(style) {
        if (this.map) {
          this.map.setStyle(`mapbox://styles/${style}`);
        }
      }

      /**
       * Cleanup
       */
      destroy() {
        if (this.map) {
          this.map.remove();
          this.map = null;
        }
        
        this.navigationControl = null;
        this.fullscreenControl = null;
        
        console.log('🗺️ Unified Map Manager destroyed');
      }
    }

    // ==================== LEGACY MAP MANAGER OBJECT ====================
    // Create an object that mirrors the old MapManager API for backwards compatibility
    const MapManager = {
      markersLoaded: false,
      hoverPopup: null,
      currentConfig: null,

      /**
       * Initialize MapManager with map and data
       * @param {Object} mapInstance - Mapbox map instance
       * @param {Object} geojsonData - GeoJSON data
       * @returns {boolean} Success status
       */
      initialize(mapInstance, geojsonData) {
        // Use the unified manager instance if available
        if (window.unifiedMapManagerInstance) {
          return window.unifiedMapManagerInstance.initializeMarkers(mapInstance, geojsonData);
        }
        
        // Fallback to direct implementation
        console.log('🚀 MapManager: Initializing with dynamic config (legacy mode)');
        
        if (!mapInstance || !geojsonData) {
          console.error('❌ MapManager: Cannot initialize - missing map or data');
          return false;
        }
        
        // Create temporary instance for methods
        const tempInstance = new UnifiedMapManager(null);
        return tempInstance.initializeMarkers(mapInstance, geojsonData);
      },

      /**
       * Update markers with new data
       * @param {Object} map - Mapbox map instance
       * @param {Object} geojsonData - New GeoJSON data
       * @returns {boolean} Success status
       */
      updateMarkers(map, geojsonData) {
        // Use the unified manager instance if available
        if (window.unifiedMapManagerInstance) {
          return window.unifiedMapManagerInstance.updateMarkers(map, geojsonData);
        }
        
        // Fallback to direct implementation
        const tempInstance = new UnifiedMapManager(null);
        return tempInstance.updateMarkers(map, geojsonData);
      },

      /**
       * Auto-zoom to fit all markers
       * @param {Object} map - Mapbox map instance
       * @param {Object} geojsonData - GeoJSON data
       */
      autoZoomToFitMarkers(map, geojsonData) {
        // Use the unified manager instance if available
        if (window.unifiedMapManagerInstance) {
          return window.unifiedMapManagerInstance.autoZoomToFitMarkers(map, geojsonData);
        }
        
        // Fallback to direct implementation
        const tempInstance = new UnifiedMapManager(null);
        return tempInstance.autoZoomToFitMarkers(map, geojsonData);
      }
    };

    // ==================== EXPORTS ====================
    
    // Export both class and object to global scope
    window.UnifiedMapManager = UnifiedMapManager;
    window.MapManager = MapManager;
    
    console.log('✅ Unified map manager loaded successfully with clean layer separation');
    
    // Mark as loaded
    if (window.MapaListerModules) {
      window.MapaListerModules.mapManager = true;
      window.MapaListerModules.unifiedMapManager = true;
    }
    
    // Emit ready events
    window.dispatchEvent(new CustomEvent('mapalister:mapManagerReady'));
    window.dispatchEvent(new CustomEvent('mapalister:unifiedMapManagerReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initUnifiedMapManager();
  }

})();