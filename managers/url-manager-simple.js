/**
 * Simple URL Manager - Handles URL-based navigation for MapaLister
 * Simplified version that works without complex EventBus dependencies
 */

(function() {
  'use strict';
  
  console.log('🔗 Loading Simple URL Manager...');

  let isProcessingHash = false;

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
   * Handle hash changes (navigation)
   */
  function handleHashChange() {
    if (isProcessingHash) return;

    console.log('🔗 URL hash changed, processing...');
    const params = parseHash();
    if (!params) return;

    isProcessingHash = true;

    // Handle coordinate-based navigation
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      const zoom = params.zoom ? parseFloat(params.zoom) : 12;

      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('🗺️ Navigating to coordinates:', lat, lng, zoom);
        if (window.map && window.map.flyTo) {
          window.map.flyTo({
            center: [lng, lat],
            zoom: zoom,
            duration: 1000
          });
        }
      }
    }
    // Handle feature-based navigation
    else if (params.parish || params.diocese || params.county || params.office || params.uploaded) {
      const type = params.parish ? 'parish' : 
                   params.diocese ? 'diocese' :
                   params.county ? 'county' :
                   params.office ? 'office' : 'uploaded';
      
      const name = params[type];
      console.log(`🔍 Navigating to ${type}:`, name);

      // Try SidebarManager first (most reliable)
      if (window.SidebarManager && window.SidebarManager.handleSearchEvent) {
        console.log('✅ Using SidebarManager for navigation');
        window.SidebarManager.handleSearchEvent({ query: name });
      }
      // Fallback: try EventBus if available
      else if (window.EventBus && window.EventBus.emit) {
        console.log('✅ Using EventBus for navigation');
        window.EventBus.emit('url:navigateToFeature', { type, name });
      }
      // Last resort: try MapaListerApp EventBus
      else if (window.MapaListerApp && window.MapaListerApp.eventBus) {
        console.log('✅ Using MapaListerApp EventBus for navigation');
        window.MapaListerApp.eventBus.emit('url:navigateToFeature', { type, name });
      }
      else {
        console.error('❌ No navigation method available for:', name);
      }
    }

    setTimeout(() => {
      isProcessingHash = false;
    }, 500);
  }

  /**
   * Simple URL Manager object
   */
  const SimpleURLManager = {
    init() {
      console.log('🔗 Simple URL Manager initializing...');
      
      // Listen for hash changes
      window.addEventListener('hashchange', handleHashChange);
      
      // Process current hash if it exists
      setTimeout(() => {
        if (window.location.hash) {
          console.log('🔗 Processing initial hash:', window.location.hash);
          handleHashChange();
        }
      }, 1000); // Wait for other components to load
      
      console.log('✅ Simple URL Manager initialized');
    },

    navigateTo(type, name) {
      const hash = `#${type}=${encodeURIComponent(name)}`;
      console.log('🔗 Setting hash:', hash);
      window.location.hash = hash;
    },

    navigateToCoordinates(lat, lng, zoom = 12) {
      const hash = `#lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&zoom=${zoom.toFixed(2)}`;
      console.log('🔗 Setting coordinate hash:', hash);
      window.location.hash = hash;
    },

    clear() {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    },

    getCurrentParams() {
      return parseHash();
    }
  };

  // Export to window
  window.URLManager = SimpleURLManager;
  window.SimpleURLManager = SimpleURLManager;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SimpleURLManager.init());
  } else {
    // Small delay to let other components load first
    setTimeout(() => SimpleURLManager.init(), 100);
  }

  console.log('✅ Simple URL Manager loaded');

})();