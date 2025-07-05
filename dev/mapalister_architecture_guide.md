# MapaLister Architecture & Future Development Guide

## Project Overview

**MapaLister** is a web-based interactive mapping application that transforms GeoJSON datasets into beautiful, searchable, filterable maps with powerful listing capabilities. Built for displaying contact/location data with advanced features like distance calculations, dataset filtering, and reference point marking.

### Core Value Proposition
- **Transform data into maps**: Upload GeoJSON → Get interactive map + sidebar
- **Dataset filtering**: Toggle visibility of different data groups
- **Distance calculations**: Set reference points, calculate distances to all contacts
- **Search & filter**: Find specific contacts quickly
- **Mobile responsive**: Works on desktop and mobile devices

### Target Use Cases
- Parish/church contact directories
- Business location mapping
- Event participant mapping
- Any geographically distributed contact database

## Current Architecture

### Technology Stack
- **Frontend**: Pure HTML5/CSS3/JavaScript (no frameworks)
- **Mapping**: Mapbox GL JS v2.15.0
- **Styling**: Custom CSS with Outfit font family
- **Data Format**: GeoJSON FeatureCollection
- **Hosting Target**: GitHub Pages (static hosting)

### Core Components

#### 1. **Application Shell** (`index.html`)
```html
<!-- Current structure -->
<div id="map"></div>                    <!-- Mapbox map container -->
<div class="sidebar">                   <!-- Left sidebar for listings -->
  <div class="app-logo"></div>         <!-- Brand/logo area -->
  <div class="dataset-selector"></div>  <!-- Filter dropdown -->
  <div id="listings"></div>            <!-- Contact listings -->
</div>
```

#### 2. **Map Management** (`scripts/map-manager.js`)
- **Purpose**: Handles all Mapbox GL interactions
- **Status**: ⚠️ Currently minimal emergency version
- **Functions**: 
  - `initialize()` - Set up map with data
  - `addMarkersToMap()` - Render GeoJSON as markers
  - `updateMarkers()` - Update markers when filters change
  - `setupHoverPopups()` - Mouse hover interactions
  - `setupClickInteractions()` - Click handling

#### 3. **Data Integration** (`scripts/mapalister-integration.js`)
- **Purpose**: Core application logic and data management
- **Key Classes**:
  - `EnhancedDatasetFilterManager` - Dataset filtering logic
  - `MapaListerIntegration` - Main application controller
- **Functions**:
  - Load and process GeoJSON data
  - Build dropdown selectors
  - Manage active dataset filtering
  - Coordinate map and sidebar updates

#### 4. **Sidebar Management** (`scripts/sidebar-distance.js`)
- **Purpose**: Contact listings with search and distance features
- **Functions**:
  - Build compact contact listings
  - Search functionality
  - Distance calculations from reference points
  - Responsive mobile layout

#### 5. **Supporting Scripts**
- `scripts/config.js` - Configuration and Mapbox initialization
- `scripts/reference-marker.js` - Reference point functionality
- `scripts/settings-manager.js` - Settings panel and map overlays
- `scripts/distance-utils.js` - Distance calculation utilities

#### 6. **Styling** (`css/enhanced-styles.css`)
- Modern, clean interface design
- Responsive mobile layout
- Custom dropdown and checkbox styling
- Smooth animations and transitions

### Data Flow Architecture

```
User Data (GeoJSON) 
    ↓
EnhancedDatasetFilterManager.loadData()
    ↓
MapManager.initialize() + SidebarManager.build()
    ↓
Interactive Map + Contact Listings
    ↓
User Interactions (filter, search, click)
    ↓
Update Map Markers + Rebuild Sidebar
```

## Current Status & Technical Debt

### ✅ **Working Features**
- Map renders with markers from GeoJSON data
- Dataset filtering (toggle groups on/off)
- Sidebar contact listings with search
- Reference point setting and distance calculations
- Responsive mobile design
- Hover popups and click interactions

### ⚠️ **Emergency Fixes in Place**
1. **Set/Array inconsistency**: Inline script overrides data type handling
2. **Basic MapManager**: Minimal replacement of full-featured original
3. **Hidden checkboxes**: CSS hiding non-functional checkboxes
4. **Manual method overrides**: Functions replaced via inline scripts

### 🎯 **Intended Future Architecture**

#### Phase 1: Bundle Loading System
**Goal**: Enable users to load their own data + Mapbox tokens securely

**Implementation Plan**:
1. **Bundle Creator Tool** (`bundle-creator.html`)
   - Simple form: Token + GeoJSON upload + settings
   - Outputs `.mapalister` bundle file (JSON format)
   - Standalone page for creating bundles

2. **Bundle Loader Integration**
   - Drag & drop interface in main app
   - Parse bundle files (JSON or ZIP format)
   - Initialize app with user's data and token
   - Store in browser memory only (no server)

