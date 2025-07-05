/**
 * DYNAMIC DATA CONFIGURATION SYSTEM
 * Flexible system for handling different data files and properties
 */

// ==========================================
// DATA CONFIGURATION & METADATA
// ==========================================

const DataConfig = {
  // Current data source configuration
  currentDataSource: {
    filename: 'deacons.geojson',
    displayName: 'Deakcons',
    sourceKey: 'deacons', // Used for map sources/layers
    groupingProperty: 'dataset', // Property used for grouping/filtering
    groupingDisplayName: 'Dataset', // Display name for the grouping property
    defaultGroupingValues: [
      'Group I - 2014-2018',
      'Group II 2017-2021', 
      'Group III - 2014-2026',
      'Group IV - 2025 - 2029',
      'Centre'
    ]
  },

  // Default colors for different grouping values
  defaultColors: [
    '#3b82f6', // Blue
    '#f59e0b', // Orange
    '#10b981', // Green
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#6b7280', // Gray
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316'  // Orange variant
  ],

  // File upload configuration (for future implementation)
  uploadConfig: {
    enabled: false, // Will be set to true when upload feature is implemented
    acceptedFormats: ['.geojson', '.json'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredProperties: ['geometry', 'properties'],
    optionalProperties: ['name', 'title', 'address', 'email', 'phone']
  },

  /**
   * Get the current data source configuration
   */
  getCurrentConfig() {
    return this.currentDataSource;
  },

  /**
   * Get color mapping for grouping values
   */
  getColorMapping() {
    const config = this.getCurrentConfig();
    const colorMap = {};
    
    config.defaultGroupingValues.forEach((value, index) => {
      colorMap[value] = this.defaultColors[index % this.defaultColors.length];
    });
    
    return colorMap;
  },

  /**
   * Update configuration for new data source
   */
  updateDataSource(newConfig) {
    this.currentDataSource = { ...this.currentDataSource, ...newConfig };
    console.log('📊 Data configuration updated:', this.currentDataSource);
  },

  /**
   * Extract metadata from loaded data
   */
  analyzeData(geojsonData) {
    if (!geojsonData || !geojsonData.features) {
      return null;
    }

    const config = this.getCurrentConfig();
    const groupingProp = config.groupingProperty;
    
    // Extract unique grouping values
    const groupingValues = new Set();
    const properties = new Set();
    
    geojsonData.features.forEach(feature => {
      if (feature.properties) {
        // Collect all property names
        Object.keys(feature.properties).forEach(prop => properties.add(prop));
        
        // Collect grouping values
        const groupValue = feature.properties[groupingProp];
        if (groupValue) {
          groupingValues.add(groupValue);
        }
      }
    });

    return {
      totalFeatures: geojsonData.features.length,
      groupingValues: Array.from(groupingValues),
      availableProperties: Array.from(properties),
      hasGroupingProperty: groupingValues.size > 0
    };
  },

  /**
   * Generate dynamic color mapping from data
   */
  generateColorMapping(groupingValues) {
    const colorMap = {};
    groupingValues.forEach((value, index) => {
      colorMap[value] = this.defaultColors[index % this.defaultColors.length];
    });
    return colorMap;
  }
};

// ==========================================
// UPDATED MAP MANAGER WITH DYNAMIC CONFIG
// ==========================================

const EnhancedMapManager = {
  markersLoaded: false,
  hoverPopup: null,
  currentConfig: null,

  /**
   * Initialize with dynamic configuration
   */
  initialize(mapInstance, geojsonData) {
    console.log('🚀 Enhanced MapManager: Initializing with dynamic config');
    
    if (!mapInstance || !geojsonData) {
      console.error('❌ MapManager: Cannot initialize - missing map or data');
      return false;
    }
    
    // Get current configuration
    this.currentConfig = DataConfig.getCurrentConfig();
    
    // Analyze the data
    const dataAnalysis = DataConfig.analyzeData(geojsonData);
    console.log('📊 Data analysis:', dataAnalysis);
    
    // Store reference to map
    map = mapInstance;
    
    // Add markers to map with dynamic configuration
    this.addMarkersToMap(map, geojsonData, dataAnalysis);
    
    // Setup interactions
    this.setupHoverPopups(map);
    this.setupClickInteractions(map);
    
    console.log('✅ Enhanced MapManager: Initialization complete');
    return true;
  },

  /**
   * Add markers with dynamic source and layer names
   */
  addMarkersToMap(map, geojsonData, dataAnalysis) {
    const config = this.currentConfig;
    const sourceKey = config.sourceKey;
    const layerKey = `${sourceKey}-markers`;
    
    console.log(`📍 Adding markers: source="${sourceKey}", layer="${layerKey}"`);
    
    // Remove existing layers and source
    this.removeExistingLayers(map);
    
    // Add source with dynamic name
    map.addSource(sourceKey, {
      type: 'geojson',
      data: geojsonData
    });
    
    // Generate color mapping
    let colorMapping;
    if (dataAnalysis && dataAnalysis.groupingValues.length > 0) {
      colorMapping = DataConfig.generateColorMapping(dataAnalysis.groupingValues);
    } else {
      colorMapping = DataConfig.getColorMapping();
    }
    
    // Build color expression for paint
    const colorExpression = this.buildColorExpression(config.groupingProperty, colorMapping);
    
    // Add marker layer with dynamic configuration
    map.addLayer({
      id: layerKey,
      type: 'circle',
      source: sourceKey,
      paint: {
        'circle-color': colorExpression,
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 6,
          10, 10,
          15, 14
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
    
    this.markersLoaded = true;
    console.log(`✅ Markers added: ${dataAnalysis?.totalFeatures || 0} features`);
  },

  /**
   * Build dynamic color expression for paint property
   */
  buildColorExpression(groupingProperty, colorMapping) {
    const expression = ['case'];
    
    // Add conditions for each grouping value
    Object.entries(colorMapping).forEach(([value, color]) => {
      expression.push(['==', ['get', groupingProperty], value]);
      expression.push(color);
    });
    
    // Default color (fallback)
    expression.push('#6b7280');
    
    return expression;
  },

  /**
   * Remove existing layers with dynamic names
   */
  removeExistingLayers(map) {
    const config = this.currentConfig;
    const sourceKey = config.sourceKey;
    const layersToRemove = [
      `${sourceKey}-markers`,
      `${sourceKey}-clusters`, 
      `${sourceKey}-cluster-count`
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
          console.log(`🗑️ Removed layer: ${layerId}`);
        } catch (e) {
          console.warn(`⚠️ Could not remove layer ${layerId}:`, e);
        }
      }
    });
    
    if (map.getSource(sourceKey)) {
      try {
        map.removeSource(sourceKey);
        console.log(`🗑️ Removed source: ${sourceKey}`);
      } catch (e) {
        console.warn(`⚠️ Could not remove source ${sourceKey}:`, e);
      }
    }
  },

  /**
   * Setup hover popups with dynamic configuration
   */
  setupHoverPopups(map) {
    const config = this.currentConfig;
    const layerKey = `${config.sourceKey}-markers`;
    
    console.log(`🖱️ Setting up hover popups for layer: ${layerKey}`);
    
    this.hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'hover-popup'
    });
      
    map.on('mouseenter', layerKey, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        
        const name = this.extractPropertyValue(properties, [
          'name', 'Name', 'title', 'Title'
        ], 'Contact');
        
        const groupValue = this.extractPropertyValue(properties, [
          config.groupingProperty
        ], null);
        
        let content = `<div class="hover-popup-content">
          <div class="hover-name">${name}</div>`;
        
        if (groupValue) {
          const colorMapping = DataConfig.getColorMapping();
          const color = colorMapping[groupValue] || '#6b7280';
          content += `<div class="hover-${config.groupingProperty}" style="color: ${color}; font-weight: 500;">${groupValue}</div>`;
        }
        
        // Add distance if reference marker exists
        if (ReferenceMarker && ReferenceMarker.exists()) {
          const coords = feature.geometry.coordinates;
          const distance = ReferenceMarker.getFormattedDistanceTo(coords[1], coords[0]);
          if (distance) {
            content += `<div class="hover-distance">📏 ${distance}</div>`;
          }
        }
        
        content += `<div class="hover-hint">Click for details • Right-click to set reference</div></div>`;
        
        this.hoverPopup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(content)
          .addTo(map);
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });
    
    map.on('mouseleave', layerKey, () => {
      this.hoverPopup.remove();
      map.getCanvas().style.cursor = '';
    });
    
    console.log('✅ Hover popups configured with dynamic layer');
  },

  /**
   * Setup click interactions with dynamic layer
   */
  setupClickInteractions(map) {
    const config = this.currentConfig;
    const layerKey = `${config.sourceKey}-markers`;
    
    console.log(`👆 Setting up click interactions for layer: ${layerKey}`);
    
    map.on('click', layerKey, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        // Handle the marker click
        this.handleMarkerClick(feature);
        
        // Show enhanced popup
        if (this.hoverPopup) {
          const content = this.createEnhancedPopupContent(feature);
          const coordinates = feature.geometry.coordinates;
          
          this.hoverPopup
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(map);
        }
      }
    });
    
    console.log('✅ Click interactions configured');
  },

  /**
   * Create enhanced popup content with dynamic configuration
   */
  createEnhancedPopupContent(feature) {
    const config = this.currentConfig;
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates;
    const [lng, lat] = coordinates;
    
    // Extract data using dynamic configuration
    const name = this.extractPropertyValue(properties, [
      'name', 'Name', 'title', 'Title'
    ], 'Contact');
    
    const groupValue = this.extractPropertyValue(properties, [
      config.groupingProperty
    ], null);
    
    // Build enhanced popup content
    let content = `
      <div class="enhanced-popup-content" style="
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        min-width: 280px;
        max-width: 320px;
        position: relative;
      ">
        <!-- Close button -->
        <button onclick="if(window.EnhancedMapManager && window.EnhancedMapManager.hoverPopup) window.EnhancedMapManager.hoverPopup.remove()" style="
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
           onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280'">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
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
      const colorMapping = DataConfig.getColorMapping();
      const color = colorMapping[groupValue] || '#6b7280';
      content += `
          <div class="contact-${config.groupingProperty}" style="
            font-size: 12px;
            color: ${color};
            font-weight: 500;
          ">${config.groupingDisplayName}: ${groupValue}</div>`;
    }
    
    content += `</div>`;
    
    // Add other contact details (address, phone, email, etc.)
    content += this.buildContactDetails(properties, lat, lng);
    
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
   * Build contact details section
   */
  buildContactDetails(properties, lat, lng) {
    const address = this.extractPropertyValue(properties, ['Address', 'address'], null);
    const telephone = this.extractPropertyValue(properties, ['Telephone', 'telephone', 'phone'], null);
    const mobile = this.extractPropertyValue(properties, ['Mobile', 'mobile', 'cell'], null);
    const email = this.extractPropertyValue(properties, ['Email', 'email'], null);
    
    let content = '';
    
    // Contact Actions
    const hasContactMethods = telephone || mobile || email;
    if (hasContactMethods) {
      content += `<div class="contact-actions" style="display: flex; gap: 8px; margin: 15px 0; flex-wrap: wrap;">`;
      
      if (telephone) {
        content += `
          <a href="tel:${telephone}" class="action-btn" style="
            display: flex; align-items: center; gap: 6px; padding: 8px 10px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            text-decoration: none; color: #374151; font-size: 12px;
            transition: all 0.2s ease; cursor: pointer;
          ">📞 Call</a>`;
      }
      
      if (mobile) {
        content += `
          <a href="tel:${mobile}" class="action-btn" style="
            display: flex; align-items: center; gap: 6px; padding: 8px 10px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            text-decoration: none; color: #374151; font-size: 12px;
            transition: all 0.2s ease; cursor: pointer;
          ">📱 Mobile</a>`;
      }
      
      if (email) {
        content += `
          <a href="mailto:${email}" class="action-btn" style="
            display: flex; align-items: center; gap: 6px; padding: 8px 10px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            text-decoration: none; color: #374151; font-size: 12px;
            transition: all 0.2s ease; cursor: pointer;
          ">✉️ Email</a>`;
      }
      
      content += `</div>`;
    }
    
    // Address
    if (address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      content += `
        <div class="contact-details" style="border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 12px;">
          <div class="detail-row" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
            <span>📍</span>
            <a href="${mapsUrl}" target="_blank" style="color: #6b7280; text-decoration: none; line-height: 1.3;">${address}</a>
          </div>
        </div>`;
    }
    
    // Distance from reference
    if (ReferenceMarker && ReferenceMarker.exists()) {
      const distance = ReferenceMarker.getFormattedDistanceTo(lat, lng);
      if (distance) {
        content += `
          <div class="detail-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
            <span>📏</span>
            <span>${distance} from reference</span>
          </div>`;
      }
    }
    
    return content;
  },

  /**
   * Update markers with new data
   */
  updateMarkers(map, geojsonData) {
    const config = this.currentConfig;
    const sourceKey = config.sourceKey;
    
    console.log(`🔄 Updating markers for source: ${sourceKey}`);
    
    if (!map || !geojsonData) {
      console.error('❌ Cannot update markers - missing map or data');
      return false;
    }
    
    const source = map.getSource(sourceKey);
    if (source) {
      source.setData(geojsonData);
      console.log('✅ Markers updated successfully');
      return true;
    } else {
      // Re-analyze data and add markers
      const dataAnalysis = DataConfig.analyzeData(geojsonData);
      this.addMarkersToMap(map, geojsonData, dataAnalysis);
      return true;
    }
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
   * Handle marker click
   */
  handleMarkerClick(feature) {
    const config = this.currentConfig;
    console.log(`📍 Marker clicked in ${config.displayName} data:`, feature.properties);
    
    const properties = feature.properties;
    const name = properties.name || properties.Name || 'Contact';
    
    // Update sidebar selection if available
    if (typeof SidebarManager !== 'undefined' && SidebarManager.setActiveItem) {
      const contactId = properties.id || properties.contact_id || name;
      SidebarManager.setActiveItem(contactId);
    }
  }
};

