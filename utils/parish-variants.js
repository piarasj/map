/**
 * =====================================================
 * FILE: utils/parish-variants.js
 * PURPOSE: Parish name variants lookup for fuzzy search
 * DEPENDENCIES: None
 * EXPORTS: ParishVariants
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📍 Loading parish-variants.js...');

  const ParishVariants = {
    variants: null,
    reverseMap: null,
    
    /**
     * Load and initialize parish variants
     */
    async init() {
      try {
        const response = await fetch('data/parish_name_variants.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Raw data loaded:', data);
        console.log('📊 parish_list length:', data.parish_list?.length);
        this.variants = data.parish_list || [];
        
        // Build reverse lookup map (variant -> canonical name)
        this.buildReverseMap();
        
        console.log(`✅ Loaded ${this.variants.length} parishes with variants`);
        return true;
      } catch (error) {
        console.warn('⚠️ Could not load parish variants:', error);
        this.variants = [];
        this.reverseMap = new Map();
        return false;
      }
    },
    
    /**
     * Build reverse lookup map for fast variant -> canonical lookups
     */
    buildReverseMap() {
      this.reverseMap = new Map();
      
      this.variants.forEach(entry => {
        const canonical = entry.parish;
        
        // Map canonical name to itself
        const canonicalLower = canonical.toLowerCase().trim();
        this.reverseMap.set(canonicalLower, canonical);
        
        // Map each variant to canonical
        if (entry.variants) {
          entry.variants.forEach(variant => {
            const variantLower = variant.toLowerCase().trim();
            this.reverseMap.set(variantLower, canonical);
          });
        }
      });
      
      console.log(`✅ Built reverse map with ${this.reverseMap.size} entries`);
    },
    
    /**
     * Get canonical parish name from any variant
     * @param {string} searchName - Parish name to look up (any variant)
     * @returns {string|null} - Canonical parish name or null if not found
     */
    getCanonicalName(searchName) {
      if (!this.reverseMap || !searchName) return null;
      
      const searchLower = searchName.toLowerCase().trim();
      return this.reverseMap.get(searchLower) || null;
    },
    
    /**
     * Check if search name matches parish (including variants)
     * @param {string} parishName - Canonical parish name from data
     * @param {string} searchText - User's search text
     * @returns {boolean} - True if search matches parish or any variant
     */
    matchesSearch(parishName, searchText) {
      if (!searchText) return true;
      
      const searchLower = searchText.toLowerCase().trim();
      const parishLower = (parishName || '').toLowerCase().trim();
      
      // Direct match with canonical name
      if (parishLower.includes(searchLower)) {
        return true;
      }
      
      // Check if search text matches any variant
      const canonicalFromSearch = this.getCanonicalName(searchText);
      if (canonicalFromSearch && canonicalFromSearch.toLowerCase() === parishLower) {
        return true;
      }
      
      // Partial match with variants
      const entry = this.variants.find(v => 
        v.parish.toLowerCase() === parishLower
      );
      
      if (entry && entry.variants) {
        return entry.variants.some(variant => 
          variant.toLowerCase().includes(searchLower)
        );
      }
      
      return false;
    },
    
    /**
     * Get all variants for a parish
     * @param {string} parishName - Canonical parish name
     * @returns {Array<string>} - Array of variant names
     */
    getVariants(parishName) {
      if (!this.variants || !parishName) return [];
      
      const parishLower = parishName.toLowerCase().trim();
      const entry = this.variants.find(v => 
        v.parish.toLowerCase() === parishLower
      );
      
      return entry?.variants || [];
    },
    
    /**
     * Get match info for display (shows which variant matched)
     * @param {string} parishName - Canonical parish name
     * @param {string} searchText - User's search text
     * @returns {Object} - {matched: boolean, matchedVariant: string|null}
     */
    getMatchInfo(parishName, searchText) {
      if (!searchText) {
        return { matched: false, matchedVariant: null };
      }
      
      const searchLower = searchText.toLowerCase().trim();
      const parishLower = (parishName || '').toLowerCase().trim();
      
      // Direct match
      if (parishLower.includes(searchLower)) {
        return { matched: true, matchedVariant: null };
      }
      
      // Check variants
      const entry = this.variants.find(v => 
        v.parish.toLowerCase() === parishLower
      );
      
      if (entry && entry.variants) {
        const matchedVariant = entry.variants.find(variant => 
          variant.toLowerCase().includes(searchLower)
        );
        
        if (matchedVariant) {
          return { matched: true, matchedVariant };
        }
      }
      
      return { matched: false, matchedVariant: null };
    }
  };
  
  // Export to global scope
  window.ParishVariants = ParishVariants;
  
  console.log('✅ Parish variants utility loaded');
})();
