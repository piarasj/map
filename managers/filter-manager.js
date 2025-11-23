/**
 * =====================================================
 * FILE: managers/filter-manager.js
 * PURPOSE: Interactive filtering for GeoJSON features
 * DEPENDENCIES: DataManager, SidebarManager, UnifiedMapManager
 * EXPORTS: FilterManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🔍 Loading filter-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    // No hard dependencies - will work with whatever is available
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ FilterManager missing dependencies: ${missingDeps.join(', ')}`);
    return;
  }

  /**
   * FILTER MANAGER
   * Handles interactive filtering of GeoJSON features
   */
  const FilterManager = {
    allFeatures: [],
    filteredFeatures: [],
    filters: {
      diocese: null,
      county: null,
      parish: ''
    },
    filterOptions: {
      dioceses: [],
      counties: [],
      parishes: []
    },

    /**
     * Initialize filter manager with GeoJSON data
     * @param {Object} geojson - GeoJSON data
     */
    initialize(geojson) {
      console.log('🔍 Initializing FilterManager...');
      
      if (!geojson || !geojson.features) {
        console.warn('⚠️ Invalid geojson data for filtering');
        return;
      }

      this.allFeatures = geojson.features;
      this.filteredFeatures = [...this.allFeatures];
      
      // Extract unique filter options
      this.extractFilterOptions();
      
      // Build filter UI
      this.buildFilterUI();
      
      console.log(`✅ FilterManager initialized with ${this.allFeatures.length} features`);
    },

    /**
     * Extract unique values for filter dropdowns
     */
    extractFilterOptions() {
      const dioceses = new Set();
      const counties = new Set();
      const parishes = new Set();

      this.allFeatures.forEach(feature => {
        const props = feature.properties || {};
        
        if (props.diocese) dioceses.add(props.diocese);
        if (props.county) counties.add(props.county);
        if (props.parish) parishes.add(props.parish);
      });

      this.filterOptions.dioceses = Array.from(dioceses).sort();
      this.filterOptions.counties = Array.from(counties).sort();
      this.filterOptions.parishes = Array.from(parishes).sort();

      console.log('🔍 Filter options extracted:', {
        dioceses: this.filterOptions.dioceses.length,
        counties: this.filterOptions.counties.length,
        parishes: this.filterOptions.parishes.length
      });
    },

    /**
     * Build filter UI in sidebar
     */
    buildFilterUI() {
      const listings = document.getElementById('listings');
      if (!listings) {
        console.error('❌ Listings container not found');
        return;
      }

      // Check if filters already exist
      let filterContainer = document.getElementById('filter-container');
      if (filterContainer) {
        // Update existing filters
        this.updateFilterDropdowns();
        return;
      }

      // Create filter container
      filterContainer = document.createElement('div');
      filterContainer.id = 'filter-container';
      filterContainer.className = 'filter-container';

      // Build filter HTML
      filterContainer.innerHTML = `
        <div class="filter-header">
          <span class="filter-title">🔍 Filters</span>
          <button class="filter-clear" id="clearFilters" title="Clear all filters">Clear</button>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Diocese</label>
          <select id="dioceseFilter" class="filter-select">
            <option value="">All Dioceses</option>
            ${this.filterOptions.dioceses.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">County</label>
          <select id="countyFilter" class="filter-select">
            <option value="">All Counties</option>
            ${this.filterOptions.counties.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Parish</label>
          <input 
            type="text" 
            id="parishFilter" 
            class="filter-input"
            placeholder="Search parishes..."
          />
        </div>

        <div class="filter-results" id="filterResults"></div>
      `;

      // Insert at the beginning of listings (after any existing controls)
      const firstChild = listings.firstChild;
      listings.insertBefore(filterContainer, firstChild);

      // Attach event listeners
      this.attachFilterEvents();
      
      console.log('✅ Filter UI built');
    },

    /**
     * Update filter dropdown options (for dynamic data)
     */
    updateFilterDropdowns() {
      const dioceseSelect = document.getElementById('dioceseFilter');
      const countySelect = document.getElementById('countyFilter');

      if (dioceseSelect) {
        const currentDiocese = dioceseSelect.value;
        dioceseSelect.innerHTML = `
          <option value="">All Dioceses</option>
          ${this.filterOptions.dioceses.map(d => `<option value="${d}"${d === currentDiocese ? ' selected' : ''}>${d}</option>`).join('')}
        `;
      }

      if (countySelect) {
        const currentCounty = countySelect.value;
        countySelect.innerHTML = `
          <option value="">All Counties</option>
          ${this.filterOptions.counties.map(c => `<option value="${c}"${c === currentCounty ? ' selected' : ''}>${c}</option>`).join('')}
        `;
      }
    },

    /**
     * Attach event listeners to filter controls
     */
    attachFilterEvents() {
      const dioceseFilter = document.getElementById('dioceseFilter');
      const countyFilter = document.getElementById('countyFilter');
      const parishFilter = document.getElementById('parishFilter');
      const clearButton = document.getElementById('clearFilters');

      if (dioceseFilter) {
        dioceseFilter.addEventListener('change', (e) => {
          this.filters.diocese = e.target.value || null;
          this.applyFilters();
        });
      }

      if (countyFilter) {
        countyFilter.addEventListener('change', (e) => {
          this.filters.county = e.target.value || null;
          this.applyFilters();
        });
      }

      if (parishFilter) {
        let debounceTimer;
        parishFilter.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.filters.parish = e.target.value.toLowerCase();
            this.applyFilters();
          }, 300);
        });
      }

      if (clearButton) {
        clearButton.addEventListener('click', () => {
          this.clearFilters();
        });
      }
    },

    /**
     * Apply current filters to features
     */
    applyFilters() {
      console.log('🔍 Applying filters:', this.filters);

      this.filteredFeatures = this.allFeatures.filter(feature => {
        const props = feature.properties || {};

        // Diocese filter
        if (this.filters.diocese && props.diocese !== this.filters.diocese) {
          return false;
        }

        // County filter
        if (this.filters.county && props.county !== this.filters.county) {
          return false;
        }

        // Parish search filter
        if (this.filters.parish) {
          const parishName = (props.parish || '').toLowerCase();
          if (!parishName.includes(this.filters.parish)) {
            return false;
          }
        }

        return true;
      });

      console.log(`🔍 Filtered: ${this.filteredFeatures.length} / ${this.allFeatures.length} features`);

      // Update results display
      this.updateFilterResults();

      // Update map and sidebar
      this.updateDisplay();
    },

    /**
     * Update filter results display
     */
    updateFilterResults() {
      const resultsDiv = document.getElementById('filterResults');
      if (!resultsDiv) return;

      const activeFilters = [];
      if (this.filters.diocese) activeFilters.push(`Diocese: ${this.filters.diocese}`);
      if (this.filters.county) activeFilters.push(`County: ${this.filters.county}`);
      if (this.filters.parish) activeFilters.push(`Parish: "${this.filters.parish}"`);

      if (activeFilters.length > 0) {
        resultsDiv.innerHTML = `
          <div class="filter-active">
            <strong>${this.filteredFeatures.length}</strong> of <strong>${this.allFeatures.length}</strong> parishes
          </div>
        `;
        resultsDiv.style.display = 'block';
      } else {
        resultsDiv.style.display = 'none';
      }
    },

    /**
     * Clear all filters
     */
    clearFilters() {
      console.log('🔍 Clearing all filters');

      this.filters = {
        diocese: null,
        county: null,
        parish: ''
      };

      // Reset UI
      const dioceseFilter = document.getElementById('dioceseFilter');
      const countyFilter = document.getElementById('countyFilter');
      const parishFilter = document.getElementById('parishFilter');

      if (dioceseFilter) dioceseFilter.value = '';
      if (countyFilter) countyFilter.value = '';
      if (parishFilter) parishFilter.value = '';

      // Reset filtered features
      this.filteredFeatures = [...this.allFeatures];

      // Update display
      this.updateFilterResults();
      this.updateDisplay();
    },

    /**
     * Update map and sidebar with filtered data
     */
    updateDisplay() {
      // Create filtered GeoJSON
      const filteredGeojson = {
        type: 'FeatureCollection',
        features: this.filteredFeatures
      };

      // Update global geojsonData
      window.geojsonData = filteredGeojson;

      // Update map markers
      if (window.map && window.UnifiedMapManager) {
        try {
          const mapManager = window.unifiedMapManagerInstance || new window.UnifiedMapManager();
          mapManager.updateMarkers(window.map, filteredGeojson);
          console.log('🗺️ Map updated with filtered data');
        } catch (e) {
          console.warn('⚠️ Could not update map:', e);
        }
      }

      // Update sidebar
      if (window.SidebarManager) {
        try {
          window.SidebarManager.build(filteredGeojson);
          console.log('📋 Sidebar updated with filtered data');
        } catch (e) {
          console.warn('⚠️ Could not update sidebar:', e);
        }
      }

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('mapalister:filtered', {
        detail: {
          total: this.allFeatures.length,
          filtered: this.filteredFeatures.length,
          filters: this.filters
        }
      }));
    },

    /**
     * Get current filtered data
     * @returns {Object} Filtered GeoJSON
     */
    getFilteredData() {
      return {
        type: 'FeatureCollection',
        features: this.filteredFeatures
      };
    }
  };

  // Export to window
  window.FilterManager = FilterManager;

  // Announce availability
  console.log('✅ FilterManager loaded and ready');
  window.dispatchEvent(new CustomEvent('mapalister:filterManagerReady'));

})();
