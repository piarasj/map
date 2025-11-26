// DEBUG SCRIPT: Track all map zoom and movement events
// Paste this into browser console to debug zoom issues

(function() {
  console.log('🔍 DEBUG: Starting map zoom tracking...');
  
  // Track all zoom events
  if (window.map) {
    console.log('✅ Map instance found');
    
    window.map.on('zoom', () => {
      console.log('🔍 ZOOM EVENT:', {
        zoom: window.map.getZoom(),
        center: window.map.getCenter(),
        stack: new Error().stack
      });
    });
    
    window.map.on('move', () => {
      console.log('🔍 MOVE EVENT:', {
        center: window.map.getCenter(),
        zoom: window.map.getZoom()
      });
    });
    
    window.map.on('moveend', () => {
      console.log('🔍 MOVEEND EVENT:', {
        center: window.map.getCenter(),
        zoom: window.map.getZoom(),
        bounds: window.map.getBounds()
      });
    });
    
    window.map.on('zoomend', () => {
      console.log('🔍 ZOOMEND EVENT:', {
        zoom: window.map.getZoom(),
        center: window.map.getCenter()
      });
    });
    
    // Track fitBounds calls
    const originalFitBounds = window.map.fitBounds.bind(window.map);
    window.map.fitBounds = function(...args) {
      console.log('🔍 FITBOUNDS CALLED:', {
        args: args,
        stack: new Error().stack.split('\n').slice(1, 5).join('\n')
      });
      return originalFitBounds(...args);
    };
    
    // Track flyTo calls
    const originalFlyTo = window.map.flyTo.bind(window.map);
    window.map.flyTo = function(...args) {
      console.log('🔍 FLYTO CALLED:', {
        args: args,
        stack: new Error().stack.split('\n').slice(1, 5).join('\n')
      });
      return originalFlyTo(...args);
    };
    
    console.log('✅ All map event tracking enabled');
  } else {
    console.log('⚠️ No map instance found yet. Try running this script after the map loads.');
  }
  
  // Check UnifiedMapManager state
  if (window.unifiedMapManagerInstance) {
    console.log('📊 UnifiedMapManager state:', {
      markersLoaded: window.unifiedMapManagerInstance.markersLoaded,
      initialLoadComplete: window.unifiedMapManagerInstance.initialLoadComplete
    });
    
    // Log state changes
    setInterval(() => {
      if (window.unifiedMapManagerInstance._lastLoggedState !== 
          JSON.stringify({
            markersLoaded: window.unifiedMapManagerInstance.markersLoaded,
            initialLoadComplete: window.unifiedMapManagerInstance.initialLoadComplete
          })) {
        console.log('📊 UnifiedMapManager state changed:', {
          markersLoaded: window.unifiedMapManagerInstance.markersLoaded,
          initialLoadComplete: window.unifiedMapManagerInstance.initialLoadComplete
        });
        window.unifiedMapManagerInstance._lastLoggedState = JSON.stringify({
          markersLoaded: window.unifiedMapManagerInstance.markersLoaded,
          initialLoadComplete: window.unifiedMapManagerInstance.initialLoadComplete
        });
      }
    }, 100);
  }
})();

console.log('🔍 Debug script loaded. Watch for zoom/move events above.');
