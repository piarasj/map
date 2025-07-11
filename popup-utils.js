/**
 * =====================================================
 * FILE: utils/popup-utils.js (CLEAN WITH DEBUG)
 * PURPOSE: Shared popup creation and management utilities with working notes
 * DEPENDENCIES: DataConfig, DistanceUtils, LucideUtils
 * EXPORTS: PopupUtils
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎯 Loading popup-utils.js (clean with debug)...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof LucideUtils === 'undefined') missing.push('LucideUtils');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ PopupUtils missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initPopupUtils();
      }
    };
    
    window.addEventListener('mapalister:coreReady', retryInit);
    window.addEventListener('mapalister:configReady', retryInit);
    window.addEventListener('mapalister:lucideUtilsReady', retryInit);
    return;
  }

  function initPopupUtils() {
    /**
     * POPUP UTILITIES - WITH DEBUG LOGGING
     */
    const PopupUtils = {
      // Core popup tracking
      activePopup: null,
      popupRegistry: new Set(),
      hoverPopup: null,
      currentHoverLayer: null,
      hoverTimeout: null,

      // Feature-to-popup mapping system
      popupFeatureMap: new Map(),
      popupIdToFeature: new Map(),

      /**
       * Create a new popup instance and register it
       */
      createPopup(options = {}) {
        const defaultOptions = {
          closeButton: false,
          closeOnClick: false,
          className: 'enhanced-popup'
        };

        const popup = new mapboxgl.Popup({...defaultOptions, ...options});
        this.registerPopup(popup);
        return popup;
      },

      /**
       * Register a popup for tracking
       */
      registerPopup(popup) {
        this.popupRegistry.add(popup);
        
        popup.on('close', () => {
          this.popupRegistry.delete(popup);
          this.popupFeatureMap.delete(popup);
          
          if (this.activePopup === popup) {
            this.activePopup = null;
          }
          if (this.hoverPopup === popup) {
            this.hoverPopup = null;
          }
        });
      },

      /**
       * Close all active popups
       */
      closeAllPopups() {
        console.log('🗑️ POPUP-UTILS: Closing all popups...');
        
        try {
          this.popupRegistry.forEach(popup => {
            if (popup.isOpen()) {
              popup.remove();
            }
          });
          
          // Clear all mapping data
          this.popupRegistry.clear();
          this.popupFeatureMap.clear();
          this.popupIdToFeature.clear();
          this.activePopup = null;
          this.hoverPopup = null;
          
          document.querySelectorAll('.mapboxgl-popup').forEach(el => {
            try {
              el.remove();
            } catch (e) {
              console.warn('⚠️ Could not remove popup element:', e);
            }
          });
          
          console.log('✅ POPUP-UTILS: All popups closed and mappings cleared');
        } catch (error) {
          console.error('❌ POPUP-UTILS: Error closing popups:', error);
        }
      },

      /**
       * Setup both click and hover events for map markers
       */
      setupMapInteractions(map, layerId) {
        if (!map || !map.getLayer || !map.getLayer(layerId)) {
          console.warn(`⚠️ POPUP-UTILS: Cannot setup interactions - layer '${layerId}' not found`);
          return false;
        }
        
        console.log(`🎯 POPUP-UTILS: Setting up interactions for layer: ${layerId}`);
        
        // Remove existing event listeners to prevent duplicates
        map.off('click', layerId);
        map.off('mouseenter', layerId);
        map.off('mouseleave', layerId);
        
        // CLICK EVENT - Show enhanced popup
        map.on('click', layerId, (e) => {
          console.log(`🖱️ POPUP-UTILS: Marker clicked on layer: ${layerId}`, e.features[0]);
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = feature.geometry.coordinates.slice();
            
            // Handle coordinate wrapping
            if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }
            
            // Show enhanced popup with notes support
            this.showEnhancedPopup(map, feature, coordinates);
          }
        });
        
        // HOVER EVENTS - NO POPUPS, just cursor
        map.on('mouseenter', layerId, (e) => {
          console.log(`🖱️ POPUP-UTILS: Mouse enter on layer: ${layerId} (cursor only)`);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', layerId, () => {
          console.log(`🖱️ POPUP-UTILS: Mouse leave on layer: ${layerId} (cursor reset)`);
          map.getCanvas().style.cursor = '';
        });
        
        console.log(`✅ POPUP-UTILS: Click and hover interactions setup complete for layer: ${layerId}`);
        return true;
      },

      /**
       * Enhanced auto-setup that only handles contact/deacon layers
       */
      autoSetupMapInteractions(map = null) {
        const targetMap = map || window.map;
        if (!targetMap) {
          console.warn('⚠️ POPUP-UTILS: No map available for interaction setup');
          return false;
        }
        
        console.log('🔄 POPUP-UTILS: autoSetupMapInteractions called');
        
        try {
          console.log('🔄 POPUP-UTILS: Available layers:', targetMap.getStyle().layers.map(l => l.id));
        } catch (e) {
          console.warn('⚠️ POPUP-UTILS: Could not get layer list:', e);
        }
        
        console.log('🔄 POPUP-UTILS: Auto-setting up interactions for contact/deacon layers only...');
        
        setTimeout(() => {
          // Only handle contact/deacon layers
          const contactLayerPatterns = [
            'deacons-markers', 'deacons', 'deacon-markers', 'deacon',
            'priests-markers', 'priests', 'priest-markers', 'priest',
            'clergy-markers', 'clergy',
            'contacts', 'markers', 'points', 'data-points', 'geojson-points',
            'uploaded-data', 'user-data', 'contact-markers', 'geojson-data'
          ];
          
          console.log('🔍 POPUP-UTILS: Checking for contact layers:', contactLayerPatterns);
          
          let setupSuccess = false;
          
          for (const layerId of contactLayerPatterns) {
            try {
              if (targetMap.getLayer && targetMap.getLayer(layerId)) {
                console.log(`🎯 POPUP-UTILS: Found layer: ${layerId}`);
                
                // Only setup if it's NOT a diocese/county layer
                if (!layerId.toLowerCase().includes('irish-') && 
                    !layerId.toLowerCase().includes('diocese') && 
                    !layerId.toLowerCase().includes('county')) {
                  console.log(`🎯 POPUP-UTILS: Layer ${layerId} is contact/deacon - setting up enhanced interactions`);
                  const success = this.setupMapInteractions(targetMap, layerId);
                  if (success) {
                    setupSuccess = true;
                    break;
                  }
                } else {
                  console.log(`🗺️ POPUP-UTILS: Layer ${layerId} is background - skipping`);
                }
              }
            } catch (error) {
              console.warn(`⚠️ POPUP-UTILS: Error checking layer ${layerId}:`, error);
            }
          }
          
          if (!setupSuccess) {
            console.log('🔍 POPUP-UTILS: No contact layers found in predefined list, scanning all layers...');
            try {
              const style = targetMap.getStyle();
              const layers = style.layers || [];
              
              const contactLayers = layers.filter(layer => {
                const id = layer.id.toLowerCase();
                const type = layer.type;
                
                const isMarkerType = type === 'circle' || type === 'symbol';
                const isContactName = id.includes('marker') ||
                                    id.includes('point') ||
                                    id.includes('contact') ||
                                    id.includes('geojson') ||
                                    id.includes('deacon') ||
                                    id.includes('priest') ||
                                    id.includes('clergy');
                
                const isNotBackgroundLayer = !id.includes('irish-') &&
                                            !id.includes('diocese') &&
                                            !id.includes('county') &&
                                            !id.includes('boundary');
                
                return (isMarkerType || isContactName) && isNotBackgroundLayer;
              });
              
              console.log('🔍 POPUP-UTILS: Found potential contact layers:', contactLayers.map(l => l.id));
              
              if (contactLayers.length > 0) {
                const layerId = contactLayers[0].id;
                console.log(`🎯 POPUP-UTILS: Using contact layer: ${layerId}`);
                setupSuccess = this.setupMapInteractions(targetMap, layerId);
              }
            } catch (error) {
              console.error('❌ POPUP-UTILS: Error scanning for layers:', error);
            }
          }
          
          console.log(setupSuccess ? '✅ POPUP-UTILS: Setup successful' : '⚠️ POPUP-UTILS: Setup failed - no contact layers found');
          return setupSuccess;
        }, 300);
      },

      /**
       * Create enhanced popup content with notes support
       */
      createEnhancedPopupContent(feature, options = {}) {
        const config = DataConfig.getCurrentConfig();
        const properties = feature.properties;
        const coordinates = feature.geometry.coordinates;
        const [lng, lat] = coordinates;
        
        // Extract contact data
        const contactData = this.extractContactData(properties);
        
        // Generate unique popup ID
        const popupId = `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store feature reference for notes functionality
        this.popupIdToFeature.set(popupId, feature);
        console.log(`📝 POPUP-UTILS: Storing feature for popup ${popupId}:`, contactData.name);
        
        let content = `
          <div class="enhanced-popup-content" id="${popupId}" style="
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-width: 280px;
            max-width: 320px;
            position: relative;
          ">
            <button onclick="window.PopupUtils.closeAllPopups()" style="
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
               onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280'"
               title="Close popup">
              ${LucideUtils ? LucideUtils.icon('x', { size: 14 }) : '×'}
            </button>
            
            <div class="popup-header" style="margin-bottom: 15px; padding-right: 32px;">
              <div class="contact-name" style="
                font-weight: 600;
                font-size: 16px;
                color: #111827;
                margin-bottom: 4px;
                line-height: 1.3;
              ">${contactData.name}</div>`;
        
        if (contactData.groupValue) {
          const color = this.getDatasetColor(contactData.groupValue);
          content += `
              <div class="contact-grouping" style="
                font-size: 12px;
                color: ${color};
                font-weight: 500;
              ">${config.groupingDisplayName || 'Group'}: ${contactData.groupValue}</div>`;
        }
        
        content += `</div>`;
        content += this.buildContactActions(contactData);
        content += this.buildContactDetails(contactData, lat, lng);
        content += this.buildNotesSection(feature);
        
        // Add notes interface (only for non-hover popups)
        if (!options.isHover) {
          content += `
            <div class="notes-actions" style="
              margin-top: 15px;
              padding-top: 12px;
              border-top: 1px solid #f3f4f6;
            ">
              <button onclick="PopupUtils.showAddNoteInterface('${popupId}')" style="
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                width: 100%;
                justify-content: center;
              " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(59,130,246,0.3)'" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                ${LucideUtils ? LucideUtils.icon('edit-3', { size: 14 }) : '📝'} Add Note
              </button>
            </div>`;
        }
        
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
              ${LucideUtils ? LucideUtils.icon('map-pin', { size: 12 }) : '📍'} Right-click to set as reference
            </div>
          </div>`;
        
        return content;
      },

      /**
       * Extract contact data from properties
       */
      extractContactData(properties) {
        const config = DataConfig.getCurrentConfig();
        
        return {
          name: this.extractPropertyValue(properties, [
            'name', 'Name', 'title', 'Title'
          ], 'Contact'),
          
          groupValue: this.extractPropertyValue(properties, [
            config.groupingProperty,
            config.groupingProperty.charAt(0).toUpperCase() + config.groupingProperty.slice(1),
            'dataset', 'Dataset', 'group', 'Group'
          ], null),
          
          address: this.extractPropertyValue(properties, ['Address', 'address'], null),
          telephone: this.extractPropertyValue(properties, ['Telephone', 'telephone', 'phone'], null),
          mobile: this.extractPropertyValue(properties, ['Mobile', 'mobile', 'cell'], null),
          email: this.extractPropertyValue(properties, ['Email', 'email'], null),
          parish: this.extractPropertyValue(properties, ['Parish', 'parish'], null),
          startYear: this.extractPropertyValue(properties, ['StartYear', 'start_year', 'startYear'], null),
          dob: this.extractPropertyValue(properties, ['DOB', 'dob', 'dateOfBirth'], null),
          note: this.extractPropertyValue(properties, ['Note', 'note', 'notes'], null)
        };
      },

      /**
       * Build contact actions section
       */
      buildContactActions(contactData) {
        const { telephone, mobile, email } = contactData;
        const hasContactMethods = telephone || mobile || email;
        
        if (!hasContactMethods) return '';
        
        let content = `<div class="contact-actions" style="display: flex; gap: 8px; margin: 15px 0; flex-wrap: wrap;">`;
        
        if (telephone) {
          content += this.createActionButton(
            `${LucideUtils ? LucideUtils.icon('phone', { size: 14 }) : '📞'} Call`, 
            `tel:${telephone}`
          );
        }
        
        if (mobile) {
          content += this.createActionButton(
            `${LucideUtils ? LucideUtils.icon('smartphone', { size: 14 }) : '📱'} Mobile`, 
            `tel:${mobile}`
          );
        }
        
        if (email) {
          content += this.createActionButton(
            `${LucideUtils ? LucideUtils.icon('mail', { size: 14 }) : '✉️'} Email`, 
            `mailto:${email}`
          );
        }
        
        content += `</div>`;
        return content;
      },

      /**
       * Create action button HTML
       */
      createActionButton(text, href) {
        return `
          <a href="${href}" class="action-btn" style="
            display: flex; align-items: center; gap: 6px; padding: 8px 10px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
            text-decoration: none; color: #374151; font-size: 12px;
            transition: all 0.2s ease; cursor: pointer;
          " onmouseover="this.style.background='#e2e8f0'; this.style.transform='translateY(-1px)'" 
             onmouseout="this.style.background='#f8fafc'; this.style.transform='translateY(0)'">
            ${text}
          </a>`;
      },

      /**
       * Build contact details section
       */
      buildContactDetails(contactData, lat, lng) {
        const { address, parish, startYear, dob, note } = contactData;
        const hasDetails = address || parish || startYear || dob;
        
        if (!hasDetails && !note) return '';
        
        let content = `
          <div class="contact-details" style="
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 12px;
          ">`;
        
        if (address) {
          content += this.createDetailRow(
            LucideUtils ? LucideUtils.icon('map-pin', { size: 14 }) : '📍', 
            address, 
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
          );
        }
        
        if (parish) {
          content += this.createDetailRow(
            LucideUtils ? LucideUtils.icon('building', { size: 14 }) : '🏢', 
            parish
          );
        }
        
        if (startYear) {
          const currentYear = new Date().getFullYear();
          const yearsService = currentYear - parseInt(startYear);
          content += this.createDetailRow(
            LucideUtils ? LucideUtils.icon('calendar', { size: 14 }) : '📅', 
            `Started ${startYear} (${yearsService} years service)`
          );
        }
        
        if (dob) {
          const dobText = this.formatDateOfBirth(dob);
          content += this.createDetailRow(
            LucideUtils ? LucideUtils.icon('cake', { size: 14 }) : '🎂', 
            dobText
          );
        }
        
        content += `</div>`;
        
        if (note && note.trim()) {
          content += `
            <div class="contact-notes" style="
              border-top: 1px solid #f3f4f6;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            ">
              ${this.createDetailRow(LucideUtils ? LucideUtils.icon('file-text', { size: 14 }) : '📝', note)}
            </div>`;
        }
        
        if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
          const distance = window.ReferenceMarker.getFormattedDistanceTo(lat, lng);
          if (distance) {
            content += this.createDetailRow(
              LucideUtils ? LucideUtils.icon('ruler', { size: 14 }) : '📏', 
              `${distance} from reference`
            );
          }
        }
        
        return content;
      },

      /**
       * Create detail row HTML
       */
      createDetailRow(icon, text, link = null) {
        const truncatedText = text.length > 40 ? text.substring(0, 37) + '...' : text;
        const displayText = link ? 
          `<a href="${link}" target="_blank" title="${text}" style="color: #6b7280; text-decoration: none; line-height: 1.3;" 
             onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#6b7280'">${truncatedText}</a>` :
          `<span>${text}</span>`;
        
        return `
          <div class="detail-row" style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #6b7280;
          ">
            <span style="margin-top: 1px; flex-shrink: 0;">${icon}</span>
            ${displayText}
          </div>`;
      },

      /**
       * Format date of birth with age calculation
       */
      formatDateOfBirth(dob) {
        try {
          const dobDate = new Date(dob);
          if (!isNaN(dobDate.getTime())) {
            const day = dobDate.getDate().toString().padStart(2, '0');
            const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
            const year = dobDate.getFullYear();
            const formattedDob = `${day}/${month}/${year}`;
            
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
              age--;
            }
            
            return `Born ${formattedDob} (Age ${age})`;
          }
        } catch (e) {
          console.warn('Date parsing failed for:', dob);
        }
        
        return `Born ${dob}`;
      },

      /**
       * Build notes section for popup
       */
      buildNotesSection(feature) {
        if (!feature || !feature.properties) {
          console.warn('⚠️ buildNotesSection: Invalid feature structure');
          return '';
        }
        
        let userNotes = feature.properties.userNotes || [];
        
        if (!Array.isArray(userNotes)) {
          console.warn('⚠️ userNotes is not an array, converting:', userNotes);
          userNotes = [];
        }
        
        if (userNotes.length === 0) {
          return '';
        }
        
        let notesHtml = `
          <div class="user-notes-section" style="
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 12px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 8px;
              font-weight: 600;
              color: #374151;
              font-size: 13px;
            ">
              ${LucideUtils ? LucideUtils.icon('sticky-note', { size: 14 }) : '📝'}
              Your Notes (${userNotes.length})
            </div>`;
        
        const notesToShow = userNotes.slice(-3);
        notesToShow.forEach((note, index) => {
          if (!note || !note.timestamp || !note.text) {
            console.warn('⚠️ Invalid note structure:', note);
            return;
          }
          const timeAgo = this.getTimeAgo(note.timestamp);
          
          notesHtml += `
            <div class="user-note-item" style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 10px;
              margin-bottom: 6px;
              font-size: 12px;
            ">
              <div style="color: #374151; line-height: 1.4; margin-bottom: 4px;">
                ${this.escapeHtml(note.text)}
              </div>
              <div style="color: #6b7280; font-size: 10px;">
                ${timeAgo}
              </div>
            </div>`;
        });
        
        if (userNotes.length > 3) {
          notesHtml += `
            <div style="font-size: 10px; color: #9ca3af; text-align: center; margin-top: 4px;">
              Showing 3 of ${userNotes.length} notes
            </div>`;
        }
        
        notesHtml += `</div>`;
        return notesHtml;
      },

      /**
       * Show enhanced popup that stays open for interaction
       */
      showEnhancedPopup(map, feature, coordinates) {
        console.log('🎯 POPUP-UTILS: Showing enhanced popup for:', feature.properties.name || 'unnamed');
        
        // Close any existing hover popup
        if (this.hoverPopup && this.hoverPopup.isOpen()) {
          this.hoverPopup.remove();
        }

        // Close any existing popups
        this.closeAllPopups();

        // Create a persistent popup
        const popup = this.createPopup({
          closeButton: true,
          closeOnClick: false,
          className: 'enhanced-popup interaction-popup'
        });

        const content = this.createEnhancedPopupContent(feature);
        
        popup.setLngLat(coordinates)
          .setHTML(content)
          .addTo(map);

        // Store feature reference in multiple ways for reliability
        popup._feature = feature;
        this.activePopup = popup;
        this.popupFeatureMap.set(popup, feature);
        
        console.log('✅ POPUP-UTILS: Enhanced popup shown with proper feature association');

        // Initialize Lucide icons
        if (window.LucideUtils) {
          setTimeout(() => LucideUtils.init(), 10);
        }

        return popup;
      },

      /**
       * Show add note interface
       */
      showAddNoteInterface(popupId) {
        console.log('📝 Showing add note interface for popup:', popupId);
        
        const popup = document.getElementById(popupId);
        if (!popup) {
          console.error('❌ Popup not found:', popupId);
          return;
        }
        
        const notesActions = popup.querySelector('.notes-actions');
        if (!notesActions) {
          console.error('❌ Notes actions container not found');
          return;
        }
        
        const noteInterface = document.createElement('div');
        noteInterface.className = 'note-input-interface';
        noteInterface.style.cssText = `
          margin-top: 8px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        `;
        
        noteInterface.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 12px;">
            Add Note:
          </div>
          <textarea id="note-text-input" placeholder="Enter your note here..." style="
            width: 100%;
            min-height: 60px;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 12px;
            font-family: inherit;
            resize: vertical;
            outline: none;
            margin-bottom: 8px;
          "></textarea>
          <div style="display: flex; gap: 6px;">
            <button onclick="PopupUtils.saveNote('${popupId}')" style="
              flex: 1;
              background: #10b981;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              cursor: pointer;
            ">Save</button>
            <button onclick="PopupUtils.cancelNote('${popupId}')" style="
              flex: 1;
              background: #6b7280;
              color: white;
              border: none;
              padding: 6px 12px;