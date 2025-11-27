# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MapaLister is a Progressive Web App (PWA) that transforms GeoJSON data into interactive maps with listing, search, and navigation capabilities. Built with vanilla JavaScript and Mapbox GL JS, it's a **client-side-only application** with no backend server or build system.

## Development Commands

### Running Locally
Since this is a client-side only application with no build system:

```bash
# Start a local web server from project root
python3 -m http.server 8000
# Then open http://localhost:8000 in a browser
```

Alternatively, use VS Code's Live Server extension (right-click `index.html` → "Open with Live Server").

### Testing
- **No automated test suite** - all testing is manual via browser developer tools
- Open browser DevTools console to monitor events and debug issues
- Check Network tab for Mapbox API calls
- Inspect localStorage for saved settings (`SettingsManager` namespace)

### Common Tasks
- **View console logs**: All managers include detailed console logging with emoji prefixes (🗺️ map, 📊 data, 📋 sidebar, etc.)
- **Debug script loading**: Check browser console for dependency loading order and any missing dependencies
- **Clear state**: Clear localStorage to reset all user settings and preferences

## Architecture Overview

### Modular IIFE Pattern
Every manager file follows this pattern:
```javascript
(function() {
  'use strict';
  
  // Dependency checking
  const checkDependencies = () => {
    const missing = [];
    if (typeof Dependency === 'undefined') missing.push('Dependency');
    return missing;
  };
  
  // Retry loading if dependencies missing
  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    // Wait for dependencies via custom events
    window.addEventListener('mapalister:coreReady', retryInit);
    return;
  }
  
  // Expose via window
  window.ManagerName = { /* ... */ };
})();
```

### Script Loading Order (Critical)
Scripts **must** load in this exact order (see `index.html` lines 139-177):

1. **Utilities** (dependencies for everything)
   - `lucide-utils.js` - Icon rendering
   - `distance-utils.js` - Distance calculations
   - `reference-marker.js` - Reference point system
   - `popup-utils.js` - Map popup creation
   - `parish-variants.js` - Search variants

2. **Configuration**
   - `data-config.js` - Dynamic data configuration (must load before managers)

3. **Managers** (dependency order matters)
   - `style-manager.js` - Style management
   - `keyboard-manager.js` - Keyboard shortcuts
   - `settings-manager.js` - Application settings (provides config for others)
   - `settings-overlays.js` - Overlay configurations
   - `settings-modal.js` - Settings UI
   - `unified-map-manager.js` - Map initialization and markers
   - `data-manager.js` - Data processing and filtering
   - `sidebar-manager.js` - Sidebar listings
   - `polygon-sidebar-manager.js` - Polygon/area data sidebar
   - `sidebar-router.js` - Routes to correct sidebar type
   - `filter-manager.js` - Interactive filtering UI
   - `file-upload-manager.js` - File handling
   - `user-display-manager.js` - User display logic

4. **Integration**
   - `notification-system.js` - User notifications
   - `main-integration.js` - Application conductor/orchestrator (loads LAST)

**When adding new managers**: Insert them in the appropriate section based on dependencies, never before their dependencies.

### Event Bus System
Inter-component communication uses a custom event bus pattern (`AppEventBus` in `main-integration.js`):

```javascript
// Emitting events
eventBus.emit('map:loaded', { map: this.map });
eventBus.emit('sidebar:stateChanged', { state: 'left' });
eventBus.emit('settings:changed', settings);

// Listening to events
eventBus.on('map:loaded', (data) => { /* ... */ });
```

Common events:
- `map:loaded` - Map initialization complete
- `sidebar:stateChanged` - Sidebar visibility/position changed
- `settings:changed` - User settings updated
- `mapalister:coreReady` - Core dependencies loaded
- `mapalister:configReady` - Configuration loaded

### Data Flow Architecture

**Upload → Process → Display → Interact**

1. User uploads GeoJSON via `file-upload-manager.js`
2. `data-manager.js` processes data using `DataConfig`
   - Detects grouping properties (e.g., "dataset")
   - Builds dataset configuration with colors
   - Filters features by active datasets
