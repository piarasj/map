/**
 * =====================================================
 * FILE: managers/data-manager.js (UNIFIED VERSION)
 * PURPOSE: Complete data processing with working dataset filtering
 * DEPENDENCIES: DataConfig, MapManager, SidebarManager, SettingsManager
 * EXPORTS: DataManager with integrated dataset filtering
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📊 Loading unified data-manager.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof DataConfig === 'undefined') missing.push('DataConfig');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ DataManager missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initDataManager();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    return;
  }

  function initDataManager() {

    // ==================== UNIFIED DATASET FILTER MANAGER ====================
    class DatasetFilterManager {
      constructor(map) {
        this.map = map;
        this.allData = null;
        this.activeDatasets = new Set();
        this.datasetConfig = {};
        this.colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
        this._closeDropdownHandler = null;
      }

      async loadData(geojsonData) {
        console.log('📊 Dataset manager processing data...', geojsonData.features?.length, 'features');
        
        this.allData = geojsonData;
        
        try {
          // Build dataset configuration
          this.datasetConfig = this.buildDatasetConfig(geojsonData);
          const datasets = this.findAvailableDatasets(geojsonData);
          
          console.log('📂 Found datasets:', datasets);
          console.log('📊 Dataset config:', this.datasetConfig);
          
          if (datasets.length > 1) {
            // Multiple datasets - show dropdown
            this.activeDatasets = new Set(datasets);
            console.log('📱 Multiple datasets detected, showing dropdown');
            this.updateDropdown(datasets);
            this.setupDropdownInteractions();
            this.showSelectorDropdown();
          } else if (datasets.length === 1) {
            // Single dataset - hide dropdown, show simple label
            console.log('📱 Single dataset detected, hiding dropdown');
            this.activeDatasets = new Set(datasets);
            this.hideSelectorDropdown();
          } else {
            // No datasets - show default
            console.log('📱 No datasets detected, showing default');
            this.activeDatasets = new Set();
            this.hideSelectorDropdown();
          }
          
          // Always update selector text
          this.updateSelectorText();
          
          // Store filtered data globally
          window.geojsonData = this.getFilteredData();
          
          // Initialize map with data
          if (this.map && window.MapManager) {
            console.log('🗺️ Initializing map with filtered data...');
            window.MapManager.initialize(this.map, window.geojsonData);
          } else if (this.map && window.UnifiedMapManager) {
            // Use UnifiedMapManager if available
            const mapManager = window.unifiedMapManagerInstance || new window.UnifiedMapManager();
            mapManager.updateMarkers(this.map, window.geojsonData);
          }
          
          // Update sidebar
          this.updateSidebar();
          
          console.log(`✅ ${geojsonData.features.length} features loaded with dataset filtering`);
          
          // Force UI update after data processing
          setTimeout(() => {
            console.log('🔄 Forcing UI update after data processing...');
            
            // Update dropdown and selector text
            if (datasets.length > 1) {
              this.updateDropdown(datasets);
              this.showSelectorDropdown();
              this.updateSelectorText();
            } else {
              this.hideSelectorDropdown();
              this.updateSelectorText();
            }
            
            console.log('✅ UI update completed');
          }, 100);
          
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
        
        const groupingProperty = this.getGroupingProperty();
        console.log('📊 Using grouping property:', groupingProperty);
        
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
        
        return Array.from(datasets).sort();
      }

      getGroupingProperty() {
        // Primary: Use 'dataset' property
        if (this.allData?.features?.some(f => f.properties?.dataset)) {
          return 'dataset';
        }
        
        // Try DataConfig if available
        if (window.DataConfig?.getCurrentConfig) {
          try {
            const config = window.DataConfig.getCurrentConfig();
            if (config?.groupingProperty) {
              return config.groupingProperty;
            }
          } catch (e) {
            console.warn('⚠️ Could not get DataConfig, using fallback');
          }
        }
        
        // Try SettingsManager
        if (window.SettingsManager?.getDataConfig) {
          try {
            const dataConfig = window.SettingsManager.getDataConfig();
            if (dataConfig?.groupingProperty) {
              return dataConfig.groupingProperty;
            }
          } catch (e) {
            console.warn('⚠️ Could not get SettingsManager config, using fallback');
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
        
        // Extract group number from patterns like "Group I - 2014-2018"
        const groupMatch = groupValue.match(/Group\s+([IVX]+)/i);
        if (groupMatch) {
          return groupMatch[1];
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

        console.log('📊 Updating dropdown with datasets:', datasets);
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
            <div class="dataset-color" style="background-color: ${config.color}; width: 12px; height: 12px; border-radius: 50%; margin-left: auto;"></div>
          `;
          
          dropdown.appendChild(item);
        });
        
        this.updateSelectorText();
        console.log('✅ Dropdown updated with', datasets.length, 'datasets');
      }

      setupDropdownInteractions() {
        const selectorButton = document.getElementById('selectorButton');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (!selectorButton || !dropdownMenu) {
          console.warn('⚠️ Dropdown elements not found for interaction setup');
          return;
        }

        console.log('🔗 Setting up dropdown interactions...');

        // Remove existing listeners to prevent duplicates
        const newSelectorButton = selectorButton.cloneNode(true);
        selectorButton.parentNode.replaceChild(newSelectorButton, selectorButton);

        // Toggle dropdown on button click
        newSelectorButton.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('active');
          
          const arrow = document.getElementById('selectorArrow');
          if (arrow) {
            arrow.style.transform = dropdownMenu.classList.contains('active') ? 
              'rotate(180deg)' : 'rotate(0deg)';
          }
        });

        // Handle dataset selection
        dropdownMenu.addEventListener('click', (e) => {
          const item = e.target.closest('.dropdown-item[data-value]');
          if (item) {
            e.stopPropagation();
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

        // Clean up existing handler
        if (this._closeDropdownHandler) {
          document.removeEventListener('click', this._closeDropdownHandler);
        }
        this._closeDropdownHandler = closeDropdown;
        document.addEventListener('click', this._closeDropdownHandler);

        console.log('✅ Dropdown interactions configured');
      }

      toggleDataset(dataset) {
        console.log('🔄 Toggling dataset:', dataset);
        
        // STEP 1: Store flags before filtering
        const flagMap = window.PopupUtils ? window.PopupUtils.storeFlagsBeforeFiltering() : new Map();
        
        if (this.activeDatasets.has(dataset)) {
          this.activeDatasets.delete(dataset);
        } else {
          this.activeDatasets.add(dataset);
        }
        
        // Update UI elements
        this.updateDropdownCheckboxes();
        this.updateSelectorText();
        
        // Update data and views
        const filteredData = this.getFilteredData();
        window.geojsonData = filteredData;
        
        this.updateMap();
        this.updateSidebar();
        
        // STEP 2: Restore flags after filtering
        if (window.PopupUtils && flagMap.size > 0) {
          setTimeout(() => {
            window.PopupUtils.restoreFlagsAfterFiltering(flagMap);
          }, 200);
        }
        
        console.log(`📊 Active datasets: [${Array.from(this.activeDatasets).join(', ')}]`);
        console.log(`📊 Filtered features: ${filteredData.features.length}`);
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
        if (!selectorText) {
          console.warn('❌ updateSelectorText: selectorText element not found');
          return;
        }

        const activeCount = this.activeDatasets.size;
        console.log('🔄 updateSelectorText called with', activeCount, 'active datasets:', Array.from(this.activeDatasets));
        console.log('📊 Available dataset config:', this.datasetConfig);
        
        if (activeCount === 0) {
          selectorText.textContent = 'No datasets available';
          selectorText.className = 'selector-text placeholder';
          console.log('📱 Set selector to: No datasets available');
        } else if (activeCount === 1) {
          const dataset = Array.from(this.activeDatasets)[0];
          const config = this.datasetConfig[dataset];
          const count = this.allData.features.filter(f => 
            f.properties?.[this.getGroupingProperty()] === dataset
          ).length;
          const newText = `${config?.label || dataset} (${count} features)`;
          selectorText.textContent = newText;
          selectorText.className = 'selector-text';
          console.log('📱 Set selector to:', newText);
        } else if (activeCount <= 3) {
          const labels = Array.from(this.activeDatasets).map(dataset => 
            this.datasetConfig[dataset]?.shortLabel || this.generateShortLabel(dataset)
          );
          const totalCount = this.getFilteredData().features.length;
          selectorText.textContent = `${labels.join(' + ')} (${totalCount})`;
          selectorText.className = 'selector-text multiple-active';
        } else {
          const totalCount = this.getFilteredData().features.length;
          selectorText.textContent = `${activeCount} datasets (${totalCount} features)`;
          selectorText.className = 'selector-text multiple-active';
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
        const filteredData = this.getFilteredData();
        
        // First priority: Use pulsing markers if available
        if (window.unifiedMapManagerInstance && window.unifiedMapManagerInstance.pulsingMarkers) {
          console.log('🔄 Using pulsing markers for dataset update');
          window.unifiedMapManagerInstance.pulsingMarkers.updateData(filteredData);
          return;
        }
        
        // Second priority: Use unified map manager
        if (window.unifiedMapManagerInstance && window.unifiedMapManagerInstance.updateMarkers) {
          console.log('🔄 Using unified map manager for dataset update');
          window.unifiedMapManagerInstance.updateMarkers(this.map, filteredData);
          return;
        }
        
        // Fallback: Use legacy MapManager
        if (window.MapManager && window.MapManager.updateMarkers) {
          console.log('🔄 Using legacy MapManager for dataset update');
          window.MapManager.updateMarkers(this.map, filteredData);
        }
      }

updateSidebar() {
        if (this.allData && window.SidebarManager) {
          const filteredData = this.getFilteredData();
          
          // Update global data reference for pulsing markers
          window.geojsonData = filteredData;
          
          window.SidebarManager.build(filteredData);
          
          // Update sidebar with any existing flags
          if (window.PopupUtils && window.PopupUtils.updateSidebarFlaggedContacts) {
            setTimeout(() => {
              window.PopupUtils.updateSidebarFlaggedContacts();
            }, 50);
          }
          
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

    // ==================== UNIFIED DATA MANAGER ====================
    class DataManager {
      constructor(eventBus) {
        this.eventBus = eventBus;
        this.datasetManager = null;
        this.currentDataSource = 'default';
      }

      init() {
        console.log('📊 Data Manager initialized');
      }

      async processLoadedData(data, config) {
        console.log('📊 Processing loaded data...', data.features?.length, 'features');
        
        try {
          // Clean up existing dataset manager
          if (this.datasetManager && this.datasetManager.cleanup) {
            this.datasetManager.cleanup();
          }
          
          // Ensure map is globally available
          if (!window.map && window.MapaListerApp?.mapManager?.map) {
            window.map = window.MapaListerApp.mapManager.map;
            console.log('✅ Map made globally available');
          }
          
          // Initialize dataset management
          if (window.map) {
            console.log('🔄 Initializing dataset filtering...');
            
            this.datasetManager = new DatasetFilterManager(window.map);
            const datasets = await this.datasetManager.loadData(data);
            
            // Store reference globally for other components
          window.datasetFilterManager = this.datasetManager;
          
          // Ensure global data reference is updated for pulsing markers
          window.geojsonData = data;
            
            console.log('✅ Dataset filtering initialized with', datasets.length, 'datasets');
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
        this.removeUploadedIndicator();
        
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
        
        console.log('✅ UI updated for uploaded data:', fileName);
        
        if (this.eventBus) {
          this.eventBus.emit('ui:updated', { fileName, featureCount, type: 'upload' });
        }
      }

      addUploadedIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'uploaded-indicator';
        indicator.innerHTML = '📁';
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

      removeUploadedIndicator() {
        const existingIndicator = document.getElementById('uploaded-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
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

      processUploadedData(data, fileName, featureCount) {
        console.log('📁 Processing uploaded data:', fileName, 'with', featureCount, 'features');
        
        this.currentDataSource = 'uploaded';
        this.updateUIForUploadedData(fileName, featureCount);

        setTimeout(async () => {
          try {
            await this.processLoadedData(data, {
              filename: fileName,
              displayName: fileName,
              isUploaded: true
            });
            console.log('✅ Uploaded data processed successfully');
          } catch (error) {
            console.error('❌ Error processing uploaded data:', error);
          }
        }, 100);
      }

      getCurrentDataSource() {
        return this.currentDataSource;
      }

      getDatasetManager() {
        return this.datasetManager;
      }

      clearUploadedData() {
        this.currentDataSource = 'default';
        
        if (this.datasetManager && this.datasetManager.cleanup) {
          this.datasetManager.cleanup();
        }
        
        this.removeUploadedIndicator();
        
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

      destroy() {
        if (this.datasetManager && this.datasetManager.cleanup) {
          this.datasetManager.cleanup();
        }
        this.datasetManager = null;
      }
    }

    // Export to global scope
    window.DataManager = DataManager;
    window.DatasetFilterManager = DatasetFilterManager;

    console.log('✅ Unified Data Manager loaded');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('mapalister:dataManagerReady'));
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initDataManager();
  }

})();