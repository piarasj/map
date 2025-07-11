/**
 * =====================================================
 * COMPLETE ICON TAGGING SYSTEM FOR MAPALISTER
 * =====================================================
 * This system adds icon-based tagging functionality to your existing application
 * Features:
 * - Icon selection in popups
 * - Visual icon overlays on map markers
 * - Sidebar filtering by icons
 * - Instant save to feature properties
 */

// 1. ENHANCED POPUP UTILS WITH COMPLETE ICON TAGGING
// Update your existing popup-utils.js with these additions:

// Add this to your PopupUtils object in popup-utils.js:
const IconTaggingEnhancements = {
  
  // Define available icons with their meanings
  availableIcons: [
    { key: 'star', icon: '⭐', label: 'Important/Starred', color: '#fbbf24' },
    { key: 'urgent', icon: '🚨', label: 'Urgent Action', color: '#ef4444' },
    { key: 'call', icon: '📞', label: 'Need to Call', color: '#3b82f6' },
    { key: 'email', icon: '📧', label: 'Send Email', color: '#8b5cf6' },
    { key: 'meeting', icon: '📅', label: 'Schedule Meeting', color: '#10b981' },
    { key: 'follow-up', icon: '🔄', label: 'Follow Up', color: '#f59e0b' },
    { key: 'completed', icon: '✅', label: 'Task Completed', color: '#22c55e' },
    { key: 'issue', icon: '⚠️', label: 'Has Issues', color: '#ef4444' }
  ],

  /**
   * Build enhanced icon tagging section for popups
   */
  buildIconTaggingSection(feature) {
    if (!feature || !feature.properties) {
      return '';
    }
    
    // Get latest feature data with tags
    const latestFeature = this.getLatestFeatureData ? this.getLatestFeatureData(feature) : feature;
    const currentTags = latestFeature.properties.userTags || [];
    
    // Generate unique popup ID for this feature
    const popupId = this.getCurrentPopupId ? this.getCurrentPopupId(latestFeature) : `popup_${Date.now()}`;
    
    let tagsHtml = `
      <div class="icon-tagging-section" style="
        border-top: 1px solid #f3f4f6;
        padding-top: 12px;
        margin-top: 12px;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            color: #374151;
            font-size: 13px;
          ">
            🏷️ Quick Tags
          </div>
          <button onclick="IconTaggingSystem.clearAllTags('${popupId}')" style="
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 10px;
            color: #6b7280;
            cursor: pointer;
          " title="Clear all tags">Clear</button>
        </div>
        
        <div class="icon-grid" style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        ">`;
    
    // Generate icon buttons
    this.availableIcons.forEach(iconData => {
      const isSelected = currentTags.includes(iconData.key);
      
      tagsHtml += `
        <button 
          onclick="IconTaggingSystem.toggleIconTag('${popupId}', '${iconData.key}')"
          title="${iconData.label}"
          data-tag-key="${iconData.key}"
          style="
            background: ${isSelected ? iconData.color + '20' : '#f9fafb'};
            border: 2px solid ${isSelected ? iconData.color : '#e5e7eb'};
            border-radius: 8px;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            font-size: 16px;
            position: relative;
          "
          onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
        >
          ${iconData.icon}
          ${isSelected ? '<div style="position: absolute; top: -2px; right: -2px; background: ' + iconData.color + '; color: white; border-radius: 50%; width: 14px; height: 14px; font-size: 10px; display: flex; align-items: center; justify-content: center;">✓</div>' : ''}
        </button>`;
    });
    
    tagsHtml += `
        </div>`;
    
    // Show selected tags summary if any
    if (currentTags.length > 0) {
      tagsHtml += `
        <div style="
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 8px;
        ">
          <div style="font-size: 11px; color: #0369a1; font-weight: 500; margin-bottom: 4px;">
            Active Tags (${currentTags.length}):
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">`;
      
      currentTags.forEach(tagKey => {
        const iconData = this.availableIcons.find(i => i.key === tagKey);
        if (iconData) {
          tagsHtml += `
            <span style="
              background: ${iconData.color};
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 10px;
              display: flex;
              align-items: center;
              gap: 2px;
            ">
              ${iconData.icon} ${iconData.label}
            </span>`;
        }
      });
      
      tagsHtml += `
          </div>
        </div>`;
    }
    
    tagsHtml += `
        <div style="
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
          line-height: 1.3;
        ">
          Click icons to tag this contact • Use sidebar filters to find tagged contacts
        </div>
      </div>`;
    
    return tagsHtml;
  }
};