// ==========================================
// FILE UPLOAD PREPARATION
// ==========================================

const FileUploadManager = {
  enabled: false, // Will be enabled when upload feature is implemented
  
  /**
   * Initialize file upload (placeholder for future implementation)
   */
  init() {
    console.log('📁 File Upload Manager initialized (not yet implemented)');
    // TODO: Implement file upload functionality
  },
  
  /**
   * Handle file selection (placeholder)
   */
  handleFileSelection(file) {
    console.log('📁 File selected:', file.name);
    // TODO: Validate file, parse GeoJSON, update configuration
  },
  
  /**
   * Validate uploaded GeoJSON (placeholder)
   */
  validateGeoJSON(data) {
    // TODO: Implement validation logic
    return {
      valid: false,
      errors: ['File upload not yet implemented']
    };
  }
};

// ==========================================
// UPDATED INTEGRATION MANAGER
// ==========================================

class DynamicMapaListerIntegration {
  constructor() {
    this.datasetManager = null;
    this.initialized = false;
    this.map = null;
    this.dataConfig = DataConfig;
  }

  async initialize(mapInstance) {
    if (this.initialized) {
      console.log('⚠️ Integration already initialized');
      return;
    }

    this.map = mapInstance;

    try {
      console.log('🔄 Initializing Dynamic MapaLister system...');
      
      // Get current data configuration
      const config = this.dataConfig.getCurrentConfig();
      const dataPath = `data/${config.filename}`;
      
      console.log(`📂 Loading data from: ${dataPath}`);
      
      // Load the data file
      const response = await fetch(dataPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${config.filename}: ${response.statusText}`);
      }
      
      const geojsonData = await response.json();
      console.log(`✅ ${config.displayName} data loaded:`, geojsonData.features?.length, 'features');
      
      // Analyze the data
      const dataAnalysis = this.dataConfig.analyzeData(geojsonData);
      console.log('📊 Data analysis:', dataAnalysis);
      
      // Update configuration based on actual data
      if (dataAnalysis && dataAnalysis.groupingValues.length > 0) {
        this.dataConfig.updateDataSource({
          defaultGroupingValues: dataAnalysis.groupingValues
        });
      }
      
      // Initialize Enhanced Map Manager
      if (!EnhancedMapManager.initialize(mapInstance, geojsonData)) {
        throw new Error('Failed to initialize Enhanced Map Manager');
      }
      
      // Initialize dataset manager with dynamic configuration
      this.datasetManager = new EnhancedDatasetFilterManager(mapInstance, this.dataConfig);
      await this.datasetManager.loadData(geojsonData);
      
      // Export to global scope
      window.geojsonData = geojsonData;
      window.datasetFilterManager = this.datasetManager;
      window.EnhancedMapManager = EnhancedMapManager;
      window.DataConfig = DataConfig;
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize overlays if available
      if (SettingsManager && SettingsManager.initializeOverlays) {
        SettingsManager.initializeOverlays();
      }
      
      this.initialized = true;
      console.log(`🎉 Dynamic MapaLister integration successful for ${config.displayName} data!`);
      
      // Show success message
      if (window.ReferenceMarker && window.ReferenceMarker.showToast) {
        window.ReferenceMarker.showToast(
          `🎉 ${config.displayName} data loaded! Right-click to set reference points.`, 
          'success'
        );
      }
      
    } catch (error) {
      console.error('❌ Dynamic integration failed:', error);
      this.showErrorMessage(error);
    }
  }

  setupEventListeners() {
    // Existing event listener setup code...
    console.log('✅ Dynamic event listeners configured');
  }

  showErrorMessage(error) {
    const config = this.dataConfig.getCurrentConfig();
    const listings = document.getElementById('listings');
    const dropdown = document.getElementById('dropdownMenu');
    
    const errorHTML = `
      <div style="padding: 20px; text-align: center; color: #dc2626;">
        <h3>🚫 Loading Error</h3>
        <p>Failed to load ${config.filename}</p>
        <p style="font-size: 0.9em; color: #666; margin: 10px 0;">${error.message}</p>
        <button onclick="location.reload()" style="
          margin-top: 10px; 
          padding: 8px 16px; 
          background: #3b82f6; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
        ">
          🔄 Retry
        </button>
      </div>
    `;
    
    if (listings) listings.innerHTML = errorHTML;
    if (dropdown) {
      dropdown.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc2626;">
          <p>❌ Failed to load ${config.displayName} datasets</p>
        </div>
      `;
    }
  }
}

// ==========================================
// ENHANCED DATASET FILTER MANAGER
// ==========================================

class EnhancedDatasetFilterManager {
  constructor(map, dataConfig) {
    this.map = map;
    this.dataConfig = dataConfig;
    this.allData = null;
    this.activeDatasets = new Set();
    
    console.log('✅ Enhanced Dataset Filter Manager initialized with dynamic config');
  }

