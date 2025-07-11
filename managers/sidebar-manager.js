/**
 * =====================================================
 * FILE: managers/sidebar-manager.js (UPDATED WITH LUCIDE ICONS)
 * PURPOSE: Sidebar management with Lucide icons instead of emojis
 * DEPENDENCIES: DataConfig, DistanceUtils, ReferenceMarker, LucideUtils
 * EXPORTS: SidebarManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📋 Loading sidebar-manager.js (with Lucide icons)...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    if (typeof DistanceUtils === 'undefined') missing.push('DistanceUtils');
    if (typeof ReferenceMarker === 'undefined') missing.push('ReferenceMarker');
    if (typeof PopupUtils === 'undefined') missing.push('PopupUtils');
    if (typeof LucideUtils === 'undefined') missing.push('LucideUtils');
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
    window.addEventListener('mapalister:lucideUtilsReady', retryInit);
    return;
  }

  function initSidebarManager() {
    /**
     * SIDEBAR MANAGER WITH LUCIDE ICONS
     * Handles contact listings, search, and sidebar functionality with dynamic configuration
     */
    const SidebarManager = {
      searchQuery: '',
      filteredFeatures: [],
      searchTimeout: null,
      flagFilterActive: false,

      /**
       * Build sidebar with compact layout and Lucide icons
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
        
        // Add simple flag filter
        this.addFlagFilter(listings);
        
        // Update flag visuals if PopupUtils is available
        if (window.PopupUtils && window.PopupUtils.updateSidebarVisuals) {
          setTimeout(() => {
            window.PopupUtils.updateSidebarVisuals();
            this.updateFlagFilterVisuals();
            this.applyFlagFilterToSidebar();
            
            // Initialize Lucide icons after all content is built
            if (window.LucideUtils) {
              window.LucideUtils.init();
            }
          }, 50);
        }
      },

      /**
       * Add control buttons with Lucide icons
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
        const globeIcon = window.LucideUtils ? window.LucideUtils.icons.map({ size: 14 }) : '🌍';
        zoomToAll.innerHTML = `${globeIcon} Zoom to All`;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
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
        const settingsIcon = window.LucideUtils ? window.LucideUtils.icons.settings({ size: 14 }) : '⚙️';
        settingsButton.innerHTML = `${settingsIcon} Settings`;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        `;

        settingsButton.onclick = () => {
          if (window.SettingsManager) {
            window.SettingsManager.showSettings();
          }
        };

        this.addButtonHoverEffects(settingsButton);
        controlsContainer.appendChild(settingsButton);

        container.appendChild(controlsContainer);
        
        // Initialize Lucide icons for the buttons
        if (window.LucideUtils) {
          setTimeout(() => window.LucideUtils.init(), 10);
        }
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
       * Add search box with Lucide icons
       * @param {HTMLElement} container - Container element
       */
      addSearchBox(container) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.style.cssText = `position: relative; margin-bottom: 12px;`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search contacts...';
        searchInput.className = 'search-input';
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
        const searchIconHtml = window.LucideUtils ? window.LucideUtils.icon('search', { size: 14 }) : '🔍';
        searchIcon.innerHTML = searchIconHtml;
        searchIcon.style.cssText = `
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        `;

        // Clear button
        const clearButton = document.createElement('button');
        const clearIconHtml = window.LucideUtils ? window.LucideUtils.icon('x', { size: 16 }) : '×';
        clearButton.innerHTML = clearIconHtml;
        clearButton.className = 'search-clear-button';
        clearButton.style.cssText = `
          position: absolute;
          right: 35px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
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

        // Input event handler
        searchInput.addEventListener('input', (e) => {
          this.performSearch(e.target.value);
          
          if (e.target.value.trim() !== '') {
            clearButton.style.display = 'flex';
            searchIcon.style.display = 'none';
          } else {
            clearButton.style.display = 'none';
            searchIcon.style.display = 'block';
          }
        });

        // Keydown event handler
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            searchInput.value = '';
            this.clearSearch();
          }
          e.stopPropagation();
        });
        
        // Focus/blur handlers
        searchInput.addEventListener('focus', (e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });
        
        searchInput.addEventListener('blur', (e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        });
        
        clearButton.addEventListener('click', () => {
          searchInput.value = '';
          this.clearSearch();
          searchInput.focus();
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
        
        // Initialize Lucide icons
        if (window.LucideUtils) {
          setTimeout(() => window.LucideUtils.init(), 10);
        }
      },

      /**
       * Create sidebar item with Lucide icons
       * @param {Object} itemData - Item data object
       * @param {boolean} hasReference - Whether reference marker exists
       * @returns {HTMLElement} Sidebar item element
       */
      createSidebarItem(itemData, hasReference) {
        const { feature, index, contactId, name, coordinates, distance, groupValue } = itemData;
        
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('data-id', contactId);
        item.style.position = 'relative';

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
        leftSide.style.cssText = `flex: 1; min-width: 0;`;

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

        // Right side: Distance display
        const rightSide = document.createElement('div');
        rightSide.style.cssText = `flex-shrink: 0; margin-left: 8px;`;

        if (hasReference && distance !== null && distance !== undefined && !isNaN(distance)) {
          const distanceCapsule = document.createElement('div');
          distanceCapsule.className = 'distance-capsule';
          distanceCapsule.textContent = DistanceUtils.formatDistance(distance);
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
        }

        contentContainer.appendChild(leftSide);
        contentContainer.appendChild(rightSide);

        // Click handler
        contentContainer.onclick = (e) => {
          e.preventDefault();
          try {
            console.log('🖱️ Sidebar item clicked:', contactId);
            
            // Set active item
            this.handleClick(feature, contactId);
            
            // Close any existing popups first
            if (window.PopupUtils && window.PopupUtils.closeAllPopups) {
              window.PopupUtils.closeAllPopups();
            }
            
            // Zoom to marker on map
            if (window.map && coordinates) {
              const [lng, lat] = coordinates;
              console.log('🗺️ Flying to coordinates:', [lng, lat]);
              
              window.map.flyTo({
                center: [lng, lat],
                zoom: Math.max(window.map.getZoom(), 14),
                duration: 1000
              });
              
              // Show popup after zoom completes - multiple fallback methods
              setTimeout(() => {
                console.log('🎯 Attempting to show popup...');
                
                // Method 1: Try PopupUtils (preferred)
                if (window.PopupUtils && window.PopupUtils.showEnhancedPopup) {
                  console.log('✅ Using PopupUtils.showEnhancedPopup');
                  window.PopupUtils.showEnhancedPopup(window.map, feature, [lng, lat]);
                  return;
                }
                
                // Method 2: Try MapManager hover popup (fallback)
                if (window.MapManager && window.MapManager.hoverPopup) {
                  console.log('✅ Using MapManager.hoverPopup fallback');
                  const content = this.createBasicPopupContent ? 
                    this.createBasicPopupContent(feature) :
                    `<div style="padding: 15px;"><h3>${name}</h3></div>`;
                  
                  window.MapManager.hoverPopup
                    .setLngLat([lng, lat])
                    .setHTML(content)
                    .addTo(window.map);
                  return;
                }
                
                // Method 3: Create new popup directly (last resort)
                if (window.mapboxgl && window.mapboxgl.Popup) {
                  console.log('✅ Creating new popup directly');
                  const popup = new window.mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: false,
                    className: 'enhanced-popup'
                  });
                  
                  const content = this.createBasicPopupContent ? 
                    this.createBasicPopupContent(feature) :
                    `<div style="padding: 15px;"><h3>${name}</h3></div>`;
                  
                  popup.setLngLat([lng, lat])
                    .setHTML(content)
                    .addTo(window.map);
                  return;
                }
                
                console.error('❌ No popup method available');
              }, 1200);
            }
          } catch (err) {
            console.error('❌ Click handler error:', err);
            this.showFallbackPopup(feature, coordinates);
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
       * Create reference button with Lucide icon
       */
      createReferenceButton(feature, index, name, coordinates) {
        const refButton = document.createElement('button');
        refButton.className = 'reference-button';
        
        const locationIcon = window.LucideUtils ? window.LucideUtils.icon('crosshair', { size: 12 }) : '📍';
        refButton.innerHTML = locationIcon;
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
          transition: all 0.2s ease;
          z-index: 1;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
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

        if (window.LucideUtils) {
          setTimeout(() => window.LucideUtils.init(), 10);
        }

        return refButton;
      },

      /**
       * Add dataset summary
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
       * Add search results summary
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
       * Add flag filter
       */
      addFlagFilter(container) {
        if (document.querySelector('.flag-filter-controls')) return;
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'flag-filter-controls';
        filterContainer.style.cssText = `
          margin-bottom: 12px;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        `;
        
        const flagIcon = window.LucideUtils ? window.LucideUtils.icon('flag', { size: 12 }) : '🚩';
        const clearIcon = window.LucideUtils ? window.LucideUtils.icon('x', { size: 10 }) : '×';
        
        filterContainer.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: 600; 
              color: #374151; 
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ${flagIcon} Filter by Flags
            </div>
            <button onclick="SidebarManager.clearFlagFilter()" style="
              background: none;
              border: none;
              color: #6b7280;
              font-size: 10px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 2px;
            ">${clearIcon} Clear</button>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button onclick="SidebarManager.toggleFlagFilter()" 
                    id="flag-filter-button"
                    title="Show only flagged contacts"
                    style="
                      background: #ffffff;
                      border: 2px solid #e5e7eb;
                      border-radius: 6px;
                      padding: 8px 12px;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      font-size: 13px;
                      font-weight: 500;
                    ">
              ${flagIcon} Show Flagged Only
            </button>
            <div id="flag-filter-status" style="font-size: 11px; color: #6b7280;"></div>
          </div>
        `;
        
        container.appendChild(filterContainer);
        
        if (window.LucideUtils) {
          setTimeout(() => window.LucideUtils.init(), 10);
        }
      },

      /**
       * Perform search with debouncing
       */
      performSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
          if (window.geojsonData) {
            this.build(window.geojsonData);
          }
        }, 800);
      },

      /**
       * Clear search
       */
      clearSearch() {
        this.searchQuery = '';
        
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
          this.searchTimeout = null;
        }
        
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = '';
          const clearButton = document.querySelector('.search-clear-button');
          const searchIcon = searchInput.parentNode.querySelector('div');
          if (clearButton) clearButton.style.display = 'none';
          if (searchIcon) searchIcon.style.display = 'block';
        }
        
        if (window.geojsonData) {
          this.build(window.geojsonData);
        }
      },

      /**
       * Filter features based on search query
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
       * Handle click on sidebar item
       */
      handleClick(feature, contactId) {
        this.setActiveItem(contactId);
        
        if (window.MapManager && window.MapManager.handleMarkerClick) {
          window.MapManager.handleMarkerClick(feature);
        }
      },

      /**
       * Set active item in sidebar
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
       * Toggle flag filter
       */
      toggleFlagFilter() {
        this.flagFilterActive = !this.flagFilterActive;
        this.updateFlagFilterVisuals();
        this.applyFlagFilterToSidebar();
      },

      /**
       * Clear flag filter
       */
      clearFlagFilter() {
        this.flagFilterActive = false;
        this.updateFlagFilterVisuals();
        this.applyFlagFilterToSidebar();
      },

      /**
       * Update flag filter visuals with Lucide icons
       */
      updateFlagFilterVisuals() {
        const button = document.getElementById('flag-filter-button');
        const status = document.getElementById('flag-filter-status');
        
        if (!button || !status) return;
        
        const flagIcon = window.LucideUtils ? window.LucideUtils.icon('flag', { size: 14 }) : '🚩';
        
        if (this.flagFilterActive) {
          button.style.background = '#ef4444';
          button.style.borderColor = '#ef4444';
          button.style.color = 'white';
          button.innerHTML = `${flagIcon} Showing Flagged Only`;
          status.textContent = 'Filter active';
        } else {
          button.style.background = '#ffffff';
          button.style.borderColor = '#e5e7eb';
          button.style.color = '#374151';
          button.innerHTML = `${flagIcon} Show Flagged Only`;
          status.textContent = '';
        }
        
        if (window.LucideUtils) {
          setTimeout(() => window.LucideUtils.init(), 10);
        }
      },

      /**
       * Apply flag filter to sidebar items
       */
      applyFlagFilterToSidebar() {
        this.ensureCSSOverride();
        
        let visibleCount = 0;
        const totalCount = document.querySelectorAll('.item').length;
        
        document.querySelectorAll('.item').forEach((item, index) => {
          const contactId = item.getAttribute('data-id');
          const feature = this.findFeatureByContactId(contactId);
          
          if (!feature) {
            item.classList.add('flag-filter-hidden');
            return;
          }
          
          const isFlagged = feature.properties.flagged === true;
          
          if (!this.flagFilterActive) {
            item.classList.remove('flag-filter-hidden');
            visibleCount++;
          } else {
            if (isFlagged) {
              item.classList.remove('flag-filter-hidden');
              visibleCount++;
            } else {
              item.classList.add('flag-filter-hidden');
            }
          }
        });
        
        // Update the dataset summary
        const summary = document.querySelector('.dataset-summary');
        if (summary && this.flagFilterActive) {
          summary.textContent = `${visibleCount} of ${totalCount} contacts (flagged only)`;
        } else if (summary) {
          const config = DataConfig.getCurrentConfig();
          summary.textContent = `${totalCount} ${config.displayName.toLowerCase()}`;
        }
      },

      /**
       * Ensure CSS override for flag filtering
       */
      ensureCSSOverride() {
        if (document.getElementById('flag-filter-css')) return;
        
        const style = document.createElement('style');
        style.id = 'flag-filter-css';
        style.textContent = `
          .flag-filter-hidden {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            max-height: 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
        `;
        
        document.head.appendChild(style);
      },

      /**
       * Find feature by contact ID for flag filtering
       */
      findFeatureByContactId(contactId) {
        if (!window.geojsonData || !window.geojsonData.features) return null;
        
        // Extract index from contact_X format
        const contactIndex = parseInt(contactId.replace('contact_', ''));
        if (!isNaN(contactIndex) && window.geojsonData.features[contactIndex]) {
          return window.geojsonData.features[contactIndex];
        }
        
        // Fallback: search by property matching
        return window.geojsonData.features.find(feature => {
          const props = feature.properties || {};
          const featureContactId = props.id || props.contact_id || props.name || props.Name;
          return featureContactId === contactId;
        });
      },

      /**
       * Update all distances when reference marker changes
       */
      updateAllDistances() {
        const hasReference = window.ReferenceMarker && window.ReferenceMarker.exists();
        
        if (!hasReference) {
          document.querySelectorAll('.distance-capsule').forEach(el => {
            el.remove();
          });
          return;
        }
        
        if (window.geojsonData) {
          this.build(window.geojsonData);
        }
      },

      /**
       * Extract property value with fallbacks
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
       * Extract property value for grouping with dynamic property name
       */
      extractGroupingValue(properties) {
        const config = DataConfig.getCurrentConfig();
        
        return this.extractPropertyValue(properties, [
          config.groupingProperty,
          config.groupingProperty.charAt(0).toUpperCase() + config.groupingProperty.slice(1),
          'dataset', 'Dataset', 'group', 'Group'
        ], null);
      },

      /**
       * Get dataset color with dynamic configuration
       */
      getDatasetColor(groupValue) {
        const colors = DataConfig.getColorMapping();
        return colors[groupValue] || '#6b7280';
      },

      /**
       * Get dataset short label with dynamic configuration
       */
      getDatasetShortLabel(groupValue) {
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
        
        if (groupValue && groupValue.length <= 3) {
          return groupValue.toUpperCase();
        }
        
        if (!groupValue) return '';
        
        return groupValue.split(/[\s-_]+/)
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
      },

      /**
       * Create dataset indicator with dynamic configuration
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
       * Simple toast notification
       */
      showSimpleToast(message, type = 'info') {
        const colors = {
          success: '#22c55e',
          info: '#3b82f6', 
          warning: '#f59e0b',
          error: '#ef4444'
        };
        
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
        
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        });
        
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
      },

      /**
       * Utility methods for notes display
       */
      getTimeAgo(date) {
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
       * Basic popup content creator for fallback
       */
      createBasicPopupContent(feature) {
        const properties = feature.properties || {};
        const name = this.extractPropertyValue(properties, [
          'name', 'Name', 'title', 'Title'
        ], 'Contact');
        
        const telephone = this.extractPropertyValue(properties, ['Telephone', 'telephone', 'phone'], null);
        const mobile = this.extractPropertyValue(properties, ['Mobile', 'mobile', 'cell'], null);
        const email = this.extractPropertyValue(properties, ['Email', 'email'], null);
        const address = this.extractPropertyValue(properties, ['Address', 'address'], null);
        
        let content = `
          <div style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 250px;
            max-width: 300px;
            padding: 15px;
          ">
            <h3 style="
              margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: 600;
              color: #111827;
            ">${name}</h3>`;
        
        // Contact actions
        if (telephone || mobile || email) {
          content += `<div style="display: flex; gap: 8px; margin: 10px 0; flex-wrap: wrap;">`;
          
          if (telephone) {
            content += `<a href="tel:${telephone}" style="
              display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px;
              background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
              text-decoration: none; color: #374151; font-size: 12px;
            ">📞 Call</a>`;
          }
          
          if (mobile) {
            content += `<a href="tel:${mobile}" style="
              display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px;
              background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
              text-decoration: none; color: #374151; font-size: 12px;
            ">📱 Mobile</a>`;
          }
          
          if (email) {
            content += `<a href="mailto:${email}" style="
              display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px;
              background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
              text-decoration: none; color: #374151; font-size: 12px;
            ">✉️ Email</a>`;
          }
          
          content += `</div>`;
        }
        
        // Address
        if (address) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
          content += `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6;">
              <div style="font-size: 12px; color: #6b7280;">
                📍 <a href="${mapsUrl}" target="_blank" style="color: #6b7280; text-decoration: none;">${address}</a>
              </div>
            </div>`;
        }
        
        content += `</div>`;
        return content;
      },

      /**
       * Fallback popup when everything else fails
       */
      showFallbackPopup(feature, coordinates) {
        console.log('🆘 Showing fallback popup');
        
        if (!window.mapboxgl || !coordinates) return;
        
        try {
          const [lng, lat] = coordinates;
          const popup = new window.mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false
          });
          
          const content = this.createBasicPopupContent(feature);
          popup.setLngLat([lng, lat])
            .setHTML(content)
            .addTo(window.map);
        } catch (err) {
          console.error('❌ Fallback popup failed:', err);
        }
      }
    };

    // Export SidebarManager to window
    window.SidebarManager = SidebarManager;
    // Dispatch event to indicate SidebarManager is ready
    window.dispatchEvent(new CustomEvent('mapalister:sidebarReady'));

    console.log('✅ SidebarManager loaded with Lucide icons and exported to window');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSidebarManager();
  }

})();