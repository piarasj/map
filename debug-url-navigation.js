/**
 * URL Navigation Debug Script
 * Copy and paste this into your browser console while on the map page
 * to debug the URL navigation system
 */

console.log('🔍 Starting URL Navigation Debug...');
console.log('==========================================');

// Debug function
function debugURLNavigation() {
  const results = {
    dependencies: {},
    urlParsing: {},
    eventSystem: {},
    dataAvailability: {},
    searchFunctionality: {},
    recommendations: []
  };

  // 1. Check Dependencies
  console.log('\n1️⃣ Checking Dependencies...');
  results.dependencies = {
    EventBus: typeof window.EventBus !== 'undefined',
    MapaListerApp: typeof window.MapaListerApp !== 'undefined',
    SidebarManager: typeof window.SidebarManager !== 'undefined',
    URLManager: typeof window.URLManager !== 'undefined',
    geojsonData: typeof window.geojsonData !== 'undefined' && window.geojsonData !== null,
    map: typeof window.map !== 'undefined' && window.map !== null
  };

  Object.entries(results.dependencies).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Available' : 'Missing'}`);
  });

  // 2. Test URL Parsing
  console.log('\n2️⃣ Testing URL Parsing...');
  const testURL = 'http://localhost/map/#parish=Kilkenny';
  const hash = '#parish=Kilkenny';
  
  try {
    // Simulate URLManager parseHash function
    const hashContent = hash.slice(1);
    const params = {};
    hashContent.split('&').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    results.urlParsing = {
      originalHash: hash,
      parsedParams: params,
      hasParish: !!params.parish,
      parishValue: params.parish
    };
    
    console.log('✅ URL parsing successful:', results.urlParsing);
  } catch (error) {
    console.error('❌ URL parsing failed:', error);
    results.urlParsing.error = error.message;
  }

  // 3. Test Event System
  console.log('\n3️⃣ Testing Event System...');
  const eventBus = window.EventBus || (window.MapaListerApp && window.MapaListerApp.eventBus);
  results.eventSystem = {
    eventBusFound: !!eventBus,
    eventBusType: eventBus ? 'Found' : 'Missing',
    canEmit: !!(eventBus && typeof eventBus.emit === 'function'),
    canListen: !!(eventBus && typeof eventBus.on === 'function')
  };

  console.log(`${eventBus ? '✅' : '❌'} EventBus: ${eventBus ? 'Available' : 'Missing'}`);
  console.log(`${results.eventSystem.canEmit ? '✅' : '❌'} Can emit events: ${results.eventSystem.canEmit}`);
  console.log(`${results.eventSystem.canListen ? '✅' : '❌'} Can listen to events: ${results.eventSystem.canListen}`);

  // 4. Check Data Availability
  console.log('\n4️⃣ Checking Data Availability...');
  if (window.geojsonData && window.geojsonData.features) {
    const features = window.geojsonData.features;
    const sampleFeature = features[0];
    
    results.dataAvailability = {
      totalFeatures: features.length,
      hasFeatures: features.length > 0,
      sampleProperties: sampleFeature ? Object.keys(sampleFeature.properties || {}) : [],
      kilkennyFound: false,
      kilkennyMatches: []
    };

    // Look for Kilkenny
    const kilkennyMatches = features.filter(feature => {
      const props = feature.properties || {};
      const name = (props.name || props.Name || '').toLowerCase();
      return name.includes('kilkenny');
    });

    results.dataAvailability.kilkennyFound = kilkennyMatches.length > 0;
    results.dataAvailability.kilkennyMatches = kilkennyMatches.map(f => ({
      name: f.properties.name || f.properties.Name,
      coordinates: f.geometry ? f.geometry.coordinates : null
    }));

    console.log(`✅ Total features loaded: ${features.length}`);
    console.log(`${kilkennyMatches.length > 0 ? '✅' : '❌'} Kilkenny matches found: ${kilkennyMatches.length}`);
    if (kilkennyMatches.length > 0) {
      console.log('   Matches:', kilkennyMatches.map(f => f.properties.name || f.properties.Name));
    }
  } else {
    results.dataAvailability = {
      error: 'No geojsonData available',
      hasFeatures: false
    };
    console.error('❌ No geojsonData available');
  }

  // 5. Test Search Functionality
  console.log('\n5️⃣ Testing Search Functionality...');
  if (window.SidebarManager && window.SidebarManager.handleSearchEvent) {
    results.searchFunctionality = {
      handleSearchEventExists: true,
      canTestSearch: true
    };
    console.log('✅ SidebarManager.handleSearchEvent exists');
    
    // Test the search event handler
    console.log('🧪 Testing search event with "Kilkenny"...');
    try {
      window.SidebarManager.handleSearchEvent({ query: 'Kilkenny' });
      console.log('✅ Search event handler executed without errors');
    } catch (error) {
      console.error('❌ Search event handler failed:', error);
      results.searchFunctionality.error = error.message;
    }
  } else {
    results.searchFunctionality = {
      handleSearchEventExists: false,
      error: 'SidebarManager.handleSearchEvent not found'
    };
    console.error('❌ SidebarManager.handleSearchEvent not found');
  }

  // 6. Generate Recommendations
  console.log('\n6️⃣ Recommendations...');
  
  if (!results.dependencies.EventBus) {
    results.recommendations.push('EventBus is missing - check main-integration.js loaded');
  }
  
  if (!results.dependencies.SidebarManager) {
    results.recommendations.push('SidebarManager is missing - check sidebar-manager.js loaded');
  }
  
  if (!results.dependencies.geojsonData) {
    results.recommendations.push('No geojsonData loaded - check data loading in main-integration.js');
  }
  
  if (!results.dataAvailability.kilkennyFound) {
    results.recommendations.push('No Kilkenny data found - check if parishes data contains Kilkenny');
  }
  
  if (!results.searchFunctionality.handleSearchEventExists) {
    results.recommendations.push('Search event handler missing - check sidebar-manager.js updates');
  }

  if (results.recommendations.length === 0) {
    results.recommendations.push('All components look good! Try the manual test below.');
  }

  results.recommendations.forEach(rec => console.log(`💡 ${rec}`));

  // 7. Manual Test
  console.log('\n7️⃣ Manual Test - Run this to simulate URL navigation:');
  console.log(`
// Copy and paste this line to test manually:
if (window.SidebarManager && window.SidebarManager.handleSearchEvent) {
  console.log('🧪 Testing manual navigation to Kilkenny...');
  window.SidebarManager.handleSearchEvent({ query: 'Kilkenny' });
} else {
  console.error('❌ Cannot test - SidebarManager.handleSearchEvent not available');
}
  `);

  console.log('\n==========================================');
  console.log('🔍 Debug Complete! Check results above.');
  
  return results;
}

// Auto-run the debug
const debugResults = debugURLNavigation();

// Export results for further inspection
window.urlNavigationDebugResults = debugResults;

console.log('\n📊 Full results available as: window.urlNavigationDebugResults');

// Additional helper functions
window.testKilkennyNavigation = function() {
  console.log('🧪 Testing Kilkenny navigation...');
  if (window.SidebarManager && window.SidebarManager.handleSearchEvent) {
    window.SidebarManager.handleSearchEvent({ query: 'Kilkenny' });
  } else {
    console.error('❌ SidebarManager.handleSearchEvent not available');
  }
};

window.testURLHash = function(hash) {
  console.log(`🧪 Testing URL hash: ${hash}`);
  
  // Simulate hash change
  window.location.hash = hash;
  
  // Wait a moment then check if URLManager processed it
  setTimeout(() => {
    console.log('Hash set. Check if navigation occurred.');
  }, 1000);
};

console.log('\n🛠️  Helper functions available:');
console.log('   window.testKilkennyNavigation() - Test direct navigation');
console.log('   window.testURLHash("#parish=Kilkenny") - Test URL hash');