  async loadData(geojsonData) {
    const config = this.dataConfig.getCurrentConfig();
    console.log(`📊 Loading ${config.displayName} data...`, geojsonData.features?.length, 'features');
    
    // Fix property names
    const fixedData = {
      ...geojsonData,
      features: geojsonData.features.map(fixPropertyNames)
    };
    
    this.allData = fixedData;
    
    // Find available grouping values
    const groupingValues = new Set();
    fixedData.features.forEach(feature => {
      const groupValue = feature.properties?.[config.groupingProperty];
      if (groupValue) {
        groupingValues.add(groupValue);
      }
    });
    
    const availableGroupingValues = Array.from(groupingValues);
    console.log(`📂 Found ${config.groupingDisplayName} values:`, availableGroupingValues);
    
    this.updateDropdown(availableGroupingValues);
    
    // Activate all grouping values by default
    this.activeDatasets = new Set(availableGroupingValues);
    
    // Initialize map with data
    this.initializeMapWithData();
    
    // Update sidebar
    this.updateSidebar();
    
    return availableGroupingValues;
  }

  updateDropdown(groupingValues) {
    const config = this.dataConfig.getCurrentConfig();
    const dropdown = document.getElementById('dropdownMenu');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    
    // Add select all / none options
    const selectAllItem = document.createElement('div');
    selectAllItem.className = 'dropdown-item dropdown-control';
    selectAllItem.innerHTML = `
      <button onclick="datasetFilterManager.selectAll()" class="control-button">Select All</button>
      <button onclick="datasetFilterManager.selectNone()" class="control-button">Select None</button>
    `;
    dropdown.appendChild(selectAllItem);

    // Add separator
    const separator = document.createElement('div');
    separator.className = 'dropdown-separator';
    dropdown.appendChild(separator);
    
    // Generate color mapping
    const colorMapping = this.dataConfig.generateColorMapping(groupingValues);
    
    groupingValues.forEach(groupValue => {
      const count = this.allData.features.filter(f => f.properties?.[config.groupingProperty] === groupValue).length;
      const color = colorMapping[groupValue] || '#6b7280';
      
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('data-value', groupValue);
      
      const isActive = this.activeDatasets.has(groupValue);
      
      item.innerHTML = `
        <div class="checkbox-wrapper">
          <div class="checkbox ${isActive ? 'checked' : ''}"></div>
        </div>
        <span class="dataset-label">${groupValue}</span>
        <span class="dataset-count">${count}</span>
        <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; margin-left: auto;"></div>
      `;
      
      dropdown.appendChild(item);
    });
    
    this.updateSelectorText();
  }

