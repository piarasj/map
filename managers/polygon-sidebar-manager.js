/**
 * =====================================================
 * FILE: managers/polygon-sidebar-manager.js
 * PURPOSE: Sidebar for filtering polygon/area data (counties, dioceses, parishes)
 * DEPENDENCIES: FilterManager
 * EXPORTS: PolygonSidebarManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🗺️ Loading polygon-sidebar-manager.js...');

  const PolygonSidebarManager = {
    allFeatures: [],
    filteredFeatures: [],
    
    /**
     * Detect if data is polygon-based (areas) vs point-based (markers)
     */
    isPolygonData(geojson) {
      if (!geojson || !geojson.features || !geojson.features.length) {
        return false;
      }
      
      // Check first few features
      const sampleSize = Math.min(10, geojson.features.length);
      let polygonCount = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        const geomType = geojson.features[i]?.geometry?.type;
        if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
          polygonCount++;
        }
      }
      
      // If more than 50% are polygons, treat as polygon data
      return (polygonCount / sampleSize) > 0.5;
    },
    
    /**
     * Build polygon-focused sidebar
     */
    build(geojson) {
      console.log('🗺️ Building polygon sidebar...');
      
      const listings = document.getElementById('listings');
      if (!listings) {
        console.error('❌ Listings container not found');
        return;
      }
      
      this.allFeatures = geojson.features || [];
      this.filteredFeatures = [...this.allFeatures];
      
      listings.innerHTML = '';
      listings.style.display = 'block';
      listings.style.visibility = 'visible';
      
      // Add filter panel at top
      this.addFilterPanel(listings, geojson);
      
      // Add statistics summary
      this.addStatsSummary(listings);
      
      // Add parish list
      this.addParishList(listings);
      
      // Add instructions
      this.addInstructions(listings);
      
      // Ensure sidebar is visible
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = 'flex';
        sidebar.style.visibility = 'visible';
        sidebar.classList.remove('sidebar-hidden');
      }
      
      console.log('✅ Polygon sidebar built with', this.allFeatures.length, 'features');
    },
    
    /**
     * Add filter panel
     */
    addFilterPanel(container, geojson) {
      const filterContainer = document.createElement('div');
      filterContainer.className = 'polygon-filter-panel';
      
      // Extract unique values
      const dioceses = new Set();
      const counties = new Set();
      const parishes = new Set();
      
      geojson.features.forEach(f => {
        const props = f.properties || {};
        if (props.diocese) dioceses.add(props.diocese);
        
        // Handle underscore-separated counties (e.g., "Limerick_Tipperary")
        if (props.county) {
          const countyList = props.county.split('_');
          countyList.forEach(c => counties.add(c.trim()));
        }
        
        if (props.parish) parishes.add(props.parish);
      });
      
      filterContainer.innerHTML = `
        <div class="polygon-filter-header">
          <h3>🔍 Filter Parishes</h3>
          <button class="filter-clear-btn" id="clearPolygonFilters">Clear All</button>
        </div>
        
        <div class="polygon-filter-group">
          <label class="polygon-filter-label">Diocese</label>
          <select id="polygonDioceseFilter" class="polygon-filter-select">
            <option value="">All Dioceses (${dioceses.size})</option>
            ${Array.from(dioceses).sort().map(d => 
              `<option value="${d}">${d}</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="polygon-filter-group">
          <label class="polygon-filter-label">County</label>
          <select id="polygonCountyFilter" class="polygon-filter-select">
            <option value="">All Counties (${counties.size})</option>
            ${Array.from(counties).sort().map(c => 
              `<option value="${c}">${c}</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="polygon-filter-group">
          <label class="polygon-filter-label">Parish Search</label>
          <input 
            type="text" 
            id="polygonParishSearch" 
            class="polygon-filter-input"
            placeholder="Type to search ${parishes.size} parishes..."
          />
        </div>
        
        <div class="polygon-filter-results" id="polygonFilterResults"></div>
      `;
      
      container.appendChild(filterContainer);
      
      // Attach event listeners
      this.attachFilterEvents(geojson);
    },
    
    /**
     * Attach filter event listeners
     */
    attachFilterEvents(geojson) {
      const dioceseFilter = document.getElementById('polygonDioceseFilter');
      const countyFilter = document.getElementById('polygonCountyFilter');
      const parishSearch = document.getElementById('polygonParishSearch');
      const clearBtn = document.getElementById('clearPolygonFilters');
      
      const applyFilters = () => {
        const dioceseValue = dioceseFilter?.value || '';
        const countyValue = countyFilter?.value || '';
        const searchValue = (parishSearch?.value || '').toLowerCase();
        
        this.filteredFeatures = this.allFeatures.filter(f => {
          const props = f.properties || {};
          
          // Diocese filter
          if (dioceseValue && props.diocese !== dioceseValue) return false;
          
          // County filter - handle underscore-separated values
          if (countyValue) {
            const countyList = (props.county || '').split('_').map(c => c.trim());
            if (!countyList.includes(countyValue)) return false;
          }
          
          // Parish search
          if (searchValue && !(props.parish || '').toLowerCase().includes(searchValue)) return false;
          
          return true;
        });
        
        this.updateStatsSummary();
        this.updateFilterResults(dioceseValue, countyValue, searchValue);
        this.updateParishList();
        this.highlightFilteredAreas();
        
        // Zoom to filtered area if diocese or county selected
        if (dioceseValue || countyValue) {
          this.zoomToFilteredArea(dioceseValue ? 'diocese' : 'county');
        }
      };
      
      if (dioceseFilter) {
        dioceseFilter.addEventListener('change', applyFilters);
      }
      
      if (countyFilter) {
        countyFilter.addEventListener('change', applyFilters);
      }
      
      if (parishSearch) {
        let debounce;
        parishSearch.addEventListener('input', () => {
          clearTimeout(debounce);
          debounce = setTimeout(applyFilters, 300);
        });
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (dioceseFilter) dioceseFilter.value = '';
          if (countyFilter) countyFilter.value = '';
          if (parishSearch) parishSearch.value = '';
          this.filteredFeatures = [...this.allFeatures];
          this.updateStatsSummary();
          this.updateFilterResults('', '', '');
          this.highlightFilteredAreas();
        });
      }
    },
    
    /**
     * Add statistics summary
     */
    addStatsSummary(container) {
      const statsDiv = document.createElement('div');
      statsDiv.id = 'polygonStats';
      statsDiv.className = 'polygon-stats';
      
      const dioceses = new Set(this.allFeatures.map(f => f.properties?.diocese).filter(Boolean));
      
      // Count split counties correctly
      const counties = new Set();
      this.allFeatures.forEach(f => {
        if (f.properties?.county) {
          f.properties.county.split('_').forEach(c => counties.add(c.trim()));
        }
      });
      
      statsDiv.innerHTML = `
        <div class="stat-item">
          <span class="stat-value">${this.allFeatures.length}</span>
          <span class="stat-label">Parishes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${dioceses.size}</span>
          <span class="stat-label">Dioceses</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${counties.size}</span>
          <span class="stat-label">Counties</span>
        </div>
      `;
      
      container.appendChild(statsDiv);
    },
    
    /**
     * Update statistics after filtering
     */
    updateStatsSummary() {
      const statsDiv = document.getElementById('polygonStats');
      if (!statsDiv) return;
      
      const dioceses = new Set(this.filteredFeatures.map(f => f.properties?.diocese).filter(Boolean));
      
      // Count split counties correctly
      const counties = new Set();
      this.filteredFeatures.forEach(f => {
        if (f.properties?.county) {
          f.properties.county.split('_').forEach(c => counties.add(c.trim()));
        }
      });
      
      statsDiv.innerHTML = `
        <div class="stat-item">
          <span class="stat-value">${this.filteredFeatures.length}</span>
          <span class="stat-label">Parishes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${dioceses.size}</span>
          <span class="stat-label">Dioceses</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${counties.size}</span>
          <span class="stat-label">Counties</span>
        </div>
      `;
    },
    
    /**
     * Update filter results display
     */
    updateFilterResults(diocese, county, search) {
      const resultsDiv = document.getElementById('polygonFilterResults');
      if (!resultsDiv) return;
      
      const hasFilters = diocese || county || search;
      
      if (hasFilters) {
        const total = this.allFeatures.length;
        const filtered = this.filteredFeatures.length;
        const percentage = Math.round((filtered / total) * 100);
        
        resultsDiv.innerHTML = `
          <div class="filter-result-text">
            Showing <strong>${filtered}</strong> of <strong>${total}</strong> parishes (${percentage}%)
          </div>
        `;
        resultsDiv.style.display = 'block';
      } else {
        resultsDiv.style.display = 'none';
      }
    },
    
    /**
     * Highlight filtered areas on map
     */
    highlightFilteredAreas() {
      const map = window.map;
      if (!map) return;
      
      console.log(`🗺️ ${this.filteredFeatures.length} parishes match filters`);
      
      // Remove previous highlight and event listeners
      this.removeHighlight();
      this.removeHighlightEvents();
      
      // Separate polygons and points
      const polygonFeatures = this.filteredFeatures.filter(f => 
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      );
      const pointFeatures = this.filteredFeatures.filter(f => 
        f.geometry.type === 'Point'
      );
      
      // If filters are active, highlight filtered areas
      if (this.filteredFeatures.length < this.allFeatures.length && this.filteredFeatures.length > 0) {
        // Determine color based on filter type
        const color = this.getHighlightColor();
        
        // Highlight polygon features
        if (polygonFeatures.length > 0) {
          const highlightData = {
            type: 'FeatureCollection',
            features: polygonFeatures
          };
          
          if (!map.getSource('parish-highlight')) {
            map.addSource('parish-highlight', {
              type: 'geojson',
              data: highlightData
            });
            
            map.addLayer({
              id: 'parish-highlight-fill',
              type: 'fill',
              source: 'parish-highlight',
              paint: {
                'fill-color': color,
                'fill-opacity': 0.2
              }
            });
            
            map.addLayer({
              id: 'parish-highlight-outline',
              type: 'line',
              source: 'parish-highlight',
              paint: {
                'line-color': color,
                'line-width': 2,
                'line-opacity': 0.8
              }
            });
          } else {
            map.getSource('parish-highlight').setData(highlightData);
            
            // Update colors
            map.setPaintProperty('parish-highlight-fill', 'fill-color', color);
            map.setPaintProperty('parish-highlight-outline', 'line-color', color);
          }
        }
        
        // Highlight point features (city parishes)
        if (pointFeatures.length > 0) {
          const pointHighlightData = {
            type: 'FeatureCollection',
            features: pointFeatures
          };
          
          if (!map.getSource('parish-points-highlight')) {
            map.addSource('parish-points-highlight', {
              type: 'geojson',
              data: pointHighlightData
            });
            
            map.addLayer({
              id: 'parish-points-highlight',
              type: 'circle',
              source: 'parish-points-highlight',
              paint: {
                'circle-radius': 8,
                'circle-color': color,
                'circle-opacity': 0.8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }
            });
          } else {
            map.getSource('parish-points-highlight').setData(pointHighlightData);
            map.setPaintProperty('parish-points-highlight', 'circle-color', color);
          }
        }
        
        // Add hover popup functionality after layers are ready
        // Use requestAnimationFrame to ensure layers are rendered
        requestAnimationFrame(() => {
          this.addHighlightEvents();
        });
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('mapalister:polygonFiltered', {
        detail: {
          filtered: this.filteredFeatures,
          total: this.allFeatures.length
        }
      }));
    },
    
    /**
     * Get highlight color based on active filters
     */
    getHighlightColor() {
      const dioceseFilter = document.getElementById('polygonDioceseFilter');
      const countyFilter = document.getElementById('polygonCountyFilter');
      const parishSearch = document.getElementById('polygonParishSearch');
      
      // Diocese = green
      if (dioceseFilter?.value) return '#10b981';
      
      // County = purple
      if (countyFilter?.value) return '#8b5cf6';
      
      // Parish search = blue
      if (parishSearch?.value) return '#3b82f6';
      
      return '#3b82f6';
    },
    
    /**
     * Zoom to show all filtered areas in context
     */
    zoomToFilteredArea(filterType) {
      const map = window.map;
      if (!map || this.filteredFeatures.length === 0) return;
      
      try {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Calculate bounds for all filtered features
        this.filteredFeatures.forEach(feature => {
          const coords = feature.geometry.coordinates;
          const geomType = feature.geometry.type;
          
          if (geomType === 'Polygon') {
            coords[0].forEach(coord => bounds.extend(coord));
          } else if (geomType === 'MultiPolygon') {
            coords.forEach(polygon => {
              polygon[0].forEach(coord => bounds.extend(coord));
            });
          }
        });
        
        // Zoom with context
        map.fitBounds(bounds, {
          padding: {top: 80, bottom: 80, left: 80, right: 80},
          maxZoom: filterType === 'diocese' ? 9 : 10,
          duration: 1200,
          essential: true
        });
        
        console.log(`🎯 Zoomed to ${filterType} with ${this.filteredFeatures.length} parishes`);
      } catch (error) {
        console.error('❌ Error zooming to filtered area:', error);
      }
    },
    
    /**
     * Add parish list display
     */
    addParishList(container) {
      const listContainer = document.createElement('div');
      listContainer.id = 'polygonParishList';
      listContainer.className = 'polygon-parish-list';
      
      const listHeader = document.createElement('div');
      listHeader.className = 'parish-list-header';
      listHeader.innerHTML = `
        <h4>📍 Parishes</h4>
        <span class="parish-count">${this.filteredFeatures.length} total</span>
      `;
      
      const list = document.createElement('div');
      list.id = 'parishListItems';
      list.className = 'parish-list-items';
      
      this.renderParishList(list);
      
      listContainer.appendChild(listHeader);
      listContainer.appendChild(list);
      container.appendChild(listContainer);
    },
    
    /**
     * Render parish list items
     */
    renderParishList(container) {
      container.innerHTML = '';
      
      if (this.filteredFeatures.length === 0) {
        container.innerHTML = '<div class="no-parishes">No parishes match your filters</div>';
        return;
      }
      
      // Sort parishes alphabetically
      const sortedParishes = [...this.filteredFeatures].sort((a, b) => {
        const nameA = (a.properties?.parish || '').toLowerCase();
        const nameB = (b.properties?.parish || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      sortedParishes.forEach(feature => {
        const props = feature.properties || {};
        const item = document.createElement('div');
        item.className = 'parish-item';
        
        item.innerHTML = `
          <div class="parish-name">${props.parish || 'Urban Parishes'}</div>
          <div class="parish-details">
            <span class="parish-county">${props.county || 'Unknown County'}</span>
            <span class="parish-separator">•</span>
            <span class="parish-diocese">${props.diocese || 'Unknown Diocese'}</span>
          </div>
        `;
        
        // Add click handler to zoom to parish
        item.addEventListener('click', () => {
          this.zoomToParish(feature);
        });
        
        container.appendChild(item);
      });
    },
    
    /**
     * Update parish list after filtering
     */
    updateParishList() {
      const listItems = document.getElementById('parishListItems');
      const countSpan = document.querySelector('.parish-count');
      
      if (listItems) {
        this.renderParishList(listItems);
      }
      
      if (countSpan) {
        countSpan.textContent = `${this.filteredFeatures.length} ${this.filteredFeatures.length === 1 ? 'parish' : 'parishes'}`;
      }
    },
    
    /**
     * Highlight and zoom to parish with context
     */
    zoomToParish(feature) {
      if (!window.map || !feature.geometry) return;
      
      try {
        const parishName = feature.properties?.parish || 'parish';
        const geomType = feature.geometry.type;
        
        // Remove any existing highlight
        this.removeHighlight();
        
        // Handle Point features (city parishes) differently
        if (geomType === 'Point') {
          const coords = feature.geometry.coordinates;
          
          // Add a marker highlight for the point
          const pointHighlightData = {
            type: 'FeatureCollection',
            features: [feature]
          };
          
          if (!window.map.getSource('parish-points-highlight')) {
            window.map.addSource('parish-points-highlight', {
              type: 'geojson',
              data: pointHighlightData
            });
            
            window.map.addLayer({
              id: 'parish-points-highlight',
              type: 'circle',
              source: 'parish-points-highlight',
              paint: {
                'circle-radius': 10,
                'circle-color': '#3b82f6',
                'circle-opacity': 0.8,
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff'
              }
            });
          } else {
            window.map.getSource('parish-points-highlight').setData(pointHighlightData);
          }
          
          window.map.flyTo({
            center: coords,
            zoom: 14,
            duration: 1200,
            essential: true
          });
          console.log(`🎯 Zoomed to city parish marker: ${parishName}`);
          return;
        }
        
        // Add highlight layer for polygon parishes
        this.addHighlight(feature);
        
        // Calculate bounds for polygons
        const bounds = new mapboxgl.LngLatBounds();
        const coords = feature.geometry.coordinates;
        
        if (geomType === 'Polygon') {
          coords[0].forEach(coord => bounds.extend(coord));
        } else if (geomType === 'MultiPolygon') {
          coords.forEach(polygon => {
            polygon[0].forEach(coord => bounds.extend(coord));
          });
        }
        
        // Zoom with generous padding to show context (not filling screen)
        window.map.fitBounds(bounds, {
          padding: {top: 100, bottom: 100, left: 100, right: 100},
          maxZoom: 11, // Don't zoom in too close
          duration: 1200,
          essential: true
        });
        
        console.log(`🎯 Highlighted and zoomed to ${parishName}`);
      } catch (error) {
        console.error('❌ Error zooming to parish:', error);
      }
    },
    
    /**
     * Add highlight outline to selected parish
     */
    addHighlight(feature) {
      const map = window.map;
      if (!map) return;
      
      // Create GeoJSON for the highlight
      const highlightData = {
        type: 'FeatureCollection',
        features: [feature]
      };
      
      // Add source if it doesn't exist
      if (!map.getSource('parish-highlight')) {
        map.addSource('parish-highlight', {
          type: 'geojson',
          data: highlightData
        });
        
        // Add fill layer (subtle)
        map.addLayer({
          id: 'parish-highlight-fill',
          type: 'fill',
          source: 'parish-highlight',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15
          }
        });
        
        // Add outline layer (prominent)
        map.addLayer({
          id: 'parish-highlight-outline',
          type: 'line',
          source: 'parish-highlight',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-opacity': 0.9
          }
        });
      } else {
        // Update existing source
        map.getSource('parish-highlight').setData(highlightData);
      }
    },
    
    /**
     * Remove parish highlight
     */
    removeHighlight() {
      const map = window.map;
      if (!map) return;
      
      // Remove polygon highlights
      if (map.getLayer('parish-highlight-outline')) {
        map.removeLayer('parish-highlight-outline');
      }
      if (map.getLayer('parish-highlight-fill')) {
        map.removeLayer('parish-highlight-fill');
      }
      if (map.getSource('parish-highlight')) {
        map.removeSource('parish-highlight');
      }
      
      // Remove point highlights
      if (map.getLayer('parish-points-highlight')) {
        map.removeLayer('parish-points-highlight');
      }
      if (map.getSource('parish-points-highlight')) {
        map.removeSource('parish-points-highlight');
      }
    },
    
    /**
     * Add hover events to show popup on highlighted areas
     */
    addHighlightEvents() {
      const map = window.map;
      if (!map) return;
      
      // Create popup if it doesn't exist
      if (!this.highlightPopup) {
        this.highlightPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'overlay-popup parish-popup',
          anchor: 'right',
          offset: [-15, 0]
        });
      }
      
      let currentHoveredFeature = null;
      let popupTimeout = null;
      
      // Mousemove event - updates position continuously
      this.onHighlightMouseMove = (e) => {
        if (popupTimeout) {
          clearTimeout(popupTimeout);
          popupTimeout = null;
        }
        
        // Only query layers that exist
        const layersToQuery = [];
        if (map.getLayer('parish-highlight-fill')) layersToQuery.push('parish-highlight-fill');
        if (map.getLayer('parish-points-highlight')) layersToQuery.push('parish-points-highlight');
        
        if (layersToQuery.length === 0) return;
        
        const features = map.queryRenderedFeatures(e.point, {
          layers: layersToQuery
        });
        
        if (features.length > 0) {
          const feature = features[0];
          const props = feature.properties || {};
          const featureId = props.parish || feature.id;
          
          if (currentHoveredFeature !== featureId) {
            currentHoveredFeature = featureId;
            map.getCanvas().style.cursor = 'pointer';
            
            // Split county if it has underscores
            const countyDisplay = (props.county || 'Unknown County').split('_').join(', ');
            const diocese = props.diocese || 'Unknown';
            
            const parishIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 16 }) : '📍';
            const html = `
              <div style="
                font-family: 'Outfit', sans-serif;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(12px);
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.2);
                min-width: 120px;
                text-align: center;
              ">
                <div style="
                  font-weight: 600; 
                  color: #047857; 
                  font-size: 14px; 
                  margin-bottom: 2px;
                  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                ">${parishIcon} ${props.parish || 'Urban Parishes'}</div>
                <div style="
                  color: #64748b; 
                  font-size: 10px; 
                  font-weight: 500;
                  opacity: 0.9;
                  margin-bottom: 2px;
                ">Diocese of ${diocese}</div>
                <div style="
                  color: #10b981; 
                  font-size: 10px; 
                  font-weight: 500;
                  opacity: 0.85;
                  margin-bottom: 4px;
                ">${countyDisplay}</div>
                <div style="
                  color: #059669; 
                  font-size: 11px; 
                  font-weight: 500;
                  opacity: 0.8;
                ">Filtered Selection</div>
              </div>
            `;
            
            this.highlightPopup
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
              
            if (window.LucideUtils) {
              setTimeout(() => window.LucideUtils.init(), 10);
            }
          } else {
            // Same feature, just update position
            this.highlightPopup.setLngLat(e.lngLat);
          }
        } else {
          this.hideHighlightPopupWithDelay();
        }
      };
      
      // Mouseleave event with delay
      this.onHighlightMouseLeave = () => {
        if (popupTimeout) {
          clearTimeout(popupTimeout);
        }
        
        popupTimeout = setTimeout(() => {
          if (this.highlightPopup) {
            this.highlightPopup.remove();
          }
          currentHoveredFeature = null;
          map.getCanvas().style.cursor = '';
        }, 150);
      };
      
      this.hideHighlightPopupWithDelay = this.onHighlightMouseLeave;
      
      // Attach events for polygon fills
      if (map.getLayer('parish-highlight-fill')) {
        map.on('mousemove', 'parish-highlight-fill', this.onHighlightMouseMove);
        map.on('mouseleave', 'parish-highlight-fill', this.onHighlightMouseLeave);
        console.log('✅ Attached hover events to parish-highlight-fill');
      } else {
        console.log('⚠️ parish-highlight-fill layer not found');
      }
      
      // Attach events for point markers
      if (map.getLayer('parish-points-highlight')) {
        map.on('mousemove', 'parish-points-highlight', this.onHighlightMouseMove);
        map.on('mouseleave', 'parish-points-highlight', this.onHighlightMouseLeave);
        console.log('✅ Attached hover events to parish-points-highlight');
      }
    },
    
    /**
     * Remove hover events
     */
    removeHighlightEvents() {
      const map = window.map;
      if (!map) return;
      
      if (this.onHighlightMouseMove) {
        if (map.getLayer('parish-highlight-fill')) {
          map.off('mousemove', 'parish-highlight-fill', this.onHighlightMouseMove);
        }
        if (map.getLayer('parish-points-highlight')) {
          map.off('mousemove', 'parish-points-highlight', this.onHighlightMouseMove);
        }
      }
      if (this.onHighlightMouseLeave) {
        if (map.getLayer('parish-highlight-fill')) {
          map.off('mouseleave', 'parish-highlight-fill', this.onHighlightMouseLeave);
        }
        if (map.getLayer('parish-points-highlight')) {
          map.off('mouseleave', 'parish-points-highlight', this.onHighlightMouseLeave);
        }
      }
      
      if (this.highlightPopup) {
        this.highlightPopup.remove();
      }
    },
    
    /**
     * Add usage instructions
     */
    addInstructions(container) {
      const instructions = document.createElement('div');
      instructions.className = 'polygon-instructions';
      instructions.innerHTML = `
        <div class="instruction-header">📖 How to Use</div>
        <ul class="instruction-list">
          <li>Use filters above to narrow down parishes</li>
          <li>Diocese and County filters work together</li>
          <li>Search for specific parish names</li>
          <li>Click "Clear All" to reset filters</li>
          <li>Upload point data (GeoJSON) to switch to marker mode</li>
        </ul>
      `;
      container.appendChild(instructions);
    }
  };
  
  // Export
  window.PolygonSidebarManager = PolygonSidebarManager;
  
  console.log('✅ PolygonSidebarManager loaded');
  window.dispatchEvent(new CustomEvent('mapalister:polygonSidebarReady'));

})();
