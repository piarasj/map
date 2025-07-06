/**
 * =====================================================
 * FILE: managers/enhanced-data-manager.js
 * PURPOSE: Data processing and UI updates for uploaded content
 * DEPENDENCIES: DataConfig, MapManager, SidebarManager, SettingsManager
 * EXPORTS: EnhancedDataManager
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📊 Loading enhanced-data-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ EnhancedDataManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initEnhancedDataManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    return;
  }

  function initEnhancedDataManager() {

    // ==================== INTERNAL DATASET FILTER MANAGER ====================
    class InternalDatasetFilterManager {
      constructor(map) {
        this.map = map;
        this.allData = null;
        this.activeDatasets = new Set();
        this.datasetConfig = {};
        this.colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
      }

      async loadData(geojsonData) {
        console.log('📊 Internal dataset manager processing data...', geojsonData.features?.length, 'features');
        
        this.allData = geojsonData;
        
        // Build dataset configuration
        try {
          this.datasetConfig = this.buildDatasetConfig(geojsonData);
          const datasets = this.findAvailableDatasets(geojsonData);
          
          console.log('📂 Found datasets:', datasets);
          
          if (datasets.length > 1) {
            // Multiple datasets - show dropdown
            this.updateDropdown(datasets);
            this.activeDatasets = new Set(datasets);
            this.setupDropdownInteractions();
          } else {
            // Single dataset - hide dropdown, show simple label
            this.hideSelectorDropdown();
            if (datasets.length === 1) {
              this.activeDatasets = new Set(datasets);
            }
          }
          
          // Initialize map with data
          if (this.map && window.MapManager) {
            window.MapManager.initialize(this.map, this.getFilteredData());
          }
          
          this.updateSidebar();
          console.log(`✅ ${geojsonData.features.length} features loaded with dataset filtering`);
          
          return datasets;
        } catch (error) {
          console.error('❌ Error in dataset processing:', error);
          // Fallback to simple sidebar
          if (window.SidebarManager) {
            window.SidebarManager.build(geojsonData);
          }
          return [];
        }
      }

      buildDatasetConfig(geojsonData) {
        const config = {};
        let colorIndex = 0;
        
        // Get grouping property
        const groupingProperty = this.getGroupingProperty();
        
        geojsonData.features.forEach(feature => {
          const groupValue = feature.properties?.[groupingProperty];
          if (groupValue && !config[groupValue]) {
            config[groupValue] = {
              label: groupValue,
              shortLabel: this.generateShortLabel(groupValue),
              color: this.colors[colorIndex % this.colors.length]
            };
            colorIndex++;
          }
        });
        
        return config;
      }

      findAvailableDatasets(geojsonData) {
        const datasets = new Set();
        const groupingProperty = this.getGroupingProperty();
        
        geojsonData.features.forEach(feature => {
          const groupValue = feature.properties?.[groupingProperty];
          if (groupValue) {
            datasets.add(groupValue);
          }
        });
        
        return Array.from(datasets);
      }

      getGroupingProperty() {
        // Try to get from SettingsManager first
        if (window.SettingsManager?.getDataConfig) {
          const dataConfig = window.SettingsManager.getDataConfig();
          if (dataConfig?.groupingProperty) {
            return dataConfig.groupingProperty;
          }
        }
        
        // Try DataConfig if available
        if (window.DataConfig?.getCurrentConfig) {
          const config = window.DataConfig.getCurrentConfig();
          if (config?.groupingProperty) {
            return config.groupingProperty;
          }
        }
        
        // Default fallback
        return 'dataset';
      }

      generateShortLabel(groupValue) {
        if (!groupValue) return '';
        
        // Handle known patterns
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
        
        // Short values
        if (groupValue.length <= 3) {
          return groupValue.toUpperCase();
        }
        
        // Extract first letter of each word
        return groupValue.split(/[\s-_]+/)
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
      }

      updateDropdown(datasets) {
        const dropdown = document.getElementById('dropdownMenu');
        if (!dropdown) {
          console.warn('⚠️ Dropdown menu element not found');
          return;
        }

        dropdown.innerHTML = '';
        
        datasets.forEach(dataset => {
          const config = this.datasetConfig[dataset];
          if (!config) {
            console.warn('⚠️ No config found for dataset:', dataset);
            return;
          }
          
          const count = this.allData.features.filter(f => 
            f.properties?.[this.getGroupingProperty()] === dataset
          ).length;
          
          const item = document.createElement('div');
          item.className = 'dropdown-item';
          item.setAttribute('data-value', dataset);
          
          const isActive = this.activeDatasets.has(dataset);
          
          item.innerHTML = `
            <div class="checkbox-wrapper">
              <div class="checkbox ${isActive ? 'checked' : ''}"></div>
            </div>
            <span class="dataset-label">${config.label}</span>
            <span class="dataset-count">${count}</span>
            <div style="background-color: ${config.color}; width: 12px; height: 12px; border-radius: 50%; margin-left: auto;"></div>
          `;
          
          dropdown.appendChild(item);
        });
        
        this.updateSelectorText();
        this.showSelectorDropdown();
      }

      setupDropdownInteractions() {
        const selectorButton = document.getElementById('selectorButton');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (!selectorButton || !dropdownMenu) {
          console.warn('⚠️ Dropdown elements not found for interaction setup');
          return;
        }

        // Remove existing listeners to prevent duplicates
        const newSelectorButton = selectorButton.cloneNode(true);
        selectorButton.parentNode.replaceChild(newSelectorButton, selectorButton);

        newSelectorButton.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('active');
          
          const arrow = document.getElementById('selectorArrow');
          if (arrow) {
            arrow.style.transform = dropdownMenu.classList.contains('active') ? 
              'rotate(180deg)' : 'rotate(0deg)';
          }
        });

        dropdownMenu.addEventListener('click', (e) => {
          const item = e.target.closest('.dropdown-item[data-value]');
          if (item) {
            const dataset = item.getAttribute('data-value');
            this.toggleDataset(dataset);
          }
        });

        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
          if (!newSelectorButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            const arrow = document.getElementById('selectorArrow');
            if (arrow) {
              arrow.style.transform = 'rotate(0deg)';
            }
          }
        };

        document.removeEventListener('click', this._closeDropdownHandler);
        this._closeDropdownHandler = closeDropdown;
        document.addEventListener('click', this._closeDropdownHandler);

        console.log('✅ Dropdown interactions configured');
      }

      toggleDataset(dataset) {
        if (this.activeDatasets.has(dataset)) {
          this.activeDatasets.delete(dataset);
        } else {
          this.activeDatasets.add(dataset);
        }
        
        this.updateDropdownCheckboxes();
        this.updateMap();
        this.updateSidebar();
        this.updateSelectorText();
        
        console.log(`📊 Dataset toggled: ${dataset}`);
      }

      updateDropdownCheckboxes() {
        document.querySelectorAll('.dropdown-item[data-value]').forEach(item => {
          const dataset = item.getAttribute('data-value');
          const checkbox = item.querySelector('.checkbox');
          
          if (this.activeDatasets.has(dataset)) {
            checkbox.classList.add('checked');
          } else {
            checkbox.classList.remove('checked');
          }
        });
      }

      updateSelectorText() {
        const selectorText = document.getElementById('selectorText');
        if (!selectorText) return;

        const activeCount = this.activeDatasets.size;
        if (activeCount === 0) {
          selectorText.textContent = 'No datasets selected';
          selectorText.className = 'selector-text placeholder';
        } else {
          const labels = Array.from(this.activeDatasets).map(dataset => 
            this.datasetConfig[dataset]?.shortLabel || this.generateShortLabel(dataset)
          );
          
          if (labels.length <= 2) {
            selectorText.textContent = labels.join(', ');
          } else {
            selectorText.textContent = `${labels.length} datasets selected`;
          }
          selectorText.className = 'selector-text';
        }
      }

      showSelectorDropdown() {
        const selectorButton = document.getElementById('selectorButton');
        const arrow = document.getElementById('selectorArrow');
        
        if (selectorButton) {
          selectorButton.style.cursor = 'pointer';
        }
        if (arrow) {
          arrow.style.display = 'block';
        }
      }

      hideSelectorDropdown() {
        const selectorButton = document.getElementById('selectorButton');
        const arrow = document.getElementById('selectorArrow');
        const dropdown = document.getElementById('dropdownMenu');
        
        if (selectorButton) {
          selectorButton.style.cursor = 'default';
        }
        if (arrow) {
          arrow.style.display = 'none';
        }
        if (dropdown) {
          dropdown.classList.remove('active');
        }

        // Update selector text for single dataset
        const selectorText = document.getElementById('selectorText');
        if (selectorText && this.activeDatasets.size === 1) {
          const dataset = Array.from(this.activeDatasets)[0];
          const config = this.datasetConfig[dataset];
          const count = this.allData.features.length;
          selectorText.textContent = `${config?.label || dataset} (${count} features)`;
          selectorText.className = 'selector-text';
        }
      }

      getFilteredData() {
        if (!this.allData) return null;

        const groupingProperty = this.getGroupingProperty();
        const filteredFeatures = this.allData.features.filter(feature => 
          this.activeDatasets.has(feature.properties?.[groupingProperty])
        );

        return {
          type: 'FeatureCollection',
          features: filteredFeatures
        };
      }

      updateMap() {
        if (window.MapManager && window.MapManager.updateMarkers) {
          const filteredData = this.getFilteredData();
          window.MapManager.updateMarkers(this.map, filteredData);
        }
      }

      updateSidebar() {
        if (this.allData && window.SidebarManager) {
          const filteredData = this.getFilteredData();
          window.SidebarManager.build(filteredData);
          
          // Update global reference
          window.geojsonData = filteredData;
          
          // Notify settings manager of dataset change
          if (window.SettingsManager && window.SettingsManager.onDatasetChange) {
            window.SettingsManager.onDatasetChange();
          }
        }
      }

      cleanup() {
        if (this._closeDropdownHandler) {
          document.removeEventListener('click', this._closeDropdownHandler);
          this._closeDropdownHandler = null;
        }
      }
    }

    // ==================== ENHANCED DATA MANAGER ====================
    class EnhancedDataManager {
      constructor(eventBus) {
        this.eventBus = eventBus;
        this.datasetManager = null;
        this.currentDataSource = 'default';
      }

      init() {
        console.log('📊 Enhanced Data Manager initialized');
      }

      async processLoadedData(data, config) {
        console.log('📊 Processing loaded data...', data.features?.length, 'features');
        
        try {
          // Clean up existing dataset manager
          if (this.datasetManager && this.datasetManager.cleanup) {
            this.datasetManager.cleanup();
          }
          
          // Initialize dataset management
          if (window.map && window.MapManager) {
            console.log('🔄 Initializing dataset filtering...');
            
            // Use external EnhancedDatasetFilterManager if available, otherwise use internal
            const DatasetManagerClass = window.EnhancedDatasetFilterManager || InternalDatasetFilterManager;
            
            this.datasetManager = new DatasetManagerClass(window.map);
            await this.datasetManager.loadData(data);
            
            // Store reference globally for other components
            window.datasetFilterManager = this.datasetManager;
            
            console.log('✅ Dataset filtering initialized');
          } else {
            console.log('📋 Map not available, using simple sidebar display');
            if (window.SidebarManager) {
              window.SidebarManager.build(data);
            }
          }
          
          // Update UI elements
          this.updateUIElements(data, config);
          
          // Auto-center if enabled
          if (window.SettingsManager?.getSetting('autoCenter')) {
            setTimeout(() => {
              if (window.SettingsManager.centerMapOnData) {
                window.SettingsManager.centerMapOnData();
              }
            }, 1000);
          }
          
          // Update distances if reference marker exists
          setTimeout(() => {
            if (window.ReferenceMarker?.exists() && window.SidebarManager) {
              console.log('📊 Data loaded with existing reference marker - updating distances...');
              window.SidebarManager.updateAllDistances();
            }
          }, 500);
          
          if (this.eventBus) {
            this.eventBus.emit('data:processed', { data, config });
          }
          
        } catch (error) {
          console.error('❌ Error processing loaded data:', error);
          
          // Fallback to basic sidebar
          if (window.SidebarManager) {
            console.log('🔄 Falling back to basic sidebar display');
            window.SidebarManager.build(data);
          }
          
          throw error;
        }
      }

      updateUIForUploadedData(fileName, featureCount) {
        const selectorText = document.getElementById('selectorText');
        if (selectorText) {
          selectorText.textContent = `📁 ${fileName} (${featureCount} features)`;
          selectorText.className = 'selector-text uploaded-data';
        }
        
        this.addUploadedIndicator();
        
        const datasetSelector = document.querySelector('.dataset-selector');
        if (datasetSelector) {
          datasetSelector.classList.add('has-upload');
        }
        
        console.log('✅ UI updated for uploaded data');
        
        if (this.eventBus) {
          this.eventBus.emit('ui:updated', { fileName, featureCount, type: 'upload' });
        }
      }

      addUploadedIndicator() {
        // Remove existing indicator
        const existingIndicator = document.getElementById('uploaded-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'uploaded-indicator';
        indicator.innerHTML = '📁 Uploaded';
        indicator.style.cssText = `
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 8px;
          display: inline-block;
          animation: uploadedPulse 2s ease-in-out infinite;
        `;
        
        const selectorButton = document.getElementById('selectorButton');
        if (selectorButton) {
          selectorButton.appendChild(indicator);
        }
      }

      updateUIElements(data, config) {
        const selectorText = document.getElementById('selectorText');
        if (selectorText && !config.isUploaded) {
          if (this.datasetManager) {
            // Selector text will be updated by dataset manager
            console.log('📊 Selector text managed by dataset manager');
          } else {
            selectorText.textContent = `${data.features.length} ${config.displayName.toLowerCase()} loaded`;
            selectorText.className = 'selector-text';
          }
        }
        
        console.log('✅ UI elements updated');
      }

      showAwaitingDataScreen() {
        const listings = document.getElementById('listings');
        if (listings) {
          listings.innerHTML = `
            <div class="awaiting-upload">
              <div class="upload-prompt">
                <div class="upload-icon">📁</div>
                <h2>Welcome to MapaLister</h2>
                <p>Upload your GeoJSON data file to get started</p>
                
                <button id="main-upload-btn" class="upload-main-btn">
                  <span class="btn-icon">📁</span>
                  <span>Choose GeoJSON File</span>
                </button>
              </div>
            </div>
          `;
          
          const uploadBtn = document.getElementById('main-upload-btn');
          if (uploadBtn && window.FileUploadManager) {
            uploadBtn.addEventListener('click', () => {
              window.FileUploadManager.triggerFileUpload();
            });
          }
        }
        
        if (this.eventBus) {
          this.eventBus.emit('ui:awaiting-data');
        }
      }

      // Process uploaded file data specifically
      processUploadedData(data, fileName, featureCount) {
        this.currentDataSource = 'uploaded';
        this.updateUIForUploadedData(fileName, featureCount);

        setTimeout(async () => {
          try {
            await this.processLoadedData(data, {
              filename: fileName,
              displayName: fileName,
              isUploaded: true
            });
            console.log('✅ Uploaded data processed and dataset manager initialized');
          } catch (error) {
            console.error('❌ Error processing uploaded data:', error);
          }
        }, 100);
      }

      // Get current data source type
      getCurrentDataSource() {
        return this.currentDataSource;
      }

      // Get dataset manager
      getDatasetManager() {
        return this.datasetManager;
      }

      // Clear uploaded data and reset
      clearUploadedData() {
        this.currentDataSource = 'default';
        
        // Clean up dataset manager
        if (this.datasetManager && this.datasetManager.cleanup) {
          this.datasetManager.cleanup();
        }
        
        // Remove uploaded indicator
        const indicator = document.getElementById('uploaded-indicator');
        if (indicator) {
          indicator.remove();
        }
        
        // Reset selector text
        const selectorText = document.getElementById('selectorText');
        if (selectorText) {
          selectorText.textContent = 'Default data';
          selectorText.className = 'selector-text';
        }
        
        if (this.eventBus) {
          this.eventBus.emit('data:cleared');
        }
        
        console.log('🗑️ Uploaded data cleared');
      }

      // Update data display for new dataset
      updateDataDisplay(geojsonData) {
        if (window.SidebarManager) {
          window.SidebarManager.build(geojsonData);
        }
        
        if (window.map && window.MapManager) {
          window.MapManager.updateMarkers(window.map, geojsonData);
        }
        
        if (this.eventBus) {
          this.eventBus.emit('data:updated', { data: geojsonData });
        }
      }

      // Cleanup method
      destroy() {
        if (this.datasetManager && this.datasetManager.cleanup) {
          this.datasetManager.cleanup();
        }
        this.datasetManager = null;
      }
    }

    // Add event bus support to existing DataManager if it exists
    if (typeof window.DataManager !== 'undefined') {
      const OriginalDataManager = window.DataManager;
      
      window.DataManager = function(eventBus) {
        this.eventBus = eventBus;
        // Call original constructor logic if it exists
        if (OriginalDataManager && typeof OriginalDataManager === 'function') {
          OriginalDataManager.call(this);
        }
      };
      
      // Copy all methods from original
      if (OriginalDataManager && OriginalDataManager.prototype) {
        Object.setPrototypeOf(window.DataManager.prototype, OriginalDataManager.prototype);
      }
    } else {
      // Create new DataManager
      window.DataManager = EnhancedDataManager;
    }

    // Export enhanced version to global scope
    window.EnhancedDataManager = EnhancedDataManager;
    window.InternalDatasetFilterManager = InternalDatasetFilterManager;

    console.log('✅ Enhanced Data Manager loaded');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('mapalister:dataManagerReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initEnhancedDataManager();
  }

})();