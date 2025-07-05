/**
 * =====================================================
 * FILE: managers/sidebar-manager.js
 * PURPOSE: Sidebar management and contact listings
 * DEPENDENCIES: DataConfig, DistanceUtils, ReferenceMarker
 * EXPORTS: SidebarManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📋 Loading sidebar-manager.js...');

  // Check dependencies
const checkDependencies = () => {
  const missing = [];
  if (typeof DataConfig === 'undefined') missing.push('DataConfig');
  if (typeof DistanceUtils === 'undefined') missing.push('DistanceUtils');
  if (typeof ReferenceMarker === 'undefined') missing.push('ReferenceMarker');
  if (typeof PopupUtils === 'undefined') missing.push('PopupUtils');
  return missing;
};

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ SidebarManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initSidebarManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    window.addEventListener('mapalister:referenceMarkerReady', retryInit);
    window.addEventListener('mapalister:popupUtilsReady', retryInit);
    return;
  }

  function initSidebarManager() {
    /**
     * SIDEBAR MANAGER
     * Handles contact listings, search, and sidebar functionality with dynamic configuration
     */
    const SidebarManager = {
      searchQuery: '',
      filteredFeatures: [],
      searchTimeout: null,

      /**
       * Build sidebar with compact layout
       * @param {Object} geojson - GeoJSON data
       */
      build(geojson) {
        console.log('🔧 Building sidebar...');
        
        const listings = document.getElementById('listings');
        if (!listings) {
          console.error('❌ Listings container not found');
          return;
        }
        
        listings.innerHTML = '';

        // Data validation
        if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
          console.warn('⚠️ Invalid geojson data:', geojson);
          listings.innerHTML = '<div class="loading">Invalid data format</div>';
          return;
        }

        if (geojson.features.length === 0) {
          listings.innerHTML = '<div class="loading">No contacts found</div>';
          return;
        }

        console.log(`📊 Processing ${geojson.features.length} features...`);

        // Store features
        this.filteredFeatures = geojson.features;

        // Add control buttons
        this.addControlButtons(listings);

        // Add dataset summary
        this.addDatasetSummary(listings, geojson);

        // Add search box for larger datasets
        if (geojson.features.length >= 10) {
          this.addSearchBox(listings);
        }

        // Apply search filter if active
        let featuresToShow = this.searchQuery ? 
          this.filterFeatures(geojson.features, this.searchQuery) : 
          geojson.features;

        // Check if reference marker is set
        const hasReference = window.ReferenceMarker && window.ReferenceMarker.exists();

        // Process features with distances
        let featuresWithDistances = featuresToShow.map((feature, index) => {
          const properties = feature.properties || {};
          
          // Extract contact name with fallbacks
          const name = this.extractPropertyValue(properties, [
            'name', 'Name', 'title', 'Title', 'deacon_name', 'contact_name'
          ], `Contact ${index + 1}`);

          const groupValue = this.extractGroupingValue(properties);

          // Contact ID
          const contactId = this.extractPropertyValue(properties, [
            'id', 'ID', 'contact_id', 'deacon_id'
          ], `contact_${index}`);

          // Safe coordinates
          let coordinates = [0, 0];
          try {
            if (feature.geometry && 
                feature.geometry.coordinates && 
                Array.isArray(feature.geometry.coordinates) &&
                feature.geometry.coordinates.length >= 2) {
              coordinates = feature.geometry.coordinates;
            }
          } catch (e) {
            console.warn('⚠️ Invalid coordinates for feature:', index, e);
          }

          const [lng, lat] = coordinates;
          let distance = null;
          
          // Distance calculation only if reference marker exists
          if (hasReference) {
            try {
              const referenceMarker = window.ReferenceMarker.get();
              if (referenceMarker && referenceMarker.lat && referenceMarker.lng) {
                distance = DistanceUtils.calculateDistance(
                  referenceMarker.lat, referenceMarker.lng,
                  lat, lng
                );
              }
            } catch (e) {
              console.warn('⚠️ Distance calculation failed:', e);
            }
          }
          
          return {
            feature,
            index,
            contactId,
            distance,
            name,
            groupValue,
            coordinates: [lng, lat]
          };
        });

        // Sort by distance if reference marker exists
        if (hasReference) {
          featuresWithDistances.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }

        // Show search results if searching
        if (this.searchQuery && geojson.features.length >= 10) {
          this.addSearchResults(listings, featuresWithDistances.length, geojson.features.length);
        }

        // Build sidebar items
        featuresWithDistances.forEach((itemData) => {
          try {
            const item = this.createSidebarItem(itemData, hasReference);
            if (item) {
              listings.appendChild(item);
            }
          } catch (e) {
            console.error('❌ Error creating sidebar item:', itemData.index, e);
          }
        });

        // Show "no results" message if search returned nothing
        if (this.searchQuery && featuresWithDistances.length === 0) {
          this.addNoResultsMessage(listings);
        }

        console.log('✅ Sidebar built successfully');
      },

      /**
       * Extract property value for grouping with dynamic property name
       * @param {Object} properties - Feature properties
       * @returns {string|null} Group value
       */
      extractGroupingValue(properties) {
        const config = DataConfig.getCurrentConfig();
        
        return this.extractPropertyValue(properties, [
          config.groupingProperty,
          config.groupingProperty.charAt(0).toUpperCase() + config.groupingProperty.slice(1),
          'dataset', 'Dataset', 'group', 'Group' // fallbacks
        ], null);
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
       * Get dataset short label with dynamic configuration
       * @param {string} groupValue - Group value
       * @returns {string} Short label
       */
      getDatasetShortLabel(groupValue) {
        // For backwards compatibility with existing labels
        const staticLabels = {
          'Group I - 2014-2018': 'I',
          'Group II 2017-2021': 'II',
          'Group III - 2014-2026': 'III', 
          'Group IV - 2025 - 2029': 'IV',
          'Centre': 'C'
        };
        
        if (staticLabels[groupValue]) {
          return staticLabels[groupValue];
        }
        
        // Generate short label from group value
        if (groupValue && groupValue.length <= 3) {
          return groupValue.toUpperCase();
        }
        
        if (!groupValue) return '';
        
        // Extract first letter of each word
        return groupValue.split(/[\s-_]+/)
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
      },

      /**
       * Create sidebar item with enhanced debugging for distance display
       * @param {Object} itemData - Item data object
       * @param {boolean} hasReference - Whether reference marker exists
       * @returns {HTMLElement} Sidebar item element
       */
      createSidebarItem(itemData, hasReference) {
        const { feature, index, contactId, name, coordinates, distance, groupValue } = itemData;
        
        console.log(`Creating sidebar item ${index}:`, {
          name,
          coordinates,
          distance,
          hasReference,
          contactId
        });
        
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('data-id', contactId);
        item.style.position = 'relative';

        // Set dataset attribute with dynamic property
        if (groupValue) {
          item.setAttribute('data-grouping-value', groupValue);
        }

        // Create main content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
          padding: 10px 12px;
          ${groupValue ? 'padding-left: 45px;' : ''}
          padding-right: 35px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 45px;
        `;

        // Left side: Contact name
        const leftSide = document.createElement('div');
        leftSide.style.cssText = `
          flex: 1;
          min-width: 0;
        `;

        const nameElement = document.createElement('div');
        nameElement.className = 'contact-name';
        nameElement.innerHTML = this.highlightSearchText(name, this.searchQuery);
        nameElement.style.cssText = `
          font-weight: 500;
          color: #374151;
          font-size: 14px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;

        leftSide.appendChild(nameElement);

        // Right side: Distance display with enhanced debugging
        const rightSide = document.createElement('div');
        rightSide.style.cssText = `
          flex-shrink: 0;
          margin-left: 8px;
        `;

        console.log(`Distance check for ${name}:`, {
          hasReference,
          distance,
          distanceIsNull: distance === null,
          distanceIsUndefined: distance === undefined,
          distanceIsNaN: isNaN(distance)
        });

        if (hasReference && distance !== null && distance !== undefined && !isNaN(distance)) {
          console.log(`Creating distance capsule for ${name}: ${distance}`);
          
          const distanceCapsule = document.createElement('div');
          distanceCapsule.className = 'distance-capsule';
          
          const formattedDistance = DistanceUtils.formatDistance(distance);
          console.log(`Formatted distance for ${name}: ${formattedDistance}`);
          
          distanceCapsule.textContent = formattedDistance;
          distanceCapsule.style.cssText = `
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 500;
            color: #6b7280;
            white-space: nowrap;
          `;
          rightSide.appendChild(distanceCapsule);
          console.log(`Distance capsule added for ${name}`);
        } else {
          console.log(`No distance capsule for ${name}: hasReference=${hasReference}, distance=${distance}`);
        }

        contentContainer.appendChild(leftSide);
        contentContainer.appendChild(rightSide);

        // Enhanced click handler with unified popup system
        contentContainer.onclick = (e) => {
          e.preventDefault();
          try {
            this.handleClick(feature, contactId);
            // Zoom to marker on map
            if (window.map && coordinates) {
              const [lng, lat] = coordinates;
              window.map.flyTo({
                center: [lng, lat],
                zoom: 14,
                duration: 1000
              });
              
              // Show enhanced popup after zoom completes using PopupUtils
              setTimeout(() => {
                if (window.PopupUtils) {
                  window.PopupUtils.showEnhancedPopup(window.map, feature, [lng, lat]);
                } else if (window.MapManager && window.MapManager.hoverPopup) {
                  // Fallback to old system
                  const content = this.createEnhancedPopupContentForSidebar(feature);
                  window.MapManager.hoverPopup
                    .setLngLat([lng, lat])
                    .setHTML(content)
                    .addTo(window.map);
                }
              }, 1200);
            }
          } catch (err) {
            console.error('Click handler error:', err);
          }
        };

        // Add dataset indicator if available
        if (groupValue) {
          const datasetIndicator = this.createDatasetIndicator(groupValue);
          if (datasetIndicator) {
            item.appendChild(datasetIndicator);
          }
        }

        // Add reference button
        const refButton = this.createReferenceButton(feature, index, name, coordinates);

        item.appendChild(contentContainer);
        item.appendChild(refButton);

        return item;
      },

      /**
       * Create dataset indicator with dynamic configuration
       * @param {string} groupValue - Group value
       * @returns {HTMLElement|null} Dataset indicator element
       */
      createDatasetIndicator(groupValue) {
        try {
          const indicator = document.createElement('div');
          indicator.className = 'dataset-indicator';
          indicator.textContent = this.getDatasetShortLabel(groupValue);
          indicator.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            background: ${this.getDatasetColor(groupValue)};
            color: white;
            padding: 3px 7px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            z-index: 1;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          `;
          return indicator;
        } catch (e) {
          console.warn('Failed to create dataset indicator:', e);
          return null;
        }
      },

      /**
       * Create reference button
       * @param {Object} feature - GeoJSON feature
       * @param {number} index - Feature index
       * @param {string} name - Contact name
       * @param {Array} coordinates - [lng, lat] coordinates
       * @returns {HTMLElement} Reference button element
       */
      createReferenceButton(feature, index, name, coordinates) {
        const refButton = document.createElement('button');
        refButton.className = 'reference-button';
        refButton.innerHTML = '📍';
        refButton.title = 'Set as reference point';
        refButton.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 5px 7px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
          z-index: 1;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        `;

        refButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const [lng, lat] = coordinates;
            if (lng && lat && window.ReferenceMarker) {
              window.ReferenceMarker.set(lat, lng, name);
            }
          } catch (err) {
            console.error('Reference button error:', err);
          }
        };

        refButton.addEventListener('mouseenter', () => {
          refButton.style.backgroundColor = '#3b82f6';
          refButton.style.color = 'white';
          refButton.style.borderColor = '#3b82f6';
          refButton.style.transform = 'scale(1.05)';
        });
        
        refButton.addEventListener('mouseleave', () => {
          refButton.style.backgroundColor = '#f8fafc';
          refButton.style.color = '';
          refButton.style.borderColor = '#e5e7eb';
          refButton.style.transform = 'scale(1)';
        });

        return refButton;
      },

      /**
       * Create enhanced popup content for sidebar clicks
       * @param {Object} feature - GeoJSON feature
       * @returns {string} HTML content
       */
      createEnhancedPopupContentForSidebar(feature) {
        const config = DataConfig.getCurrentConfig();
        const properties = feature.properties;
        const coordinates = feature.geometry.coordinates;
        const [lng, lat] = coordinates;
        
        // Extract all available data
        const name = this.extractPropertyValue(properties, [
          'name', 'Name', 'title', 'Title'
        ], 'Contact');
        
        const groupValue = this.extractGroupingValue(properties);
        const address = this.extractPropertyValue(properties, ['Address', 'address'], null);
        const telephone = this.extractPropertyValue(properties, ['Telephone', 'telephone', 'phone'], null);
        const mobile = this.extractPropertyValue(properties, ['Mobile', 'mobile', 'cell'], null);
        const email = this.extractPropertyValue(properties, ['Email', 'email'], null);
        
        // Build enhanced popup content
        let content = `
          <div class="enhanced-popup-content" style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 280px;
            max-width: 320px;
            position: relative;
          ">
            <!-- Close button with proper functionality -->
<button onclick="window.PopupUtils ? window.PopupUtils.closeAllPopups() : (window.MapManager && window.MapManager.hoverPopup && window.MapManager.hoverPopup.remove())" style="
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
              ">${name}</div>`;
        
        if (groupValue) {
          const color = this.getDatasetColor(groupValue);
          content += `
              <div class="contact-grouping" style="
                font-size: 12px;
                color: ${color};
                font-weight: 500;
              ">${config.groupingDisplayName || 'Group'}: ${groupValue}</div>`;
        }
        
        content += `</div>`;
        
        // Contact Actions
        const hasContactMethods = telephone || mobile || email;
        if (hasContactMethods) {
          content += `
            <div class="contact-actions" style="
              display: flex;
              gap: 8px;
              margin: 15px 0;
              flex-wrap: wrap;
            ">`;
          
          if (telephone) {
            content += `
              <a href="tel:${telephone}" class="action-btn" style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 10px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                text-decoration: none;
                color: #374151;
                font-size: 12px;
                transition: all 0.2s ease;
                cursor: pointer;
              ">📞 Call</a>`;
          }
          
          if (mobile) {
            content += `
              <a href="tel:${mobile}" class="action-btn" style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 10px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                text-decoration: none;
                color: #374151;
                font-size: 12px;
                transition: all 0.2s ease;
                cursor: pointer;
              ">📱 Mobile</a>`;
          }
          
          if (email) {
            content += `
              <a href="mailto:${email}" class="action-btn" style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 10px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                text-decoration: none;
                color: #374151;
                font-size: 12px;
                transition: all 0.2s ease;
                cursor: pointer;
              ">✉️ Email</a>`;
          }
          
          content += `</div>`;
        }
        
        // Address and distance
        if (address) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
          content += `
            <div class="contact-details" style="
              border-top: 1px solid #f3f4f6;
              padding-top: 12px;
              margin-top: 12px;
            ">
              <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                <span>📍</span>
                <a href="${mapsUrl}" target="_blank" style="color: #6b7280; text-decoration: none; line-height: 1.3;">${address}</a>
              </div>
            </div>`;
        }
        
        // Distance from reference
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const distance = window.ReferenceMarker.getFormattedDistanceTo(lat, lng);
          if (distance) {
            content += `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                <span>📏</span>
                <span>${distance} from reference</span>
              </div>`;
          }
        }
        
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
       * Add control buttons
       * @param {HTMLElement} container - Container element
       */
      addControlButtons(container) {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.style.cssText = `
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        `;

        // Zoom to all button
        const zoomToAll = document.createElement('button');
        zoomToAll.textContent = '🌍 Zoom to All';
        zoomToAll.style.cssText = `
          flex: 1;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
          color: #374151;
        `;

        zoomToAll.onclick = () => {
          if (window.geojsonData && window.MapManager) {
            window.MapManager.autoZoomToFitMarkers(window.map, window.geojsonData);
          }
        };

        this.addButtonHoverEffects(zoomToAll);
        controlsContainer.appendChild(zoomToAll);

        // Settings button
        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️ Settings';
        settingsButton.style.cssText = `
          flex: 1;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
          color: #374151;
        `;

        settingsButton.onclick = () => {
          if (window.SettingsManager) {
            window.SettingsManager.showSettings();
          }
        };

        this.addButtonHoverEffects(settingsButton);
        controlsContainer.appendChild(settingsButton);

        container.appendChild(controlsContainer);
      },

      /**
       * Add button hover effects
       * @param {HTMLElement} button - Button element
       */
      addButtonHoverEffects(button) {
        button.addEventListener('mouseenter', () => {
          button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          button.style.color = 'white';
          button.style.borderColor = '#3b82f6';
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          button.style.color = '#374151';
          button.style.borderColor = '#d1d5db';
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = '';
        });
      },

      /**
       * Add dataset summary with dynamic configuration
       * @param {HTMLElement} container - Container element
       * @param {Object} geojson - GeoJSON data
       */
      addDatasetSummary(container, geojson) {
        const config = DataConfig.getCurrentConfig();
        
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'dataset-summary';
        summaryContainer.style.cssText = `
          margin-bottom: 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          font-size: 13px;
          text-align: center;
        `;

        summaryContainer.textContent = `${geojson.features.length} ${config.displayName.toLowerCase()} `;
        container.appendChild(summaryContainer);
      },

      /**
       * Add search box for larger datasets
       * @param {HTMLElement} container - Container element
       */
      addSearchBox(container) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.style.cssText = `position: relative; margin-bottom: 12px;`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search contacts...';
        searchInput.className = 'search-input'; // Important: This class is checked by keyboard shortcuts
        searchInput.style.cssText = `
          width: 100%;
          padding: 10px 35px 10px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.2s ease;
          background: white;
        `;

        const searchIcon = document.createElement('div');
        searchIcon.innerHTML = '🔍';
        searchIcon.style.cssText = `
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: #9ca3af;
          pointer-events: none;
        `;

        // Clear button (appears when search has content)
        const clearButton = document.createElement('button');
        clearButton.innerHTML = '×';
        clearButton.className = 'search-clear-button';
        clearButton.style.cssText = `
          position: absolute;
          right: 35px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          color: #9ca3af;
          cursor: pointer;
          width: 20px;
          height: 20px;
          display: none;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        `;

        // Enhanced input event handler with better debouncing
        searchInput.addEventListener('input', (e) => {
          console.log('🔍 Search input event:', e.target.value);
          this.performSearch(e.target.value);
          
          // Show/hide clear button based on input content
          if (e.target.value.trim() !== '') {
            clearButton.style.display = 'flex';
            searchIcon.style.display = 'none';
          } else {
            clearButton.style.display = 'none';
            searchIcon.style.display = 'block';
          }
        });

        // Enhanced keydown event handler
        searchInput.addEventListener('keydown', (e) => {
          console.log('🔍 Search keydown:', e.key);
          
          if (e.key === 'Escape') {
            searchInput.value = '';
            this.clearSearch();
            console.log('🔍 Search cleared via Escape key');
          }
          
          // Prevent other keyboard shortcuts when typing in search
          e.stopPropagation();
        });
        
        // Focus/blur handlers for better UX
        searchInput.addEventListener('focus', (e) => {
          console.log('🔍 Search input focused');
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });
        
        searchInput.addEventListener('blur', (e) => {
          console.log('🔍 Search input blurred');
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        });
        
        clearButton.addEventListener('click', () => {
          searchInput.value = '';
          this.clearSearch();
          searchInput.focus();
          console.log('🔍 Search cleared via clear button');
        });
        
        clearButton.addEventListener('mouseenter', () => {
          clearButton.style.backgroundColor = '#f3f4f6';
          clearButton.style.color = '#374151';
        });
        
        clearButton.addEventListener('mouseleave', () => {
          clearButton.style.backgroundColor = 'transparent';
          clearButton.style.color = '#9ca3af';
        });

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(clearButton);
        container.appendChild(searchContainer);
        
        console.log('🔍 Enhanced search box added with improved event handling');
      },

      /**
       * Perform search with FIXED debouncing - INCREASED TO 800ms
       * @param {string} query - Search query
       */
      performSearch(query) {
        console.log('🔍 Performing search for:', query);
        this.searchQuery = query.toLowerCase();
        
        // Clear existing timeout
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
          console.log('🔍 Cleared previous search timeout');
        }
        
        // FIXED: Increased debounce timeout from 300ms to 800ms for better UX
        this.searchTimeout = setTimeout(() => {
          console.log('🔍 Executing search after debounce:', this.searchQuery);
          if (window.geojsonData) {
            this.build(window.geojsonData);
          }
        }, 800); // FIXED: Changed from 300ms to 800ms
        
        console.log('🔍 Search scheduled with 800ms debounce');
      },

      /**
       * Clear search with ENHANCED cleanup
       */
      clearSearch() {
        console.log('🔍 Clearing search');
        
        this.searchQuery = '';
        
        // Clear any pending search timeouts
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
          this.searchTimeout = null;
          console.log('🔍 Cleared search timeout');
        }
        
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = '';
          console.log('🔍 Cleared search input value');
          
          // Hide clear button, show search icon
          const clearButton = document.querySelector('.search-clear-button');
          const searchIcon = searchInput.parentNode.querySelector('div');
          if (clearButton) clearButton.style.display = 'none';
          if (searchIcon) searchIcon.style.display = 'block';
        }
        
        if (window.geojsonData) {
          this.build(window.geojsonData);
          console.log('🔍 Rebuilt sidebar after search clear');
        }
      },

      /**
       * Filter features based on search query
       * @param {Array} features - GeoJSON features
       * @param {string} query - Search query
       * @returns {Array} Filtered features
       */
      filterFeatures(features, query) {
        if (!query || query.trim() === '') {
          return features;
        }

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return features.filter(feature => {
          const properties = feature.properties || {};
          
          const searchableFields = [
            this.extractPropertyValue(properties, ['name', 'Name', 'title', 'Title'], ''),
            this.extractGroupingValue(properties) || ''
          ];
          
          const searchableText = searchableFields.join(' ').toLowerCase();
          
          return searchTerms.every(term => searchableText.includes(term));
        });
      },

      /**
       * Highlight search text in results
       * @param {string} text - Text to highlight
       * @param {string} query - Search query
       * @returns {string} HTML with highlighted text
       */
      highlightSearchText(text, query) {
        if (!query || query.trim() === '') {
          return text;
        }

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let highlightedText = text;

        searchTerms.forEach(term => {
          const regex = new RegExp(`(${term})`, 'gi');
          highlightedText = highlightedText.replace(regex, '<mark style="background-color: #fef08a; color: #374151;">$1</mark>');
        });

        return highlightedText;
      },

      /**
       * Add search results summary
       * @param {HTMLElement} container - Container element
       * @param {number} shown - Number of results shown
       * @param {number} total - Total number of items
       */
      addSearchResults(container, shown, total) {
        const resultsContainer = document.createElement('div');
        resultsContainer.innerHTML = `Found ${shown} of ${total} contacts matching "${this.searchQuery}"`;
        resultsContainer.style.cssText = `
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-size: 11px;
          color: #1e40af;
          font-weight: 500;
        `;
        container.appendChild(resultsContainer);
      },

      /**
       * Add no results message
       * @param {HTMLElement} container - Container element
       */
      addNoResultsMessage(container) {
        const noResults = document.createElement('div');
        noResults.innerHTML = `
          <div>No contacts found matching "${this.searchQuery}"</div>
          <button onclick="SidebarManager.clearSearch()" style="
            margin-top: 10px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            font-size: 12px;
          ">Clear Search</button>
        `;
        noResults.style.cssText = `
          text-align: center;
          padding: 20px 15px;
          color: #6b7280;
          font-style: italic;
          font-size: 13px;
        `;
        container.appendChild(noResults);
      },

      /**
       * Extract property value with fallbacks
       * @param {Object} properties - Feature properties
       * @param {Array} keys - Possible property keys
       * @param {*} defaultValue - Default value if not found
       * @returns {*} Property value or default
       */
      extractPropertyValue(properties, keys, defaultValue = null) {
        if (!properties || typeof properties !== 'object') {
          return defaultValue;
        }
        for (const key of keys) {
          if (properties.hasOwnProperty(key)) {
            const value = properties[key];
            if (value !== null && value !== undefined && 
                (typeof value !== 'string' || value.trim() !== '')) {
              return value;
            }
          }
        }
        return defaultValue;
      },

      /**
       * Handle click on sidebar item
       * @param {Object} feature - GeoJSON feature
       * @param {string} contactId - Contact ID
       */
      handleClick(feature, contactId) {
        console.log('📌 Sidebar item clicked:', contactId);
        this.setActiveItem(contactId);
        
        if (window.MapManager && window.MapManager.handleMarkerClick) {
          window.MapManager.handleMarkerClick(feature);
        }
      },

      /**
       * Set active item in sidebar
       * @param {string} selectedId - Selected item ID
       */
      setActiveItem(selectedId) {
        document.querySelectorAll('.item').forEach(item => {
          item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-id="${selectedId}"]`);
        if (selectedItem) {
          selectedItem.classList.add('active');
          selectedItem.style.backgroundColor = '#e3f2fd';
          selectedItem.style.transition = 'background-color 0.3s ease';
          
          setTimeout(() => {
            selectedItem.style.backgroundColor = '';
          }, 2000);
        }
      },

      /**
       * Update all distances when reference marker changes
       */
      updateAllDistances() {
        console.log('🔄 Updating distances in sidebar...');
        
        // Check if reference marker exists
        const hasReference = window.ReferenceMarker && window.ReferenceMarker.exists();
        
        if (!hasReference) {
          console.log('No reference marker - removing distance capsules');
          // Remove all distance capsules
          document.querySelectorAll('.distance-capsule').forEach(el => {
            el.remove();
          });
          return;
        }

        console.log('Reference marker exists - rebuilding sidebar with distances');
        
        // Rebuild the sidebar to show distances
        if (window.geojsonData) {
          this.build(window.geojsonData);
        } else {
          console.warn('No geojsonData available for distance update');
        }
      },

      /**
       * Simple toast notification that doesn't depend on external notification system
       * @param {string} message - Message to show
       * @param {string} type - Toast type (success, info, warning, error)
       */
      showSimpleToast(message, type = 'info') {
        const colors = {
          success: '#22c55e',
          info: '#3b82f6', 
          warning: '#f59e0b',
          error: '#ef4444'
        };
        
        // Remove any existing toast
        const existingToast = document.querySelector('.sidebar-toast');
        if (existingToast) {
          existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'sidebar-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          background: ${colors[type] || colors.info};
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          font-size: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          max-width: 200px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        });
        
        // Auto remove
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }
        }, 2000);
      }

    };

    // Export SidebarManager to window
    window.SidebarManager = SidebarManager;

    // Dispatch event to indicate SidebarManager is ready
    window.dispatchEvent(new CustomEvent('mapalister:sidebarReady'));

    console.log('✅ SidebarManager loaded and exported to window');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSidebarManager();
  }

})();