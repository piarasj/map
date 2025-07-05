/**
 * GeoJSON Transformer Utility
 * Transforms existing GeoJSON files to include comprehensive user metadata
 */

class GeoJSONTransformer {
  constructor() {
    this.defaultUserData = {
      username: "john.doe@example.com",
      mapboxUserToken: "pk.eyJ1IjoicGlhcmFzaiIsImEiOiJjbWNtYWxyeXUwa2llMmpzOW04YnVmNzduIn0.z-3qnk6YvQ01NCUL8BKzlw",
      lastModified: new Date().toISOString(),
      version: "1.2.0",
      settings: {
        distanceUnit: "km",
        mapStyle: "streets-v11", 
        defaultZoom: 10,
        colorScheme: "default",
        groupingProperty: "dataset",
        groupingDisplayName: "Group",
        autoSave: true,
        notifications: {
          enabled: true,
          locationUpdates: true,
          dataChanges: false
        },
        display: {
          showDistanceMarkers: true,
          showGroupIndicators: true,
          showIrishDioceses: true,
          showIrishCounties: true,
          compactMode: false
        }
      },
      recentReferences: [
        {
          name: "Home",
          lat: 54.7834,
          lng: -6.0768,
          timestamp: "2025-01-20T09:15:00Z"
        },
        {
          name: "Office", 
          lat: 54.6527,
          lng: -6.1765,
          timestamp: "2025-01-19T14:22:00Z"
        }
      ],
      customNotes: "Updated contact list for Q1 2025"
    };
  }

  /**
   * Transform existing GeoJSON to include user metadata
   * @param {Object} originalGeoJSON - Original GeoJSON data
   * @param {Object} customUserData - Optional custom user data to merge
   * @returns {Object} Enhanced GeoJSON with user metadata
   */
  transformGeoJSON(originalGeoJSON, customUserData = {}) {
    // Validate input
    if (!originalGeoJSON || originalGeoJSON.type !== 'FeatureCollection') {
      throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
    }

    // Create enhanced user data
    const userData = this.mergeUserData(customUserData);

    // Create the enhanced GeoJSON structure
    const enhancedGeoJSON = {
      type: "FeatureCollection",
      userData: userData,
      features: originalGeoJSON.features
    };

    // Preserve any additional properties from original
    Object.keys(originalGeoJSON).forEach(key => {
      if (key !== 'type' && key !== 'features' && key !== 'userData') {
        enhancedGeoJSON[key] = originalGeoJSON[key];
      }
    });

    return enhancedGeoJSON;
  }

  /**
   * Merge custom user data with defaults
   * @param {Object} customUserData - Custom user data
   * @returns {Object} Merged user data
   */
  mergeUserData(customUserData) {
    const userData = JSON.parse(JSON.stringify(this.defaultUserData));
    
    // Update timestamp
    userData.lastModified = new Date().toISOString();
    
    // Merge custom data
    if (customUserData.username) userData.username = customUserData.username;
    if (customUserData.mapboxUserToken) userData.mapboxUserToken = customUserData.mapboxUserToken;
    if (customUserData.version) userData.version = customUserData.version;
    if (customUserData.customNotes) userData.customNotes = customUserData.customNotes;
    
    // Merge settings
    if (customUserData.settings) {
      userData.settings = { ...userData.settings, ...customUserData.settings };
      
      // Deep merge notifications and display objects
      if (customUserData.settings.notifications) {
        userData.settings.notifications = { ...userData.settings.notifications, ...customUserData.settings.notifications };
      }
      if (customUserData.settings.display) {
        userData.settings.display = { ...userData.settings.display, ...customUserData.settings.display };
      }
    }
    
    // Merge recent references
    if (customUserData.recentReferences && Array.isArray(customUserData.recentReferences)) {
      userData.recentReferences = customUserData.recentReferences;
    }
    
    return userData;
  }

