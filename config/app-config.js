/**
 * =====================================================
 * FILE: config/app-config.js
 * PURPOSE: Core application configuration and data management
 * DEPENDENCIES: None (pure configuration)
 * EXPORTS: MapaListerConfig, DataConfig
 * =====================================================
 */
 
 // Add to top of app-config.js
console.warn('⚠️ app-config.js is deprecated. Functionality moved to SettingsManager.');

(function() {
  'use strict';
  
  console.log('🔧 Loading app-config.js...');

  /**
   * CORE APPLICATION CONFIGURATION
   * Static configuration that doesn't change during runtime
   */
  const MapaListerConfig = {
    // Map configuration
    defaultMapStyle: 'mapbox/dark-v11',
    defaultZoom: 6,
    defaultCenter: [-7.5, 53.0], // Ireland center
    distanceUnits: 'km',
    
    // Available map styles
    mapStyles: {
      'mapbox/light-v11': 'Light',
      'mapbox/streets-v12': 'Streets', 
      'mapbox/outdoors-v12': 'Outdoors',
      'mapbox/satellite-v9': 'Satellite',
      'mapbox/dark-v11': 'Dark'
    },
    
    // Get dynamic dataset colors (depends on DataConfig)
    get datasetColors() {
      return window.DataConfig ? 
        window.DataConfig.getColorMapping() : 
        this._fallbackColors;
    },
    
    // Fallback colors when DataConfig not available
    _fallbackColors: {
      'Group I - 2014-2018': '#3b82f6',
      'Group II 2017-2021': '#f59e0b',
      'Group III - 2014-2026': '#10b981',
      'Group IV - 2025 - 2029': '#8b5cf6',
      'Centre': '#ef4444'
    },
    
    // Get current data configuration
    get currentDataConfig() {
      return window.DataConfig ? 
        window.DataConfig.getCurrentConfig() : 
        this._fallbackDataConfig;
    },
    
    // Fallback data config
    _fallbackDataConfig: {
      filename: 'deacons.geojson',
      displayName: 'Contacts',
      sourceKey: 'deacons',
      groupingProperty: 'dataset',
      groupingDisplayName: 'Dataset'
    }
  };

  /**
   * DYNAMIC DATA CONFIGURATION MANAGER
   * Handles different data sources and their properties
   */
  const DataConfig = {
    // Current data source configuration
    _currentDataSource: {
      filename: 'deacons.geojson',
      displayName: 'Contacts',
      sourceKey: 'deacons',
      groupingProperty: 'dataset',
      groupingDisplayName: 'Dataset',
      defaultGroupingValues: [
        'Group I - 2014-2018',
        'Group II 2017-2021', 
        'Group III - 2014-2026',
        'Group IV - 2025 - 2029',
        'Centre'
      ]
    },

    // Default colors for different grouping values
    _defaultColors: [
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

    // Change listeners
    _listeners: new Set(),

    /**
     * Get the current data source configuration
     */
    getCurrentConfig() {
      return { ...this._currentDataSource };
    },

    /**
     * Update data source configuration
     * @param {Object} newConfig - New configuration options
     */
    updateDataSource(newConfig) {
      const oldConfig = { ...this._currentDataSource };
      this._currentDataSource = { ...this._currentDataSource, ...newConfig };
      
      console.log('📊 Data configuration updated:', this._currentDataSource);
      
      // Notify listeners of change
      this._notifyListeners(oldConfig, this._currentDataSource);
      
      // Emit global event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mapalister:configChanged', {
          detail: { 
            oldConfig, 
            newConfig: this._currentDataSource 
          }
        }));
      }
    },

    /**
     * Get color mapping for current grouping values
     */
    getColorMapping() {
      const config = this.getCurrentConfig();
      const colorMap = {};
      
      config.defaultGroupingValues.forEach((value, index) => {
        colorMap[value] = this._defaultColors[index % this._defaultColors.length];
      });
      
      return colorMap;
    },

    /**
     * Generate color mapping for any set of values
     * @param {Array} groupingValues - Array of grouping values
     * @param {Array} customColors - Optional custom color palette
     */
    generateColorMapping(groupingValues, customColors = null) {
      const colors = customColors || this._defaultColors;
      const colorMap = {};
      
      groupingValues.forEach((value, index) => {
        colorMap[value] = colors[index % colors.length];
      });
      
      return colorMap;
    },

    /**
     * Analyze GeoJSON data structure
     * @param {Object} geojsonData - GeoJSON data to analyze
     */
    analyzeData(geojsonData) {
      if (!geojsonData || !geojsonData.features) {
        return null;
      }

      const config = this.getCurrentConfig();
      const groupingProp = config.groupingProperty;
      
      // Extract unique grouping values and all properties
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
        hasGroupingProperty: groupingValues.size > 0,
        groupingProperty: groupingProp
      };
    },

    /**
     * Add change listener
     * @param {Function} callback - Function to call when config changes
     */
    addChangeListener(callback) {
      this._listeners.add(callback);
    },

    /**
     * Remove change listener
     * @param {Function} callback - Function to remove
     */
    removeChangeListener(callback) {
      this._listeners.delete(callback);
    },

    /**
     * Notify all listeners of configuration change
     * @private
     */
    _notifyListeners(oldConfig, newConfig) {
      this._listeners.forEach(callback => {
        try {
          callback(newConfig, oldConfig);
        } catch (error) {
          console.error('Error in DataConfig change listener:', error);
        }
      });
    },

    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     */
    validateConfig(config) {
      const required = ['filename', 'displayName', 'sourceKey', 'groupingProperty'];
      const missing = required.filter(key => !config[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required config properties: ${missing.join(', ')}`);
      }
      
      // Validate filename format
      if (!config.filename.match(/\.(geojson|json)$/i)) {
        console.warn('Filename should have .geojson or .json extension');
      }
      
      // Validate sourceKey format (should be valid identifier)
      if (!config.sourceKey.match(/^[a-z][a-z0-9_]*$/i)) {
        throw new Error('sourceKey must be a valid identifier (letters, numbers, underscore)');
      }
      
      return true;
    },

    /**
     * Reset to default configuration
     */
    reset() {
      const defaultConfig = {
        filename: 'deacons.geojson',
        displayName: 'Contacts',
        sourceKey: 'deacons',
        groupingProperty: 'dataset',
        groupingDisplayName: 'Dataset',
        defaultGroupingValues: [
          'Group I - 2014-2018',
          'Group II 2017-2021', 
          'Group III - 2014-2026',
          'Group IV - 2025 - 2029',
          'Centre'
        ]
      };
      
      this.updateDataSource(defaultConfig);
      console.log('🔄 DataConfig reset to defaults');
    },

    /**
     * Export current configuration
     */
    exportConfig() {
      return JSON.stringify(this.getCurrentConfig(), null, 2);
    },

    /**
     * Import configuration from JSON
     * @param {string} configJson - JSON string of configuration
     */
    importConfig(configJson) {
      try {
        const config = JSON.parse(configJson);
        this.validateConfig(config);
        this.updateDataSource(config);
        console.log('📥 Configuration imported successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to import configuration:', error);
        return false;
      }
    }
  };

  // Export to global scope
  window.MapaListerConfig = MapaListerConfig;
  window.DataConfig = DataConfig;
  
  console.log('✅ app-config.js loaded successfully');
  
  // Emit ready event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mapalister:configReady'));
  }

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('utils/sw.js')
      .then(reg => {
        console.log('Service worker registered ✅', reg.scope);
      })
      .catch(err => {
        console.error('Service worker registration failed ❌', err);
      });
  });
}


})();