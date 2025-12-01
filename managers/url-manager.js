/**
 * URL Manager - Handles URL-based navigation for MapaLister
 * Supports hash-based routing for shareable location links
 * 
 * Supported URL patterns:
 * - #parish=Name
 * - #diocese=Name
 * - #county=Name
 * - #office=Name
 * - #lat=53.3498&lng=-6.2603&zoom=12
 * - #uploaded=Name (for uploaded GeoJSON features)
 */

const URLManager = (function() {
  'use strict';

  // Check dependencies
  if (typeof EventBus === 'undefined') {
    console.error('URLManager: EventBus not found');
    return null;
  }

  let initialized = false;
  let isProcessingHash = false; // Prevent circular updates
  let mapReady = false;

  /**
   * Parse the current URL hash into parameters
   */
  function parseHash() {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return null;

    const params = {};
    hash.split('&').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    return Object.keys(params).length > 0 ? params : null;
  }

  /**
   * Build a hash string from parameters
   */
  function buildHash(params) {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Handle hash changes (navigation)
   */
  function handleHashChange() {
    if (isProcessingHash || !mapReady) return;

    const params = parseHash();
    if (!params) return;

    isProcessingHash = true;

    // Handle coordinate-based navigation
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      const zoom = params.zoom ? parseFloat(params.zoom) : 12;

      if (!isNaN(lat) && !isNaN(lng)) {
        EventBus.emit('url:navigateToCoordinates', {
          lat,
          lng,
          zoom
        });
      }
    }
    // Handle feature-based navigation
    else if (params.parish || params.diocese || params.county || params.office || params.uploaded) {
      const type = params.parish ? 'parish' : 
                   params.diocese ? 'diocese' :
                   params.county ? 'county' :
                   params.office ? 'office' : 'uploaded';
      
      const name = params[type];

      EventBus.emit('url:navigateToFeature', {
        type,
        name
      });
    }

    setTimeout(() => {
      isProcessingHash = false;
    }, 500);
  }

  /**
   * Update URL hash when user navigates within app
   */
  function updateURLFromNavigation(data) {
    if (isProcessingHash) return;

    isProcessingHash = true;

    const params = {};
    
    if (data.type && data.name) {
      // Feature-based navigation
      params[data.type] = data.name;
    } else if (data.lat !== undefined && data.lng !== undefined) {
      // Coordinate-based navigation
      params.lat = data.lat.toFixed(6);
      params.lng = data.lng.toFixed(6);
      if (data.zoom) {
        params.zoom = data.zoom.toFixed(2);
      }
    }

    if (Object.keys(params).length > 0) {
      const newHash = buildHash(params);
      if (window.location.hash.slice(1) !== newHash) {
        window.location.hash = newHash;
      }
    }

    setTimeout(() => {
      isProcessingHash = false;
    }, 100);
  }

  /**
   * Clear the URL hash
   */
  function clearHash() {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  /**
   * Initialize URL manager
   */
  function init() {
    if (initialized) return;

    console.log('URLManager: Initializing...');

    // Listen for map ready
    EventBus.on('map:loaded', () => {
      mapReady = true;
      
      // Process initial hash after map is ready
      setTimeout(() => {
        handleHashChange();
      }, 500);
    });

    // Listen for hash changes (back/forward buttons, direct URL changes)
    window.addEventListener('hashchange', handleHashChange);

    // Listen for internal navigation events to update URL
    EventBus.on('sidebar:itemSelected', (data) => {
      updateURLFromNavigation(data);
    });

    EventBus.on('search:featureSelected', (data) => {
      updateURLFromNavigation(data);
    });

    // Listen for reference point clearing
    EventBus.on('reference:cleared', () => {
      clearHash();
    });

    initialized = true;
    console.log('URLManager: Initialized');
  }

  /**
   * Public API
   */
  return {
    init,
    
    /**
     * Navigate to a specific feature by URL
     * @param {string} type - Feature type (parish, diocese, county, office)
     * @param {string} name - Feature name
     */
    navigateTo(type, name) {
      const params = {};
      params[type] = name;
      window.location.hash = buildHash(params);
    },

    /**
     * Navigate to coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Zoom level (optional)
     */
    navigateToCoordinates(lat, lng, zoom = 12) {
      const params = {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        zoom: zoom.toFixed(2)
      };
      window.location.hash = buildHash(params);
    },

    /**
     * Clear current navigation
     */
    clear() {
      clearHash();
    },

    /**
     * Get current URL parameters
     */
    getCurrentParams() {
      return parseHash();
    }
  };
})();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => URLManager.init());
} else {
  URLManager.init();
}