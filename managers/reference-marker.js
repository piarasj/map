/**
 * =====================================================
 * FILE: managers/reference-marker.js
 * PURPOSE: Reference marker functionality for distance calculations
 * DEPENDENCIES: DistanceUtils, MapaListerConfig
 * EXPORTS: ReferenceMarker
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📍 Loading reference-marker.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DistanceUtils === 'undefined') missing.push('DistanceUtils');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ ReferenceMarker missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initReferenceMarker();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:distanceUtilsReady', retryInit);
    return;
  }

  function initReferenceMarker() {
    /**
     * REFERENCE MARKER SYSTEM
     * Manages location reference markers for distance calculations
     */
    const ReferenceMarker = {
      currentMarker: null,
      markerElement: null,
      mapboxMarker: null,

      /**
       * Set a reference marker at the specified coordinates
       * @param {number} lat - Latitude
       * @param {number} lng - Longitude  
       * @param {string} name - Marker name
       * @returns {boolean} Success status
       */
      set(lat, lng, name = 'Reference Point') {
        console.log(`📍 Setting reference marker: ${lat}, ${lng} - ${name}`);
        
        // Validate coordinates
        if (!this.validateCoordinates(lat, lng)) {
          console.error('❌ Invalid coordinates for reference marker');
          this.showToast('❌ Invalid coordinates', 'error');
          return false;
        }
        
        // Clear existing marker
        this.clear();
        
        // Store marker data
        this.currentMarker = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          name: name,
          timestamp: Date.now()
        };
        
        // Add visual marker to map if available
        if (typeof map !== 'undefined' && map) {
          this.addVisualMarker(lat, lng, name);
        }
        
        // Update all distances in sidebar
        this.notifyDistanceUpdate();
        
        // ADDITION: Ensure sidebar updates after setting reference
        console.log('📍 Reference marker set, updating sidebar distances...');
        
        // Trigger sidebar distance update with a small delay
        setTimeout(() => {
          if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
            window.SidebarManager.updateAllDistances();
          }
        }, 100);
        
        // ADDITION: Show notification if available
        if (window.notifications) {
          window.notifications.notifyLocationUpdate();
        }
        
        // Show success message
        this.showToast(`📍 Reference set: ${name}`, 'success');
        
        console.log('✅ Reference marker set successfully');
        return true;
      },

      /**
       * Clear the reference marker
       * @returns {boolean} Success status
       */
      clear() {
        if (!this.currentMarker) {
          console.log('⚠️ No reference marker to clear');
          return false;
        }
        
        console.log('🗑️ Clearing reference marker');
        
        // Remove visual marker
        this.removeVisualMarker();
        
        // Clear stored data
        this.currentMarker = null;
        
        // Update sidebar to remove distances
        this.notifyDistanceUpdate();
        
        // ADDITION: Update sidebar when reference is cleared
        console.log('🗑️ Reference marker cleared, updating sidebar...');
        
        setTimeout(() => {
          if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
            window.SidebarManager.updateAllDistances();
          }
        }, 100);
        
        // Show clear message
        this.showToast('🗑️ Reference marker cleared', 'info');
        
        console.log('✅ Reference marker cleared');
        return true;
      },

      /**
       * Check if reference marker exists
       * @returns {boolean} True if marker exists
       */
      exists() {
        return this.currentMarker !== null;
      },

      /**
       * Get current reference marker data
       * @returns {Object|null} Marker data or null
       */
      get() {
        return this.currentMarker;
      },

      /**
       * Get formatted distance from reference to target coordinates
       * @param {number} targetLat - Target latitude
       * @param {number} targetLng - Target longitude
       * @returns {string|null} Formatted distance or null
       */
      getFormattedDistanceTo(targetLat, targetLng) {
        if (!this.currentMarker) return null;
        
        try {
          const distance = DistanceUtils.calculateDistance(
            this.currentMarker.lat, this.currentMarker.lng,
            targetLat, targetLng
          );
          
          return DistanceUtils.formatDistance(distance);
        } catch (error) {
          console.warn('⚠️ Distance calculation failed:', error);
          return null;
        }
      },

      /**
       * Add visual marker to map
       * @param {number} lat - Latitude
       * @param {number} lng - Longitude
       * @param {string} name - Marker name
       */
      addVisualMarker(lat, lng, name) {
        if (!map) return;
        
        try {
          // Create custom marker element
          this.markerElement = document.createElement('div');
          this.markerElement.className = 'reference-marker-pin';
          this.markerElement.innerHTML = '📍';
          this.markerElement.style.cssText = `
            cursor: pointer;
            font-size: 32px;
            transform-origin: center bottom;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          `;
          
 
          
          
          
          
          
          
          
          
          
          // Create and add Mapbox marker
          this.mapboxMarker = new mapboxgl.Marker(this.markerElement)
            .setLngLat([lng, lat])
            .addTo(map);
          
          // Add popup with details
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="font-family: 'Outfit', sans-serif; text-align: center;">
                <strong>${name}</strong><br>
                <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small><br>
                <button onclick="ReferenceMarker.clear()" style="
                  margin-top: 8px;
                  padding: 4px 8px;
                  background: #ef4444;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 11px;
                ">Remove</button>
              </div>
            `);
          
          this.mapboxMarker.setPopup(popup);
          
          console.log('✅ Visual marker added to map');
        } catch (error) {
          console.error('❌ Failed to add visual marker:', error);
        }
      },

      /**
       * Remove visual marker from map
       */
      removeVisualMarker() {
        if (this.mapboxMarker) {
          try {
            this.mapboxMarker.remove();
            this.mapboxMarker = null;
            this.markerElement = null;
            console.log('✅ Visual marker removed from map');
          } catch (error) {
            console.warn('⚠️ Failed to remove visual marker:', error);
          }
        }
      },

      /**
       * Validate coordinates
       * @param {number} lat - Latitude
       * @param {number} lng - Longitude
       * @returns {boolean} True if valid
       */
      validateCoordinates(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' &&
               !isNaN(lat) && !isNaN(lng) &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
      },

      /**
       * Notify other components of distance update
       */
      notifyDistanceUpdate() {
        // Notify SidebarManager if available
        if (typeof SidebarManager !== 'undefined' && SidebarManager.updateAllDistances) {
          SidebarManager.updateAllDistances();
        }
        
        // Emit global event
        window.dispatchEvent(new CustomEvent('mapalister:distanceUpdate', {
          detail: { 
            hasReference: this.exists(),
            referenceMarker: this.currentMarker 
          }
        }));
      },

      /**
       * Show toast notification
       * @param {string} message - Message to show
       * @param {string} type - Type of message (success, info, warning, error)
       */
      showToast(message, type = 'info') {
        // Remove any existing toast first
        const existingToast = document.querySelector('.reference-toast');
        if (existingToast) {
          existingToast.remove();
        }
        
        const colors = {
          success: '#22c55e',
          info: '#3b82f6',
          warning: '#f59e0b',
          error: '#ef4444'
        };
        
        const toast = document.createElement('div');
        toast.className = 'reference-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${colors[type] || colors.info};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
          max-width: 320px;
          text-align: center;
        `;
        
        // Add animation styles if not present
        if (!document.getElementById('reference-toast-styles')) {
          const style = document.createElement('style');
          style.id = 'reference-toast-styles';
          style.textContent = `
            @keyframes slideDown {
              0% { transform: translateX(-50%) translateY(-100%); opacity: 0; }
              100% { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            @keyframes slideUp {
              0% { transform: translateX(-50%) translateY(0); opacity: 1; }
              100% { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }
        }, 4000);
      }
    };

    // Export to global scope
    window.ReferenceMarker = ReferenceMarker;
    
    // Backwards compatibility exports
    window.setReferenceMarker = (lat, lng, name) => ReferenceMarker.set(lat, lng, name);
    window.clearReferenceMarker = () => ReferenceMarker.clear();
    window.getReferenceMarker = () => ReferenceMarker.get();
    
    console.log('✅ reference-marker.js loaded successfully');
    
    // Mark as loaded
    if (window.MapaListerModules) {
      window.MapaListerModules.referenceMarker = true;
    }
    
    // Emit ready event
    window.dispatchEvent(new CustomEvent('mapalister:referenceMarkerReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initReferenceMarker();
  }

})();