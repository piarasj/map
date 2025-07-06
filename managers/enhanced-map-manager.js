/**
 * =====================================================
 * FILE: managers/enhanced-map-manager.js
 * PURPOSE: Enhanced map initialization and control management
 * DEPENDENCIES: SettingsManager, ReferenceMarker
 * EXPORTS: EnhancedMapManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🗺️ Loading enhanced-map-manager.js...');

  // ==================== ENHANCED MAP MANAGER ====================
  class EnhancedMapManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.map = null;
      this.navigationControl = null;
      this.fullscreenControl = null;
    }

    init() {
      console.log('🗺️ Enhanced Map Manager initialized');
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
        
        // Trigger map resize
        setTimeout(() => {
          if (this.map && this.map.resize) {
            this.map.resize();
          }
        }, 300);
      });

      // Listen for settings changes
      this.eventBus.on('settings:changed', (settings) => {
        if (settings.mapStyle && this.map) {
          this.map.setStyle(`mapbox://styles/${settings.mapStyle}`);
        }
      });
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

    // Center map on data
    centerMapOnData(geojsonData) {
      if (!this.map || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
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
          this.map.fitBounds(bounds, { 
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

    // Update map markers (delegated to existing MapManager)
    updateMarkers(geojsonData) {
      if (window.MapManager && window.MapManager.updateMarkers) {
        window.MapManager.updateMarkers(this.map, geojsonData);
      }
    }

    // Fly to specific coordinates
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

    // Get current map instance
    getMap() {
      return this.map;
    }

    // Check if map is loaded
    isLoaded() {
      return this.map && this.map.loaded();
    }

    // Resize map (useful after layout changes)
    resize() {
      if (this.map && this.map.resize) {
        this.map.resize();
      }
    }

    // Set map style
    setStyle(style) {
      if (this.map) {
        this.map.setStyle(`mapbox://styles/${style}`);
      }
    }

    // Cleanup
    destroy() {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      
      this.navigationControl = null;
      this.fullscreenControl = null;
      
      console.log('🗺️ Enhanced Map Manager destroyed');
    }
  }

  // Export to global scope
  window.EnhancedMapManager = EnhancedMapManager;

  console.log('✅ Enhanced Map Manager loaded');
})();