/**
 * =====================================================
 * FILE: utils/popup-utils.js (ENHANCED WITH DEACONS LAYER DETECTION)
 * PURPOSE: Shared popup creation and management utilities with automatic hover setup
 * DEPENDENCIES: DataConfig, DistanceUtils, LucideUtils
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
    if (typeof LucideUtils === 'undefined') missing.push('LucideUtils');
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
    window.addEventListener('mapalister:lucideUtilsReady', retryInit);
    return;
  }

  function initPopupUtils() {
    /**
     * POPUP UTILITIES
     * Centralized popup creation and management system with hover event handling
     */
    const PopupUtils = {
      activePopup: null,
      popupRegistry: new Set(),
      hoverPopup: null,
      currentHoverLayer: null,

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
          if (this.hoverPopup === popup) {
            this.hoverPopup = null;
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
          this.hoverPopup = null;
          
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
       * Setup hover events for a map layer
       * @param {Object} map - Mapbox map instance
       * @param {string} layerId - Layer ID to attach hover events to
       * @param {Object} options - Additional options
       */
      setupHoverEvents(map, layerId = 'contacts', options = {}) {
        if (!map || !map.getLayer || !map.getLayer(layerId)) {
          console.warn(`⚠️ Cannot setup hover events - layer '${layerId}' not found`);
          return false;
        }
        
        console.log(`🎯 Setting up hover events for layer: ${layerId}`);
        
        // Remove existing event listeners to prevent duplicates
        if (this.currentHoverLayer) {
          map.off('mouseenter', this.currentHoverLayer);
          map.off('mouseleave', this.currentHoverLayer);
          map.off('mousemove', this.currentHoverLayer);
        }
        
        // Create hover popup instance
        this.hoverPopup = this.createPopup({
          className: 'hover-popup enhanced-popup'
        });
        
        this.currentHoverLayer = layerId;
        
        // Mouse enter event
        map.on('mouseenter', layerId, (e) => {
          // Change cursor
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates.slice();
            
            // Handle coordinate wrapping for mercator projection
            if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }
            
            // Show popup using enhanced content
            const content = this.createEnhancedPopupContent(feature, options);
            
            this.hoverPopup
              .setLngLat(coordinates)
              .setHTML(content)
              .addTo(map);
            
            // Initialize Lucide icons
            if (window.LucideUtils) {
              setTimeout(() => LucideUtils.init(), 10);
            }
            
            console.log('🎯 Hover popup shown for:', feature.properties.name || 'marker');
          }
        });
        
        // Mouse leave event
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          if (this.hoverPopup) {
            this.hoverPopup.remove();
          }
        });
        
        // Mouse move event for smooth positioning
        map.on('mousemove', layerId, (e) => {
          if (this.hoverPopup && this.hoverPopup.isOpen() && e.features && e.features.length > 0) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            
            if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }
            
            this.hoverPopup.setLngLat(coordinates);
          }
        });
        
        console.log(`✅ Hover events setup complete for layer: ${layerId}`);
        return true;
      },

      /**
       * Setup both click and hover events for map markers
       * @param {Object} map - Mapbox map instance
       * @param {string} layerId - Layer ID containing markers
       */
      setupMapInteractions(map, layerId) {
        if (!map || !map.getLayer || !map.getLayer(layerId)) {
          console.warn(`⚠️ Cannot setup interactions - layer '${layerId}' not found`);
          return false;
        }
        
        console.log(`🎯 Setting up click and hover interactions for layer: ${layerId}`);
        
        // Remove existing event listeners to prevent duplicates
        map.off('click', layerId);
        map.off('mouseenter', layerId);
        map.off('mouseleave', layerId);
        
        // Create popup for interactions
        const interactionPopup = this.createPopup({
          className: 'interaction-popup enhanced-popup'
        });
        
        // CLICK EVENT - Show popup on click
        map.on('click', layerId, (e) => {
          console.log('🖱️ Marker clicked:', e.features[0]);
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates.slice();
            
            // Handle coordinate wrapping
            if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }
            
            // Close any existing popups
            this.closeAllPopups();
            
            // Show popup
            const content = this.createEnhancedPopupContent(feature);
            interactionPopup
              .setLngLat(coordinates)
              .setHTML(content)
              .addTo(map);
            
            // Initialize Lucide icons
            if (window.LucideUtils) {
              setTimeout(() => LucideUtils.init(), 10);
            }
            
            console.log('✅ Click popup shown for:', feature.properties.name || 'marker');
          }
        });
        
        // HOVER EVENTS - Show hover popup
        map.on('mouseenter', layerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates.slice();
            
            // Handle coordinate wrapping
            if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }
            
            // Create hover popup with lighter styling
            const hoverContent = this.createEnhancedPopupContent(feature, { isHover: true });
            
            // Create separate hover popup to avoid conflicts with click popup
            const hoverPopup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'hover-popup'
            });
            
            hoverPopup
              .setLngLat(coordinates)
              .setHTML(hoverContent)
              .addTo(map);
            
            // Store hover popup reference
            map._mapaListerHoverPopup = hoverPopup;
            
            if (window.LucideUtils) {
              setTimeout(() => LucideUtils.init(), 10);
            }
          }
        });
        
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          
          // Remove hover popup
          if (map._mapaListerHoverPopup) {
            map._mapaListerHoverPopup.remove();
            map._mapaListerHoverPopup = null;
          }
        });
        
        console.log(`✅ Click and hover interactions setup complete for layer: ${layerId}`);
        return true;
      },

      /**
       * ENHANCED: Auto-setup map interactions with deacons layer detection
       */
      autoSetupMapInteractions(map = null) {
        const targetMap = map || window.map;
        if (!targetMap) {
          console.warn('⚠️ No map available for interaction setup');
          return false;
        }
        
        console.log('🔄 Auto-setting up map interactions...');
        
        // Wait for map to be ready
        setTimeout(() => {
          // ENHANCED: Try common layer names INCLUDING deacons/priests/clergy
          const possibleLayers = [
            'deacons-markers', 'deacons', 'deacon-markers', 'deacon',    // Deacon layers
            'priests-markers', 'priests', 'priest-markers', 'priest',    // Priest layers
            'clergy-markers', 'clergy',                                  // Clergy layers
            'contacts', 'markers', 'points', 'data-points', 'geojson-points',
            'uploaded-data', 'user-data', 'contact-markers', 'geojson-data'
          ];
          
          let setupSuccess = false;
          
          // First try known layer names
          for (const layerId of possibleLayers) {
            try {
              if (targetMap.getLayer && targetMap.getLayer(layerId)) {
                console.log(`🎯 Found layer: ${layerId} - setting up interactions`);
                const success = this.setupMapInteractions(targetMap, layerId);
                if (success) {
                  setupSuccess = true;
                  break;
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error checking layer ${layerId}:`, error);
            }
          }
          
          // If no known layers found, scan all layers
          if (!setupSuccess) {
            console.log('🔍 Scanning all map layers for markers...');
            try {
              const style = targetMap.getStyle();
              const layers = style.layers || [];
              
              console.log('📋 Available layers:', layers.map(l => `${l.id} (${l.type})`));
              
              // ENHANCED: Look for circle or symbol layers (typical for markers)
              const markerLayers = layers.filter(layer => {
                const id = layer.id.toLowerCase();
                const type = layer.type;
                
                // Check for marker-like types
                const isMarkerType = type === 'circle' || type === 'symbol';
                
                // Enhanced name detection
                const isMarkerName = id.includes('marker') ||
                                    id.includes('point') ||
                                    id.includes('contact') ||
                                    id.includes('geojson') ||
                                    id.includes('deacon') ||    // Add deacon detection
                                    id.includes('priest') ||    // Add priest detection
                                    id.includes('clergy') ||    // Add clergy detection
                                    id.includes('people') ||    // Add people detection
                                    id.includes('person');      // Add person detection
                
                // Exclude system layers
                const isNotSystemLayer = !id.includes('background') &&
                                        !id.includes('landuse') &&
                                        !id.includes('water') &&
                                        !id.includes('building') &&
                                        !id.includes('road') &&
                                        !id.includes('label') &&
                                        !id.includes('counties') &&
                                        !id.includes('dioceses') &&
                                        !id.includes('irish-');
                
                return (isMarkerType || isMarkerName) && isNotSystemLayer;
              });
              
              if (markerLayers.length > 0) {
                const layerId = markerLayers[0].id;
                console.log(`🎯 Found potential marker layer: ${layerId} (${markerLayers[0].type})`);
                setupSuccess = this.setupMapInteractions(targetMap, layerId);
              } else {
                console.warn('⚠️ No potential marker layers found');
                console.log('💡 Available layers:', layers.map(l => `${l.id} (${l.type})`).join(', '));
              }
            } catch (error) {
              console.error('❌ Error scanning for marker layers:', error);
            }
          }
          
          if (setupSuccess) {
            console.log('✅ Map interactions setup successful');
          } else {
            console.warn('⚠️ Map interactions setup failed - no suitable layers found');
          }
          
          return setupSuccess;
        }, 300);
      },

      /**
       * ENHANCED: Auto-detect and setup hover events for marker layers including deacons
       * @param {Object} map - Mapbox map instance
       */
      autoSetupHoverEvents(map = null) {
        // Use provided map or global map
        const targetMap = map || window.map;
        if (!targetMap) {
          console.warn('⚠️ No map available for hover setup');
          return false;
        }
        
        // Wait a bit for layers to be ready
        setTimeout(() => {
          // ENHANCED: Try common layer names including deacons/priests/clergy
          const possibleLayers = [
            'deacons-markers', 'deacons', 'deacon-markers', 'deacon',    // Deacon layers
            'priests-markers', 'priests', 'priest-markers', 'priest',    // Priest layers  
            'clergy-markers', 'clergy',                                  // Clergy layers
            'contacts', 'markers', 'points', 'data-points', 'geojson-points', 
            'uploaded-data', 'user-data', 'contact-markers'
          ];
          
          let setupSuccess = false;
          
          for (const layerId of possibleLayers) {
            try {
              if (targetMap.getLayer && targetMap.getLayer(layerId)) {
                console.log(`🔄 Auto-setting up hover events for: ${layerId}`);
                const success = this.setupHoverEvents(targetMap, layerId);
                if (success) {
                  setupSuccess = true;
                  break;
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error checking layer ${layerId}:`, error);
            }
          }
          
          if (!setupSuccess) {
            console.log('🔍 No standard marker layers found, checking all layers...');
            try {
              const style = targetMap.getStyle();
              const layers = style.layers || [];
              
              // ENHANCED: Look for circle or symbol layers (likely markers)
              const markerLayers = layers.filter(layer => {
                const id = layer.id.toLowerCase();
                const type = layer.type;
                
                return (type === 'circle' || type === 'symbol') &&
                       (id.includes('marker') || id.includes('point') || id.includes('contact') ||
                        id.includes('deacon') || id.includes('priest') || id.includes('clergy'));
              });
              
              if (markerLayers.length > 0) {
                const layerId = markerLayers[0].id;
                console.log(`🎯 Found potential marker layer: ${layerId}`);
                this.setupHoverEvents(targetMap, layerId);
                setupSuccess = true;
              }
            } catch (error) {
              console.warn('⚠️ Error scanning for marker layers:', error);
            }
          }
          
          return setupSuccess;
        }, 100);
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
        
        // Initialize Lucide icons after popup is added to DOM
        setTimeout(() => {
          LucideUtils.init();
        }, 10);
        
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
            <!-- Working Close button with Lucide icon -->
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
            " onmouseover="this.style.background='#e5e7eb'; this.style.color='#374151'" 
               onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280'"
               title="Close popup">
              ${LucideUtils.icon('x', { size: 14 })}
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
              ${LucideUtils.icon('map-pin', { size: 12 })} Right-click to set as reference
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
          content += this.createActionButton(
            `${LucideUtils.icon('phone', { size: 14 })} Call`, 
            `tel:${telephone}`
          );
        }
        
        if (mobile) {
          content += this.createActionButton(
            `${LucideUtils.icon('smartphone', { size: 14 })} Mobile`, 
            `tel:${mobile}`
          );
        }
        
        if (email) {
          content += this.createActionButton(
            `${LucideUtils.icon('mail', { size: 14 })} Email`, 
            `mailto:${email}`
          );
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
          content += this.createDetailRow(
            LucideUtils.icon('map-pin', { size: 14 }), 
            address, 
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
          );
        }
        
        if (parish) {
          content += this.createDetailRow(
            LucideUtils.icon('building', { size: 14 }), 
            parish
          );
        }
        
        if (startYear) {
          const currentYear = new Date().getFullYear();
          const yearsService = currentYear - parseInt(startYear);
          content += this.createDetailRow(
            LucideUtils.icon('calendar', { size: 14 }), 
            `Started ${startYear} (${yearsService} years service)`
          );
        }
        
        if (dob) {
          const dobText = this.formatDateOfBirth(dob);
          content += this.createDetailRow(
            LucideUtils.icon('cake', { size: 14 }), 
            dobText
          );
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
              ${this.createDetailRow(LucideUtils.icon('file-text', { size: 14 }), note)}
            </div>`;
        }
        
        // Distance from reference
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const distance = window.ReferenceMarker.getFormattedDistanceTo(lat, lng);
          if (distance) {
            content += this.createDetailRow(
              LucideUtils.icon('ruler', { size: 14 }), 
              `${distance} from reference`
            );
          }
        }
        
        return content;
      },

      /**
       * Create detail row HTML
       * @param {string} icon - Lucide icon HTML
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
    
    // Setup auto-initialization when data is uploaded
    window.addEventListener('mapalister:dataUploaded', (event) => {
      console.log('📁 Data uploaded - setting up map interactions...');
      setTimeout(() => {
        PopupUtils.autoSetupMapInteractions();
      }, 800);
    });
    
    // Setup map event listeners when map becomes available
    PopupUtils.setupMapEventListeners = function() {
      if (window.map && typeof window.map.on === 'function') {
        window.map.on('sourcedata', (e) => {
          if (e.sourceId && (e.sourceId.includes('contact') || e.sourceId.includes('geojson') || e.sourceId.includes('deacon'))) {
            console.log('🗺️ Map source data changed - setting up interactions...');
            setTimeout(() => {
              PopupUtils.autoSetupMapInteractions();
            }, 400);
          }
        });
        console.log('✅ Map event listeners setup for PopupUtils');
      }
    };
    
    // Global manual setup function for testing
    window.setupMapInteractionsManually = function() {
      console.log('🔧 Manual map interactions setup...');
      
      if (!window.map) {
        console.error('❌ No map found');
        return;
      }
      
      if (!PopupUtils) {
        console.error('❌ PopupUtils not found');
        return;
      }
      
      const success = PopupUtils.autoSetupMapInteractions(window.map);
      
      if (success) {
        console.log('✅ Manual setup completed - try clicking or hovering on markers!');
      } else {
        console.log('❌ Manual setup failed - check console for layer information');
      }
    };
    
    console.log('✅ popup-utils.js loaded successfully with enhanced deacons layer detection');
    
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