3. `unified-map-manager.js` creates map markers
   - Uses Mapbox GL JS for rendering
   - Creates hover/click popups via `popup-utils.js`
4. `sidebar-manager.js` or `polygon-sidebar-manager.js` generates listings
   - Auto-detected based on geometry type
   - Routed via `sidebar-router.js`
5. User interactions trigger events via event bus
   - Click listing → fly to map location
   - Set reference marker → recalculate distances
   - Filter datasets → update markers and sidebar

### Key Modules

#### DataConfig (`config/data-config.js`)
- **Dynamic configuration** that adapts to uploaded data
- Detects grouping properties (e.g., "dataset", "diocese", "region")
- Generates color mappings for different datasets
- **Static configuration** for map styles, default settings
- Must load before any managers that depend on it

#### UnifiedMapManager (`managers/unified-map-manager.js`)
- Initializes Mapbox GL map
- Creates and updates markers
- Handles map controls positioning (opposite sidebar)
- Manages hover popups and click interactions
- Listens for sidebar state changes to resize map

#### DataManager (`managers/data-manager.js`)
- Contains `DatasetFilterManager` for multi-dataset support
- Processes GeoJSON and detects available datasets
- Filters features based on active dataset selections
- Updates dropdown UI for dataset selection
- Coordinates between map and sidebar updates

#### SidebarManager (`managers/sidebar-manager.js`)
- Builds sidebar listings with Lucide icons
- Search functionality (Parish name variants support)
- Distance calculations from reference marker
- Sorts listings by distance when reference is set
- Flag filtering system

#### SettingsManager (`managers/settings-manager.js`)
- Persistent user preferences via localStorage
- Map style, sidebar position, overlays, etc.
- Provides configuration to other managers
- Emits `settings:changed` events

#### FileUploadManager (`managers/file-upload-manager.js`)
- Handles GeoJSON file uploads
- Download functionality with settings
- Ctrl+S keyboard shortcut (Cmd+S on macOS)

## Important Configuration

### Mapbox Token
Located in `index.html` line 93:
```javascript
mapboxgl.accessToken = 'pk.eyJ1IjoicGlhcmFzaiIsImEiOiJjbWJsY2hieWMweXFtMnBwamlkOHV6ZHgxIn0.h0_O_8P6oAeobHAUGPVZNg';
```

### PWA Configuration
- Manifest: `manifest.json` (theme color: `#10b981` green)
- Service Worker: `sw.js` (offline caching)
- Supports file handlers for `.geojson` and `.json` files

### iOS Safari Optimizations
Special CSS and JavaScript in `index.html` (lines 44-87) and `scripts/ios-safari-fixes.js` for:
- Fixed viewport handling
- Touch scrolling optimization
- Canvas rendering performance
- Safe area inset support

## Code Patterns & Conventions

### Dependency Checking
Every manager checks for required dependencies before initialization:
```javascript
const checkDependencies = () => {
  const missing = [];
  if (typeof DataConfig === 'undefined') missing.push('DataConfig');
  if (typeof PopupUtils === 'undefined') missing.push('PopupUtils');
  return missing;
};
```

If dependencies are missing, managers wait for custom events before retrying initialization.

### Global Exposure
Managers expose their APIs via window:
```javascript
window.SidebarManager = { build, update, /* ... */ };
window.UnifiedMapManager = UnifiedMapManager; // class
window.DataConfig = DataConfig; // object
```

### Error Handling
Use `ErrorHandler` class in `main-integration.js` for consistent error display:
- Dependency errors
- Map initialization errors
- Generic application errors

### Console Logging
All modules use descriptive console logs with emoji prefixes:
- 🗺️ Map-related
- 📊 Data processing
- 📋 Sidebar operations
- ⚙️ Settings
- ✅ Success
- ❌ Errors
- ⚠️ Warnings

## GeoJSON Data Structure

