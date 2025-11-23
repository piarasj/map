/**
 * =====================================================
 * FILE: managers/sidebar-router.js
 * PURPOSE: Route to appropriate sidebar based on data type
 * DEPENDENCIES: SidebarManager, PolygonSidebarManager
 * EXPORTS: SidebarRouter
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🔀 Loading sidebar-router.js...');

  const SidebarRouter = {
    currentDataType: null,
    
    /**
     * Detect if data contains polygons or points
     */
    detectDataType(geojson) {
      if (!geojson || !geojson.features || !geojson.features.length) {
        return 'unknown';
      }
      
      // Check first 10 features
      const sampleSize = Math.min(10, geojson.features.length);
      let polygonCount = 0;
      let pointCount = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        const geomType = geojson.features[i]?.geometry?.type;
        if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
          polygonCount++;
        } else if (geomType === 'Point') {
          pointCount++;
        }
      }
      
      // Determine type based on majority
      if (polygonCount > pointCount) {
        return 'polygon';
      } else if (pointCount > 0) {
        return 'point';
      }
      
      return 'unknown';
    },
    
    /**
     * Build appropriate sidebar based on data type
     */
    build(geojson) {
      const dataType = this.detectDataType(geojson);
      this.currentDataType = dataType;
      window._currentDataType = dataType;
      
      console.log(`🔀 Routing to ${dataType} sidebar`);
      
      if (dataType === 'polygon') {
        this.buildPolygonSidebar(geojson);
      } else if (dataType === 'point') {
        this.buildPointSidebar(geojson);
      } else {
        console.warn('⚠️ Unknown data type, defaulting to point sidebar');
        this.buildPointSidebar(geojson);
      }
    },
    
    /**
     * Build polygon sidebar (areas)
     */
    buildPolygonSidebar(geojson) {
      console.log('🗺️ Building POLYGON sidebar');
      
      if (!window.PolygonSidebarManager) {
        console.error('❌ PolygonSidebarManager not available');
        return;
      }
      
      window.PolygonSidebarManager.build(geojson);
      console.log('✅ Polygon sidebar built successfully');
    },
    
    /**
     * Build point sidebar (markers)
     */
    buildPointSidebar(geojson) {
      console.log('📍 Building POINT sidebar');
      
      if (!window.SidebarManager) {
        console.error('❌ SidebarManager not available');
        return;
      }
      
      window.SidebarManager.build(geojson);
      console.log('✅ Point sidebar built successfully');
    },
    
    /**
     * Get current data type
     */
    getCurrentDataType() {
      return this.currentDataType || window._currentDataType || 'unknown';
    },
    
    /**
     * Check if current data is polygon type
     */
    isPolygonData() {
      return this.getCurrentDataType() === 'polygon';
    }
  };
  
  // Export
  window.SidebarRouter = SidebarRouter;
  
  console.log('✅ SidebarRouter loaded');
  window.dispatchEvent(new CustomEvent('mapalister:sidebarRouterReady'));

})();
