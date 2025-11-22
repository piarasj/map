# MapaLister Project

**Take a list, show a map.**

## Project Summary

MapaLister is a Progressive Web App (PWA) that transforms GeoJSON data into interactive maps with powerful listing, search, and navigation capabilities. Built with vanilla JavaScript and Mapbox GL JS, it provides a client-side-only solution for visualizing geographic data.

---

## Tech Stack

- **Core**: Vanilla JavaScript (ES6+)
- **Mapping**: Mapbox GL JS v2.15.0
- **Icons**: Lucide icon library
- **Typography**: Outfit font family
- **Architecture**: Modular IIFE pattern with event bus
- **Storage**: localStorage for user preferences
- **PWA**: Service worker, manifest, and offline capabilities

---

## Project Structure

```
/Users/pjackson/Sites/map/
├── index.html              # Main entry point
├── manifest.json           # PWA configuration
├── sw.js                   # Service worker
├── readme.md              # Technical documentation
│
├── css/                   # Stylesheets
│   ├── map.css
│   └── multi-select-dropdown.css
│
├── config/                # Configuration utilities
│   ├── data-config.js         # Dynamic data configuration
│   └── distance-utils.js      # Distance calculations
│
├── managers/              # Core application managers
│   ├── unified-map-manager.js      # Map initialization & markers
│   ├── data-manager.js             # Data processing & filtering
│   ├── sidebar-manager.js          # Sidebar content & interactions
│   ├── settings-manager.js         # App settings
│   ├── settings-overlays.js        # Overlay configurations
│   ├── settings-modal.js           # Settings UI
│   ├── file-upload-manager.js      # File handling
│   ├── keyboard-manager.js         # Keyboard shortcuts
│   ├── welcome-overlay-manager.js  # Welcome screen
│   ├── reference-marker.js         # Reference point system
│   ├── style-manager.js            # Style management
│   └── user-display-manager.js     # User display logic
│
├── scripts/               # Integration scripts
│   ├── main-integration.js      # Application initialization
│   ├── notification-system.js   # User notifications
│   └── ios-safari-fixes.js      # iOS compatibility
│
├── utils/                 # Utility functions
│   ├── popup-utils.js          # Map popup creation
│   └── lucide-utils.js         # Icon rendering
│
├── data/                  # GeoJSON data files
│   ├── downandconnor.geojson
│   └── downconnor-parishes.geojson
│
├── uploads/               # User uploaded data
├── dev/                   # Development files
├── icons/                 # App icons
└── .git/                  # Git repository

```

---

## Architecture Overview

### Modular Design

- **IIFE Pattern**: Each manager is wrapped in an Immediately Invoked Function Expression
- **Dependency Injection**: Managers check for required dependencies before initialization
- **Global Exposure**: Core managers exposed via `window.[ManagerName]`
- **Event Bus**: Custom event system for inter-component communication

### Data Flow

1. User uploads GeoJSON via `file-upload-manager.js`
2. `data-manager.js` processes data using `DataConfig`
3. `unified-map-manager.js` creates map markers
4. `sidebar-manager.js` generates listings
5. User interactions handled through event bus in `main-integration.js`

### Script Loading Order

The application loads dependencies in a specific order:

1. **Utilities**: lucide-utils, distance-utils, popup-utils
2. **Configuration**: data-config
3. **Managers**: style → keyboard → welcome → settings → map → data → sidebar → file-upload → user-display
4. **Integration**: notification-system → main-integration

---

## Key Features

- ✅ Multi-dataset support (handle multiple GeoJSON datasets)
- ✅ Dynamic configuration (adapts to uploaded data structure)
- ✅ Distance calculations (reference marker system)
- ✅ Responsive design (desktop & mobile PWA)
- ✅ Keyboard shortcuts (full keyboard navigation)
- ✅ Settings persistence (localStorage)
- ✅ Offline capabilities (PWA)
- ✅ iOS Safari optimizations

---

## Development

### Running Locally

Since this is a client-side only application with no build system:

```bash
# Option 1: Python HTTP server
cd /Users/pjackson/Sites/map
python3 -m http.server 8000

# Option 2: Use Live Server extension in VS Code
# Right-click index.html → "Open with Live Server"
```

### Testing

- Manual testing via browser developer tools
- Extensive console logging built into all modules
- No automated test suite currently

### Debugging

- All managers include detailed console logging
- Use browser DevTools console to monitor events
- Check Network tab for Mapbox API calls
- Inspect localStorage for saved settings

---

## Configuration

### Mapbox Token

Located in `index.html` line 93:
```javascript
mapboxgl.accessToken = 'pk.eyJ1IjoicGlhcmFzaiIsImEiOiJjbWJsY2hieWMweXFtMnBwamlkOHV6ZHgxIn0.h0_O_8P6oAeobHAUGPVZNg';
```

### PWA Settings

- Theme color: `#10b981` (green)
- App name: MapaLister
- Supports file handlers for `.geojson` and `.json`
- Protocol handler for `geo:` URLs

---

## Git Repository

- **Current branch**: main
- **Remote**: origin/master
- **Modified files**: 
  - `.DS_Store`
  - `managers/keyboard-manager.js`
- **Untracked files**:
  - Data files (downandconnor.geojson, downconnor-parishes.geojson)
  - PDF generation scripts

---

## Keyboard Shortcuts

- **Ctrl/Cmd + S**: Download data with settings
- Additional shortcuts managed by `keyboard-manager.js`

---

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ iOS Safari (with specific optimizations)
- ✅ PWA installation on mobile devices
- ⚠️ Requires JavaScript enabled
- ⚠️ Requires internet for Mapbox tiles (offline mode limited)

---

## Important Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML entry point with script loading order |
| `scripts/main-integration.js` | Application conductor/orchestrator |
| `managers/unified-map-manager.js` | Core map functionality |
| `managers/data-manager.js` | Data processing and filtering |
| `managers/sidebar-manager.js` | Listing display and search |
| `config/data-config.js` | Dynamic data configuration system |
| `manifest.json` | PWA configuration |
| `sw.js` | Service worker for offline support |

---

## Next Steps / TODO

Potential improvements:
- [ ] Add automated testing suite
- [ ] Implement data validation
- [ ] Add export to different formats (CSV, KML)
- [ ] Enhanced mobile gestures
- [ ] Offline map tiles caching
- [ ] Custom map style editor
- [ ] Analytics/usage tracking
- [ ] Multi-language support

---

## Contact & Ownership

**Project Path**: `/Users/pjackson/Sites/map`  
**Owner**: pjackson

---

## License

_License information not specified in repository_

---

## Notes

- No external API calls except Mapbox services
- All data processing is client-side
- No backend server required
- User data never leaves the browser
- Settings and preferences stored in localStorage
