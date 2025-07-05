/**
 * =====================================================
 * FILE: config/distance-utils.js
 * PURPOSE: Distance calculation and formatting utilities with settings integration
 * DEPENDENCIES: None (standalone utility)
 * EXPORTS: DistanceUtils
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📏 Loading distance-utils.js...');

  /**
   * DISTANCE UTILITIES
   * Handles distance calculations and formatting with unit conversion
   */
  const DistanceUtils = {
    // Default unit (can be changed via settings)
    currentUnit: 'km',
    
    // Conversion constants
    EARTH_RADIUS_KM: 6371,
    KM_TO_MILES: 0.621371,
    
    /**
     * Set the current distance unit
     * @param {string} unit - 'km' or 'miles'
     */
    setUnit(unit) {
      if (unit === 'km' || unit === 'miles') {
        const oldUnit = this.currentUnit;
        this.currentUnit = unit;
        
        if (oldUnit !== unit) {
          console.log(`📏 Distance unit changed: ${oldUnit} → ${unit}`);
          
          // Notify other components if needed
          this.notifyUnitChange(unit);
        }
      } else {
        console.warn('⚠️ Invalid distance unit:', unit);
      }
    },
    
    /**
     * Get the current distance unit
     * @returns {string} Current unit ('km' or 'miles')
     */
    getUnit() {
      return this.currentUnit;
    },
    
    /**
     * Notify other components about unit change
     * @param {string} newUnit - New unit
     */
    notifyUnitChange(newUnit) {
      // Update any existing distance displays
      if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
        // Small delay to ensure settings are saved
        setTimeout(() => {
          window.SidebarManager.updateAllDistances();
        }, 100);
      }
      
      // Update reference marker info if it exists
      if (window.ReferenceMarker && window.ReferenceMarker.updateDisplay) {
        window.ReferenceMarker.updateDisplay();
      }
    },
    
    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lng1 - Longitude of first point  
     * @param {number} lat2 - Latitude of second point
     * @param {number} lng2 - Longitude of second point
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
      // Validate inputs
      if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
        console.warn('⚠️ Invalid coordinates for distance calculation:', {lat1, lng1, lat2, lng2});
        return null;
      }
      
      try {
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                 Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = this.EARTH_RADIUS_KM * c;
        
        return distanceKm;
      } catch (error) {
        console.error('❌ Distance calculation error:', error);
        return null;
      }
    },
    
    /**
     * Format distance with current unit setting
     * @param {number} distanceKm - Distance in kilometers
     * @returns {string} Formatted distance string
     */
    formatDistance(distanceKm) {
      if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
        return 'Unknown';
      }
      
      try {
        if (this.currentUnit === 'miles') {
          const distanceMiles = distanceKm * this.KM_TO_MILES;
          
          if (distanceMiles < 0.1) {
            return '< 0.1 mi';
          } else if (distanceMiles < 1) {
            return `${distanceMiles.toFixed(1)} mi`;
          } else if (distanceMiles < 10) {
            return `${distanceMiles.toFixed(1)} mi`;
          } else {
            return `${Math.round(distanceMiles)} mi`;
          }
        } else {
          // Default to kilometers
          if (distanceKm < 0.1) {
            return '< 0.1 km';
          } else if (distanceKm < 1) {
            return `${(distanceKm * 1000).toFixed(0)} m`;
          } else if (distanceKm < 10) {
            return `${distanceKm.toFixed(1)} km`;
          } else {
            return `${Math.round(distanceKm)} km`;
          }
        }
      } catch (error) {
        console.error('❌ Distance formatting error:', error);
        return 'Error';
      }
    },
    
    /**
     * Format distance with specific unit (override current setting)
     * @param {number} distanceKm - Distance in kilometers
     * @param {string} unit - Unit to use ('km' or 'miles')
     * @returns {string} Formatted distance string
     */
    formatDistanceWithUnit(distanceKm, unit) {
      const originalUnit = this.currentUnit;
      this.currentUnit = unit;
      const formatted = this.formatDistance(distanceKm);
      this.currentUnit = originalUnit; // Restore original unit
      return formatted;
    },
    
    /**
     * Get distance in specified unit
     * @param {number} distanceKm - Distance in kilometers
     * @param {string} unit - Target unit ('km' or 'miles')
     * @returns {number} Distance in specified unit
     */
    convertDistance(distanceKm, unit = this.currentUnit) {
      if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
        return null;
      }
      
      if (unit === 'miles') {
        return distanceKm * this.KM_TO_MILES;
      } else {
        return distanceKm; // Already in km
      }
    },
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    toRadians(degrees) {
      return degrees * (Math.PI / 180);
    },
    
    /**
     * Validate coordinate values
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if coordinates are valid
     */
    isValidCoordinate(lat, lng) {
      return typeof lat === 'number' && 
             typeof lng === 'number' && 
             !isNaN(lat) && 
             !isNaN(lng) &&
             lat >= -90 && 
             lat <= 90 && 
             lng >= -180 && 
             lng <= 180;
    },
    
    /**
     * Calculate bearing between two points
     * @param {number} lat1 - Start latitude
     * @param {number} lng1 - Start longitude
     * @param {number} lat2 - End latitude
     * @param {number} lng2 - End longitude
     * @returns {number} Bearing in degrees (0-360)
     */
    calculateBearing(lat1, lng1, lat2, lng2) {
      if (!this.isValidCoordinate(lat1, lng1) || !this.isValidCoordinate(lat2, lng2)) {
        return null;
      }
      
      try {
        const dLng = this.toRadians(lng2 - lng1);
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        
        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                 Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        
        let bearing = Math.atan2(y, x);
        bearing = (bearing * 180 / Math.PI + 360) % 360;
        
        return bearing;
      } catch (error) {
        console.error('❌ Bearing calculation error:', error);
        return null;
      }
    },
    
    /**
     * Get cardinal direction from bearing
     * @param {number} bearing - Bearing in degrees
     * @returns {string} Cardinal direction (N, NE, E, SE, S, SW, W, NW)
     */
    getCardinalDirection(bearing) {
      if (bearing === null || bearing === undefined || isNaN(bearing)) {
        return '';
      }
      
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const index = Math.round(bearing / 45) % 8;
      return directions[index];
    },
    
    /**
     * Format bearing with cardinal direction
     * @param {number} bearing - Bearing in degrees
     * @returns {string} Formatted bearing string
     */
    formatBearing(bearing) {
      if (bearing === null || bearing === undefined || isNaN(bearing)) {
        return '';
      }
      
      const cardinal = this.getCardinalDirection(bearing);
      return `${Math.round(bearing)}° ${cardinal}`;
    },
    
    /**
     * Calculate distance and bearing between two points
     * @param {number} lat1 - Start latitude
     * @param {number} lng1 - Start longitude
     * @param {number} lat2 - End latitude
     * @param {number} lng2 - End longitude
     * @returns {Object} Object with distance and bearing
     */
    calculateDistanceAndBearing(lat1, lng1, lat2, lng2) {
      const distance = this.calculateDistance(lat1, lng1, lat2, lng2);
      const bearing = this.calculateBearing(lat1, lng1, lat2, lng2);
      
      return {
        distance,
        bearing,
        formattedDistance: this.formatDistance(distance),
        formattedBearing: this.formatBearing(bearing),
        cardinalDirection: this.getCardinalDirection(bearing)
      };
    },
    
    /**
     * Initialize with settings integration
     */
    init() {
      // Get initial unit from settings if available
      if (window.SettingsManager && window.SettingsManager.getSetting) {
        const savedUnit = window.SettingsManager.getSetting('distanceUnit');
        if (savedUnit) {
          this.setUnit(savedUnit);
        }
      }
      
      console.log(`✅ DistanceUtils initialized with unit: ${this.currentUnit}`);
    }
  };

  // Export DistanceUtils to window
  window.DistanceUtils = DistanceUtils;

  // Initialize if settings are already available
  if (typeof window.SettingsManager !== 'undefined') {
    DistanceUtils.init();
  } else {
    // Wait for settings to be ready
    window.addEventListener('mapalister:settingsReady', () => {
      DistanceUtils.init();
    });
  }

  // Dispatch event to indicate DistanceUtils is ready
  window.dispatchEvent(new CustomEvent('mapalister:distanceUtilsReady'));

  console.log('✅ DistanceUtils loaded and exported to window');

})();