  /**
   * Create a downloadable file from transformed GeoJSON
   * @param {Object} enhancedGeoJSON - Enhanced GeoJSON data
   * @param {string} filename - Output filename
   */
  downloadEnhancedGeoJSON(enhancedGeoJSON, filename = 'enhanced-data.geojson') {
    try {
      const jsonString = JSON.stringify(enhancedGeoJSON, null, 2);
      const blob = new Blob([jsonString], { type: 'application/geo+json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ Enhanced GeoJSON downloaded: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to download enhanced GeoJSON:', error);
      throw error;
    }
  }

  /**
   * Process uploaded file and transform it
   * @param {File} file - Uploaded GeoJSON file
   * @param {Object} customUserData - Custom user data to include
   * @returns {Promise<Object>} Enhanced GeoJSON
   */
  async processUploadedFile(file, customUserData = {}) {
    try {
      const content = await this.readFileContent(file);
      const originalGeoJSON = JSON.parse(content);
      const enhancedGeoJSON = this.transformGeoJSON(originalGeoJSON, customUserData);
      
      return enhancedGeoJSON;
    } catch (error) {
      console.error('❌ Failed to process uploaded file:', error);
      throw error;
    }
  }

  /**
   * Read file content
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Extract current application state to create user data
   * @returns {Object} Current application state as user data
   */
  extractCurrentApplicationState() {
    const userData = {};
    
    // Get current settings
    if (window.SettingsManager && window.SettingsManager.settings) {
      userData.settings = { ...window.SettingsManager.settings };
    }
    
    // Get current user info
    if (window.UserDisplayManager && window.UserDisplayManager.currentUser) {
      const user = window.UserDisplayManager.currentUser;
      userData.username = user.email || user.name;
    }
    
    // Get current reference marker
    if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
      const refData = window.ReferenceMarker.getData();
      userData.recentReferences = [{
        name: refData.name || 'Current Reference',
        lat: refData.lat,
        lng: refData.lng,
        timestamp: new Date().toISOString()
      }];
    }
    
    // Get current Mapbox token
    if (window.mapboxAccessToken || (typeof mapboxgl !== 'undefined' && mapboxgl.accessToken)) {
      userData.mapboxUserToken = window.mapboxAccessToken || mapboxgl.accessToken;
    }
    
    userData.lastModified = new Date().toISOString();
    userData.version = "1.2.0";
    userData.customNotes = "Generated from current application state";
    
    return userData;
  }

  /**
   * Create enhanced version of current data
   * @param {string} filename - Output filename
   */
  enhanceCurrentData(filename = 'enhanced-current-data.geojson') {
    try {
      if (!window.geojsonData) {
        throw new Error('No current data to enhance');
      }
      
      const currentState = this.extractCurrentApplicationState();
      const enhancedGeoJSON = this.transformGeoJSON(window.geojsonData, currentState);
      
      this.downloadEnhancedGeoJSON(enhancedGeoJSON, filename);
      
      return enhancedGeoJSON;
    } catch (error) {
      console.error('❌ Failed to enhance current data:', error);
      throw error;
    }
  }
}

// Create and export the transformer
const geoJSONTransformer = new GeoJSONTransformer();
window.GeoJSONTransformer = geoJSONTransformer;

// Add convenience methods to window for easy use
window.enhanceCurrentData = () => geoJSONTransformer.enhanceCurrentData();

console.log('✅ GeoJSON Transformer loaded');

/**
 * USAGE EXAMPLES:
 * 
 * 1. Transform current loaded data:
 *    window.enhanceCurrentData();
 * 
 * 2. Transform with custom user data:
 *    const customData = {
 *      username: "jane.smith@example.com",
 *      customNotes: "Updated for January 2025",
 *      settings: { distanceUnit: "miles" }
 *    };
 *    const enhanced = geoJSONTransformer.transformGeoJSON(originalData, customData);
 * 
 * 3. Create enhanced version with current app state:
 *    const currentState = geoJSONTransformer.extractCurrentApplicationState();
 *    const enhanced = geoJSONTransformer.transformGeoJSON(originalData, currentState);
 */