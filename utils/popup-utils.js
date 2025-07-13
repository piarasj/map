/**
 * =====================================================
 * FILE: utils/popup-utils.js (FIXED WITH CORRECT LUCIDE ICONS)
 * PURPOSE: Popup utilities with Lucide icons instead of emojis
 * DEPENDENCIES: DataConfig, LucideUtils
 * EXPORTS: PopupUtils
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎯 Loading popup-utils.js (with fixed Lucide icons)...');

  function initPopupUtils() {
    /**
     * POPUP UTILITIES WITH LUCIDE ICONS
     */
    const PopupUtils = {
      // Core popup tracking
      activePopup: null,
      popupRegistry: new Set(),
      hoverPopup: null,

      // Feature-to-popup mapping system
      popupFeatureMap: new Map(),
      popupIdToFeature: new Map(),

      /**
       * Create a new popup instance and register it
       */
      createPopup(options = {}) {
        console.log('🔧 Creating new popup with options:', options);
        const defaultOptions = {
          closeButton: false,
          closeOnClick: false,
          className: 'enhanced-popup'
        };

        const popup = new mapboxgl.Popup({...defaultOptions, ...options});
        this.registerPopup(popup);
        console.log('✅ Popup created and registered');
        return popup;
      },

      /**
       * Register a popup for tracking
       */
      registerPopup(popup) {
        console.log('📝 Registering popup for tracking');
        this.popupRegistry.add(popup);
        
        popup.on('close', () => {
          console.log('🗑️ Popup closed, cleaning up references');
          this.popupRegistry.delete(popup);
          this.popupFeatureMap.delete(popup);
          
          if (this.activePopup === popup) {
            this.activePopup = null;
            console.log('🔄 Cleared activePopup reference');
          }
          if (this.hoverPopup === popup) {
            this.hoverPopup = null;
            console.log('🔄 Cleared hoverPopup reference');
          }
        });
      },

      /**
       * Close all active popups
       */
      closeAllPopups() {
        console.log('🗑️ POPUP-UTILS: Closing all popups...');
        console.log('📊 Current popup registry size:', this.popupRegistry.size);
        
        try {
          this.popupRegistry.forEach(popup => {
            if (popup.isOpen()) {
              console.log('🗑️ Removing open popup');
              popup.remove();
            }
          });
          
          // Clear all mapping data
          this.popupRegistry.clear();
          this.popupFeatureMap.clear();
          this.popupIdToFeature.clear();
          this.activePopup = null;
          this.hoverPopup = null;
          
          console.log('✅ POPUP-UTILS: All popups closed and data cleared');
        } catch (error) {
          console.error('❌ POPUP-UTILS: Error closing popups:', error);
        }
      },

      /**
       * Get the latest feature data with flags from global storage
       */
      getLatestFeatureData(feature) {
        console.log('🔍 Getting latest feature data for:', feature.properties?.name || 'unnamed');
        console.log('🔍 Feature coordinates:', feature.geometry?.coordinates);
        console.log('🔍 Current flag state:', feature.properties?.flagged);
        
        // Try to find the matching feature in global data first
        if (window.geojsonData && window.geojsonData.features) {
          console.log('🔍 Searching in global data with', window.geojsonData.features.length, 'features');
          
          const matchedFeature = window.geojsonData.features.find(f => {
            if (f.geometry && feature.geometry && 
                f.geometry.coordinates && feature.geometry.coordinates) {
              const [lng1, lat1] = f.geometry.coordinates;
              const [lng2, lat2] = feature.geometry.coordinates;
              
              // More lenient coordinate matching + name fallback
              const coordMatch = Math.abs(lng1 - lng2) < 0.001 && Math.abs(lat1 - lat2) < 0.001;
              const nameMatch = f.properties?.name === feature.properties?.name;
              
              const match = coordMatch || nameMatch;
              
              if (match) {
                console.log('🎯 Found matching feature by', coordMatch ? 'coordinates' : 'name');
                console.log('🎯 Coordinate diff:', Math.abs(lng1 - lng2), Math.abs(lat1 - lat2));
              }
              return match;
            }
            return false;
          });
          
          if (matchedFeature) {
            console.log('✅ Found latest feature in global data, flagged:', matchedFeature.properties.flagged === true);
            console.log('📊 Global feature properties:', Object.keys(matchedFeature.properties));
            return matchedFeature;
          } else {
            console.log('⚠️ No matching feature found in global data');
          }
        } else {
          console.log('⚠️ No global geojsonData available');
        }
        
        console.log('⚠️ Using original feature data, flagged:', feature.properties.flagged === true);
        return feature;
      },

      /**
       * Show enhanced popup with flag support
       */
      showEnhancedPopup(map, feature, coordinates) {
        console.log('🎯 POPUP-UTILS: Showing ENHANCED popup for:', feature.properties.name || 'unnamed');
        console.log('📍 Popup coordinates:', coordinates);
        
        // Get the latest feature data with flags from global storage
        const latestFeature = this.getLatestFeatureData(feature);
        console.log('📝 POPUP-UTILS: Using latest feature data, flagged:', latestFeature.properties.flagged === true);
        
        // Close any existing popups
        this.closeAllPopups();

        // Create enhanced popup
        const popup = this.createPopup({
          closeButton: true,
          closeOnClick: false,
          className: 'enhanced-popup interaction-popup'
        });
        
        // Style the close button after popup is added
        setTimeout(() => {
          const closeBtn = document.querySelector('.mapboxgl-popup-close-button');
          if (closeBtn) {
            closeBtn.style.cssText = `
              background: #f3f4f6 !important;
              border-radius: 50% !important;
              width: 24px !important;
              height: 24px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              color: #6b7280 !important;
              font-size: 14px !important;
              font-weight: normal !important;
              transition: all 0.2s ease !important;
              top: 8px !important;
              right: 8px !important;
            `;
            closeBtn.onmouseenter = () => {
              closeBtn.style.background = '#e5e7eb';
              closeBtn.style.color = '#374151';
              closeBtn.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseleave = () => {
              closeBtn.style.background = '#f3f4f6';
              closeBtn.style.color = '#6b7280';
              closeBtn.style.transform = 'scale(1)';
            };
          }
        }, 50);

        console.log('🔧 Creating popup content...');
        const content = this.createEnhancedPopupContent(latestFeature);
        console.log('📄 Popup content length:', content.length);
        
        popup.setLngLat(coordinates)
          .setHTML(content)
          .addTo(map);

        // Store feature reference
        popup._feature = latestFeature;
        this.activePopup = popup;
        this.popupFeatureMap.set(popup, latestFeature);
        
        // Initialize Lucide icons after popup content is added
        setTimeout(() => {
          if (window.LucideUtils) {
            window.LucideUtils.init();
          }
        }, 50);
        
        console.log('✅ POPUP-UTILS: Enhanced popup shown with flag support');
        return popup;
      },

      /**
       * Create enhanced popup content with Lucide icons
       */
      createEnhancedPopupContent(feature, options = {}) {
        console.log('🔧 Creating enhanced popup content for:', feature.properties?.name || 'unnamed');
        
        const config = DataConfig.getCurrentConfig();
        console.log('⚙️ Using config:', config);
        
        const properties = feature.properties;
        const coordinates = feature.geometry.coordinates;
        const [lng, lat] = coordinates;
        
        // Extract contact data
        const contactData = this.extractContactData(properties);
        console.log('📊 Extracted contact data:', contactData);
        
        // Generate unique popup ID
        const popupId = `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🆔 Generated popup ID:', popupId);
        
        // Store feature reference for flagging functionality
        this.popupIdToFeature.set(popupId, feature);
        
let content = `
          <div class="enhanced-popup-content" id="${popupId}" style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 280px;
            max-width: 320px;
            position: relative;
          ">
            <div class="popup-header" style="margin-bottom: 15px;">
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
        
        // Get the current flag state before building HTML
        const latestFeature = this.getLatestFeatureData(feature);
        const isFlagged = latestFeature.properties.flagged === true;
        const flagIcon = window.LucideUtils ? window.LucideUtils.icon('flag', { size: 12 }) : '🚩';
        
        content += `
        <button 
          onclick="console.log('🚩 Flag button clicked for popup: ${popupId}'); window.PopupUtils.toggleFlag('${popupId}')"
          style="
            position: absolute;
            top: 8px;
            left: 8px;
            background: ${isFlagged ? '#ef4444' : '#f3f4f6'};
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isFlagged ? 'white' : '#6b7280'};
            z-index: 10;
          "
          onmouseover="this.style.background='${isFlagged ? '#dc2626' : '#e5e7eb'}'; this.style.transform='scale(1.1)'"
          onmouseout="this.style.background='${isFlagged ? '#ef4444' : '#f3f4f6'}'; this.style.transform='scale(1)'"
          title="${isFlagged ? 'Flagged - Click to remove. Appears as red text in sidebar.' : 'Click to flag - Flagged contacts appear as red text in sidebar'}"
        >
          ${flagIcon}
        </button>
        </div>`;
        content += this.buildContactActions(contactData);
        content += this.buildContactDetails(contactData, lat, lng);
        
        // Style the close button to match flag button
        setTimeout(() => {
          const closeBtn = document.querySelector('.mapboxgl-popup-close-button');
          if (closeBtn) {
            closeBtn.style.cssText = `
              background: #f3f4f6 !important;
              border-radius: 50% !important;
              width: 24px !important;
              height: 24px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              color: #6b7280 !important;
              font-size: 14px !important;
              font-weight: normal !important;
              transition: all 0.2s ease !important;
              top: 8px !important;
              right: 8px !important;
              z-index: 10 !important;
            `;
            closeBtn.onmouseenter = () => {
              closeBtn.style.background = '#e5e7eb';
              closeBtn.style.color = '#374151';
              closeBtn.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseleave = () => {
              closeBtn.style.background = '#f3f4f6';
              closeBtn.style.color = '#6b7280';
              closeBtn.style.transform = 'scale(1)';
            };
          }
        }, 50);
        
        const locationIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 12 }) : '📍';
        
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            ${locationIcon} Right-click to set as reference
          </div>
        </div>`;
        
        console.log('✅ Popup content created successfully');
        return content;
      },

      /**
       * Build simple flag section for popup with Lucide icons
       */
      buildSimpleFlagSection(feature, popupId = null) {
        console.log('🚩 Building simple flag section...');
        
        if (!feature || !feature.properties) {
          console.log('❌ No feature or properties provided');
          return '';
        }
        
        // Get latest feature data with flags
        const latestFeature = this.getLatestFeatureData(feature);
        const isFlagged = latestFeature.properties.flagged === true;
        
        console.log('🚩 Flag section - Feature:', latestFeature.properties?.name || 'unnamed');
        console.log('🚩 Flag section - Current flag state:', isFlagged);
        
        // Use provided popupId or get current one
        const currentPopupId = popupId || this.getCurrentPopupId(latestFeature);
        console.log('🆔 Using popup ID for flag section:', currentPopupId);
        
        const flagIcon = window.LucideUtils ? window.LucideUtils.icon('flag', { size: 14 }) : '🚩';
        
        const flagHtml = `
          <div class="flag-section" style="
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
          ">
            
            <button 
              onclick="console.log('🚩 Flag button clicked for popup: ${currentPopupId}'); window.PopupUtils.toggleFlag('${currentPopupId}')"
              style="
                background: ${isFlagged ? '#ef4444' : '#f3f4f6'};
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${isFlagged ? 'white' : '#6b7280'};
              "
              onmouseover="this.style.background='${isFlagged ? '#dc2626' : '#e5e7eb'}'; this.style.transform='scale(1.1)'"
              onmouseout="this.style.background='${isFlagged ? '#ef4444' : '#f3f4f6'}'; this.style.transform='scale(1)'"
              title="${isFlagged ? 'Flagged - Click to remove' : 'Click to flag - Flagged contacts appear as red text in sidebar'}"
            >
              ${flagIcon}
            </button>
            
            ${isFlagged ? `<div style="
              font-size: 9px;
              color: #ef4444;
              text-align: right;
              margin-top: 4px;
              line-height: 1.2;
              font-weight: 500;
            ">
              Appears as red text in sidebar
            </div>` : ''}
          </div>`;
        
        console.log('✅ Flag section HTML generated, length:', flagHtml.length);
        return flagHtml;
      },

      /**
       * Build contact actions section with Lucide icons
       */
      buildContactActions(contactData) {
        const { telephone, mobile, email } = contactData;
        const hasContactMethods = telephone || mobile || email;
        
        if (!hasContactMethods) return '';
        
        let content = `<div class="contact-actions" style="display: flex; gap: 8px; margin: 15px 0; flex-wrap: wrap;">`;
        
        if (telephone) {
          const phoneIcon = window.LucideUtils ? window.LucideUtils.icon('phone', { size: 12 }) : '📞';
          content += this.createActionButton(`${phoneIcon} Call`, `tel:${telephone}`);
        }
        
        if (mobile) {
          const mobileIcon = window.LucideUtils ? window.LucideUtils.icon('smartphone', { size: 12 }) : '📱';
          content += this.createActionButton(`${mobileIcon} Mobile`, `tel:${mobile}`);
        }
        
        if (email) {
          const emailIcon = window.LucideUtils ? window.LucideUtils.icon('mail', { size: 12 }) : '✉️';
          content += this.createActionButton(`${emailIcon} Email`, `mailto:${email}`);
        }
        
        content += `</div>`;
        return content;
      },

      /**
       * Create action button HTML
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
       * Build contact details section with Lucide icons
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
          const locationIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 12 }) : '📍';
          content += this.createDetailRow(locationIcon, address, 
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
        }
        
        if (parish) {
          const buildingIcon = window.LucideUtils ? window.LucideUtils.icon('building', { size: 12 }) : '🏢';
          content += this.createDetailRow(buildingIcon, parish);
        }
        
        if (startYear) {
          const currentYear = new Date().getFullYear();
          const yearsService = currentYear - parseInt(startYear);
          const calendarIcon = window.LucideUtils ? window.LucideUtils.icon('calendar', { size: 12 }) : '📅';
          content += this.createDetailRow(calendarIcon, `Started ${startYear} (${yearsService} years service)`);
        }
        
        if (dob) {
          const dobText = this.formatDateOfBirth(dob);
          const birthdayIcon = window.LucideUtils ? window.LucideUtils.icon('cake', { size: 12 }) : '🎂';
          content += this.createDetailRow(birthdayIcon, dobText);
        }
        
        content += `</div>`;
        
        if (note && note.trim()) {
          const notesIcon = window.LucideUtils ? window.LucideUtils.icon('file-text', { size: 12 }) : '📝';
          content += `
            <div class="contact-notes" style="
              border-top: 1px solid #f3f4f6;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            ">
              ${this.createDetailRow(notesIcon, note)}
            </div>`;
        }
        
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const distance = window.ReferenceMarker.getFormattedDistanceTo(lat, lng);
          if (distance) {
            const distanceIcon = window.LucideUtils ? window.LucideUtils.icon('ruler', { size: 12 }) : '📏';
            content += this.createDetailRow(distanceIcon, `${distance} from reference`);
          }
        }
        
        return content;
      },

      /**
       * Create detail row HTML
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
       * Get current popup ID for flagging
       */
      getCurrentPopupId(feature) {
        const popup = document.querySelector('.enhanced-popup-content');
        const popupId = popup ? popup.id : null;
        console.log('🆔 getCurrentPopupId result:', popupId);
        return popupId;
      },

      /**
       * Toggle flag for a contact - SIMPLE BOOLEAN TOGGLE
       */
      toggleFlag(popupId) {
        console.log('🚩 ===== TOGGLE FLAG CALLED =====');
        console.log('🚩 Popup ID:', popupId);
        console.log('📊 Current popup ID map size:', this.popupIdToFeature.size);
        console.log('📊 Current popup ID map keys:', Array.from(this.popupIdToFeature.keys()));
        
        const feature = this.getFeatureFromPopup(popupId);
        if (!feature) {
          console.error('❌ Could not find feature for popup - ABORTING');
          return;
        }
        
        console.log('🎯 Found feature for toggle:', feature.properties?.name || 'unnamed');
        console.log('📊 Feature properties before toggle:', feature.properties);
        
        // Toggle flag state
        const currentFlag = feature.properties.flagged === true;
        feature.properties.flagged = !currentFlag;
        
        console.log(`🚩 Flag ${currentFlag ? 'REMOVED' : 'ADDED'} for: ${feature.properties.name || 'unnamed'}`);
        console.log('📊 New flag state:', feature.properties.flagged);
        
        // Update global data
        console.log('🔄 Updating global data...');
        this.updateGlobalDataWithFlag(feature);
        
        // Update sidebar and map immediately
        console.log('🔄 Updating sidebar and map...');
        setTimeout(() => {
          this.updateSidebarFlaggedContacts();
          this.updateMapFlaggedMarkers();
          this.updateClearFlagsButton();
          
          // Force map source data refresh
          this.forceMapSourceRefresh();
          
          // IMPORTANT: Explicitly call addFlagLegendToMap after flag changes
          this.addFlagLegendToMap();
          
          console.log('✅ Flag toggle UI updates completed with legend');
        }, 100);
        
        // Refresh popup display
        console.log('🔄 Refreshing popup...');
        this.refreshPopupFlagSection(popupId, feature);
        
        console.log('✅ Flag toggle process completed successfully');
        console.log('🚩 ===== TOGGLE FLAG FINISHED =====');
      },

      /**
       * Update global data with flag state
       */
      updateGlobalDataWithFlag(feature) {
        console.log('🔄 Updating global data with flag state...');
        console.log('📊 Global data exists:', !!(window.geojsonData?.features));
        
        if (window.geojsonData && window.geojsonData.features) {
          console.log('🔍 Searching for matching feature in', window.geojsonData.features.length, 'global features');
          
          const globalFeature = window.geojsonData.features.find(f => {
            if (f.geometry && feature.geometry && 
                f.geometry.coordinates && feature.geometry.coordinates) {
              const [lng1, lat1] = f.geometry.coordinates;
              const [lng2, lat2] = feature.geometry.coordinates;
              
              // More lenient coordinate matching + name fallback
              const coordMatch = Math.abs(lng1 - lng2) < 0.001 && Math.abs(lat1 - lat2) < 0.001;
              const nameMatch = f.properties?.name === feature.properties?.name;
              
              const match = coordMatch || nameMatch;
              
              if (match) {
                console.log('🎯 Global feature matched by', coordMatch ? 'coordinates' : 'name');
              }
              return match;
            }
            return false;
          });
          
          if (globalFeature) {
            const oldFlag = globalFeature.properties.flagged;
            globalFeature.properties.flagged = feature.properties.flagged;
            console.log('✅ Updated global feature flag:', oldFlag, '->', globalFeature.properties.flagged);
            console.log('🎯 Global feature name:', globalFeature.properties?.name || 'unnamed');
          } else {
            console.log('❌ Could not find matching global feature');
          }
        } else {
          console.log('❌ No global geojsonData available for update');
        }
      },

      /**
       * Update map markers to show flagged status (ENHANCED VERSION)
       */
      updateMapFlaggedMarkers() {
        console.log('🗺️ ===== UPDATING ENHANCED FLAG MARKERS =====');
        
        if (!window.map || !window.geojsonData?.features) {
          console.log('❌ No map or geojson data available');
          return;
        }
        
        try {
          // Get current configuration for dynamic layer names
          const config = window.DataConfig?.getCurrentConfig();
          const layerKey = config ? `${config.sourceKey}-markers` : 'contacts';
          
          console.log('🎯 Updating layer:', layerKey);
          
          // Enhanced color expression with proper dataset color mapping
          const colors = window.DataConfig?.getColorMapping() || {};
          console.log('🎨 Building color expression with colors:', colors);
          
          const colorExpression = ['case'];
          
          // First condition: if flagged, use red
          colorExpression.push(['==', ['get', 'flagged'], true]);
          colorExpression.push('#ef4444');
          
          // Add conditions for each dataset color
          Object.entries(colors).forEach(([dataset, color]) => {
            colorExpression.push(['==', ['get', 'dataset'], dataset]);
            colorExpression.push(color);
          });
          
          // Default fallback
          colorExpression.push('#3b82f6');
          
          console.log('🔧 Final color expression:', colorExpression);
          
          // Enhanced size expression - make flagged markers larger
          const sizeExpression = [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, [
              'case',
              ['==', ['get', 'flagged'], true],
              8, // Larger at low zoom for flagged
              6  // Normal size for unflagged
            ],
            10, [
              'case',
              ['==', ['get', 'flagged'], true],
              14, // Larger at medium zoom for flagged
              10  // Normal size for unflagged
            ],
            15, [
              'case',
              ['==', ['get', 'flagged'], true],
              18, // Larger at high zoom for flagged
              14  // Normal size for unflagged
            ]
          ];
          
          // Enhanced stroke for flagged markers
          const strokeColorExpression = [
            'case',
            ['==', ['get', 'flagged'], true],
            '#dc2626', // Dark red stroke for flagged
            '#ffffff'  // White stroke for unflagged
          ];
          
          const strokeWidthExpression = [
            'case',
            ['==', ['get', 'flagged'], true],
            3, // Thick stroke for flagged
            1  // Thin stroke for unflagged (less intrusive)
          ];
          
          // Apply to all possible layer variations
          const possibleLayers = [
            layerKey,
            'contacts',
            'contacts-markers', 
            'geojson-markers',
            'uploaded-markers'
          ];
          
          let updatedLayers = 0;
          
          possibleLayers.forEach(layer => {
            if (window.map.getLayer(layer)) {
              try {
                window.map.setPaintProperty(layer, 'circle-color', colorExpression);
                window.map.setPaintProperty(layer, 'circle-radius', sizeExpression);
                window.map.setPaintProperty(layer, 'circle-stroke-color', strokeColorExpression);
                window.map.setPaintProperty(layer, 'circle-stroke-width', strokeWidthExpression);
                
                // Add enhanced opacity for flagged markers
                window.map.setPaintProperty(layer, 'circle-opacity', [
                  'case',
                  ['==', ['get', 'flagged'], true],
                  0.9, // Slightly transparent for flagged
                  0.8  // Normal opacity for unflagged
                ]);
                
                updatedLayers++;
                console.log(`✅ Enhanced flag styling applied to layer: ${layer}`);
              } catch (error) {
                console.warn(`⚠️ Could not update layer ${layer}:`, error.message);
              }
            }
          });
          
          if (updatedLayers === 0) {
            console.warn('⚠️ No marker layers found to update');
            this.debugAvailableLayers();
          } else {
            console.log(`✅ Enhanced flag styling applied to ${updatedLayers} layers`);
          }
          
          // Add flag indicator legend to map
          this.addFlagLegendToMap();
          
        } catch (error) {
          console.error('❌ Error updating enhanced flag markers:', error);
        }
        
        console.log('🗺️ ===== ENHANCED MAP UPDATE FINISHED =====');
      },

      /**
       * Force map paint properties refresh (preserves dataset colors)
       */
      forceMapSourceRefresh() {
        if (!window.map || !window.geojsonData) {
          console.log('❌ No map or geojson data for source refresh');
          return;
        }
        
        try {
          console.log('🔄 Force refreshing map paint properties only...');
          
          // Just re-apply the paint properties without touching the data source
          // This preserves dataset colors while updating flag status
          this.updateMapFlaggedMarkers();
          
          // Force a repaint
          if (window.map.triggerRepaint) {
            window.map.triggerRepaint();
          }
          
          console.log('✅ Map paint properties refreshed (dataset colors preserved)');
          
        } catch (error) {
          console.error('❌ Error forcing map paint refresh:', error);
        }
      },

      /**
       * Add flag legend to map for better UX (ENHANCED WITH DEBUG)
       */
      addFlagLegendToMap() {
        console.log('🏷️ ===== ADDING FLAG LEGEND TO MAP =====');
        
        // Remove existing legend
        const existingLegend = document.getElementById('flag-legend');
        if (existingLegend) {
          console.log('🗑️ Removing existing legend');
          existingLegend.remove();
        }
        
        // Count flagged markers
        const flaggedCount = window.geojsonData?.features?.filter(f => f.properties?.flagged === true).length || 0;
        console.log('📊 Flagged markers count:', flaggedCount);
        
        if (flaggedCount === 0) {
          console.log('ℹ️ No flagged markers - legend not needed');
          return; // Don't show legend if no flags
        }
        
        // Check map container
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
          console.error('❌ Map container not found - cannot add legend');
          return;
        }
        console.log('✅ Map container found');
        
        // Create legend element with sidebar-aware positioning
        const legend = document.createElement('div');
        legend.id = 'flag-legend';
        
        // Position opposite to sidebar (same logic as map controls)
        const sidebarPosition = window.SettingsManager?.getSetting('sidebarPosition') || 'right';
        const legendPosition = sidebarPosition === 'right' ? 'left: 10px;' : 'right: 10px;';
        
        console.log('📍 Sidebar position:', sidebarPosition);
        console.log('📍 Legend position:', legendPosition);
        
        legend.style.cssText = `
          position: absolute;
          bottom: 40px;
          ${legendPosition}
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          pointer-events: none;
          transition: all 0.3s ease;
        `;
        
        legend.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="
              width: 12px; 
              height: 12px; 
              background: #ef4444; 
              border: 2px solid #dc2626;
              border-radius: 50%;
            "></div>
            <span style="font-weight: 600; color: #374151;">Flagged (${flaggedCount})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              width: 12px; 
              height: 12px; 
              background: #3b82f6; 
              border: 2px solid #ffffff;
              border-radius: 50%;
            "></div>
            <span style="color: #6b7280;">Normal</span>
          </div>
        `;
        
        // Add to map container
        mapContainer.appendChild(legend);
        console.log('✅ Flag legend added successfully');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          if (legend.parentNode) {
            legend.style.opacity = '0.7';
            legend.style.transform = 'translateY(10px)';
            console.log('🔄 Legend auto-faded after 5 seconds');
          }
        }, 5000);
        
        console.log('🏷️ ===== FLAG LEGEND ADDITION COMPLETE =====');
      },

      /**
       * Update flag legend position when sidebar changes
       */
      updateFlagLegendPosition() {
        const legend = document.getElementById('flag-legend');
        if (!legend) return;
        
        // Position opposite to sidebar (same logic as map controls)
        const sidebarPosition = window.SettingsManager?.getSetting('sidebarPosition') || 'right';
        
        if (sidebarPosition === 'right') {
          legend.style.left = '10px';
          legend.style.right = 'auto';
        } else {
          legend.style.right = '10px';
          legend.style.left = 'auto';
        }
        
        console.log(`📍 Flag legend repositioned for ${sidebarPosition} sidebar`);
      },

      /**
       * Debug available layers
       */
      debugAvailableLayers() {
        if (!window.map) return;
        
        try {
          const style = window.map.getStyle();
          const layers = style.layers || [];
          
          console.log('🔍 Available layers:');
          layers.forEach(layer => {
            if (layer.type === 'circle' || layer.type === 'symbol') {
              console.log(`  - ${layer.id} (${layer.type}) - Source: ${layer.source}`);
            }
          });
          
          const sources = style.sources || {};
          console.log('🔍 Available sources:');
          Object.entries(sources).forEach(([key, source]) => {
            if (source.type === 'geojson') {
              console.log(`  - ${key}: ${source.data?.features?.length || 0} features`);
            }
          });
        } catch (error) {
          console.error('❌ Error debugging layers:', error);
        }
      },

      /**
       * Update sidebar with red text for flagged contacts
       */
      updateSidebarFlaggedContacts() {
        console.log('🚩 ===== UPDATING SIDEBAR FLAGGED CONTACTS =====');
        console.log('📊 Global data available:', !!(window.geojsonData?.features));
        console.log('📊 Global features count:', window.geojsonData?.features?.length || 0);
        
        const sidebarItems = document.querySelectorAll('.item');
        console.log('📊 Found', sidebarItems.length, 'sidebar items');
        
        let processedCount = 0;
        let flaggedCount = 0;
        
        sidebarItems.forEach((item, index) => {
          const contactId = item.getAttribute('data-id');
          console.log(`📋 Processing sidebar item ${index}:`, contactId);
          
          if (!contactId) {
            console.log('⚠️ No contact ID found for item', index);
            return;
          }
          
          // Extract index from contact_X format
          const contactIndex = parseInt(contactId.replace('contact_', ''));
          console.log('🔢 Extracted contact index:', contactIndex);
          
          if (isNaN(contactIndex)) {
            console.log('❌ Invalid contact index for:', contactId);
            return;
          }
          
          // Get feature from global data using index
          const feature = window.geojsonData?.features?.[contactIndex];
          if (!feature) {
            console.log('❌ No feature found at index:', contactIndex);
            return;
          }
          
          console.log('🎯 Found feature:', feature.properties?.name || 'unnamed');
          console.log('🚩 Feature flag state:', feature.properties?.flagged);
          
          const nameElement = item.querySelector('.contact-name');
          if (!nameElement) {
            console.log('❌ No name element found in sidebar item');
            return;
          }
          
          processedCount++;
          
          // Apply red text for flagged contacts
          if (feature.properties.flagged === true) {
            console.log(`🔴 Making ${feature.properties.name || 'unnamed'} RED (flagged)`);
            nameElement.style.setProperty('color', '#ef4444', 'important');
            nameElement.style.setProperty('font-weight', '700', 'important');
            flaggedCount++;
          } else {
            console.log(`⚫ Making ${feature.properties.name || 'unnamed'} NORMAL (not flagged)`);
            nameElement.style.setProperty('color', '#374151', 'important');
            nameElement.style.setProperty('font-weight', '500', 'important');
          }
        });
        
        console.log('📊 Sidebar update summary:');
        console.log('  - Items processed:', processedCount);
        console.log('  - Items flagged (red):', flaggedCount);
        console.log('  - Items normal:', processedCount - flaggedCount);
        console.log('✅ POPUP-UTILS: Flag-based red text update complete');
        console.log('🚩 ===== SIDEBAR UPDATE FINISHED =====');
      },

      /**
       * Initialize flagged marker visuals when data first loads
       */
      initializeFlaggedMarkersOnMap() {
        console.log('🎬 Initializing flagged marker visuals on map...');
        
        // Small delay to ensure map layers are ready
        setTimeout(() => {
          this.updateMapFlaggedMarkers();
        }, 500);
      },

      /**
       * Refresh popup flag section after changes
       */
      refreshPopupFlagSection(popupId, feature) {
        console.log('🔄 Refreshing popup flag button for:', popupId);
        
        const popup = document.getElementById(popupId);
        if (!popup) {
          console.log('❌ Popup element not found:', popupId);
          return;
        }
        
        // Find the flag button (it should be the first button in the popup)
        const flagButton = popup.querySelector('button[onclick*="toggleFlag"]');
        if (!flagButton) {
          console.log('❌ Flag button not found in popup');
          return;
        }
        
        console.log('🔧 Updating flag button state...');
        const latestFeature = this.getLatestFeatureData(feature);
        const isFlagged = latestFeature.properties.flagged === true;
        const flagIcon = window.LucideUtils ? window.LucideUtils.icon('flag', { size: 12 }) : '🚩';
        
        // Update button styling based on flag state
        flagButton.style.background = isFlagged ? '#ef4444' : '#f3f4f6';
        flagButton.style.color = isFlagged ? 'white' : '#6b7280';
        flagButton.title = isFlagged ? 'Flagged - Click to remove. Appears as red text in sidebar.' : 'Click to flag - Flagged contacts appear as red text in sidebar';
        flagButton.innerHTML = flagIcon;
        
        // Update hover effects
        flagButton.onmouseover = function() {
          this.style.background = isFlagged ? '#dc2626' : '#e5e7eb';
          this.style.transform = 'scale(1.1)';
        };
        flagButton.onmouseout = function() {
          this.style.background = isFlagged ? '#ef4444' : '#f3f4f6';
          this.style.transform = 'scale(1)';
        };
        
        // Re-initialize Lucide icons in the updated button
        if (window.LucideUtils) {
          window.LucideUtils.init();
        }
        
        console.log('✅ Flag button refreshed successfully');
      },

      /**
       * Get feature from popup
       */
      getFeatureFromPopup(popupId) {
        console.log('🔍 ===== GETTING FEATURE FROM POPUP =====');
        console.log('🔍 Looking for feature for popup:', popupId);
        console.log('📊 PopupId map size:', this.popupIdToFeature.size);
        console.log('📊 PopupId map keys:', Array.from(this.popupIdToFeature.keys()));
        
        if (this.popupIdToFeature.has(popupId)) {
          const feature = this.popupIdToFeature.get(popupId);
          console.log('✅ Found feature via popup ID map:', feature.properties?.name || 'unnamed');
          console.log('📊 Feature flag state:', feature.properties?.flagged);
          
          // Try to get the most up-to-date version from global data
          if (window.geojsonData && window.geojsonData.features) {
            console.log('🔍 Looking for updated version in global data...');
            
            const matchedFeature = window.geojsonData.features.find(f => {
              if (f.geometry && feature.geometry && 
                  f.geometry.coordinates && feature.geometry.coordinates) {
                const [lng1, lat1] = f.geometry.coordinates;
                const [lng2, lat2] = feature.geometry.coordinates;
                
                // More lenient coordinate matching + name fallback
                const coordMatch = Math.abs(lng1 - lng2) < 0.001 && Math.abs(lat1 - lat2) < 0.001;
                const nameMatch = f.properties?.name === feature.properties?.name;
                
                const match = coordMatch || nameMatch;
                return match;
              }
              return false;
            });
            
            if (matchedFeature) {
              console.log('✅ Found updated feature in global data');
              console.log('📊 Global feature flag state:', matchedFeature.properties?.flagged);
              return matchedFeature;
            } else {
              console.log('⚠️ No matching feature found in global data, using cached version');
            }
          }
          
          return feature;
        }
        
        if (this.activePopup && this.activePopup._feature) {
          const feature = this.activePopup._feature;
          console.log('✅ Found feature via activePopup:', feature.properties?.name || 'unnamed');
          return feature;
        }
        
        console.error('❌ Could not find feature for popup:', popupId);
        console.log('🔍 ===== FEATURE LOOKUP FAILED =====');
        return null;
      },

      /**
       * Extract contact data from properties
       */
      extractContactData(properties) {
        console.log('📊 Extracting contact data from properties:', Object.keys(properties || {}));
        
        const config = DataConfig.getCurrentConfig();
        
        const data = {
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
        
        console.log('📊 Extracted contact data:', data);
        return data;
      },

      /**
       * Format date of birth with age calculation
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
       */
      getDatasetColor(groupValue) {
        const colors = DataConfig.getColorMapping();
        return colors[groupValue] || '#6b7280';
      },

      /**
       * Utility methods for time display
       */
      getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      },

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      },

      /**
       * Store flags before data filtering
       */
      storeFlagsBeforeFiltering() {
        console.log('💾 Storing flags before filtering...');
        
        if (!window.geojsonData?.features) {
          console.log('⚠️ No global data to store flags from');
          return new Map();
        }
        
        const flagMap = new Map();
        
        window.geojsonData.features.forEach((feature, index) => {
          if (feature.properties?.flagged === true) {
            // Create unique key based on coordinates
            const coords = feature.geometry?.coordinates;
            if (coords && coords.length >= 2) {
              const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
              flagMap.set(key, {
                index,
                name: feature.properties?.name || 'unnamed',
                flagged: true
              });
              console.log(`💾 Stored flag for: ${feature.properties?.name || 'unnamed'}`);
            }
          }
        });
        
        console.log(`💾 Stored ${flagMap.size} flags`);
        return flagMap;
      },

      /**
       * Restore flags after data filtering
       */
      restoreFlagsAfterFiltering(flagMap) {
        console.log('🔄 Restoring flags after filtering...');
        console.log(`🔄 Attempting to restore ${flagMap.size} flags`);
        
        if (!window.geojsonData?.features || flagMap.size === 0) {
          console.log('⚠️ No data or flags to restore');
          return;
        }
        
        let restoredCount = 0;
        
        window.geojsonData.features.forEach((feature, index) => {
          const coords = feature.geometry?.coordinates;
          if (coords && coords.length >= 2) {
            const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
            
            if (flagMap.has(key)) {
              const flagData = flagMap.get(key);
              feature.properties.flagged = true;
              restoredCount++;
              console.log(`🔄 Restored flag for: ${feature.properties?.name || 'unnamed'}`);
            }
          }
        });
        
        console.log(`✅ Restored ${restoredCount} of ${flagMap.size} flags`);
        
        // Update sidebar immediately after restoring flags
        setTimeout(() => {
          this.updateSidebarFlaggedContacts();
          this.updateMapFlaggedMarkers();
          
          // Add legend if flags were restored
          if (restoredCount > 0) {
            this.addFlagLegendToMap();
          }
        }, 100);
      },

      /**
       * Legacy compatibility methods - kept for existing integrations
       */
      setupMapInteractions(map, layerId) {
        console.log(`🎯 POPUP-UTILS: setupMapInteractions called for ${layerId} (not needed)`);
        return true;
      },

      autoSetupMapInteractions(map = null) {
        console.log('🔄 POPUP-UTILS: autoSetupMapInteractions called (not needed)');
        return true;
      },

      handleLayerMouseEnter() {
        // Placeholder for compatibility
      },

      handleLayerMouseLeave() {
        // Placeholder for compatibility
      },

      // Aliases for legacy support
      updateSidebarVisuals() {
        console.log('🔄 updateSidebarVisuals called - redirecting to updateSidebarFlaggedContacts');
        this.updateSidebarFlaggedContacts();
      },

      /**
       * Debug method to inspect current state
       */
      debugCurrentState() {
        console.log('🔍 ===== POPUP UTILS DEBUG STATE =====');
        console.log('📊 Active popup:', !!this.activePopup);
        console.log('📊 Popup registry size:', this.popupRegistry.size);
        console.log('📊 Popup feature map size:', this.popupFeatureMap.size);
        console.log('📊 Popup ID map size:', this.popupIdToFeature.size);
        console.log('📊 Popup ID map keys:', Array.from(this.popupIdToFeature.keys()));
        console.log('📊 Global geojsonData exists:', !!window.geojsonData);
        console.log('📊 Global features count:', window.geojsonData?.features?.length || 0);
        
        // Check sidebar items
        const sidebarItems = document.querySelectorAll('.item');
        console.log('📊 Sidebar items found:', sidebarItems.length);
        
        if (window.geojsonData?.features) {
          const flaggedFeatures = window.geojsonData.features.filter(f => f.properties?.flagged === true);
          console.log('📊 Flagged features in global data:', flaggedFeatures.length);
          flaggedFeatures.forEach(f => {
            console.log('🚩 Flagged feature:', f.properties?.name || 'unnamed');
          });
        }
        
        console.log('🔍 ===== DEBUG STATE END =====');
      },

      /**
       * Test sidebar update functionality
       */
      testSidebarUpdate() {
        console.log('🧪 ===== TESTING SIDEBAR UPDATE =====');
        
        if (!window.geojsonData?.features?.length) {
          console.log('❌ No features available for testing');
          return;
        }
        
        // Test flagging the first feature
        const testFeature = window.geojsonData.features[0];
        console.log('🧪 Testing with feature:', testFeature.properties?.name || 'unnamed');
        
        // Toggle flag
        const originalFlag = testFeature.properties.flagged;
        testFeature.properties.flagged = !originalFlag;
        console.log('🧪 Set feature flag to:', testFeature.properties.flagged);
        
        // Update sidebar
        this.updateSidebarFlaggedContacts();
        
        // Check result
        const sidebarItems = document.querySelectorAll('.item');
        console.log('🧪 Found', sidebarItems.length, 'sidebar items');
        
        if (sidebarItems.length > 0) {
          const firstItem = sidebarItems[0];
          const nameElement = firstItem.querySelector('.contact-name');
          if (nameElement) {
            const computedStyle = window.getComputedStyle(nameElement);
            console.log('🧪 First item color:', computedStyle.color);
            console.log('🧪 First item font-weight:', computedStyle.fontWeight);
          }
        }
        
        // Restore original state
        testFeature.properties.flagged = originalFlag;
        this.updateSidebarFlaggedContacts();
        
        console.log('🧪 ===== SIDEBAR TEST COMPLETE =====');
      },

      /**
       * Manual test method to verify flag functionality
       */
      testFlagSystem() {
        console.log('🧪 ===== TESTING FLAG SYSTEM =====');
        
        // Test 1: Check if we can find a feature to test with
        if (!window.geojsonData?.features?.length) {
          console.log('❌ No features available for testing');
          return;
        }
        
        const testFeature = window.geojsonData.features[0];
        console.log('🧪 Testing with feature:', testFeature.properties?.name || 'unnamed');
        
        // Test 2: Toggle flag programmatically
        const originalFlag = testFeature.properties.flagged;
        testFeature.properties.flagged = true;
        console.log('🧪 Set test feature flag to true');
        
        // Test 3: Update sidebar
        this.updateSidebarFlaggedContacts();
        
        // Test 4: Check sidebar result
        const sidebarItems = document.querySelectorAll('.item');
        const firstItem = sidebarItems[0];
        if (firstItem) {
          const nameElement = firstItem.querySelector('.contact-name');
          if (nameElement) {
            const color = window.getComputedStyle(nameElement).color;
            console.log('🧪 First sidebar item color:', color);
          }
        }
        
        // Test 5: Restore original state
        testFeature.properties.flagged = originalFlag;
        this.updateSidebarFlaggedContacts();
        
        console.log('🧪 ===== FLAG SYSTEM TEST COMPLETE =====');
      },

      /**
       * Get current flag count
       */
      getFlagCount() {
        if (!window.geojsonData?.features) return 0;
        return window.geojsonData.features.filter(f => f.properties?.flagged === true).length;
      },

      /**
       * Update clear flags button visibility and count
       */
      updateClearFlagsButton() {
        const clearBtn = document.getElementById('clear-flags-button');
        if (!clearBtn) return;
        
        const flagCount = this.getFlagCount();
        const clearIcon = window.LucideUtils ? window.LucideUtils.icon('trash-2', { size: 12 }) : '🗑️';
        
        if (flagCount > 0) {
          clearBtn.style.display = 'flex';
          clearBtn.innerHTML = `${clearIcon} Clear All Flags (${flagCount})`;
          clearBtn.disabled = false;
        } else {
          clearBtn.style.display = 'none';
          clearBtn.disabled = true;
        }
      },

      /**
       * Clear all flags from all contacts
       */
      clearAllFlags() {
        console.log('🗑️ ===== CLEARING ALL FLAGS =====');
        
        if (!window.geojsonData?.features) {
          console.log('❌ No global data available');
          return;
        }
        
        let clearedCount = 0;
        
        // Clear flags from global data
        window.geojsonData.features.forEach(feature => {
          if (feature.properties?.flagged === true) {
            feature.properties.flagged = false;
            clearedCount++;
            console.log(`🗑️ Cleared flag from: ${feature.properties?.name || 'unnamed'}`);
          }
        });
        
        console.log(`📊 Cleared ${clearedCount} flags`);
        
        if (clearedCount === 0) {
          console.log('ℹ️ No flags to clear');
          return;
        }
        
        // Update UI immediately
        setTimeout(() => {
          this.updateSidebarFlaggedContacts();
          this.updateClearFlagsButton();
          
          // Remove the legend when all flags are cleared
          const existingLegend = document.getElementById('flag-legend');
          if (existingLegend) {
            existingLegend.remove();
            console.log('🗑️ Removed flag legend (no flags remaining)');
          }
          
          // Show success message
          this.showClearFlagsMessage(clearedCount);
          
          // Update any flag-related UI elements
          this.updateFlagRelatedUI();
        }, 100);
        
        console.log('🗑️ ===== CLEAR ALL FLAGS COMPLETE =====');
      },

      /**
       * Show success message after clearing flags
       */
      showClearFlagsMessage(count) {
        // Create temporary success message
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        const message = document.createElement('div');
        message.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(34, 197, 94, 0.95);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 2000;
          pointer-events: none;
          backdrop-filter: blur(10px);
          animation: fadeInOut 2s ease-in-out;
        `;
        
        message.innerHTML = `✅ Cleared ${count} flag${count > 1 ? 's' : ''}`;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('clearFlagsAnimation')) {
          const style = document.createElement('style');
          style.id = 'clearFlagsAnimation';
          style.textContent = `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
              20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
          `;
          document.head.appendChild(style);
        }
        
        mapContainer.appendChild(message);
        
        // Remove message after animation
        setTimeout(() => {
          if (message.parentNode) {
            message.remove();
          }
        }, 2000);
      },

      /**
       * Update flag-related UI elements
       */
      updateFlagRelatedUI() {
        // Trigger any flag count updates in other parts of the UI
        window.dispatchEvent(new CustomEvent('flagsCleared'));
        
        // Update clear flags button visibility if it exists elsewhere
        const clearBtn = document.getElementById('clear-flags-btn');
        if (clearBtn) {
          clearBtn.style.display = 'none';
        }
      },

      /**
       * Add flag icon overlay on map markers
       */
      addFlagIconOverlay() {
        if (!window.map || !window.geojsonData?.features) {
          console.log('❌ Map or data not available for flag overlay');
          return;
        }
        
        // Remove existing flag overlay
        if (window.map.getLayer('flag-overlay')) {
          window.map.removeLayer('flag-overlay');
        }
        if (window.map.getSource('flag-overlay')) {
          window.map.removeSource('flag-overlay');
        }
        
        // Create flagged features overlay
        const flaggedFeatures = window.geojsonData.features
          .filter(feature => feature.properties?.flagged === true)
          .map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              flagIcon: '🚩'
            }
          }));
        
        if (flaggedFeatures.length === 0) {
          console.log('ℹ️ No flagged features found for overlay');
          return;
        }
        
        try {
          // Add flag overlay source
          window.map.addSource('flag-overlay', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: flaggedFeatures
            }
          });
          
          // Add flag icon layer
          window.map.addLayer({
            id: 'flag-overlay',
            type: 'symbol',
            source: 'flag-overlay',
            layout: {
              'text-field': '🚩',
              'text-size': 16,
              'text-offset': [0.8, -0.8],
              'text-anchor': 'bottom-left',
              'text-allow-overlap': true,
              'text-ignore-placement': true
            },
            paint: {
              'text-color': '#ef4444',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1
            }
          });
          
          console.log(`✅ Flag icon overlay added for ${flaggedFeatures.length} flagged markers`);
        } catch (error) {
          console.error('❌ Error adding flag icon overlay:', error);
        }
      },

      /**
       * Remove flag icon overlay
       */
      removeFlagIconOverlay() {
        if (!window.map) return;
        
        try {
          if (window.map.getLayer('flag-overlay')) {
            window.map.removeLayer('flag-overlay');
          }
          if (window.map.getSource('flag-overlay')) {
            window.map.removeSource('flag-overlay');
          }
          console.log('✅ Flag icon overlay removed');
        } catch (error) {
          console.error('❌ Error removing flag icon overlay:', error);
        }
      }
    };

    // Export to global scope
    window.PopupUtils = PopupUtils;
    
    // Add debug methods to window for easy testing
    window.debugFlags = () => PopupUtils.debugCurrentState();
    window.testFlags = () => PopupUtils.testFlagSystem();
    window.testSidebar = () => PopupUtils.testSidebarUpdate();
    window.addFlagIcons = () => PopupUtils.addFlagIconOverlay();
    window.removeFlagIcons = () => PopupUtils.removeFlagIconOverlay();
    window.addFlagLegend = () => PopupUtils.addFlagLegendToMap();
    window.removeFlagLegend = () => {
      const legend = document.getElementById('flag-legend');
      if (legend) {
        legend.remove();
        console.log('🗑️ Legend removed manually');
      } else {
        console.log('❌ No legend found to remove');
      }
    };
    
    console.log('✅ popup-utils.js (with fixed Lucide icons) loaded successfully');
    console.log('🔧 Debug methods available: window.debugFlags(), window.testFlags()');
    
    // Mark as loaded
    if (window.MapaListerModules) {
      window.MapaListerModules.popupUtils = true;
    }
    
    // Emit ready event
    window.dispatchEvent(new CustomEvent('mapalister:popupUtilsReady'));
  }

  // Initialize immediately
  initPopupUtils();

})();