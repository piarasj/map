# File Organization Plan - Dependency Analysis

## Current Problem
The `combined.js` file is monolithic (2000+ lines) with complex interdependencies that make it hard to maintain and extend. When split into separate files, Claude loses track of how components interact.

## Dependency Analysis

### Core Dependencies (Bottom Layer)
```
1. MapaListerConfig (global config)
2. DistanceUtils (pure functions, no deps)
3. DataConfig (new - configuration management)
```

### Manager Layer (Middle Layer)
```
4. SettingsManager (depends on: MapaListerConfig)
5. ReferenceMarker (depends on: DistanceUtils)
6. MapManager (depends on: MapaListerConfig, ReferenceMarker, DataConfig)
7. SidebarManager (depends on: DistanceUtils, ReferenceMarker, DataConfig)
```

### Integration Layer (Top Layer)
```
8. MapStyleController (depends on: SettingsManager)
9. DatasetFilterManager (depends on: MapManager, SidebarManager, DataConfig)
10. MapaListerIntegration (depends on: all above)
```

## Proposed File Structure

### 1. Core Configuration (`config/`)
```
config/
├── app-config.js          # MapaListerConfig + DataConfig
├── distance-utils.js      # DistanceUtils (pure functions)
└── settings-manager.js    # SettingsManager + overlays
```

### 2. Core Managers (`managers/`)
```
managers/
├── reference-marker.js    # ReferenceMarker
├── map-manager.js         # MapManager + dynamic methods
└── sidebar-manager.js     # SidebarManager + dynamic methods
```

### 3. Features (`features/`)
```
features/
├── map-style-controller.js    # MapStyleController
├── dataset-filter.js          # DatasetFilterManager
└── file-upload.js             # FileUploadManager (future)
```

### 4. Integration (`integration/`)
```
integration/
├── main-integration.js        # Main integration class
└── initialization.js          # Startup and error handling
```

### 5. Main Entry Point
```
scripts/
└── mapalister.js             # Main entry point that loads all modules
```

## Interface Contracts

### Global Exports Contract
Each file will export specific objects to `window`:

```javascript
// config/app-config.js
window.MapaListerConfig = {...}
window.DataConfig = {...}

// config/distance-utils.js  
window.DistanceUtils = {...}

// managers/reference-marker.js
window.ReferenceMarker = {...}
```

### Dependency Injection Points
Files will check for dependencies at runtime:

```javascript
// Example in map-manager.js
if (typeof DataConfig === 'undefined') {
  console.error('MapManager requires DataConfig to be loaded first');
  return;
}
```

### Event System
Use a simple event system for loose coupling:

```javascript
// Emit events instead of direct calls
window.dispatchEvent(new CustomEvent('mapalister:dataChanged', {
  detail: { data: newData }
}));

// Listen for events
window.addEventListener('mapalister:dataChanged', (e) => {
  this.updateDisplay(e.detail.data);
});
```

## Loading Strategy

### Option A: Sequential Loading (Guaranteed Order)
```html
<!-- Core (no dependencies) -->
<script src="config/app-config.js"></script>
<script src="config/distance-utils.js"></script>

<!-- Managers (depend on core) -->
<script src="config/settings-manager.js"></script>
<script src="managers/reference-marker.js"></script>
<script src="managers/map-manager.js"></script>
<script src="managers/sidebar-manager.js"></script>

<!-- Features (depend on managers) -->
<script src="features/map-style-controller.js"></script>
<script src="features/dataset-filter.js"></script>

<!-- Integration (depends on all) -->
<script src="integration/main-integration.js"></script>
<script src="integration/initialization.js"></script>
```

### Option B: Module System (Modern)
```javascript
// mapalister.js - main entry point
import { MapaListerConfig, DataConfig } from './config/app-config.js';
import { DistanceUtils } from './config/distance-utils.js';
import { MapManager } from './managers/map-manager.js';
// ... etc

// Export unified API
window.MapaLister = {
  config: DataConfig,
  managers: { MapManager, SidebarManager },
  utils: { DistanceUtils }
};
```