  updateSelectorText() {
    const config = this.dataConfig.getCurrentConfig();
    const selectorText = document.getElementById('selectorText');
    if (!selectorText) return;

    const activeCount = this.activeDatasets.size;
    if (activeCount === 0) {
      selectorText.textContent = `No ${config.groupingDisplayName.toLowerCase()} selected`;
      selectorText.className = 'selector-text placeholder';
    } else {
      const labels = Array.from(this.activeDatasets);
      if (labels.length <= 2) {
        selectorText.textContent = labels.join(', ');
      } else {
        selectorText.textContent = `${labels.length} ${config.groupingDisplayName.toLowerCase()}s selected`;
      }
      selectorText.className = 'selector-text';
    }
  }

  selectAll() {
    const config = this.dataConfig.getCurrentConfig();
    const availableGroupingValues = Array.from(new Set(
      this.allData.features
        .map(f => f.properties?.[config.groupingProperty])
        .filter(Boolean)
    ));
    
    this.activeDatasets = new Set(availableGroupingValues);
    this.updateDropdownCheckboxes();
    this.updateMap();
    this.updateSidebar();
    this.updateSelectorText();
  }

  selectNone() {
    this.activeDatasets.clear();
    this.updateDropdownCheckboxes();
    this.updateMap();
    this.updateSidebar();
    this.updateSelectorText();
  }

