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
      countiesPopup: null,
      diocesesPopup: null,

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
        
        console.log(`📋 Overlay settings: Counties=${countiesEnabled}, Dioceses=${diocesesEnabled}`);
        
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
        
        const overlaysToLoad = (countiesEnabled ? 1 : 0) + (diocesesEnabled ? 1 : 0);
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
          anchor: 'top',
          offset: [0, 10]
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
          anchor: 'bottom',
          offset: [0, -10]
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