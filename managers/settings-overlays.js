/**
 * =====================================================
 * FILE: managers/settings-overlays.js (IRISH OVERLAYS)
 * PURPOSE: Irish counties and dioceses overlay management
 * DEPENDENCIES: SettingsManager, LucideUtils
 * EXPORTS: SettingsOverlays
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🗺️ Loading settings-overlays.js...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof SettingsManager === 'undefined') missing.push('SettingsManager');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ SettingsOverlays missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initSettingsOverlays();
      }
    };
    
    window.addEventListener('mapalister:settingsReady', retryInit);
    return;
  }

  function initSettingsOverlays() {
    /**
     * IRISH OVERLAYS MANAGEMENT
     * Handles counties and dioceses overlay functionality
     */
    const SettingsOverlays = {
      countiesLayerLoaded: false,
      diocesesLayerLoaded: false,
      parishesLayerLoaded: false,
      diocesanOfficesLoaded: false,
      countiesPopup: null,
      diocesesPopup: null,
      parishesPopup: null,
      officesPopup: null,

      /**
       * Handle overlay setting changes
       */
      handleOverlaySettingChange(key, value) {
        if (typeof map !== 'undefined' && map) {
          switch (key) {
            case 'showIrishCounties':
              if (value) {
                this.loadIrishCounties();
              } else {
                this.hideIrishCounties();
              }
              break;
            case 'showIrishDioceses':
              if (value) {
                this.loadIrishDioceses();
              } else {
                this.hideIrishDioceses();
              }
              break;
            case 'showIrishParishes':
              if (value) {
                this.loadIrishParishes();
              } else {
                this.hideIrishParishes();
              }
              break;
            case 'irishCountiesOpacity':
              this.updateCountiesOpacity(value);
              break;
            case 'irishCountiesStyle':
              this.updateCountiesStyle(value);
              break;
            case 'irishDiocesesOpacity':
              this.updateDiocesesOpacity(value);
              break;
            case 'irishDiocesesStyle':
              this.updateDiocesesStyle(value);
              break;
            case 'irishParishesOpacity':
              this.updateParishesOpacity(value);
              break;
            case 'irishParishesStyle':
              this.updateParishesStyle(value);
              break;
            case 'showDiocesanOffices':
              if (value) {
                this.loadDiocesanOffices();
              } else {
                this.hideDiocesanOffices();
              }
              break;
          }
        }
      },

      /**
       * Initialize overlays on map load
       */
      initializeOverlays() {
        if (!map) {
          console.warn('⚠️ Cannot initialize overlays - no map available');
          return;
        }
        
        if (!map.isStyleLoaded()) {
          console.log('⏳ Waiting for map style to load before initializing overlays...');
          map.once('styledata', () => {
            if (map.isStyleLoaded()) {
              this.initializeOverlays();
            }
          });
          return;
        }
        
        console.log('🗺️ Initializing overlays...');
        
        const countiesEnabled = window.SettingsManager.getSetting('showIrishCounties');
        const diocesesEnabled = window.SettingsManager.getSetting('showIrishDioceses');
        const parishesEnabled = window.SettingsManager.getSetting('showIrishParishes');
        const officesEnabled = window.SettingsManager.getSetting('showDiocesanOffices');
        
        console.log(`📋 Overlay settings: Counties=${countiesEnabled}, Dioceses=${diocesesEnabled}, Parishes=${parishesEnabled}, Offices=${officesEnabled}`);
        
        if (countiesEnabled) {
          console.log('🏛️ Auto-loading Irish counties...');
          setTimeout(() => {
            this.loadIrishCounties().then(() => {
              console.log('✅ Counties auto-load completed');
            }).catch((error) => {
              console.error('❌ Counties auto-load failed:', error);
            });
          }, 1000);
        }
        
        if (diocesesEnabled) {
          console.log('⛪ Auto-loading Irish dioceses...');
          setTimeout(() => {
            this.loadIrishDioceses().then(() => {
              console.log('✅ Dioceses auto-load completed');
            }).catch((error) => {
              console.error('❌ Dioceses auto-load failed:', error);
            });
          }, 1200);
        }
        
        if (parishesEnabled) {
          console.log('📍 Auto-loading Irish parishes...');
          setTimeout(() => {
            this.loadIrishParishes().then(() => {
              console.log('✅ Parishes auto-load completed');
            }).catch((error) => {
              console.error('❌ Parishes auto-load failed:', error);
            });
          }, 1400);
        }
        
        if (officesEnabled) {
          console.log('⛪ Auto-loading Diocesan offices...');
          setTimeout(() => {
            this.loadDiocesanOffices().then(() => {
              console.log('✅ Diocesan offices auto-load completed');
            }).catch((error) => {
              console.error('❌ Diocesan offices auto-load failed:', error);
            });
          }, 1600);
        }
        
        const overlaysToLoad = (countiesEnabled ? 1 : 0) + (diocesesEnabled ? 1 : 0) + (parishesEnabled ? 1 : 0) + (officesEnabled ? 1 : 0);
        if (overlaysToLoad > 0) {
          console.log(`✅ Overlay initialization complete - loading ${overlaysToLoad} overlay(s)`);
          
          setTimeout(() => {
            if (window.SettingsManager && window.SettingsManager.showToast) {
              const message = overlaysToLoad === 1 ? 
                'Overlay loaded' : 
                'Overlays loaded';
              window.SettingsManager.showToast(message, 'success');
            }
          }, 2000);
        } else {
          console.log('✅ Overlay initialization complete - no overlays enabled');
        }
      },

      /**
       * Load and display Irish counties
       */
      async loadIrishCounties() {
        console.log('🏛️ Loading Irish counties...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for counties overlay');
          return;
        }

        if (this.countiesLayerLoaded) {
          this.showIrishCounties();
          return;
        }

        try {
          const url = window.SettingsManager.getSetting('irishCountiesSource');
          console.log(`📂 Fetching counties from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const countiesData = await response.json();
          console.log('✅ Counties data loaded:', countiesData.features?.length, 'features');
          
          if (!countiesData.type || countiesData.type !== 'FeatureCollection' || !countiesData.features) {
            throw new Error('Invalid GeoJSON structure for counties');
          }
          
          this.removeCountiesLayers();
          
          map.addSource('irish-counties', {
            type: 'geojson',
            data: countiesData
          });
          
          map.addLayer({
            id: 'irish-counties-fill',
            type: 'fill',
            source: 'irish-counties',
            paint: {
              'fill-color': [
                'case',
                ['has', 'fill'], ['get', 'fill'],
                ['has', 'color'], ['get', 'color'],
                '#3b82f6'
              ],
              'fill-opacity': window.SettingsManager.getSetting('irishCountiesOpacity')
            }
          });
          
          map.addLayer({
            id: 'irish-counties-border',
            type: 'line',
            source: 'irish-counties',
            paint: {
              'line-color': [
                'case',
                ['has', 'stroke'], ['get', 'stroke'],
                ['has', 'stroke-color'], ['get', 'stroke-color'],
                '#1e293b'
              ],
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
          
          this.setupCountiesHover();
          this.countiesLayerLoaded = true;
          this.updateCountiesStyle(window.SettingsManager.getSetting('irishCountiesStyle'));
          
          console.log('✅ Irish counties loaded successfully');
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast('Irish counties loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Irish counties:', error);
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast(`Counties failed: ${error.message}`, 'error');
          }
          
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            window.SettingsManager.setSetting('showIrishCounties', false);
          }
        }
      },

      /**
       * Load and display Irish dioceses
       */
      async loadIrishDioceses() {
        console.log('⛪ Loading Irish dioceses...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for dioceses overlay');
          return;
        }

        if (this.diocesesLayerLoaded) {
          this.showIrishDioceses();
          return;
        }

        try {
          const url = window.SettingsManager.getSetting('irishDiocesesSource');
          console.log(`📂 Fetching dioceses from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const diocesesData = await response.json();
          console.log('✅ Dioceses data loaded:', diocesesData.features?.length, 'features');
          
          if (!diocesesData.type || diocesesData.type !== 'FeatureCollection' || !diocesesData.features) {
            throw new Error('Invalid GeoJSON structure for dioceses');
          }
          
          this.removeDiocesesLayers();
          
          map.addSource('irish-dioceses', {
            type: 'geojson',
            data: diocesesData
          });
          
          map.addLayer({
            id: 'irish-dioceses-fill',
            type: 'fill',
            source: 'irish-dioceses',
            paint: {
              'fill-color': [
                'case',
                ['has', 'fill'], ['get', 'fill'],
                ['has', 'color'], ['get', 'color'],
                '#8b5cf6'
              ],
              'fill-opacity': window.SettingsManager.getSetting('irishDiocesesOpacity')
            }
          });
          
          map.addLayer({
            id: 'irish-dioceses-border',
            type: 'line',
            source: 'irish-dioceses',
            paint: {
              'line-color': [
                'case',
                ['has', 'stroke'], ['get', 'stroke'],
                ['has', 'stroke-color'], ['get', 'stroke-color'],
                '#4c1d95'
              ],
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
          
          this.setupDiocesesHover();
          this.diocesesLayerLoaded = true;
          this.updateDiocesesStyle(window.SettingsManager.getSetting('irishDiocesesStyle'));
          
          console.log('✅ Irish dioceses loaded successfully');
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast('Irish dioceses loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Irish dioceses:', error);
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast(`Dioceses failed: ${error.message}`, 'error');
          }
          
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            window.SettingsManager.setSetting('showIrishDioceses', false);
          }
        }
      },

      /**
       * Load and display Irish parishes
       */
      async loadIrishParishes() {
        console.log('📍 Loading Irish parishes...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for parishes overlay');
          return;
        }

        if (this.parishesLayerLoaded) {
          this.showIrishParishes();
          return;
        }

        try {
          const url = window.SettingsManager.getSetting('irishParishesSource');
          console.log(`📂 Fetching parishes from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const parishesData = await response.json();
          console.log('✅ Parishes data loaded:', parishesData.features?.length, 'features');
          
          if (!parishesData.type || parishesData.type !== 'FeatureCollection' || !parishesData.features) {
            throw new Error('Invalid GeoJSON structure for parishes');
          }
          
          this.removeParishesLayers();
          
          map.addSource('irish-parishes', {
            type: 'geojson',
            data: parishesData
          });
          
          map.addLayer({
            id: 'irish-parishes-fill',
            type: 'fill',
            source: 'irish-parishes',
            paint: {
              'fill-color': [
                'case',
                ['has', 'fill'], ['get', 'fill'],
                ['has', 'color'], ['get', 'color'],
                '#10b981'
              ],
              'fill-opacity': window.SettingsManager.getSetting('irishParishesOpacity')
            }
          });
          
          map.addLayer({
            id: 'irish-parishes-border',
            type: 'line',
            source: 'irish-parishes',
            paint: {
              'line-color': [
                'case',
                ['has', 'stroke'], ['get', 'stroke'],
                ['has', 'stroke-color'], ['get', 'stroke-color'],
                '#047857'
              ],
              'line-width': 1.5,
              'line-opacity': 0.8
            }
          });
          
          this.setupParishesHover();
          this.parishesLayerLoaded = true;
          this.updateParishesStyle(window.SettingsManager.getSetting('irishParishesStyle'));
          
          console.log('✅ Irish parishes loaded successfully');
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast('Irish parishes loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Irish parishes:', error);
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast(`Parishes failed: ${error.message}`, 'error');
          }
          
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            window.SettingsManager.setSetting('showIrishParishes', false);
          }
        }
      },

      /**
       * Setup enhanced hover effects for counties
       */
      setupCountiesHover() {
        if (!map || !map.getLayer('irish-counties-fill')) return;
        
        if (this.countiesPopup) {
          this.countiesPopup.remove();
        }
        
        this.countiesPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'overlay-popup county-popup',
          anchor: 'left',
          offset: [15, 0]
        });
        
        let currentHoveredFeature = null;
        let popupTimeout = null;
        
        const handleMouseMove = (e) => {
          const countiesStyle = window.SettingsManager.getSetting('irishCountiesStyle');
          const countiesEnabled = window.SettingsManager.getSetting('showIrishCounties');
          
          if (!countiesEnabled || (countiesStyle !== 'filled' && countiesStyle !== 'both')) {
            if (this.countiesPopup && this.countiesPopup.isOpen()) {
              this.countiesPopup.remove();
            }
            return;
          }
          
          if (popupTimeout) {
            clearTimeout(popupTimeout);
            popupTimeout = null;
          }
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['irish-counties-fill']
          });
          
          if (features.length > 0) {
            const feature = features[0];
            const featureId = feature.id || feature.properties.id || 
                             feature.properties.COUNTY || feature.properties.name;
            
            if (currentHoveredFeature !== featureId) {
              currentHoveredFeature = featureId;
              map.getCanvas().style.cursor = 'pointer';
              
              const properties = feature.properties;
              
              const countyEnglish = (properties.COUNTY || 'County')
                .toLowerCase()
                .replace(/\b\w/g, l => l.toUpperCase());
              const countyIrish = properties.CONTAE || '';
              const province = properties.PROVINCE || '';
              
              const countyDisplay = countyIrish ? 
                `${countyEnglish} • ${countyIrish}` : 
                countyEnglish;
              
              const provinceDisplay = province ? 
                `Province of ${province}` : 
                '';
              
              const landmarkIcon = window.LucideUtils ? window.LucideUtils.icon('landmark', { size: 16 }) : '🏛️';
              const popupContent = `
                <div style="
                  font-family: 'Outfit', sans-serif;
                  background: rgba(255, 255, 255, 0.98);
                  backdrop-filter: blur(12px);
                  border-radius: 8px;
                  padding: 12px 16px;
                  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                  border: 1px solid rgba(59, 130, 246, 0.2);
                  min-width: 120px;
                  text-align: center;
                ">
                  <div style="
                    font-weight: 600; 
                    color: #1e40af; 
                    font-size: 14px; 
                    margin-bottom: ${provinceDisplay ? '2px' : '4px'};
                    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                  ">${landmarkIcon} ${countyDisplay}</div>
                  ${provinceDisplay ? `
                    <div style="
                      color: #64748b; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.9;
                      margin-bottom: 4px;
                    ">${provinceDisplay}</div>
                  ` : ''}
                  <div style="
                    color: #3b82f6; 
                    font-size: 11px; 
                    font-weight: 500;
                    opacity: 0.8;
                  ">Civil ● County</div>
                </div>
              `;
              
              this.countiesPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
                
              if (window.LucideUtils) {
                setTimeout(() => window.LucideUtils.init(), 10);
              }
            } else {
              this.countiesPopup.setLngLat(e.lngLat);
            }
          } else {
            this.hideCountiesPopupWithDelay();
          }
        };
        
        const hideCountiesPopupWithDelay = () => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
          }
          
          popupTimeout = setTimeout(() => {
            if (this.countiesPopup) {
              this.countiesPopup.remove();
            }
            currentHoveredFeature = null;
            map.getCanvas().style.cursor = '';
          }, 150);
        };
        
        const layers = ['irish-counties-fill', 'irish-counties-border'];
        
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, () => {
              hideCountiesPopupWithDelay();
            });
          }
        });
        
        this.hideCountiesPopupWithDelay = hideCountiesPopupWithDelay;
        
        console.log('✅ Enhanced counties hover effects configured');
      },

      /**
       * Setup enhanced hover effects for dioceses
       */
      setupDiocesesHover() {
        if (!map || !map.getLayer('irish-dioceses-fill')) return;
        
        if (this.diocesesPopup) {
          this.diocesesPopup.remove();
        }
        
        this.diocesesPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'overlay-popup diocese-popup',
          anchor: 'top',
          offset: [0, 15]
        });
        
        let currentHoveredFeature = null;
        let popupTimeout = null;
        
        const handleMouseMove = (e) => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
            popupTimeout = null;
          }
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['irish-dioceses-fill']
          });
          
          if (features.length > 0) {
            const feature = features[0];
            const featureId = feature.id || feature.properties.id || 
                             feature.properties.diocese || feature.properties.name;
            
            if (currentHoveredFeature !== featureId) {
              currentHoveredFeature = featureId;
              map.getCanvas().style.cursor = 'pointer';
              
              const properties = feature.properties;
              
              const dioceseName = properties.diocese ||
                                 properties.Diocese ||
                                 properties.DIOCESE ||
                                 properties.name ||
                                 properties.NAME ||
                                 properties.title ||
                                 properties.TITLE ||
                                 properties.dioceseName ||
                                 properties.DioceseName ||
                                 'Irish Diocese';
              
              const province = properties.province || '';
              const administration = properties.administration || '';
              
              const provinceDisplay = province ? 
                `Province of ${province}` : 
                '';
              
              const churchIcon = window.LucideUtils ? window.LucideUtils.icon('church', { size: 16 }) : '⛪';
              const popupContent = `
                <div style="
                  font-family: 'Outfit', sans-serif;
                  background: rgba(255, 255, 255, 0.98);
                  backdrop-filter: blur(12px);
                  border-radius: 8px;
                  padding: 12px 16px;
                  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                  border: 1px solid rgba(139, 92, 246, 0.2);
                  min-width: 120px;
                  text-align: center;
                ">
                  <div style="
                    font-weight: 600; 
                    color: #4c1d95; 
                    font-size: 14px; 
                    margin-bottom: ${provinceDisplay || administration ? '2px' : '4px'};
                    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                  ">${churchIcon} ${dioceseName}</div>
                  ${provinceDisplay ? `
                    <div style="
                      color: #64748b; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.9;
                      margin-bottom: ${administration ? '2px' : '4px'};
                    ">${provinceDisplay}</div>
                  ` : ''}
                  ${administration ? `
                    <div style="
                      color: #7c3aed; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.85;
                      margin-bottom: 4px;
                      font-style: italic;
                      line-height: 1;
                    ">${administration}</div>
                  ` : ''}
                  <div style="
                    color: #6b46c1; 
                    font-size: 11px; 
                    font-weight: 500;
                    opacity: 0.8;
                  ">Ecclesiastical ● Diocese</div>
                </div>
              `;
              
              this.diocesesPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
                
              if (window.LucideUtils) {
                setTimeout(() => window.LucideUtils.init(), 10);
              }
            } else {
              this.diocesesPopup.setLngLat(e.lngLat);
            }
          } else {
            this.hideDiocesesPopupWithDelay();
          }
        };
        
        const hideDiocesesPopupWithDelay = () => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
          }
          
          popupTimeout = setTimeout(() => {
            if (this.diocesesPopup) {
              this.diocesesPopup.remove();
            }
            currentHoveredFeature = null;
            map.getCanvas().style.cursor = '';
          }, 150);
        };
        
        const layers = ['irish-dioceses-fill', 'irish-dioceses-border'];
        
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, () => {
              hideDiocesesPopupWithDelay();
            });
          }
        });
        
        this.hideDiocesesPopupWithDelay = hideDiocesesPopupWithDelay;
        
        console.log('✅ Enhanced dioceses hover effects configured');
      },

      /**
       * Setup enhanced hover effects for parishes
       */
      setupParishesHover() {
        if (!map || !map.getLayer('irish-parishes-fill')) return;
        
        if (this.parishesPopup) {
          this.parishesPopup.remove();
        }
        
        this.parishesPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'overlay-popup parish-popup',
          anchor: 'right',
          offset: [-15, 0]
        });
        
        let currentHoveredFeature = null;
        let popupTimeout = null;
        
        const handleMouseMove = (e) => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
            popupTimeout = null;
          }
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['irish-parishes-fill']
          });
          
          if (features.length > 0) {
            const feature = features[0];
            const featureId = feature.id || feature.properties.id || 
                             feature.properties.parish || feature.properties.name;
            
            if (currentHoveredFeature !== featureId) {
              currentHoveredFeature = featureId;
              map.getCanvas().style.cursor = 'pointer';
              
              const properties = feature.properties;
              
              const parishName = properties.parish ||
                                properties.Parish ||
                                properties.PARISH ||
                                properties.name ||
                                properties.NAME ||
                                properties.title ||
                                properties.TITLE ||
                                properties.parishName ||
                                properties.ParishName ||
                                'Urban Parishes';
              
              const diocese = properties.diocese || properties.Diocese || '';
              const county = properties.county || properties.County || '';
              
              const dioceseDisplay = diocese ? 
                `Diocese of ${diocese}` : 
                '';
              
              const parishIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 16 }) : '📍';
              const popupContent = `
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
                    margin-bottom: ${dioceseDisplay || county ? '2px' : '4px'};
                    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                  ">${parishIcon} ${parishName}</div>
                  ${dioceseDisplay ? `
                    <div style="
                      color: #64748b; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.9;
                      margin-bottom: ${county ? '2px' : '4px'};
                    ">${dioceseDisplay}</div>
                  ` : ''}
                  ${county ? `
                    <div style="
                      color: #10b981; 
                      font-size: 10px; 
                      font-weight: 500;
                      opacity: 0.85;
                      margin-bottom: 4px;
                    ">${county}</div>
                  ` : ''}
                  <div style="
                    color: #059669; 
                    font-size: 11px; 
                    font-weight: 500;
                    opacity: 0.8;
                  ">Ecclesiastical ● Parish</div>
                </div>
              `;
              
              this.parishesPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
                
              if (window.LucideUtils) {
                setTimeout(() => window.LucideUtils.init(), 10);
              }
            } else {
              this.parishesPopup.setLngLat(e.lngLat);
            }
          } else {
            this.hideParishesPopupWithDelay();
          }
        };
        
        const hideParishesPopupWithDelay = () => {
          if (popupTimeout) {
            clearTimeout(popupTimeout);
          }
          
          popupTimeout = setTimeout(() => {
            if (this.parishesPopup) {
              this.parishesPopup.remove();
            }
            currentHoveredFeature = null;
            map.getCanvas().style.cursor = '';
          }, 150);
        };
        
        const layers = ['irish-parishes-fill', 'irish-parishes-border'];
        
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, () => {
              hideParishesPopupWithDelay();
            });
          }
        });
        
        this.hideParishesPopupWithDelay = hideParishesPopupWithDelay;
        
        console.log('✅ Enhanced parishes hover effects configured');
      },

      /**
       * Safely remove counties layers
       */
      removeCountiesLayers() {
        if (!map) return;
        
        try {
          if (map.getLayer('irish-counties-fill')) {
            map.removeLayer('irish-counties-fill');
          }
          if (map.getLayer('irish-counties-border')) {
            map.removeLayer('irish-counties-border');
          }
          if (map.getSource('irish-counties')) {
            map.removeSource('irish-counties');
          }
        } catch (error) {
          console.warn('⚠️ Error removing counties layers:', error);
        }
      },

      /**
       * Safely remove dioceses layers
       */
      removeDiocesesLayers() {
        if (!map) return;
        
        try {
          if (map.getLayer('irish-dioceses-fill')) {
            map.removeLayer('irish-dioceses-fill');
          }
          if (map.getLayer('irish-dioceses-border')) {
            map.removeLayer('irish-dioceses-border');
          }
          if (map.getSource('irish-dioceses')) {
            map.removeSource('irish-dioceses');
          }
        } catch (error) {
          console.warn('⚠️ Error removing dioceses layers:', error);
        }
      },

      /**
       * Safely remove parishes layers
       */
      removeParishesLayers() {
        if (!map) return;
        
        try {
          if (map.getLayer('irish-parishes-fill')) {
            map.removeLayer('irish-parishes-fill');
          }
          if (map.getLayer('irish-parishes-border')) {
            map.removeLayer('irish-parishes-border');
          }
          if (map.getSource('irish-parishes')) {
            map.removeSource('irish-parishes');
          }
        } catch (error) {
          console.warn('⚠️ Error removing parishes layers:', error);
        }
      },

      /**
       * Show/Hide methods for overlays
       */
      showIrishCounties() {
        if (!map || !this.countiesLayerLoaded) return;
        
        const style = window.SettingsManager.getSetting('irishCountiesStyle');
        
        try {
          if (style === 'filled' || style === 'both') {
            map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          }
          
          if (style === 'borders' || style === 'both') {
            map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          }
          
          console.log('✅ Counties visibility updated:', style);
        } catch (error) {
          console.error('❌ Error showing counties:', error);
        }
      },

      hideIrishCounties() {
        if (!map || !this.countiesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          console.log('✅ Counties hidden');
        } catch (error) {
          console.error('❌ Error hiding counties:', error);
        }
      },

      showIrishDioceses() {
        if (!map || !this.diocesesLayerLoaded) return;
        
        const style = window.SettingsManager.getSetting('irishDiocesesStyle');
        
        try {
          if (style === 'filled' || style === 'both') {
            map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          }
          
          if (style === 'borders' || style === 'both') {
            map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          }
          
          console.log('✅ Dioceses visibility updated:', style);
        } catch (error) {
          console.error('❌ Error showing dioceses:', error);
        }
      },

      hideIrishDioceses() {
        if (!map || !this.diocesesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          console.log('✅ Dioceses hidden');
        } catch (error) {
          console.error('❌ Error hiding dioceses:', error);
        }
      },

      showIrishParishes() {
        if (!map || !this.parishesLayerLoaded) return;
        
        const style = window.SettingsManager.getSetting('irishParishesStyle');
        
        try {
          if (style === 'filled' || style === 'both') {
            map.setLayoutProperty('irish-parishes-fill', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-parishes-fill', 'visibility', 'none');
          }
          
          if (style === 'borders' || style === 'both') {
            map.setLayoutProperty('irish-parishes-border', 'visibility', 'visible');
          } else {
            map.setLayoutProperty('irish-parishes-border', 'visibility', 'none');
          }
          
          // Also show city parish point markers if they exist
          if (map.getLayer('deacons-markers')) {
            map.setLayoutProperty('deacons-markers', 'visibility', 'visible');
          }
          
          console.log('✅ Parishes visibility updated:', style);
        } catch (error) {
          console.error('❌ Error showing parishes:', error);
        }
      },

      hideIrishParishes() {
        if (!map || !this.parishesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-parishes-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-parishes-border', 'visibility', 'none');
          
          // Also hide city parish point markers if they exist
          if (map.getLayer('deacons-markers')) {
            map.setLayoutProperty('deacons-markers', 'visibility', 'none');
          }
          
          console.log('✅ Parishes hidden');
        } catch (error) {
          console.error('❌ Error hiding parishes:', error);
        }
      },

      /**
       * Load and display Diocesan Offices
       */
      async loadDiocesanOffices() {
        console.log('⛪ Loading Diocesan offices...');
        
        if (!map || !map.isStyleLoaded()) {
          console.warn('⚠️ Map not ready for diocesan offices');
          return;
        }

        if (this.diocesanOfficesLoaded) {
          this.showDiocesanOffices();
          return;
        }

        try {
          const url = window.SettingsManager.getSetting('diocesanOfficesSource');
          console.log(`📂 Fetching diocesan offices from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const officesData = await response.json();
          console.log('✅ Diocesan offices data loaded:', officesData.features?.length, 'offices');
          
          if (!officesData.type || officesData.type !== 'FeatureCollection' || !officesData.features) {
            throw new Error('Invalid GeoJSON structure for diocesan offices');
          }
          
          // Remove existing layers if any
          if (map.getLayer('diocesan-offices-markers')) {
            map.removeLayer('diocesan-offices-markers');
          }
          if (map.getSource('diocesan-offices')) {
            map.removeSource('diocesan-offices');
          }
          
          // Add source
          map.addSource('diocesan-offices', {
            type: 'geojson',
            data: officesData
          });
          
          // Add marker layer with church icon styling
          // Add it without beforeId first to ensure it's on top of polygon layers
          map.addLayer({
            id: 'diocesan-offices-markers',
            type: 'circle',
            source: 'diocesan-offices',
            paint: {
              'circle-radius': 10,
              'circle-color': '#dc2626',
              'circle-opacity': 0.9,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });
          
          // Ensure markers are on top of all polygon layers
          // Try to move after the last polygon layer or to the very top
          try {
            // Find the topmost non-symbol layer to place markers above polygons
            const layers = map.getStyle().layers;
            const symbolLayers = layers.filter(layer => layer.type === 'symbol');
            
            if (symbolLayers.length > 0) {
              // Move just before the first symbol layer (labels)
              map.moveLayer('diocesan-offices-markers', symbolLayers[0].id);
              console.log('📍 Diocesan offices markers moved above polygons, below labels');
            } else {
              console.log('📍 Diocesan offices markers added on top (no symbol layers found)');
            }
          } catch (e) {
            console.log('📍 Diocesan offices markers added (move not needed)');
          }
          
          this.setupOfficesHover();
          this.diocesanOfficesLoaded = true;
          
          console.log('✅ Diocesan offices loaded successfully');
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast('Diocesan offices loaded', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to load diocesan offices:', error);
          
          if (window.SettingsManager && window.SettingsManager.showToast) {
            window.SettingsManager.showToast(`Offices failed: ${error.message}`, 'error');
          }
          
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            window.SettingsManager.setSetting('showDiocesanOffices', false);
          }
        }
      },

      /**
       * Setup click popup for diocesan offices
       */
      setupOfficesHover() {
        if (!map || !map.getLayer('diocesan-offices-markers')) return;
        
        // Change cursor on hover
        map.on('mouseenter', 'diocesan-offices-markers', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'diocesan-offices-markers', () => {
          map.getCanvas().style.cursor = '';
        });
        
        // Show popup on click
        map.on('click', 'diocesan-offices-markers', (e) => {
          if (e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          const churchIcon = window.LucideUtils ? window.LucideUtils.icon('church', { size: 16 }) : '⛪';
          
          const popupContent = `
            <div style="
              font-family: 'Outfit', sans-serif;
              background: rgba(255, 255, 255, 0.98);
              backdrop-filter: blur(12px);
              border-radius: 8px;
              padding: 12px 16px;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
              border: 1px solid rgba(220, 38, 38, 0.2);
              min-width: 220px;
            ">
              <div style="
                font-weight: 600; 
                color: #dc2626; 
                font-size: 14px; 
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
              ">${churchIcon} ${props.name}</div>
              <div style="
                color: #6b7280; 
                font-size: 11px; 
                margin-bottom: 4px;
              ">${props.address || ''}</div>
              <div style="
                color: #4b5563; 
                font-size: 12px; 
                font-weight: 500;
                margin-top: 6px;
              ">${props.bishop || ''}</div>
              ${props.note ? `<a href="${props.note}" target="_blank" rel="noopener noreferrer" style="
                display: inline-block;
                color: #3b82f6; 
                font-size: 11px; 
                margin-top: 8px;
                text-decoration: none;
                padding: 4px 8px;
                border: 1px solid #3b82f6;
                border-radius: 4px;
                transition: all 0.2s ease;
              " onmouseover="this.style.background='#3b82f6'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='#3b82f6';">➔ Visit Website</a>` : ''}
            </div>
          `;
          
          new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            className: 'overlay-popup office-popup',
            anchor: 'bottom',
            offset: [0, -15]
          })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(popupContent)
            .addTo(map);
            
          if (window.LucideUtils) {
            setTimeout(() => window.LucideUtils.init(), 10);
          }
        });
      },

      showDiocesanOffices() {
        if (!map || !this.diocesanOfficesLoaded) return;
        
        try {
          map.setLayoutProperty('diocesan-offices-markers', 'visibility', 'visible');
          console.log('✅ Diocesan offices visible');
        } catch (error) {
          console.error('❌ Error showing diocesan offices:', error);
        }
      },

      hideDiocesanOffices() {
        if (!map || !this.diocesanOfficesLoaded) return;
        
        try {
          map.setLayoutProperty('diocesan-offices-markers', 'visibility', 'none');
          console.log('✅ Diocesan offices hidden');
        } catch (error) {
          console.error('❌ Error hiding diocesan offices:', error);
        }
      },

      /**
       * Update overlay styles
       */
      updateCountiesStyle(style) {
        if (!map || !this.countiesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-counties-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-counties-border', 'visibility', 'none');
          
          switch (style) {
            case 'filled':
              map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
              break;
            case 'borders':
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
              break;
            case 'both':
              map.setLayoutProperty('irish-counties-fill', 'visibility', 'visible');
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
              break;
            default:
              console.warn('⚠️ Unknown counties style:', style);
              map.setLayoutProperty('irish-counties-border', 'visibility', 'visible');
          }
          
          console.log('✅ Counties style updated:', style);
        } catch (error) {
          console.error('❌ Error updating counties style:', error);
        }
      },

      updateDiocesesStyle(style) {
        if (!map || !this.diocesesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-dioceses-border', 'visibility', 'none');
          
          switch (style) {
            case 'filled':
              map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
              break;
            case 'borders':
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
              break;
            case 'both':
              map.setLayoutProperty('irish-dioceses-fill', 'visibility', 'visible');
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
              break;
            default:
              console.warn('⚠️ Unknown dioceses style:', style);
              map.setLayoutProperty('irish-dioceses-border', 'visibility', 'visible');
          }
          
          console.log('✅ Dioceses style updated:', style);
        } catch (error) {
          console.error('❌ Error updating dioceses style:', error);
        }
      },

      /**
       * Update overlay opacity
       */
      updateCountiesOpacity(opacity) {
        if (!map || !this.countiesLayerLoaded) return;
        
        const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.3));
        
        try {
          map.setPaintProperty('irish-counties-fill', 'fill-opacity', validOpacity);
          console.log('✅ Counties opacity updated:', validOpacity);
        } catch (error) {
          console.error('❌ Error updating counties opacity:', error);
        }
      },

      updateDiocesesOpacity(opacity) {
        if (!map || !this.diocesesLayerLoaded) return;
        
        const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.3));
        
        try {
          map.setPaintProperty('irish-dioceses-fill', 'fill-opacity', validOpacity);
          console.log('✅ Dioceses opacity updated:', validOpacity);
        } catch (error) {
          console.error('❌ Error updating dioceses opacity:', error);
        }
      },

      updateParishesStyle(style) {
        if (!map || !this.parishesLayerLoaded) return;
        
        try {
          map.setLayoutProperty('irish-parishes-fill', 'visibility', 'none');
          map.setLayoutProperty('irish-parishes-border', 'visibility', 'none');
          
          switch (style) {
            case 'filled':
              map.setLayoutProperty('irish-parishes-fill', 'visibility', 'visible');
              break;
            case 'borders':
              map.setLayoutProperty('irish-parishes-border', 'visibility', 'visible');
              break;
            case 'both':
              map.setLayoutProperty('irish-parishes-fill', 'visibility', 'visible');
              map.setLayoutProperty('irish-parishes-border', 'visibility', 'visible');
              break;
            default:
              console.warn('⚠️ Unknown parishes style:', style);
              map.setLayoutProperty('irish-parishes-border', 'visibility', 'visible');
          }
          
          console.log('✅ Parishes style updated:', style);
        } catch (error) {
          console.error('❌ Error updating parishes style:', error);
        }
      },

      updateParishesOpacity(opacity) {
        if (!map || !this.parishesLayerLoaded) return;
        
        const validOpacity = Math.max(0, Math.min(1, parseFloat(opacity) || 0.3));
        
        try {
          map.setPaintProperty('irish-parishes-fill', 'fill-opacity', validOpacity);
          console.log('✅ Parishes opacity updated:', validOpacity);
        } catch (error) {
          console.error('❌ Error updating parishes opacity:', error);
        }
      },

      /**
       * Enhanced three-state toggle for Irish counties
       */
      toggleIrishCounties() {
        const currentlyEnabled = window.SettingsManager.getSetting('showIrishCounties');
        const currentStyle = window.SettingsManager.getSetting('irishCountiesStyle');
        
        if (!currentlyEnabled) {
          window.SettingsManager.setSetting('showIrishCounties', true);
          window.SettingsManager.setSetting('irishCountiesStyle', 'borders');
          console.log('🏛️ Irish counties: BORDERS enabled');
          if (window.SettingsManager.showToast) {
            const landmarkIcon = window.LucideUtils ? window.LucideUtils.icon('landmark', { size: 14 }) : '🏛️';
            window.SettingsManager.showToast(`${landmarkIcon} Counties: Borders only`, 'info');
          }
        } else if (currentStyle === 'borders') {
          window.SettingsManager.setSetting('irishCountiesStyle', 'filled');
          console.log('🏛️ Irish counties: FILLED enabled');
          if (window.SettingsManager.showToast) {
            const landmarkIcon = window.LucideUtils ? window.LucideUtils.icon('landmark', { size: 14 }) : '🏛️';
            window.SettingsManager.showToast(`${landmarkIcon} Counties: Filled areas`, 'info');
          }
        } else {
          window.SettingsManager.setSetting('showIrishCounties', false);
          console.log('🏛️ Irish counties: DISABLED');
          if (window.SettingsManager.showToast) {
            const eyeOffIcon = window.LucideUtils ? window.LucideUtils.icon('eye-off', { size: 14 }) : '🚫';
            window.SettingsManager.showToast(`${eyeOffIcon} Counties: Off`, 'info');
          }
        }
      },

      /**
       * Enhanced three-state toggle for Irish dioceses
       */
      toggleIrishDioceses() {
        const currentlyEnabled = window.SettingsManager.getSetting('showIrishDioceses');
        const currentStyle = window.SettingsManager.getSetting('irishDiocesesStyle');
        
        if (!currentlyEnabled) {
          window.SettingsManager.setSetting('showIrishDioceses', true);
          window.SettingsManager.setSetting('irishDiocesesStyle', 'borders');
          console.log('⛪ Irish dioceses: BORDERS enabled');
          if (window.SettingsManager.showToast) {
            const churchIcon = window.LucideUtils ? window.LucideUtils.icon('church', { size: 14 }) : '⛪';
            window.SettingsManager.showToast(`${churchIcon} Dioceses: Borders only`, 'info');
          }
        } else if (currentStyle === 'borders') {
          window.SettingsManager.setSetting('irishDiocesesStyle', 'filled');
          console.log('⛪ Irish dioceses: FILLED enabled');
          if (window.SettingsManager.showToast) {
            const churchIcon = window.LucideUtils ? window.LucideUtils.icon('church', { size: 14 }) : '⛪';
            window.SettingsManager.showToast(`${churchIcon} Dioceses: Filled areas`, 'info');
          }
        } else {
          window.SettingsManager.setSetting('showIrishDioceses', false);
          console.log('⛪ Irish dioceses: DISABLED');
          if (window.SettingsManager.showToast) {
            const eyeOffIcon = window.LucideUtils ? window.LucideUtils.icon('eye-off', { size: 14 }) : '🚫';
            window.SettingsManager.showToast(`${eyeOffIcon} Dioceses: Off`, 'info');
          }
        }
      },

      /**
       * Enhanced three-state toggle for Irish parishes
       */
      toggleIrishParishes() {
        const currentlyEnabled = window.SettingsManager.getSetting('showIrishParishes');
        const currentStyle = window.SettingsManager.getSetting('irishParishesStyle');
        
        if (!currentlyEnabled) {
          window.SettingsManager.setSetting('showIrishParishes', true);
          window.SettingsManager.setSetting('irishParishesStyle', 'borders');
          console.log('📍 Irish parishes: BORDERS enabled');
          if (window.SettingsManager.showToast) {
            const pinIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 14 }) : '📍';
            window.SettingsManager.showToast(`${pinIcon} Parishes: Borders only`, 'info');
          }
        } else if (currentStyle === 'borders') {
          window.SettingsManager.setSetting('irishParishesStyle', 'filled');
          console.log('📍 Irish parishes: FILLED enabled');
          if (window.SettingsManager.showToast) {
            const pinIcon = window.LucideUtils ? window.LucideUtils.icon('map-pin', { size: 14 }) : '📍';
            window.SettingsManager.showToast(`${pinIcon} Parishes: Filled areas`, 'info');
          }
        } else {
          window.SettingsManager.setSetting('showIrishParishes', false);
          console.log('📍 Irish parishes: DISABLED');
          if (window.SettingsManager.showToast) {
            const eyeOffIcon = window.LucideUtils ? window.LucideUtils.icon('eye-off', { size: 14 }) : '🚫';
            window.SettingsManager.showToast(`${eyeOffIcon} Parishes: Off`, 'info');
          }
        }
      }
    };

    // Export SettingsOverlays to window
    window.SettingsOverlays = SettingsOverlays;

    // Dispatch event to indicate SettingsOverlays is ready
    window.dispatchEvent(new CustomEvent('mapalister:settingsOverlaysReady'));

    console.log('✅ SettingsOverlays loaded and exported to window');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSettingsOverlays();
  }

})();