3. **Bundle Format**:
   ```json
   {
     "version": "1.0",
     "mapboxToken": "pk.eyJ...",
     "title": "My Contacts",
     "data": { "type": "FeatureCollection", "features": [...] },
     "settings": { "defaultZoom": 10, "center": [lat, lng] }
   }
   ```

#### Phase 2: Code Quality Improvements
**Goal**: Remove emergency fixes, implement proper architecture

**Tasks**:
1. **Resolve Set/Array inconsistency**
   - Choose one data type for `activeDatasets`
   - Update all methods consistently
   - Remove inline override scripts

2. **Restore Full MapManager**
   - Implement clustering if needed
   - Add advanced marker interactions
   - Proper error handling

3. **Clean CSS Architecture**
   - Remove `!important` overrides
   - Implement proper component styling
   - Mobile-first responsive design

#### Phase 3: Enhanced Features
**Goal**: Advanced functionality for power users

**Potential Features**:
- **Export capabilities**: Save filtered results as new GeoJSON
- **Print-friendly views**: Generate PDF reports
- **Advanced search**: Search by distance, dataset, custom fields
- **Data validation**: Check GeoJSON format, suggest fixes
- **Theming**: Dark mode, custom color schemes
- **Offline capabilities**: Service worker for offline usage

## Files to Provide for Future Claude Sessions

### **Essential Files** (Always provide these)
1. **`index.html`** - Current application structure and emergency scripts
2. **`scripts/mapalister-integration.js`** - Core application logic
3. **`scripts/map-manager.js`** - Current MapManager implementation
4. **`css/enhanced-styles.css`** - Complete UI styling
5. **`FIXES_SUMMARY.md`** - Technical debt documentation

### **Context Files** (Provide based on development focus)

#### For Bundle System Development:
- **`scripts/config.js`** - Current initialization logic
- **Sample GeoJSON data** - For testing bundle creation
- **Security requirements** - Token handling specifications

#### For Code Quality Cleanup:
- **`scripts/sidebar-distance.js`** - Working sidebar implementation
- **`scripts/reference-marker.js`** - Reference point functionality
- **`scripts/settings-manager.js`** - Settings panel logic
- **All CSS files** - Complete styling context

#### For Feature Enhancement:
- **Complete file structure** - Understanding current capabilities
- **User feedback** - What features are most requested
- **Performance requirements** - Speed, mobile, data size limits

### **Documentation Files** (Create these for context)
1. **`DATA_FORMAT.md`** - GeoJSON requirements and examples
2. **`DEPLOYMENT.md`** - GitHub Pages setup instructions
3. **`USER_GUIDE.md`** - How to use MapaLister features
4. **`CHANGELOG.md`** - Version history and updates

## Development Approach for Future Sessions

### 1. **Diagnosis Phase**
- Provide essential files + fixes summary
- Explain current pain points
- Define specific goals for the session

### 2. **Architecture Review**
- Claude reviews current implementation
- Identifies improvement opportunities
- Proposes clean implementation strategy

### 3. **Implementation Phase**
- Work on one component at a time
- Test each change thoroughly
- Update documentation as you go

### 4. **Integration Phase**
- Ensure all components work together
- Remove any emergency fixes that are no longer needed
- Verify mobile responsiveness

## Key Design Principles

### **Simplicity First**
- Pure JavaScript (no build tools required)
- Single-file deployments when possible
- Minimal external dependencies

### **Privacy by Design**
- No data ever leaves user's browser
- No analytics or tracking
- User controls all sensitive information

### **Mobile-First**
- Touch-friendly interface
- Responsive design patterns
- Efficient data loading

### **Accessibility**
- Proper ARIA labels
- Keyboard navigation support
- High contrast mode compatibility

## Success Metrics

A successfully refactored MapaLister should:
- ✅ Load any valid GeoJSON data
- ✅ Work with any valid Mapbox token
- ✅ Render quickly on mobile devices
- ✅ Have zero console errors
- ✅ Be deployable to GitHub Pages in under 5 minutes
- ✅ Work offline after initial load
- ✅ Pass basic accessibility audits

---

## Quick Start for Future Claude Sessions

1. **"I want to implement bundle loading"**
   - Provide: `index.html`, `mapalister-integration.js`, sample data
   - Focus: User experience, security, file handling

2. **"I want to clean up technical debt"**
   - Provide: All essential files + `FIXES_SUMMARY.md`
   - Focus: Code quality, removing emergency fixes

3. **"I want to add new features"**
   - Provide: Complete codebase + user requirements
   - Focus: Feature design, integration, testing

4. **"I want to deploy this publicly"**
   - Provide: Complete codebase + deployment requirements
   - Focus: Security, documentation, user onboarding