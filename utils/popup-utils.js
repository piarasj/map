/**
 * =====================================================
 * FILE: utils/popup-utils.js (NEW FILE - CREATE THIS)
 * PURPOSE: Shared popup creation and management utilities
 * DEPENDENCIES: DataConfig, DistanceUtils
 * EXPORTS: PopupUtils
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎯 Loading popup-utils.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ PopupUtils missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initPopupUtils();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    return;
  }

  function initPopupUtils() {
    /**
     * POPUP UTILITIES
     * Centralized popup creation and management system
     */
    const PopupUtils = {
      activePopup: null,
      popupRegistry: new Set(),

      /**
       * Create a new popup instance and register it
       * @param {Object} options - Mapbox popup options
       * @returns {Object} Mapbox popup instance
       */
      createPopup(options = {}) {
        const defaultOptions = {
          closeButton: false,
          closeOnClick: false,
          className: 'enhanced-popup'
        };

        const popup = new mapboxgl.Popup({...defaultOptions, ...options});
        this.registerPopup(popup);
        return popup;
      },

      /**
       * Register a popup for tracking
       * @param {Object} popup - Mapbox popup instance
       */
      registerPopup(popup) {
        this.popupRegistry.add(popup);
        
        // Clean up on popup remove
        popup.on('close', () => {
          this.popupRegistry.delete(popup);
          if (this.activePopup === popup) {
            this.activePopup = null;
          }
        });
      },

      /**
       * Close all active popups
       */
      closeAllPopups() {
        console.log('🗑️ Closing all popups...');
        
        try {
          // Close all registered popups
          this.popupRegistry.forEach(popup => {
            if (popup.isOpen()) {
              popup.remove();
            }
          });
          
          // Clear registry
          this.popupRegistry.clear();
          this.activePopup = null;
          
          // Fallback: remove any popup elements that might be stuck in DOM
          document.querySelectorAll('.mapboxgl-popup').forEach(el => {
            try {
              el.remove();
            } catch (e) {
              console.warn('⚠️ Could not remove popup element:', e);
            }
          });
          
          console.log('✅ All popups closed');
        } catch (error) {
          console.error('❌ Error closing popups:', error);
        }
      },

      /**
       * Show enhanced popup with unified content
       * @param {Object} map - Mapbox map instance
       * @param {Object} feature - GeoJSON feature
       * @param {Array} coordinates - [lng, lat] coordinates
       * @param {Object} options - Additional options
       * @returns {Object} Popup instance
       */
      showEnhancedPopup(map, feature, coordinates, options = {}) {
        // Close any existing popups first
        this.closeAllPopups();
        
        const popup = this.createPopup();
        const content = this.createEnhancedPopupContent(feature, options);
        
        popup
          .setLngLat(coordinates)
          .setHTML(content)
          .addTo(map);
        
        this.activePopup = popup;
        
        // Store reference in MapManager for backwards compatibility
        if (window.MapManager) {
          window.MapManager.hoverPopup = popup;
        }
        
        return popup;
      },

      /**
       * Create enhanced popup content with unified styling
       * @param {Object} feature - GeoJSON feature
       * @param {Object} options - Content options
       * @returns {string} HTML content
       */
      createEnhancedPopupContent(feature, options = {}) {
        const config = DataConfig.getCurrentConfig();
        const properties = feature.properties;
        const coordinates = feature.geometry.coordinates;
        const [lng, lat] = coordinates;
        
        // Extract contact data using utility method
        const contactData = this.extractContactData(properties);
        
        // Generate unique popup ID for this instance
        const popupId = `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Build enhanced popup content with working close button
        let content = `
          <div class="enhanced-popup-content" id="${popupId}" style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 280px;
            max-width: 320px;
            position: relative;
          ">
            <!-- Working Close button -->
            <button onclick="window.PopupUtils.closeAllPopups()" style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: #f3f4f6;
              border: none;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10;
              transition: all 0.2s ease;
              color: #6b7280;
              font-size: 16px;
              line-height: 1;
            " onmouseover="this.style.background='#e5e7eb'; this.style.color='#374151'" 
               onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280'"
               title="Close popup">
              ×
            </button>
            
            <!-- Header -->
            <div class="popup-header" style="margin-bottom: 15px; padding-right: 32px;">
              <div class="contact-name" style="
                font-weight: 600;
                font-size: 16px;
                color: #111827;
                margin-bottom: 4px;
                line-height: 1.3;
              ">${contactData.name}</div>`;
        
        if (contactData.groupValue) {
          const color = this.getDatasetColor(contactData.groupValue);
          content += `
              <div class="contact-grouping" style="
                font-size: 12px;
                color: ${color};
                font-weight: 500;
              ">${config.groupingDisplayName || 'Group'}: ${contactData.groupValue}</div>`;
        }
        
        content += `</div>`;
        
        // Add contact actions
        content += this.buildContactActions(contactData);
        
        // Add contact details
        content += this.buildContactDetails(contactData, lat, lng);
        
        // Footer hint
        content += `
            <div class="popup-footer" style="
              margin-top: 15px;
              padding-top: 10px;
              padding-bottom: 5px;
              border-top: 1px solid #f3f4f6;
              font-size: 10px;
              color: #9ca3af;
              text-align: center;
              font-style: italic;
            ">
              📍 Right-click to set as reference
            </div>
          </div>`;
        
        return content;
      },

      /**
       * Extract contact data from properties with unified logic
       * @param {Object} properties - Feature properties
       * @returns {Object} Extracted contact data
       */
      extractContactData(properties) {
        const config = DataConfig.getCurrentConfig();
        
        return {
          name: this.extractPropertyValue(properties, [
            'name', 'Name', 'title', 'Title'
          ], 'Contact'),
          
          groupValue: this.extractPropertyValue(properties, [
            config.groupingProperty,
            config.groupingProperty.charAt(0).toUpperCase() + config.groupingProperty.slice(1),
            'dataset', 'Dataset', 'group', 'Group'
          ], null),
          
          address: this.extractPropertyValue(properties, ['Address', 'address'], null),
          telephone: this.extractPropertyValue(properties, ['Telephone', 'telephone', 'phone'], null),
          mobile: this.extractPropertyValue(properties, ['Mobile', 'mobile', 'cell'], null),
          email: this.extractPropertyValue(properties, ['Email', 'email'], null),
          parish: this.extractPropertyValue(properties, ['Parish', 'parish'], null),
          startYear: this.extractPropertyValue(properties, ['StartYear', 'start_year', 'startYear'], null),
          dob: this.extractPropertyValue(properties, ['DOB', 'dob', 'dateOfBirth'], null),
          note: this.extractPropertyValue(properties, ['Note', 'note', 'notes'], null)
        };
      },

      /**
       * Build contact actions section
       * @param {Object} contactData - Contact data object
       * @returns {string} HTML content
       */
      buildContactActions(contactData) {
        const { telephone, mobile, email } = contactData;
        const hasContactMethods = telephone || mobile || email;
        
        if (!hasContactMethods) return '';
        
        let content = `<div class="contact-actions" style="display: flex; gap: 8px; margin: 15px 0; flex-wrap: wrap;">`;
        
        if (telephone) {
          content += this.createActionButton('📞 Call', `tel:${telephone}`);
        }
        
        if (mobile) {
          content += this.createActionButton('📱 Mobile', `tel:${mobile}`);
        }
        
        if (email) {
          content += this.createActionButton('✉️ Email', `mailto:${email}`);
        }
        
        content += `</div>`;
        return content;
      },

      /**
       * Create action button HTML
       * @param {string} text - Button text
       * @param {string} href - Button link
       * @returns {string} HTML for action button
       */
      createActionButton(text, href) {
        return `
          <a href="${href}" class="action-btn" style="
            display: flex; align-items: center; gap: 6px; padding: 8px 10px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            text-decoration: none; color: #374151; font-size: 12px;
            transition: all 0.2s ease; cursor: pointer;
          " onmouseover="this.style.background='#e2e8f0'; this.style.transform='translateY(-1px)'" 
             onmouseout="this.style.background='#f8fafc'; this.style.transform='translateY(0)'">
            ${text}
          </a>`;
      },

      /**
       * Build contact details section
       * @param {Object} contactData - Contact data object
       * @param {number} lat - Latitude
       * @param {number} lng - Longitude
       * @returns {string} HTML content
       */
      buildContactDetails(contactData, lat, lng) {
        const { address, parish, startYear, dob, note } = contactData;
        const hasDetails = address || parish || startYear || dob;
        
        if (!hasDetails && !note) return '';
        
        let content = `
          <div class="contact-details" style="
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 12px;
          ">`;
        
        if (address) {
          content += this.createDetailRow('📍', address, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
        }
        
        if (parish) {
          content += this.createDetailRow('🏛️', parish);
        }
        
        if (startYear) {
          const currentYear = new Date().getFullYear();
          const yearsService = currentYear - parseInt(startYear);
          content += this.createDetailRow('📅', `Started ${startYear} (${yearsService} years service)`);
        }
        
        if (dob) {
          const dobText = this.formatDateOfBirth(dob);
          content += this.createDetailRow('🎂', dobText);
        }
        
        content += `</div>`;
        
        // Notes section
        if (note && note.trim()) {
          content += `
            <div class="contact-notes" style="
              border-top: 1px solid #f3f4f6;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            ">
              ${this.createDetailRow('📝', note)}
            </div>`;
        }
        
        // Distance from reference
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const distance = window.ReferenceMarker.getFormattedDistanceTo(lat, lng);
          if (distance) {
            content += this.createDetailRow('📏', `${distance} from reference`);
          }
        }
        
        return content;
      },

      /**
       * Create detail row HTML
       * @param {string} icon - Icon for the row
       * @param {string} text - Text content
       * @param {string} link - Optional link URL
       * @returns {string} HTML for detail row
       */
      createDetailRow(icon, text, link = null) {
        const truncatedText = text.length > 40 ? text.substring(0, 37) + '...' : text;
        const displayText = link ? 
          `<a href="${link}" target="_blank" title="${text}" style="color: #6b7280; text-decoration: none; line-height: 1.3;" 
             onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#6b7280'">${truncatedText}</a>` :
          `<span>${text}</span>`;
        
        return `
          <div class="detail-row" style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #6b7280;
          ">
            <span style="margin-top: 1px; flex-shrink: 0;">${icon}</span>
            ${displayText}
          </div>`;
      },

      /**
       * Format date of birth with age calculation
       * @param {string} dob - Date of birth
       * @returns {string} Formatted date with age
       */
      formatDateOfBirth(dob) {
        try {
          const dobDate = new Date(dob);
          if (!isNaN(dobDate.getTime())) {
            const day = dobDate.getDate().toString().padStart(2, '0');
            const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
            const year = dobDate.getFullYear();
            const formattedDob = `${day}/${month}/${year}`;
            
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
              age--;
            }
            
            return `Born ${formattedDob} (Age ${age})`;
          }
        } catch (e) {
          console.warn('Date parsing failed for:', dob);
        }
        
        return `Born ${dob}`;
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
      },

      /**
       * Get active popup count for debugging
       * @returns {number} Number of active popups
       */
      getActivePopupCount() {
        return this.popupRegistry.size;
      }
    };

    // Export to global scope
    window.PopupUtils = PopupUtils;
    
    console.log('✅ popup-utils.js loaded successfully');
    
    // Mark as loaded
    if (window.MapaListerModules) {
      window.MapaListerModules.popupUtils = true;
    }
    
    // Emit ready event
    window.dispatchEvent(new CustomEvent('mapalister:popupUtilsReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initPopupUtils();
  }

})();