  updateDropdownCheckboxes() {
    document.querySelectorAll('.dropdown-item[data-value]').forEach(item => {
      const groupValue = item.getAttribute('data-value');
      const checkbox = item.querySelector('.checkbox');
      
      if (this.activeDatasets.has(groupValue)) {
        checkbox.classList.add('checked');
      } else {
        checkbox.classList.remove('checked');
      }
    });
  }

  getFilteredData() {
    if (!this.allData) return null;

    const config = this.dataConfig.getCurrentConfig();
    const filteredFeatures = this.allData.features.filter(feature => 
      this.activeDatasets.has(feature.properties?.[config.groupingProperty])
    );

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  }

  updateMap() {
    // Update map markers with filtered data
    if (EnhancedMapManager && EnhancedMapManager.updateMarkers) {
      const filteredData = this.getFilteredData();
      EnhancedMapManager.updateMarkers(this.map, filteredData);
      
      // Only auto-zoom if auto-center is enabled
      if (SettingsManager && SettingsManager.getSetting('autoCenter')) {
        setTimeout(() => {
          this.zoomToFitMarkers(filteredData);
        }, 300);
      }
    }
  }

  updateSidebar() {
    if (this.allData && SidebarManager) {
      const filteredData = this.getFilteredData();
      SidebarManager.build(filteredData);
      
      // Export filtered data globally for other components
      geojsonData = filteredData;
    }
  }