// 2. MAIN ICON TAGGING SYSTEM
const IconTaggingSystem = {
  
  // Reference to available icons (same as above)
  availableIcons: IconTaggingEnhancements.availableIcons,
  
  /**
   * Toggle icon tag for a contact
   */
  toggleIconTag(popupId, tagKey) {
    console.log(`🏷️ Toggling tag "${tagKey}" for popup: ${popupId}`);
    
    const feature = this.getFeatureFromPopup(popupId);
    if (!feature) {
      console.error('❌ Could not find feature for popup');
      return;
    }
    
    if (!feature.properties.userTags) {
      feature.properties.userTags = [];
    }
    
    const currentTags = feature.properties.userTags;
    const tagIndex = currentTags.indexOf(tagKey);
    
    if (tagIndex > -1) {
      currentTags.splice(tagIndex, 1);
      console.log(`➖ Removed tag: ${tagKey}`);
    } else {
      currentTags.push(tagKey);
      console.log(`➕ Added tag: ${tagKey}`);
    }
    
    // Update global data
    this.updateGlobalDataWithTags(feature);
    
    // Update visual indicators
    this.updateMapMarkerVisuals(feature);
    this.updateSidebarVisuals();
    this.refreshPopupTagSection(popupId, feature);
    
    console.log('✅ Tag updated successfully, current tags:', currentTags);
  },

  /**
   * Clear all tags for a contact
   */
  clearAllTags(popupId) {
    console.log(`🗑️ Clearing all tags for popup: ${popupId}`);
    
    const feature = this.getFeatureFromPopup(popupId);
    if (!feature) {
      console.error('❌ Could not find feature for popup');
      return;
    }
    
    feature.properties.userTags = [];
    
    // Update global data
    this.updateGlobalDataWithTags(feature);
    
    // Update visuals
    this.updateMapMarkerVisuals(feature);
    this.updateSidebarVisuals();
    this.refreshPopupTagSection(popupId, feature);
    
    console.log('✅ All tags cleared');
  },

  /**
   * Get feature from popup (integrates with existing PopupUtils)
   */
  getFeatureFromPopup(popupId) {
    if (window.PopupUtils && window.PopupUtils.getFeatureFromPopup) {
      return window.PopupUtils.getFeatureFromPopup(popupId);
    }
    
    // Fallback: look for active popup
    if (window.PopupUtils && window.PopupUtils.activePopup && window.PopupUtils.activePopup._feature) {
      return window.PopupUtils.activePopup._feature;
    }
    
    console.error('❌ Could not find feature - PopupUtils not available');
    return null;
  },

  /**
   * Update global data with tags
   */
  updateGlobalDataWithTags(feature) {
    if (window.geojsonData && window.geojsonData.features) {
      const globalFeature = window.geojsonData.features.find(f => {
        if (f.geometry && feature.geometry && 
            f.geometry.coordinates && feature.geometry.coordinates) {
          const [lng1, lat1] = f.geometry.coordinates;
          const [lng2, lat2] = feature.geometry.coordinates;
          return Math.abs(lng1 - lng2) < 0.0001 && Math.abs(lat1 - lat2) < 0.0001;
        }
        return false;
      });
      
      if (globalFeature) {
        globalFeature.properties.userTags = [...(feature.properties.userTags || [])];
        console.log('✅ Updated global feature with tags');
      }
    }
  },

  /**
   * Update map marker visual indicators
   */
  updateMapMarkerVisuals(feature) {
    if (!window.map || !feature.geometry) return;
    
    const coordinates = feature.geometry.coordinates;
    const tags = feature.properties.userTags || [];
    
    // Remove existing icon overlays for this marker
    this.removeExistingIconOverlays(coordinates);
    
    // Add new icon overlays if tags exist
    if (tags.length > 0) {
      this.addIconOverlaysToMarker(coordinates, tags);
    }
  },

  /**
   * Remove existing icon overlays for a marker
   */
  removeExistingIconOverlays(coordinates) {
    const [lng, lat] = coordinates;
    const overlayId = `icon-overlay-${lng.toFixed(6)}-${lat.toFixed(6)}`;
    
    // Remove from map if exists
    const existingOverlay = document.getElementById(overlayId);
    if (existingOverlay) {
      existingOverlay.remove();
    }
  },

  /**
   * Add icon overlays to map marker
   */
  addIconOverlaysToMarker(coordinates, tags) {
    if (!window.map) return;
    
    const [lng, lat] = coordinates;
    const overlayId = `icon-overlay-${lng.toFixed(6)}-${lat.toFixed(6)}`;
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = `
      position: absolute;
      top: -25px;
      left: -25px;
      display: flex;
      gap: 2px;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // Add up to 3 most important tags as overlays
    const priorityTags = this.getPriorityTags(tags).slice(0, 3);
    
    priorityTags.forEach((tagKey, index) => {
      const iconData = this.availableIcons.find(i => i.key === tagKey);
      if (iconData) {
        const iconElement = document.createElement('div');
        iconElement.style.cssText = `
          background: ${iconData.color};
          color: white;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 1px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        `;
        iconElement.textContent = iconData.icon;
        overlay.appendChild(iconElement);
      }
    });
    
    // Create Mapbox marker with custom overlay
    const marker = new mapboxgl.Marker(overlay)
      .setLngLat([lng, lat])
      .addTo(window.map);
    
    // Store reference for cleanup
    if (!window.iconOverlayMarkers) {
      window.iconOverlayMarkers = new Map();
    }
    window.iconOverlayMarkers.set(overlayId, marker);
  },

  /**
   * Get priority order for tags (most important first)
   */
  getPriorityTags(tags) {
    const priority = ['urgent', 'star', 'issue', 'call', 'email', 'meeting', 'follow-up', 'completed'];
    return tags.sort((a, b) => {
      const priorityA = priority.indexOf(a);
      const priorityB = priority.indexOf(b);
      if (priorityA === -1 && priorityB === -1) return 0;
      if (priorityA === -1) return 1;
      if (priorityB === -1) return -1;
      return priorityA - priorityB;
    });
  },

  /**
   * Update sidebar visual indicators
   */
  updateSidebarVisuals() {
    // Add small tag indicators to sidebar items
    document.querySelectorAll('.item').forEach(item => {
      const contactId = item.getAttribute('data-id');
      if (!contactId) return;
      
      // Find corresponding feature
      const feature = this.findFeatureByContactId(contactId);
      if (!feature) return;
      
      const tags = feature.properties.userTags || [];
      
      // Remove existing tag indicators
      const existingIndicator = item.querySelector('.tag-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      // Add new tag indicator if tags exist
      if (tags.length > 0) {
        const indicator = document.createElement('div');
        indicator.className = 'tag-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: 5px;
          right: 35px;
          display: flex;
          gap: 2px;
          z-index: 2;
        `;
        
        // Show up to 2 priority tags
        const priorityTags = this.getPriorityTags(tags).slice(0, 2);
        priorityTags.forEach(tagKey => {
          const iconData = this.availableIcons.find(i => i.key === tagKey);
          if (iconData) {
            const tagElement = document.createElement('div');
            tagElement.style.cssText = `
              background: ${iconData.color};
              color: white;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              border: 1px solid white;
            `;
            tagElement.textContent = iconData.icon;
            tagElement.title = iconData.label;
            indicator.appendChild(tagElement);
          }
        });
        
        item.appendChild(indicator);
      }
    });
  },

  /**
   * Find feature by contact ID
   */
  findFeatureByContactId(contactId) {
    if (!window.geojsonData || !window.geojsonData.features) return null;
    
    return window.geojsonData.features.find(feature => {
      const props = feature.properties || {};
      const featureContactId = props.id || props.contact_id || props.name || props.Name;
      return featureContactId === contactId;
    });
  },

  /**
   * Refresh popup tag section after changes
   */
  refreshPopupTagSection(popupId, feature) {
    const popup = document.getElementById(popupId);
    if (!popup) return;
    
    const tagSection = popup.querySelector('.icon-tagging-section');
    if (!tagSection) return;
    
    // Update the tag section with new content
    const newTagContent = IconTaggingEnhancements.buildIconTaggingSection(feature);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newTagContent;
    const newTagSection = tempDiv.querySelector('.icon-tagging-section');
    
    if (newTagSection) {
      tagSection.innerHTML = newTagSection.innerHTML;
    }
  },

  /**
   * Add filter controls to sidebar
   */
  addFilterControlsToSidebar() {
    const listings = document.getElementById('listings');
    if (!listings) return;
    
    // Check if filter controls already exist
    if (document.querySelector('.tag-filter-controls')) return;
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'tag-filter-controls';
    filterContainer.style.cssText = `
      margin-bottom: 12px;
      padding: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    `;
    
    filterContainer.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      ">
        <div style="font-weight: 600; color: #374151; font-size: 12px;">
          🏷️ Filter by Tags
        </div>
        <button onclick="IconTaggingSystem.clearFilters()" style="
          background: none;
          border: none;
          color: #6b7280;
          font-size: 10px;
          cursor: pointer;
        ">Clear</button>
      </div>
      <div class="tag-filter-buttons" style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      ">
        ${this.availableIcons.map(iconData => `
          <button onclick="IconTaggingSystem.toggleFilter('${iconData.key}')" 
                  data-filter-tag="${iconData.key}"
                  title="${iconData.label}"
                  style="
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    padding: 4px;
                    cursor: pointer;
                    font-size: 10px;
                    transition: all 0.2s ease;
                  ">
            ${iconData.icon}
          </button>
        `).join('')}
      </div>
      <div id="active-filters" style="margin-top: 8px; min-height: 16px;">
        <!-- Active filters will appear here -->
      </div>
    `;
    
    // Insert at the top of the listings
    listings.insertBefore(filterContainer, listings.firstChild);
  },

  /**
   * Current active filters
   */
  activeFilters: new Set(),

  /**
   * Toggle filter for a specific tag
   */
  toggleFilter(tagKey) {
    if (this.activeFilters.has(tagKey)) {
      this.activeFilters.delete(tagKey);
    } else {
      this.activeFilters.add(tagKey);
    }
    
    this.updateFilterVisuals();
    this.applyFiltersToSidebar();
  },

  /**
   * Clear all filters
   */
  clearFilters() {
    this.activeFilters.clear();
    this.updateFilterVisuals();
    this.applyFiltersToSidebar();
  },

  /**
   * Update filter button visuals
   */
  updateFilterVisuals() {
    document.querySelectorAll('[data-filter-tag]').forEach(button => {
      const tagKey = button.getAttribute('data-filter-tag');
      const iconData = this.availableIcons.find(i => i.key === tagKey);
      const isActive = this.activeFilters.has(tagKey);
      
      if (isActive) {
        button.style.background = iconData.color;
        button.style.borderColor = iconData.color;
        button.style.color = 'white';
      } else {
        button.style.background = '#ffffff';
        button.style.borderColor = '#e5e7eb';
        button.style.color = '';
      }
    });
    
    // Update active filters display
    const activeFiltersDiv = document.getElementById('active-filters');
    if (activeFiltersDiv) {
      if (this.activeFilters.size > 0) {
        const filterLabels = Array.from(this.activeFilters).map(tagKey => {
          const iconData = this.availableIcons.find(i => i.key === tagKey);
          return iconData ? `${iconData.icon} ${iconData.label}` : tagKey;
        });
        activeFiltersDiv.innerHTML = `
          <div style="font-size: 10px; color: #6b7280;">
            Showing: ${filterLabels.join(', ')}
          </div>
        `;
      } else {
        activeFiltersDiv.innerHTML = '';
      }
    }
  },

  /**
   * Apply filters to sidebar items
   */
  applyFiltersToSidebar() {
    document.querySelectorAll('.item').forEach(item => {
      const contactId = item.getAttribute('data-id');
      const feature = this.findFeatureByContactId(contactId);
      
      if (!feature) {
        item.style.display = 'none';
        return;
      }
      
      const tags = feature.properties.userTags || [];
      
      if (this.activeFilters.size === 0) {
        // No filters active - show all
        item.style.display = '';
      } else {
        // Check if item has any of the active filter tags
        const hasActiveTag = Array.from(this.activeFilters).some(filterTag => 
          tags.includes(filterTag)
        );
        
        item.style.display = hasActiveTag ? '' : 'none';
      }
    });
    
    // Update the dataset summary to reflect filtered count
    this.updateFilteredCount();
  },

  /**
   * Update filtered count in sidebar summary
   */
  updateFilteredCount() {
    const summary = document.querySelector('.dataset-summary');
    const visibleItems = document.querySelectorAll('.item:not([style*="display: none"])').length;
    const totalItems = document.querySelectorAll('.item').length;
    
    if (summary && this.activeFilters.size > 0) {
      summary.textContent = `${visibleItems} of ${totalItems} contacts (filtered)`;
    } else if (summary) {
      summary.textContent = `${totalItems} contacts`;
    }
  },

  /**
   * Initialize the icon tagging system
   */
  init() {
    console.log('🏷️ Initializing Icon Tagging System...');
    
    // Add filter controls to sidebar if it exists
    if (document.getElementById('listings')) {
      this.addFilterControlsToSidebar();
    }
    
    // Listen for sidebar rebuilds to re-add controls
    if (window.SidebarManager) {
      const originalBuild = window.SidebarManager.build;
      window.SidebarManager.build = function(geojson) {
        originalBuild.call(this, geojson);
        // Re-add filter controls and update visuals
        setTimeout(() => {
          IconTaggingSystem.addFilterControlsToSidebar();
          IconTaggingSystem.updateSidebarVisuals();
          IconTaggingSystem.updateFilterVisuals();
          IconTaggingSystem.applyFiltersToSidebar();
        }, 100);
      };
    }
    
    console.log('✅ Icon Tagging System initialized');
  }
};

// 3. INTEGRATION WITH EXISTING POPUP UTILS
// Add this to your PopupUtils object by updating the buildIconTaggingSection method:

if (window.PopupUtils) {
  // Enhance existing PopupUtils with icon tagging
  window.PopupUtils.buildIconTaggingSection = IconTaggingEnhancements.buildIconTaggingSection.bind(IconTaggingEnhancements);
  window.PopupUtils.availableIcons = IconTaggingEnhancements.availableIcons;
}

// 4. EXPORT AND INITIALIZE
window.IconTaggingSystem = IconTaggingSystem;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => IconTaggingSystem.init(), 500);
  });
} else {
  setTimeout(() => IconTaggingSystem.init(), 500);
}

console.log('✅ Complete Icon Tagging System loaded successfully');

// 5. USAGE INSTRUCTIONS:
/*
To integrate this system:

1. Include this file after your existing popup-utils.js
2. The system will automatically enhance your popups with icon tagging
3. Filter controls will be added to the sidebar
4. Icon overlays will appear on map markers with tags

Key Features:
- 8 predefined icons with colors and meanings
- Visual overlays on map markers
- Sidebar filtering by tags
- Instant save to feature properties
- Priority-based display (most important tags shown first)
- Integration with your existing popup system

The system works by:
1. Adding icon selection interface to popups
2. Saving selected icons to feature.properties.userTags
3. Updating global geojsonData
4. Adding visual indicators to map markers and sidebar
5. Providing filtering capabilities

No changes needed to your existing code - this extends it!
*/