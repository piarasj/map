/**
 * =====================================================
 * FILE: managers/map-manager.js  
 * PURPOSE: Map management and marker handling
 * DEPENDENCIES: DataConfig, MapaListerConfig, ReferenceMarker
 * EXPORTS: MapManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🗺️ Loading map-manager.js...');

  // Check dependencies
const checkDependencies = () => {
  const missing = [];
  if (typeof DataConfig === 'undefined') missing.push('DataConfig');
  if (typeof MapaListerConfig === 'undefined') missing.push('MapaListerConfig');
  if (typeof PopupUtils === 'undefined') missing.push('PopupUtils');
  return missing;
};

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ MapManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initMapManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    window.addEventListener('mapalister:popupUtilsReady', retryInit);
    return;
  }

  function initMapManager() {
    /**
     * MAP MANAGER
     * Handles map interactions and marker management with dynamic configuration
     */
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
        console.log('🚀 MapManager: Initializing with dynamic config');
        
        if (!mapInstance || !geojsonData) {
          console.error('❌ MapManager: Cannot initialize - missing map or data');
          return false;
        }
        
        // Get current configuration
        this.currentConfig = DataConfig.getCurrentConfig();
        
        // Analyze the data
        const dataAnalysis = DataConfig.analyzeData(geojsonData);
        console.log('📊 Data analysis:', dataAnalysis);
        
        // Store reference to map
        window.map = mapInstance;
        
        // Add markers to map
        this.addMarkersToMap(mapInstance, geojsonData, dataAnalysis);
        
        // Setup interactions
        this.setupHoverPopups(mapInstance);
        this.setupClickInteractions(mapInstance);
        
        console.log('✅ MapManager: Initialization complete');
        return true;
      },

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
        console.log(`✅ MapManager: ${featureCount} markers added successfully`);
      },

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
      },

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
      },

      /**
       * Setup hover popups with dynamic layer name and timeout system
       * @param {Object} map - Mapbox map instance
       */
      setupHoverPopups(map) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const layerKey = `${config.sourceKey}-markers`;
        
        console.log(`🖱️ MapManager: Setting up hover popups for layer: ${layerKey}`);
        
        // Updated mouseenter handler for your map layer
        map.on('mouseenter', layerKey, (e) => {
          console.log('🎯 Mouse entered map feature');
          
          // Clear any pending popup close timeouts
          if (window.PopupUtils) {
            window.PopupUtils.handleLayerMouseEnter();
          }
          
          // Change cursor
          map.getCanvas().style.cursor = 'pointer';
          
          // Get feature data
          const features = map.queryRenderedFeatures(e.point, {
            layers: [layerKey]
          });
          
          if (!features.length) return;
          
          const feature = features[0];
          const coordinates = feature.geometry.coordinates.slice();
          
          // Ensure popup appears over the correct copy of the feature
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          
          // Show the enhanced popup using PopupUtils
          if (window.PopupUtils) {
            window.PopupUtils.showEnhancedPopup(map, feature, coordinates);
          } else {
            // Fallback to old popup system
            console.warn('⚠️ PopupUtils not available, using fallback popup');
            this.hoverPopup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'hover-popup'
            });
            
            const content = this.createEnhancedPopupContent(feature);
            this.hoverPopup
              .setLngLat(coordinates)
              .setHTML(content)
              .addTo(map);
          }
        });

        // Updated mouseleave handler for your map layer
        map.on('mouseleave', layerKey, () => {
          console.log('🎯 Mouse left map feature');
          
          // Reset cursor
          map.getCanvas().style.cursor = '';
          
          // Handle layer mouse leave with timeout
          if (window.PopupUtils) {
            window.PopupUtils.handleLayerMouseLeave();
          } else {
            // Fallback - close popup immediately
            if (this.hoverPopup) {
              this.hoverPopup.remove();
            }
          }
        });

        // Optional: Add a map click handler to close popups when clicking elsewhere
        map.on('click', (e) => {
          // Check if click was on the map canvas (not on popup)
          const { target } = e.originalEvent;
          const canvas = map.getCanvas();
          
          if (target === canvas && window.PopupUtils) {
            window.PopupUtils.closeAllPopups();
          }
        });

        // Optional: Close popups when map starts moving (if desired)
        map.on('movestart', () => {
          if (window.PopupUtils) {
            window.PopupUtils.closeAllPopups();
          } else if (this.hoverPopup) {
            this.hoverPopup.remove();
          }
        });
        
        console.log('✅ MapManager: Hover popups configured with timeout system');
      },

      /**
       * Setup click interactions with unified popup system
       * @param {Object} map - Mapbox map instance
       */
      setupClickInteractions(map) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const layerKey = `${config.sourceKey}-markers`;
        
        console.log(`👆 MapManager: Setting up click interactions for layer: ${layerKey}`);
        
        map.on('click', layerKey, (e) => {
          if (e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates;
            
            // Handle the marker click
            this.handleMarkerClick(feature);
            
            // Show enhanced popup using PopupUtils
            if (window.PopupUtils) {
              window.PopupUtils.showEnhancedPopup(map, feature, coordinates);
            } else {
              // Fallback to old system
              if (this.hoverPopup) {
                const content = this.createEnhancedPopupContent(feature);
                this.hoverPopup
                  .setLngLat(coordinates)
                  .setHTML(content)
                  .addTo(map);
              }
            }
          }
        });
        
        console.log('✅ MapManager: Click interactions configured with unified popup system');
      },

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
      },

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
      },

      /**
       * Update markers with new data
       * @param {Object} map - Mapbox map instance
       * @param {Object} geojsonData - New GeoJSON data
       * @returns {boolean} Success status
       */
      updateMarkers(map, geojsonData) {
        const config = this.currentConfig || DataConfig.getCurrentConfig();
        const sourceKey = config.sourceKey;
        
        console.log(`🔄 MapManager: Updating markers for source: ${sourceKey}`);
        
        if (!map || !geojsonData) {
          console.error('❌ MapManager: Cannot update - missing map or data');
          return false;
        }
        
        const source = map.getSource(sourceKey);
        if (source) {
          source.setData(geojsonData);
          console.log('✅ MapManager: Markers updated successfully');
          return true;
        } else {
          // Re-analyze data and add markers
          const dataAnalysis = DataConfig.analyzeData(geojsonData);
          this.addMarkersToMap(map, geojsonData, dataAnalysis);
          return true;
        }
      },

      /**
       * Auto-zoom to fit all markers
       * @param {Object} map - Mapbox map instance
       * @param {Object} geojsonData - GeoJSON data
       */
      autoZoomToFitMarkers(map, geojsonData) {
        if (!map || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
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
            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 12,
              duration: 1000
            });
            
            console.log(`✅ MapManager: Auto-zoom complete (${validCoordinates} markers)`);
          }
        } catch (error) {
          console.error('❌ MapManager: Auto-zoom failed:', error);
        }
      },

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
      },

      /**
       * Get dataset color with dynamic configuration
       * @param {string} groupValue - Group value
       * @returns {string} Color hex code
       */
      getDatasetColor(groupValue) {
        const colors = DataConfig.getColorMapping();
        return colors[groupValue] || '#6b7280';
      }
    };

    // Export to global scope
    window.MapManager = MapManager;
    
    console.log('✅ map-manager.js loaded successfully');
    
    // Mark as loaded
    if (window.MapaListerModules) {
      window.MapaListerModules.mapManager = true;
    }
    
    // Emit ready event
    window.dispatchEvent(new CustomEvent('mapalister:mapManagerReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initMapManager();
  }

})();