  zoomToFitMarkers(geojsonData) {
    if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) return;
    if (!this.map) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();
      let validCoordinates = 0;

      geojsonData.features.forEach(feature => {
        if (feature.geometry && 
            feature.geometry.coordinates && 
            Array.isArray(feature.geometry.coordinates) &&
            feature.geometry.coordinates.length >= 2) {
          bounds.extend(feature.geometry.coordinates);
          validCoordinates++;
        }
      });

      if (validCoordinates > 0 && !bounds.isEmpty()) {
        this.map.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 15,
          duration: 1000
        });
        
        console.log(`📍 Auto-zoomed to fit ${validCoordinates} markers`);
      }
    } catch (e) {
      console.warn('⚠️ Failed to auto-zoom to markers:', e);
    }
  }

  initializeMapWithData() {
    // Initialize EnhancedMapManager with the data
    if (this.map && this.allData && EnhancedMapManager) {
      const dataAnalysis = this.dataConfig.analyzeData(this.allData);
      EnhancedMapManager.addMarkersToMap(this.map, this.getFilteredData(), dataAnalysis);
    }
    
    // Only auto-zoom on initial load if auto-center is enabled
    if (SettingsManager && SettingsManager.getSetting('autoCenter')) {
      setTimeout(() => {
        this.zoomToFitMarkers(this.getFilteredData());
      }, 1000);
    }
  }

  toggleDataset(groupValue) {
    if (this.activeDatasets.has(groupValue)) {
      this.activeDatasets.delete(groupValue);
    } else {
      this.activeDatasets.add(groupValue);
    }
    
    this.updateDropdownCheckboxes();
    this.updateMap();
    this.updateSidebar();
    this.updateSelectorText();
    
    const config = this.dataConfig.getCurrentConfig();
    console.log(`📊 ${config.groupingDisplayName} toggled:`, groupValue, 'Active:', Array.from(this.activeDatasets));
  }
}

