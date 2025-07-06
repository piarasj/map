/**
 * =====================================================
 * FILE: utils/lucide-utils.js (NEW FILE - CREATE THIS)
 * PURPOSE: Lucide icon utility functions
 * DEPENDENCIES: Lucide CDN
 * EXPORTS: LucideUtils
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎨 Loading lucide-utils.js...');

  const LucideUtils = {
    /**
     * Create a Lucide icon element
     * @param {string} iconName - Lucide icon name
     * @param {Object} options - Icon options
     * @returns {string} HTML string
     */
    icon(iconName, options = {}) {
      const {
        size = 16,
        color = 'currentColor',
        strokeWidth = 2,
        className = '',
        style = ''
      } = options;
      
      return `<i data-lucide="${iconName}" 
                style="width: ${size}px; height: ${size}px; color: ${color}; stroke-width: ${strokeWidth}; ${style}" 
                class="${className}"></i>`;
    },
    
    /**
     * Initialize Lucide icons after content is added to DOM
     * Call this after adding HTML content with Lucide icons
     */
    init() {
      if (window.lucide) {
        window.lucide.createIcons();
      } else {
        console.warn('⚠️ Lucide library not loaded - make sure CDN is included');
      }
    },
    
    /**
     * Create an inline SVG icon (alternative method)
     * @param {string} iconName - Lucide icon name
     * @param {Object} options - Icon options
     * @returns {string} SVG HTML string
     */
    svg(iconName, options = {}) {
      const {
        size = 16,
        color = 'currentColor',
        strokeWidth = 2,
        className = ''
      } = options;
      
      // This would require the Lucide icon data - for now, use the data-lucide method
      return this.icon(iconName, options);
    },
    
    /**
     * Common icon shortcuts for the project
     */
    icons: {
      phone: (opts) => LucideUtils.icon('phone', opts),
      mobile: (opts) => LucideUtils.icon('smartphone', opts),
      email: (opts) => LucideUtils.icon('mail', opts),
      location: (opts) => LucideUtils.icon('map-pin', opts),
      building: (opts) => LucideUtils.icon('building', opts),
      landmark: (opts) => LucideUtils.icon('landmark', opts),
      church: (opts) => LucideUtils.icon('church', opts),
      calendar: (opts) => LucideUtils.icon('calendar', opts),
      notes: (opts) => LucideUtils.icon('file-text', opts),
      distance: (opts) => LucideUtils.icon('ruler', opts),
      map: (opts) => LucideUtils.icon('map', opts),
      settings: (opts) => LucideUtils.icon('settings', opts),
      close: (opts) => LucideUtils.icon('x', opts),
      upload: (opts) => LucideUtils.icon('folder', opts),
      refresh: (opts) => LucideUtils.icon('refresh-cw', opts),
      keyboard: (opts) => LucideUtils.icon('keyboard', opts),
      chart: (opts) => LucideUtils.icon('bar-chart-3', opts),
      birthday: (opts) => LucideUtils.icon('cake', opts)
    }
  };

  // Export to global scope
  window.LucideUtils = LucideUtils;
  
  console.log('✅ Lucide utilities loaded');
  
  // Mark as loaded
  if (window.MapaListerModules) {
    window.MapaListerModules.lucideUtils = true;
  }
  
  // Emit ready event
  window.dispatchEvent(new CustomEvent('mapalister:lucideUtilsReady'));

})();