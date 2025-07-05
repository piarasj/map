# MapaLister Integration Summary

## Overview
The integration brings together all the components of MapaLister with the enhanced SettingsManager. Here's how everything works together:

## Key Integration Points

### 1. Settings ↔ Distance Utils
- **Settings Manager** controls the distance unit setting (`km` or `miles`)
- **Distance Utils** automatically updates its formatting when the unit changes
- **Sidebar Manager** rebuilds distance displays when units change

```javascript
// Settings change triggers distance unit update
SettingsManager.setSetting('distanceUnit', 'miles');
// → DistanceUtils.setUnit('miles')
// → SidebarManager.updateAllDistances()
```

### 2. Settings ↔ Sidebar Position
- **Settings Manager** handles sidebar positioning (`left` or `right`)
- Automatically applies CSS changes for responsive layout
- Map resizes to accommodate sidebar position changes

```javascript
// Sidebar position change
SettingsManager.setSetting('sidebarPosition', 'right');
// → Applies .sidebar-right class
// → Updates map margins
// → Triggers map.resize()
```

### 3. Settings ↔ Auto-Center
- **Settings Manager** controls auto-center behavior
- **Main Integration** connects dataset changes to auto-center
- Automatically centers map when data changes (if enabled)

```javascript
// Auto-center integration
datasetManager.updateSidebar();
// → SettingsManager.onDatasetChange()
// → SettingsManager.centerMapOnData() (if enabled)
```

### 4. Settings ↔ Irish Overlays
- **Settings Manager** handles overlay visibility, opacity, and style
- Automatically loads/removes overlay layers based on settings
- Restores overlays when map style changes

## Component Dependencies

```
Main Integration
├── Settings Manager ✓
├── Distance Utils ✓
├── Sidebar Manager ✓
├── Map Manager ✓
├── Reference Marker ✓
└── Data Config ✓

Settings Manager
├── Distance Utils (for unit changes)
├── Sidebar Manager (for distance updates)
└── Map Manager (for style changes)

Sidebar Manager
├── Settings Manager (for auto-center)
├── Distance Utils (for formatting)
├── Reference Marker (for distances)
└── Data Config (for dynamic properties)
```

## Enhanced Features

### 1. Keyboard Shortcuts
- **C**: Clear reference marker
- **S**: Open settings modal
- **T**: Toggle sidebar position

### 2. Responsive Design
- Sidebar position adapts on mobile devices
- Map margins automatically adjust
- Smooth transitions for position changes

### 3. Irish Overlays
- Dynamic loading of counties and dioceses
- Style options: borders, filled, or both
- Opacity controls with live preview
- Hover tooltips with flexible property detection

### 4. Settings Persistence
- All settings saved to localStorage
- Automatic restoration on page load
- Reset to defaults option

## Settings Integration Examples

### Distance Unit Change
```javascript
// User changes from km to miles in settings
SettingsManager.setSetting('distanceUnit', 'miles');

// This triggers:
// 1. DistanceUtils.setUnit('miles')
// 2. SidebarManager.updateAllDistances()
// 3. All distance displays update to miles
```

### Sidebar Position Toggle
```javascript
// User toggles sidebar position
SettingsManager.toggleSidebarPosition();

// This triggers:
// 1. CSS class changes (.sidebar-left → .sidebar-right)
// 2. Map margin adjustments
// 3. Map resize for proper rendering
```

### Auto-Center with Dataset Changes
```javascript
// User filters datasets
datasetManager.toggleDataset('Group I');

// This triggers:
// 1. datasetManager.updateSidebar()
// 2. SettingsManager.onDatasetChange()
// 3. SettingsManager.centerMapOnData() (if auto-center enabled)
```

### Irish Overlay Management
```javascript
// User enables counties overlay
SettingsManager.setSetting('showIrishCounties', true);

// This triggers:
// 1. SettingsManager.loadIrishCounties()
// 2. Fetches counties-coloured.geojson
// 3. Adds fill and border layers to map
// 4. Sets up hover interactions
// 5. Applies current style and opacity settings
```

## File Structure

```
managers/
├── settings-manager.js      # Enhanced settings with overlays
├── sidebar-manager.js       # Sidebar with settings integration
├── map-manager.js          # Map management
└── reference-marker.js     # Reference point management

config/
├── app-config.js           # Data configuration
└── distance-utils.js       # Distance calculations with settings

scripts/
├── main-integration.js     # Application controller
└── notification-system.js  # Toast notifications

data/
├── deacons.geojson         # Main dataset
├── counties-coloured.geojson  # Irish counties (optional)
└── dioceses-coloured.geojson  # Irish dioceses (optional)
```

## Error Handling

### Missing Dependencies
- Each component checks for required dependencies
- Graceful fallbacks when components aren't available
- Retry mechanisms for delayed loading

### File Loading Errors
- Toast notifications for overlay loading failures
- Automatic setting resets for missing files
- Fallback behavior for data-only mode

### Map Integration Errors
- Data-only mode when Mapbox token is missing
- Error displays with retry options
- Graceful degradation of features

## Settings Modal Features

### Enhanced UI
- Color-coded brand logo
- Responsive layout with organized sections
- Live preview of opacity changes
- Sub-setting visibility toggles

### Future Features Section
- Placeholder for upcoming features
- Upload data functionality (coming soon)
- Export options (coming soon)

## Performance Optimizations

### Lazy Loading
- Overlays only load when enabled
- Style listener setup on demand
- Debounced search in sidebar

### Memory Management
- Proper cleanup of event listeners
- Popup reuse to prevent memory leaks
- Efficient layer management

### Responsive Updates
- Batched DOM updates
- Smooth transitions with CSS
- Optimized map rendering

This integration creates a cohesive, feature-rich mapping application that handles complex interactions between components while maintaining performance and user experience.