// ==========================================
// GLOBAL INTEGRATION FUNCTIONS
// ==========================================

/**
 * Update data source configuration
 */
function updateDataSource(newConfig) {
  DataConfig.updateDataSource(newConfig);
  console.log('📊 Data source configuration updated');
}

/**
 * Load different data file
 */
async function loadDataFile(filename, displayName = null, groupingProperty = 'dataset') {
  try {
    const config = {
      filename: filename,
      displayName: displayName || filename.replace('.geojson', '').replace(/[_-]/g, ' '),
      sourceKey: filename.replace('.geojson', '').toLowerCase(),
      groupingProperty: groupingProperty
    };
    
    DataConfig.updateDataSource(config);
    
    // Reinitialize with new configuration
    if (window.map && window.DynamicMapaListerIntegration) {
      await window.DynamicMapaListerIntegration.initialize(window.map);
    }
    
    console.log(`✅ Successfully loaded ${config.displayName} data from ${filename}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to load data from ${filename}:`, error);
    return false;
  }
}

/**
 * Prepare for file upload (future implementation)
 */
function prepareFileUpload() {
  console.log('📁 Preparing file upload functionality...');
  
  // Create file input element (hidden)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.geojson,.json';
  fileInput.style.display = 'none';
  fileInput.id = 'geojson-file-input';
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 File selected:', file.name);
      
      try {
        // Read file content
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate GeoJSON structure
        if (!data.type || data.type !== 'FeatureCollection' || !data.features) {
          throw new Error('Invalid GeoJSON format');
        }
        
        // Extract filename without extension for configuration
        const baseName = file.name.replace(/\.(geojson|json)$/i, '');
        const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[_-]/g, ' ');
        
        // Analyze data to find grouping property
        const analysis = DataConfig.analyzeData(data);
        let groupingProperty = 'dataset';
        
        // Try to find a suitable grouping property
        if (analysis && analysis.availableProperties.length > 0) {
          const possibleGroupingProps = ['dataset', 'group', 'category', 'type', 'class'];
          for (const prop of possibleGroupingProps) {
            if (analysis.availableProperties.includes(prop)) {
              groupingProperty = prop;
              break;
            }
          }
        }
        
        // Update configuration
        const config = {
          filename: file.name,
          displayName: displayName,
          sourceKey: baseName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          groupingProperty: groupingProperty,
          groupingDisplayName: groupingProperty.charAt(0).toUpperCase() + groupingProperty.slice(1)
        };
        
        DataConfig.updateDataSource(config);
        
        // Update global data
        window.geojsonData = data;
        
        // Reinitialize map and components
        if (window.map) {
          // Clear existing data
          if (window.EnhancedMapManager) {
            window.EnhancedMapManager.removeExistingLayers(window.map);
          }
          
          // Initialize with new data
          const integration = new DynamicMapaListerIntegration();
          window.DynamicMapaListerIntegration = integration;
          
          // Since we already have the data, initialize directly
          if (window.EnhancedMapManager) {
            window.EnhancedMapManager.initialize(window.map, data);
          }
          
          if (window.datasetFilterManager) {
            await window.datasetFilterManager.loadData(data);
          }
        }
        
        console.log(`✅ Successfully loaded uploaded file: ${displayName}`);
        
        // Show success message
        if (window.ReferenceMarker && window.ReferenceMarker.showToast) {
          window.ReferenceMarker.showToast(
            `📁 ${displayName} data loaded successfully!`, 
            'success'
          );
        }
        
      } catch (error) {
        console.error('❌ Failed to process uploaded file:', error);
        
        // Show error message
        if (window.ReferenceMarker && window.ReferenceMarker.showToast) {
          window.ReferenceMarker.showToast(
            `❌ Failed to load file: ${error.message}`, 
            'error'
          );
        }
      }
    }
  });
  
  document.body.appendChild(fileInput);
  console.log('📁 File upload prepared (hidden input created)');
}

