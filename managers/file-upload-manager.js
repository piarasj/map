/**
 * =====================================================
 * FILE: managers/file-upload-manager.js
 * PURPOSE: GeoJSON file upload and management system with comprehensive user metadata support
 * DEPENDENCIES: DataConfig, SettingsManager, SidebarManager
 * EXPORTS: FileUploadManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📁 Loading enhanced file-upload-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    if (typeof SettingsManager === 'undefined') missing.push('SettingsManager');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ FileUploadManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initFileUploadManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:settingsReady', retryInit);
    return;
  }

  function initFileUploadManager() {
  
  /**
     * ENHANCED FILE UPLOAD MANAGER FOR MAPALISTER
     * Handles GeoJSON file uploads with comprehensive user data extraction and settings integration
     */
    const FileUploadManager = {
      // Current file state
      currentFile: null,
      currentFileName: null,
      uploadedData: null,
      userDataExtracted: null,
      
      // Upload history
      uploadHistory: [],
      maxHistoryItems: 5,
      
      // Debounce timeout for settings application
      applyUserSettingsDebounced: null,

      /**
       * Initialize the file upload manager
       */
      init() {
        this.loadUploadHistory();
        console.log('✅ Enhanced FileUploadManager initialized');
      },

      /**
       * Load upload history from localStorage
       */
      loadUploadHistory() {
        try {
          const saved = localStorage.getItem('mapalister-upload-history');
          if (saved) {
            this.uploadHistory = JSON.parse(saved);
          }
        } catch (error) {
          console.warn('Failed to load upload history:', error);
          this.uploadHistory = [];
        }
      },

      /**
       * Save upload history to localStorage
       */
      saveUploadHistory() {
        try {
          // Keep only the most recent items
          const trimmed = this.uploadHistory.slice(-this.maxHistoryItems);
          localStorage.setItem('mapalister-upload-history', JSON.stringify(trimmed));
        } catch (error) {
          console.warn('Failed to save upload history:', error);
        }
      },
      
      /**
       * Create file input element and trigger upload dialog
       */
      triggerFileUpload() {
        console.log('📁 Triggering file upload dialog...');
        
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.geojson,.json';
        fileInput.style.display = 'none';
        
        // Handle file selection
        fileInput.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) {
            this.handleFileUpload(file);
          }
          
          // Clean up
          document.body.removeChild(fileInput);
        });
        
        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
      },