### Point Features (Contacts/Locations)
Handled by `sidebar-manager.js`. Expected properties:
- `name` / `Name` / `title` - Contact name
- `dataset` / grouping property - Dataset classification
- `id` / `contact_id` - Unique identifier
- Additional custom properties displayed in popups

### Polygon Features (Areas/Regions)
Handled by `polygon-sidebar-manager.js`. Expected properties:
- `name` / `Name` - Area name
- `dataset` / grouping property - Dataset classification
- Polygon geometry for map display

### Multi-dataset Support
The application auto-detects multiple datasets via the grouping property:
- Single dataset: Hides dropdown, shows simple label
- Multiple datasets: Shows dropdown with color-coded options
- Grouping property detection: `dataset` > `DataConfig.groupingProperty` > fallback

## Keyboard Shortcuts

Managed by `keyboard-manager.js`:
- **Ctrl/Cmd + S** or **D**: Save/download data with settings
- **S**: Open settings modal
- **F**: Upload file
- **C**: Clear reference marker
- **T**: Toggle sidebar position
- **O**: Toggle Irish counties overlay
- **I**: Toggle Irish dioceses overlay
- **P**: Toggle Irish parishes overlay
- **U**: Toggle diocesan offices overlay
- **M**: Toggle mobile controls visibility (for desktop users)

## Mobile/Touch Controls

For devices without keyboards (tablets, phones), a floating action button (FAB) menu provides access to all keyboard shortcuts:
- Auto-shows on mobile/tablet devices
- Hidden by default on desktop (press **M** to show/hide)
- Provides touch-friendly buttons for:
  - Save data
  - Upload file
  - Open settings
  - Toggle overlays (parishes, dioceses, counties, offices)
  - Clear reference marker
  - Toggle sidebar position

Managed by `mobile-controls.js` - automatically detects touch devices and adjusts visibility.

## File Structure Notes

- **managers/**: All major functionality managers (never modify loading order)
- **config/**: Configuration and utility functions
- **utils/**: Shared utilities (popup, distance, icons, parish variants)
- **scripts/**: Integration scripts (notification system, main integration)
- **data/**: Sample GeoJSON data files
- **uploads/**: User-uploaded data (not tracked in git)
- **css/**: Stylesheets
- **dev/**: Development files and experiments

## Common Development Pitfalls

### Script Loading Order
**Never** change the script loading order in `index.html` without understanding dependencies. Managers will fail silently or show cryptic errors if dependencies aren't loaded first.

### localStorage Namespace
All settings use the `SettingsManager` prefix. When debugging, use:
```javascript
localStorage.getItem('SettingsManager:mapStyle')
```

### Map Resize Issues
When sidebar state changes, the map must be resized:
```javascript
map.resize();
```
This is handled automatically in `unified-map-manager.js` via event bus.

### Dataset Filtering
The dataset filtering logic in `data-manager.js` relies on proper grouping property detection. If datasets aren't appearing, check:
1. GeoJSON features have consistent property names
2. `DataConfig.getCurrentConfig().groupingProperty` returns correct property
3. Console logs show detected datasets

### Reference Marker State
Reference marker (for distance calculations) is stored in `ReferenceMarker` utility. Always check if it exists before calculating distances:
```javascript
if (window.ReferenceMarker && window.ReferenceMarker.exists()) {
  const ref = window.ReferenceMarker.get();
  const distance = DistanceUtils.calculateDistance(ref.lat, ref.lng, lat, lng);
}
```

## Browser Compatibility

- Modern browsers required (Chrome, Firefox, Safari, Edge)
- iOS Safari has specific optimizations
- JavaScript must be enabled
- Internet required for Mapbox tiles (offline mode limited to cached tiles)

## Security Notes

- No backend server - all processing is client-side
- User data never leaves the browser
- Mapbox token is public (scoped to specific domains)
- No sensitive data should be embedded in GeoJSON files

## Version Control

This is a Git repository. Key files:
- `.gitignore`: Excludes uploads, IDE files, OS files
- Untracked data files: Check `git status` for large GeoJSON files before committing
- Shell scripts: PDF generation utilities (development tools, not part of core app)