/**
 * Trigger file upload dialog (future implementation)
 */
function triggerFileUpload() {
  const fileInput = document.getElementById('geojson-file-input');
  if (fileInput) {
    fileInput.click();
  } else {
    console.warn('⚠️ File upload not prepared. Call prepareFileUpload() first.');
  }
}

// ==========================================
// EXPORT TO GLOBAL SCOPE
// ==========================================

// Export all the new functionality to window
window.DataConfig = DataConfig;
window.EnhancedMapManager = EnhancedMapManager;
window.EnhancedDatasetFilterManager = EnhancedDatasetFilterManager;
window.DynamicMapaListerIntegration = DynamicMapaListerIntegration;
window.FileUploadManager = FileUploadManager;

// Export utility functions
window.updateDataSource = updateDataSource;
window.loadDataFile = loadDataFile;
window.prepareFileUpload = prepareFileUpload;
window.triggerFileUpload = triggerFileUpload;

// Create and export the integration instance
window.dynamicMapaListerIntegration = new DynamicMapaListerIntegration();

console.log('✅ Dynamic Data Configuration System loaded and ready');
console.log('📋 Available functions:', {
  'DataConfig.updateDataSource()': 'Update data source configuration',
  'loadDataFile(filename, displayName, groupingProperty)': 'Load different data file',
  'prepareFileUpload()': 'Prepare file upload functionality',
  'triggerFileUpload()': 'Open file upload dialog',
  'DataConfig.getCurrentConfig()': 'Get current configuration',
  'DataConfig.analyzeData(geojsonData)': 'Analyze GeoJSON data structure'
});

// ==========================================
// USAGE EXAMPLES
// ==========================================

/*
// Example 1: Load different data file
await loadDataFile('priests.geojson', 'Priests', 'region');

// Example 2: Update configuration manually
DataConfig.updateDataSource({
  filename: 'churches.geojson',
  displayName: 'Churches',
  sourceKey: 'churches',
  groupingProperty: 'denomination',
  groupingDisplayName: 'Denomination'
});

// Example 3: Prepare file upload
prepareFileUpload();

// Example 4: Analyze data structure
const analysis = DataConfig.analyzeData(geojsonData);
console.log('Data analysis:', analysis);

// Example 5: Get current configuration
const config = DataConfig.getCurrentConfig();
console.log('Current config:', config);
*/