/**
       * Handle file upload processing (Simplified - no loading state)
       */
      async handleFileUpload(file) {
        console.log(`📁 Processing uploaded file: ${file.name} (${this.formatFileSize(file.size)})`);
        
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
          this.showError(`Invalid file: ${validation.error}`);
          return;
        }
        
        try {
          // Read file content
          const content = await this.readFileContent(file);
          
          // Parse and validate GeoJSON
          const geoData = await this.parseAndValidateGeoJSON(content, file.name);
          
          // Extract comprehensive user data
          const userData = this.extractUserData(geoData);
          
          // Store file information
          this.currentFile = file;
          this.currentFileName = file.name;
          this.uploadedData = geoData;
          this.userDataExtracted = userData;
          
          // Update upload history
          this.updateUploadHistory(file.name, geoData.features?.length || 0);
          
          // Apply comprehensive user settings
          if (userData && Object.keys(userData).length > 0) {
            await this.applyUserSettings(userData);
          }
          
          // Integrate with main application
          await this.integrateWithApplication(geoData);
          
          // Show success message
          const featureCount = geoData.features?.length || 0;
          this.showSuccess(`✅ ${file.name} loaded successfully (${featureCount} features)`);
          
          // Emit upload event for other components
          this.emitUploadEvent(geoData, userData);
          
          console.log(`✅ File upload completed: ${featureCount} features loaded`);
          
        } catch (error) {
          console.error('❌ File upload failed:', error);
          this.showError(`Upload failed: ${error.message}`);
        }
      },

      /**
       * Read file content as text
       */
      readFileContent(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            resolve(event.target.result);
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          
          reader.readAsText(file);
        });
      },
      
      
      /**
       * Validate uploaded file (Enhanced)
       */
      validateFile(file) {
        // Check if file exists
        if (!file) {
          return {
            valid: false,
            error: 'No file selected'
          };
        }
        
        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          return {
            valid: false,
            error: `File too large (${this.formatFileSize(file.size)}). Maximum size is ${this.formatFileSize(maxSize)}.`
          };
        }
        
        // Check for empty files
        if (file.size === 0) {
          return {
            valid: false,
            error: 'File is empty'
          };
        }
        
        // Check file type with better validation
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.geojson', '.json'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          return {
            valid: false,
            error: `Invalid file type. Please upload a ${validExtensions.join(' or ')} file.`
          };
        }
        
        // Check MIME type if available
        if (file.type && !file.type.includes('json') && !file.type.includes('geo')) {
          console.warn(`⚠️ Unexpected MIME type: ${file.type}, but proceeding based on file extension`);
        }
        
        return { valid: true };
      },

      /**
       * Parse and validate GeoJSON content (Enhanced)
       */
      async parseAndValidateGeoJSON(content, fileName) {
        let data;
        
        try {
          // Parse JSON with better error context
          data = JSON.parse(content);
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            // Provide line number if available
            const match = parseError.message.match(/at position (\d+)/);
            const position = match ? ` at position ${match[1]}` : '';
            throw new Error(`Invalid JSON format${position}. Please check your file for syntax errors.`);
          }
          throw new Error(`JSON parsing failed: ${parseError.message}`);
        }
        
        // Validate GeoJSON structure with detailed error messages
        if (!data || typeof data !== 'object') {
          throw new Error('File must contain a valid JSON object');
        }
        
        if (!data.type) {
          throw new Error('GeoJSON must have a "type" property');
        }
        
        if (data.type !== 'FeatureCollection') {
          throw new Error(`Expected FeatureCollection, but found "${data.type}". Please ensure your file is a valid GeoJSON FeatureCollection.`);
        }
        
        if (!data.features) {
          throw new Error('GeoJSON FeatureCollection must contain a "features" property');
        }
        
        if (!Array.isArray(data.features)) {
          throw new Error('GeoJSON "features" must be an array');
        }
        
        if (data.features.length === 0) {
          throw new Error('GeoJSON file contains no features. Please ensure your file has location data.');
        }
        
        // Validate features with detailed reporting
        const validationResults = this.validateAllFeatures(data.features);
        
        if (validationResults.validFeatures === 0) {
          throw new Error(`No valid features found in GeoJSON file. Issues found: ${validationResults.errors.join(', ')}`);
        }
        
        if (validationResults.invalidFeatures > 0) {
          console.warn(`⚠️ ${validationResults.invalidFeatures} invalid features found and will be ignored`);
          console.warn('Common issues:', validationResults.errors.slice(0, 3).join(', '));
          
          // Show warning to user about invalid features
          this.showInfo(`⚠️ Skipped ${validationResults.invalidFeatures} invalid features. ${validationResults.validFeatures} features loaded successfully.`);
        }
        
        // Filter to only valid features
        data.features = data.features.filter((feature, index) => 
          this.validateFeatureWithIndex(feature, index, validationResults.validIndices)
        );
        
        console.log(`✅ GeoJSON validated: ${validationResults.validFeatures} valid features loaded`);
        return data;
      },
      
      /**
       * Validate all features with detailed reporting (Enhanced)
       */
      validateAllFeatures(features) {
        let validFeatures = 0;
        let invalidFeatures = 0;
        const errors = new Set(); // Use Set to avoid duplicate error messages
        const validIndices = new Set();
        
        features.forEach((feature, index) => {
          const validation = this.validateFeatureDetailed(feature, index);
          
          if (validation.valid) {
            validFeatures++;
            validIndices.add(index);
          } else {
            invalidFeatures++;
            validation.errors.forEach(error => errors.add(error));
            
            if (invalidFeatures <= 5) { // Log first 5 errors for debugging
              console.warn(`⚠️ Invalid feature at index ${index}:`, validation.errors.join(', '));
            }
          }
        });
        
        return {
          validFeatures,
          invalidFeatures,
          errors: Array.from(errors),
          validIndices
        };
      },

      /**
       * Validate individual feature with detailed error reporting (Enhanced)
       */
      validateFeatureDetailed(feature, index) {
        const errors = [];
        
        // Basic structure validation
        if (!feature || typeof feature !== 'object') {
          return { valid: false, errors: ['Feature is not an object'] };
        }
        
        if (feature.type !== 'Feature') {
          errors.push(`Invalid type: "${feature.type}" (expected "Feature")`);
        }
        
        if (!feature.geometry) {
          errors.push('Missing geometry property');
        }
        
        if (!feature.properties) {
          errors.push('Missing properties property');
        }
        
        // Geometry validation
        if (feature.geometry) {
          const geom = feature.geometry;
          
          if (!geom.type) {
            errors.push('Geometry missing type');
          }
          
          if (!geom.coordinates) {
            errors.push('Geometry missing coordinates');
          }
          
          // Specific geometry type validation
          if (geom.type === 'Point' && geom.coordinates) {
            const coords = geom.coordinates;
            
            if (!Array.isArray(coords)) {
              errors.push('Point coordinates must be an array');
            } else if (coords.length < 2) {
              errors.push('Point coordinates must have at least 2 elements [lng, lat]');
            } else {
              const [lng, lat] = coords;
              
              if (typeof lng !== 'number' || typeof lat !== 'number') {
                errors.push('Coordinates must be numbers');
              } else {
                if (lng < -180 || lng > 180) {
                  errors.push(`Invalid longitude: ${lng} (must be between -180 and 180)`);
                }
                if (lat < -90 || lat > 90) {
                  errors.push(`Invalid latitude: ${lat} (must be between -90 and 90)`);
                }
              }
            }
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      },

      /**
       * Helper method for feature filtering
       */
      validateFeatureWithIndex(feature, index, validIndices) {
        return validIndices.has(index);
      },

      /**
       * Simple feature validation (Optimized)
       */
      validateFeature(feature) {
        // Early validation with single checks
        if (!feature || 
            typeof feature !== 'object' || 
            feature.type !== 'Feature' || 
            !feature.geometry || 
            !feature.properties) {
          return false;
        }
        
        const geom = feature.geometry;
        if (!geom.type || !geom.coordinates) return false;
        
        // Optimized Point geometry validation (most common case first)
        if (geom.type === 'Point') {
          const coords = geom.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return false;
          
          const [lng, lat] = coords;
          return typeof lng === 'number' && 
                 typeof lat === 'number' && 
                 lng >= -180 && lng <= 180 && 
                 lat >= -90 && lat <= 90;
        }
        
        // Add support for other geometry types if needed
        if (geom.type === 'LineString' || geom.type === 'Polygon') {
          return Array.isArray(geom.coordinates) && geom.coordinates.length > 0;
        }
        
        return true; // Allow other valid GeoJSON types
      },
      
      /**
       * Extract comprehensive user data from GeoJSON metadata (Enhanced)
       */
      extractUserData(geoData) {
        // Early return if no data
        if (!geoData || typeof geoData !== 'object') {
          return {};
        }
        
        const userData = {};
        
        // Check for userData in root properties (new comprehensive format)
        if (geoData.userData && typeof geoData.userData === 'object') {
          Object.assign(userData, geoData.userData);
          console.log('📊 Found comprehensive userData section');
        }
        
        // Check for userData in metadata (fallback)
        if (geoData.metadata?.userData && typeof geoData.metadata.userData === 'object') {
          Object.assign(userData, geoData.metadata.userData);
        }
        
        // Check for user settings in properties (legacy support)
        if (geoData.properties?.userSettings && typeof geoData.properties.userSettings === 'object') {
          userData.settings = geoData.properties.userSettings;
        }
        
        // Look for known user data patterns (legacy support) - optimized with single loop
        const userDataKeys = [
          'userSettings', 'preferences', 'config', 'settings',
          'userName', 'userEmail', 'userId', 'lastModified',
          'referencePoints', 'bookmarks', 'customConfig', 'recentReferences'
        ];
        
        userDataKeys.forEach(key => {
          if (geoData[key] !== undefined) {
            userData[key] = geoData[key];
          }
        });

        // Extract Mapbox token (enhanced support) - simplified with find
        const tokenSources = [
          geoData.userData?.mapboxUserToken,
          geoData.mapboxToken,
          geoData.userData?.mapboxToken,
          geoData.metadata?.mapboxToken,
          geoData.properties?.mapboxToken,
          geoData.config?.mapboxToken,
          geoData.settings?.mapboxToken
        ];
        
        const mapboxToken = tokenSources.find(token => 
          token && typeof token === 'string' && token.startsWith('pk.')
        );
        
        if (mapboxToken) {
          userData.mapboxUserToken = mapboxToken;
          console.log('🗝️ Mapbox token found in uploaded file');
          
          // Validate and apply token with error handling
          try {
            if (this.validateMapboxToken(mapboxToken)) {
              this.applyMapboxToken(mapboxToken);
            } else {
              console.warn('⚠️ Invalid Mapbox token format in uploaded file');
              this.showError('Invalid Mapbox token format found in file');
            }
          } catch (error) {
            console.error('❌ Error applying Mapbox token:', error);
          }
        }
        
        // Extract and validate comprehensive user settings
        if (userData.settings && typeof userData.settings === 'object') {
          console.log('⚙️ Found comprehensive user settings');
          this.validateAndCleanUserSettings(userData.settings);
        }
        
        // Extract recent references for restoration
        if (Array.isArray(userData.recentReferences)) {
          console.log(`📍 Found ${userData.recentReferences.length} recent reference points`);
        }
        
        // Extract user identification
        if (userData.username) {
          console.log(`👤 User identified: ${userData.username}`);
        }
        
        const dataKeysCount = Object.keys(userData).length;
        if (dataKeysCount > 0) {
          console.log(`📊 Enhanced user data extracted: ${dataKeysCount} properties`);
        }
        
        return userData;
      },

      /**
       * Validate and clean user settings to ensure compatibility
       */
      validateAndCleanUserSettings(settings) {
        try {
          // Validate distance unit
          if (settings.distanceUnit && !['km', 'miles'].includes(settings.distanceUnit)) {
            console.warn(`⚠️ Invalid distance unit: ${settings.distanceUnit}, defaulting to km`);
            settings.distanceUnit = 'km';
          }
          
          // Validate map style
          if (settings.mapStyle && typeof settings.mapStyle === 'string') {
            // Convert old format to new format if needed
            if (!settings.mapStyle.includes('/')) {
              const styleMap = {
                'light': 'mapbox/light-v11',
                'streets': 'mapbox/streets-v12',
                'outdoors': 'mapbox/outdoors-v12',
                'satellite': 'mapbox/satellite-v9',
                'dark': 'mapbox/dark-v11'
              };
              settings.mapStyle = styleMap[settings.mapStyle] || 'mapbox/light-v11';
            }
          }
          
          // Validate boolean settings
          const booleanSettings = ['autoSave', 'compactMode'];
          booleanSettings.forEach(key => {
            if (settings[key] !== undefined && typeof settings[key] !== 'boolean') {
              settings[key] = Boolean(settings[key]);
            }
          });
          
          // Validate nested objects
          if (settings.notifications && typeof settings.notifications === 'object') {
            Object.keys(settings.notifications).forEach(key => {
              if (typeof settings.notifications[key] !== 'boolean') {
                settings.notifications[key] = Boolean(settings.notifications[key]);
              }
            });
          }
          
          if (settings.display && typeof settings.display === 'object') {
            Object.keys(settings.display).forEach(key => {
              if (typeof settings.display[key] !== 'boolean') {
                settings.display[key] = Boolean(settings.display[key]);
              }
            });
          }
          
          console.log('✅ User settings validated and cleaned');
        } catch (error) {
          console.warn('⚠️ Error validating user settings:', error);
        }
      },
      
      /**
       * Validate Mapbox token format
       */
      validateMapboxToken(token) {
        if (!token || typeof token !== 'string') {
          return false;
        }
        
        // Basic validation - Mapbox tokens start with 'pk.' and are base64-encoded
        const tokenRegex = /^pk\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;
        return tokenRegex.test(token);
      },

      /**
       * Apply Mapbox token from uploaded file
       */
      applyMapboxToken(token) {
        try {
          // Store in localStorage for persistence
          localStorage.setItem('mapbox-token', token);
          
          // Update global access
          if (typeof mapboxgl !== 'undefined') {
            mapboxgl.accessToken = token;
          }
          window.mapboxAccessToken = token;
          
          // Check if map needs initialization or reinitialization
          const needsMapInit = !window.map || !window.map.loaded();
          
          if (needsMapInit) {
            console.log('🔄 Initializing map with uploaded token...');
            
            // Trigger map initialization with new token
            setTimeout(() => {
              if (window.MapaListerApp && window.MapaListerApp.initializeMap) {
                window.MapaListerApp.initializeMap();
              } else if (window.MapaListerApp && window.MapaListerApp.initialize) {
                // Fallback to full initialization
                window.MapaListerApp.initialize();
              }
            }, 100);
          } else {
            console.log('🗺️ Map already initialized, token updated for future use');
          }
          
          // Show success notification
          this.showSuccess('🗝️ Mapbox token applied from uploaded file');
          
          console.log('✅ Mapbox token applied successfully');
          
        } catch (error) {
          console.error('❌ Failed to apply Mapbox token:', error);
          this.showError('Failed to apply Mapbox token from file');
        }
      },
      
      /**
       * Apply comprehensive user settings from uploaded data (Enhanced with debouncing)
       */
      async applyUserSettings(userData) {
        // Clear any pending settings application
        if (this.applyUserSettingsDebounced) {
          clearTimeout(this.applyUserSettingsDebounced);
        }
        
        // Debounce rapid settings changes
        return new Promise((resolve) => {
          this.applyUserSettingsDebounced = setTimeout(async () => {
            await this._applyUserSettingsImmediate(userData);
            resolve();
          }, 100);
        });
      },

      /**
       * Immediate settings application (Enhanced)
       */
      async _applyUserSettingsImmediate(userData) {
        if (!window.SettingsManager) {
          console.warn('⚠️ SettingsManager not available for applying user settings');
          return;
        }
        
        let settingsApplied = 0;
        const settingsToApply = [];
        
        // Batch settings changes instead of applying individually
        if (userData.settings && typeof userData.settings === 'object') {
          const settings = userData.settings;
          
          // Collect standard settings
          Object.keys(settings).forEach(key => {
            if (window.SettingsManager.defaultSettings?.hasOwnProperty(key)) {
              settingsToApply.push({ key, value: settings[key] });
            }
          });
          
          // Collect nested settings
          if (settings.notifications && typeof settings.notifications === 'object') {
            Object.keys(settings.notifications).forEach(key => {
              const fullKey = `notifications_${key}`;
              if (window.SettingsManager.defaultSettings?.hasOwnProperty(fullKey)) {
                settingsToApply.push({ key: fullKey, value: settings.notifications[key] });
              }
            });
          }
          
          if (settings.display && typeof settings.display === 'object') {
            Object.keys(settings.display).forEach(key => {
              if (window.SettingsManager.defaultSettings?.hasOwnProperty(key)) {
                settingsToApply.push({ key, value: settings.display[key] });
              }
            });
          }
        }
        
        // Apply individual preference overrides (legacy support)
        const preferenceKeys = ['distanceUnit', 'mapStyle', 'sidebarPosition', 'autoCenter'];
        preferenceKeys.forEach(key => {
          if (userData[key] !== undefined) {
            settingsToApply.push({ key, value: userData[key] });
          }
        });
        
        // Apply all settings in batch
        if (settingsToApply.length > 0) {
          try {
            settingsToApply.forEach(({ key, value }) => {
              window.SettingsManager.setSetting(key, value);
              settingsApplied++;
            });
          } catch (error) {
            console.error('❌ Error applying user settings:', error);
          }
        }
        
        // Apply recent references if available
        if (Array.isArray(userData.recentReferences)) {
          try {
            await this.applyRecentReferences(userData.recentReferences);
          } catch (error) {
            console.warn('⚠️ Failed to apply recent references:', error);
          }
        }
        
        // Apply notification settings from userData
        if (window.notifications && userData.settings?.notifications) {
          try {
            this.configureNotificationSettings(userData.settings.notifications);
          } catch (error) {
            console.warn('⚠️ Failed to configure notification settings:', error);
          }
        }
        
        if (settingsApplied > 0) {
          console.log(`⚙️ Applied ${settingsApplied} user settings from uploaded file`);
          
          this.showInfo(`Applied ${settingsApplied} user preferences from file`);
        }
      },

      /**
       * Apply recent reference points
       */
      async applyRecentReferences(recentReferences) {
        try {
          if (!window.ReferenceMarker) {
            console.warn('⚠️ ReferenceMarker not available');
            return;
          }
          
          // Apply the most recent reference point
          const mostRecent = recentReferences.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          )[0];
          
          if (mostRecent) {
            window.ReferenceMarker.set(mostRecent.lat, mostRecent.lng, mostRecent.name);
            console.log(`📍 Applied recent reference: ${mostRecent.name}`);
            
            // Update distances after setting reference
            setTimeout(() => {
              if (window.SidebarManager && window.SidebarManager.updateAllDistances) {
                window.SidebarManager.updateAllDistances();
              }
            }, 500);
          }
        } catch (error) {
          console.warn('⚠️ Failed to apply recent references:', error);
        }
      },

      /**
       * Configure notification settings
       */
      configureNotificationSettings(notificationSettings) {
        try {
          if (notificationSettings.enabled === false) {
            // Disable notifications if user preference
            console.log('🔕 Notifications disabled per user preference');
          }
          
          if (notificationSettings.locationUpdates === false) {
            // Disable location update notifications
            console.log('📍 Location update notifications disabled per user preference');
          }
          
          if (notificationSettings.dataChanges === true) {
            // Enable data change notifications
            console.log('📊 Data change notifications enabled per user preference');
          }
        } catch (error) {
          console.warn('⚠️ Failed to configure notification settings:', error);
        }
      },
      
      /**
       * Integrate uploaded data with main application (Enhanced with error recovery)
       */
      async integrateWithApplication(geoData) {
        console.log('🔄 Integrating uploaded data with application...');
        
        const integrationSteps = [
          () => this.updateGlobalDataReferences(geoData),
          () => this.updateDataConfig(geoData),
          () => this.updateSidebar(geoData),
          () => this.updateMap(geoData),
          () => this.updateDatasetSelector(geoData),
          () => this.triggerAutoCenter()
        ];
        
        let completedSteps = 0;
        const errors = [];
        
        for (const [index, step] of integrationSteps.entries()) {
          try {
            await step();
            completedSteps++;
          } catch (error) {
            const stepNames = ['global data', 'data config', 'sidebar', 'map', 'dataset selector', 'auto-center'];
            const stepName = stepNames[index] || `step ${index + 1}`;
            
            console.warn(`⚠️ Integration step "${stepName}" failed:`, error);
            errors.push(`${stepName}: ${error.message}`);
            
            // Continue with other steps even if one fails
          }
        }
        
        if (completedSteps === integrationSteps.length) {
          console.log('✅ Application integration completed successfully');
        } else {
          console.warn(`⚠️ Application integration partially completed: ${completedSteps}/${integrationSteps.length} steps successful`);
          
          if (errors.length > 0) {
            console.warn('Integration errors:', errors);
            // Show warning but don't fail completely
            this.showInfo(`⚠️ Data loaded with ${errors.length} minor integration issues. Core functionality is available.`);
          }
        }
      },

      /**
       * Helper methods for integration steps
       */
      updateGlobalDataReferences(geoData) {
        window.geojsonData = geoData;
        window.uploadedGeoJsonData = geoData;
      },

      updateDataConfig(geoData) {
        if (window.DataConfig) {
          const uploadConfig = {
            filename: this.currentFileName,
            displayName: `Uploaded: ${this.currentFileName}`,
            groupingProperty: window.DataConfig.getCurrentConfig?.()?.groupingProperty || 'dataset',
            isUploaded: true,
            data: geoData
          };
          
          if (typeof window.DataConfig.setUploadedData === 'function') {
            window.DataConfig.setUploadedData(uploadConfig);
          }
        }
      },

      updateSidebar(geoData) {
        if (window.SidebarManager && typeof window.SidebarManager.build === 'function') {
          window.SidebarManager.build(geoData);
        }
      },

      updateMap(geoData) {
        if (window.MapManager && window.map && typeof window.MapManager.updateMarkers === 'function') {
          window.MapManager.updateMarkers(window.map, geoData);
        }
      },

      triggerAutoCenter() {
        if (window.SettingsManager && window.SettingsManager.getSetting?.('autoCenter')) {
          setTimeout(() => {
            if (typeof window.SettingsManager.centerMapOnData === 'function') {
              window.SettingsManager.centerMapOnData();
            }
          }, 500);
        }
      },
      
      /**
       * Update dataset selector to show uploaded data (Enhanced with batched DOM operations)
       */
      updateDatasetSelector(geoData) {
        const featureCount = geoData.features?.length || 0;
        
        // Batch DOM operations
        const updates = [];
        
        const selectorText = document.getElementById('selectorText');
        if (selectorText) {
          updates.push(() => {
            selectorText.textContent = `📁 ${this.currentFileName} (${featureCount} features)`;
            selectorText.className = 'selector-text uploaded-data';
          });
        }
        
        // Add uploaded data indicator only if it doesn't exist
        if (!document.getElementById('uploaded-indicator')) {
          const selectorButton = document.getElementById('selectorButton');
          if (selectorButton) {
            updates.push(() => {
              const indicator = document.createElement('div');
              indicator.id = 'uploaded-indicator';
              indicator.innerHTML = '📁 Uploaded Data';
              indicator.style.cssText = `
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                margin-left: 8px;
                display: inline-block;
              `;
              selectorButton.appendChild(indicator);
            });
          }
        }
        
        // Execute all DOM updates in a single animation frame
        if (updates.length > 0) {
          requestAnimationFrame(() => {
            updates.forEach(update => update());
          });
        }
      },

      /**
       * Update upload history
       */
      updateUploadHistory(fileName, featureCount) {
        const historyItem = {
          fileName,
          featureCount,
          uploadDate: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        // Remove existing entry with same name
        this.uploadHistory = this.uploadHistory.filter(item => item.fileName !== fileName);
        
        // Add new entry
        this.uploadHistory.push(historyItem);
        
        // Save to localStorage
        this.saveUploadHistory();
      },

      /**
       * Get upload history for settings UI
       */
      getUploadHistory() {
        return this.uploadHistory.sort((a, b) => b.timestamp - a.timestamp);
      },

      /**
       * Get current upload status
       */
      getUploadStatus() {
        return {
          hasUploadedData: !!this.uploadedData,
          currentFileName: this.currentFileName,
          featureCount: this.uploadedData?.features?.length || 0,
          hasUserData: !!(this.userDataExtracted && Object.keys(this.userDataExtracted).length > 0),
          uploadHistory: this.getUploadHistory()
        };
      },
      
      /**
       * Download current data with comprehensive user settings (Enhanced)
       */
      downloadDataWithSettings() {
        if (!this.uploadedData) {
          this.showError('No uploaded data to download');
          return;
        }
        
        try {
          // Create enhanced GeoJSON with comprehensive user data
          const enhancedData = this.createEnhancedGeoJSON();
          
          // Validate that we have valid data before creating blob
          if (!enhancedData || typeof enhancedData !== 'object') {
            throw new Error('Failed to create enhanced data structure');
          }
          
          // Create download with better error handling
          const jsonString = JSON.stringify(enhancedData, null, 2);
          const blob = new Blob([jsonString], {
            type: 'application/geo+json'
          });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.generateDownloadFilename();
          link.style.display = 'none'; // Ensure it's hidden
          
          document.body.appendChild(link);
          link.click();
          
          // Clean up immediately
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
          
          // Mark changes as saved if notification system is available
          if (window.notifications && typeof window.notifications.markChangesSaved === 'function') {
            window.notifications.markChangesSaved();
          }
          
          this.showSuccess('📥 Data downloaded with comprehensive settings');
          console.log('✅ Data downloaded with comprehensive user settings');
          
        } catch (error) {
          console.error('❌ Download failed:', error);
          this.showError(`Download failed: ${error.message}`);
        }
      },

      /**
       * Create enhanced GeoJSON with comprehensive current user settings (Enhanced)
       */
      createEnhancedGeoJSON() {
        try {
          const enhanced = JSON.parse(JSON.stringify(this.uploadedData));
          
          // Create comprehensive userData section with error handling

enhanced.userData = {
  username: this.getCurrentUsername(),
  mapboxUserToken: this.getCurrentMapboxToken(),
  lastModified: new Date().toISOString(),
  version: "1.2.0",
  settings: this.getCurrentSettings(),
  recentReferences: this.getCurrentReferences(),
  customNotes: `Enhanced export from MapaLister on ${new Date().toLocaleDateString()}`,
  notesInfo: {
    totalNotes: this.countTotalNotes(enhanced.features),
    lastNoteDate: this.getLastNoteDate(enhanced.features),
    notesVersion: "1.0"
  }
};
          
          return enhanced;
        } catch (error) {
          console.error('❌ Error creating enhanced GeoJSON:', error);
          // Fallback: return original data without enhancements
          return this.uploadedData;
        }
      },

      /**
       * Get current username
       */
      getCurrentUsername() {
        if (window.UserDisplayManager && window.UserDisplayManager.currentUser) {
          const user = window.UserDisplayManager.currentUser;
          return user.email || user.name || 'unknown@example.com';
        }
        return this.userDataExtracted?.username || 'unknown@example.com';
      },

      /**
       * Get current Mapbox token
       */
      getCurrentMapboxToken() {
        return window.mapboxAccessToken || 
               (typeof mapboxgl !== 'undefined' ? mapboxgl.accessToken : null) ||
               localStorage.getItem('mapbox-token') ||
               this.userDataExtracted?.mapboxUserToken;
      },
      
      /**
       * Get current comprehensive settings
       */
      getCurrentSettings() {
        const settings = {
          distanceUnit: "km",
          mapStyle: "mapbox/light-v11",
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
            showIrishDioceses: false,
            showIrishCounties: true,
            compactMode: false
          }
        };
        
        // Override with current SettingsManager values if available
        if (window.SettingsManager && window.SettingsManager.settings) {
          const currentSettings = window.SettingsManager.settings;
          
          // Apply direct mappings
          Object.keys(settings).forEach(key => {
            if (currentSettings.hasOwnProperty(key)) {
              settings[key] = currentSettings[key];
            }
          });
          
          // Map specific settings to nested structure
          if (currentSettings.showIrishDioceses !== undefined) {
            settings.display.showIrishDioceses = currentSettings.showIrishDioceses;
          }
          if (currentSettings.showIrishCounties !== undefined) {
            settings.display.showIrishCounties = currentSettings.showIrishCounties;
          }
        }
        
        return settings;
      },

      /**
       * Get current reference points (FIXED - Critical bug fix)
       */
      getCurrentReferences() {
        const references = [];
        
        // Add current reference marker if exists - WITH NULL CHECK
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const refData = window.ReferenceMarker.get();
          
          // CRITICAL: Check if refData is not null before accessing properties
          if (refData && refData.lat !== undefined && refData.lng !== undefined) {
            references.push({
              name: refData.name || 'Current Reference',
              lat: refData.lat,
              lng: refData.lng,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Add any saved references from user data
        if (this.userDataExtracted && this.userDataExtracted.recentReferences) {
          references.push(...this.userDataExtracted.recentReferences.slice(0, 4)); // Keep up to 5 total
        }
        
        return references.slice(0, 5); // Limit to 5 most recent
      },

      /**
       * Generate download filename
       */
      generateDownloadFilename() {
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const baseName = this.currentFileName.replace(/\.(geojson|json)$/i, '');
        return `${baseName}_enhanced_${timestamp}.geojson`;
      },

      /**
       * Clear uploaded data and return to default
       */
      clearUploadedData() {
        console.log('🗑️ Clearing uploaded data...');
        
        this.currentFile = null;
        this.currentFileName = null;
        this.uploadedData = null;
        this.userDataExtracted = null;
        
        // Remove uploaded indicator
        const indicator = document.getElementById('uploaded-indicator');
        if (indicator) {
          indicator.remove();
        }
        
        // Reset to default data source
        if (window.MapaListerApp && window.MapaListerApp.loadAndDisplayData) {
          window.MapaListerApp.loadAndDisplayData();
        }
        
        this.showInfo('Returned to default data source');
      },

      /**
       * Emit upload event for other components
       */
      emitUploadEvent(geoData, userData) {
        const uploadEvent = new CustomEvent('mapalister:dataUploaded', {
          detail: {
            data: geoData,
            userData: userData,
            fileName: this.currentFileName,
            featureCount: geoData.features?.length || 0
          }
        });
        
        window.dispatchEvent(uploadEvent);
      },
      
/**
       * Utility: Format file size
       */
      formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      },

      /**
       * UI feedback methods (Simplified - no persistent loading messages)
       */
      showLoadingState(show) {
        // Simplified: No persistent loading messages
        // The success/error messages provide sufficient feedback
        if (show) {
          console.log('📁 Processing file upload...');
        } else {
          console.log('📁 File processing completed');
        }
      },

      showSuccess(message) {
        if (window.notifications) {
          window.notifications.notifySystemStatus(message);
        } else if (window.SettingsManager && window.SettingsManager.showToast) {
          window.SettingsManager.showToast(message, 'success');
        } else {
          console.log('✅', message);
        }
      },

      showError(message) {
        if (window.notifications) {
          window.notifications.notifyError(message);
        } else if (window.SettingsManager && window.SettingsManager.showToast) {
          window.SettingsManager.showToast(message, 'error');
        } else {
          console.error('❌', message);
        }
      },

      showInfo(message) {
        if (window.notifications) {
          window.notifications.notifySystemStatus(message);
        } else if (window.SettingsManager && window.SettingsManager.showToast) {
          window.SettingsManager.showToast(message, 'info');
        } else {
          console.log('ℹ️', message);
        }
      },
/**
       * Count total notes across all features
       */
      countTotalNotes(features) {
        let total = 0;
        features.forEach(feature => {
          if (feature.properties.userNotes && Array.isArray(feature.properties.userNotes)) {
            total += feature.properties.userNotes.length;
          }
        });
        return total;
      },

      /**
       * Get the date of the most recent note
       */
      getLastNoteDate(features) {
        let lastDate = null;
        
        features.forEach(feature => {
          if (feature.properties.userNotes && Array.isArray(feature.properties.userNotes)) {
            feature.properties.userNotes.forEach(note => {
              const noteDate = new Date(note.timestamp);
              if (!lastDate || noteDate > lastDate) {
                lastDate = noteDate;
              }
            });
          }
        });
        
        return lastDate ? lastDate.toISOString() : null;
      },
    };
    
    // Export FileUploadManager to window
    window.FileUploadManager = FileUploadManager;

    // Dispatch event to indicate FileUploadManager is ready
    window.dispatchEvent(new CustomEvent('mapalister:fileUploadReady'));

    console.log('✅ Enhanced FileUploadManager loaded and exported to window');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initFileUploadManager();
  }

})();