### Option C: Hybrid (Backwards Compatible)
```javascript
// Each file checks dependencies and self-registers
(function() {
  'use strict';
  
  // Check dependencies
  if (typeof DataConfig === 'undefined') {
    console.warn('MapManager: DataConfig not loaded, deferring initialization');
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof DataConfig !== 'undefined') {
        initializeMapManager();
      }
    });
    return;
  }
  
  // Initialize immediately if deps available
  initializeMapManager();
})();
```

## Conflict Resolution Strategy

### 1. Namespace Protection
```javascript
// Prevent conflicts with existing globals
if (window.MapManager) {
  console.warn('MapManager already exists, backing up to MapManager_backup');
  window.MapManager_backup = window.MapManager;
}
```

### 2. Version Checking
```javascript
// Each file declares its version and dependencies
const MODULE_INFO = {
  name: 'MapManager',
  version: '2.0.0',
  requires: {
    'DataConfig': '>=1.0.0',
    'DistanceUtils': '>=1.0.0'
  }
};
```

### 3. Graceful Degradation
```javascript
// Fallback to existing methods if new ones fail
const MapManager = {
  addMarkersToMap: window.EnhancedMapManager?.addMarkersToMap || 
                   window.MapManager?.addMarkersToMap || 
                   fallbackAddMarkers,
  // ...
};
```

## Testing Strategy

### 1. Dependency Tests
```javascript
// Test that all required dependencies are loaded
function testDependencies() {
  const required = ['MapaListerConfig', 'DataConfig', 'DistanceUtils'];
  const missing = required.filter(dep => typeof window[dep] === 'undefined');
  
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing.join(', ')}`);
  }
}
```

### 2. Integration Tests
```javascript
// Test that components work together
function testIntegration() {
  // Test MapManager can use DataConfig
  const config = DataConfig.getCurrentConfig();
  const result = MapManager.buildDynamicColorExpression(config.groupingProperty);
  
  if (!result) {
    throw new Error('MapManager and DataConfig integration failed');
  }
}
```

### 3. Backwards Compatibility Tests
```javascript
// Test that existing API still works
function testBackwardsCompatibility() {
  // Old way should still work
  const oldColors = MapaListerConfig.datasetColors;
  
  // New way should also work
  const newColors = DataConfig.getColorMapping();
  
  // Results should be equivalent
  assert(JSON.stringify(oldColors) === JSON.stringify(newColors));
}
```

## Migration Path

### Phase 1: Extract Core (Low Risk)
- Move pure functions (DistanceUtils)
- Move configuration (MapaListerConfig, DataConfig)
- Test that existing combined.js still works

### Phase 2: Extract Managers (Medium Risk)
- Move MapManager, SidebarManager, ReferenceMarker
- Add dependency checking
- Test integration thoroughly

### Phase 3: Extract Features (High Risk)
- Move DatasetFilterManager, MapStyleController
- Add event system
- Full integration testing

### Phase 4: Optimize (Polish)
- Remove duplicate code
- Optimize loading
- Add proper module system

## Benefits of This Approach

### For Development
- **Clear Dependencies**: Each file declares what it needs
- **Isolated Testing**: Test components independently
- **Easier Debugging**: Smaller, focused files
- **Better IDE Support**: Proper imports and exports

### For Maintenance
- **Reduced Conflicts**: Clear interfaces between components
- **Easier Updates**: Change one component without affecting others
- **Better Documentation**: Each file documents its purpose
- **Version Control**: Easier to track changes per component

### For Claude
- **Clear Context**: Each file has defined scope and purpose
- **Explicit Dependencies**: No guessing about what depends on what
- **Focused Changes**: Modify one component at a time
- **Testing Hooks**: Verify each component works independently

## Risk Mitigation

### 1. Gradual Migration
Start with the least risky components (pure functions) and gradually move to more complex ones.

### 2. Comprehensive Testing
Test each extraction thoroughly before moving to the next.

### 3. Rollback Plan
Keep the original combined.js as a fallback during migration.

### 4. Dependency Documentation
Document all dependencies clearly in each file's header.

## Next Steps

1. **Choose loading strategy** (Sequential recommended for safety)
2. **Start with Phase 1** (extract core utilities)
3. **Create dependency test suite**
4. **Extract one component at a time**
5. **Test thoroughly after each extraction**

Would you like me to start with Phase 1 and create the core configuration files first?