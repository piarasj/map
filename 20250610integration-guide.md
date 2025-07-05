# Settings System Integration Guide

## Overview
This settings system provides a comprehensive solution for managing user preferences in your MapaLister application. It includes:

- **Distance units** (km/miles)
- **Map styles** (Light/Streets/Satellite)
- **Data set selection**
- **Current location** (GPS or manual)
- **Theme** (Light/Dark)
- **Language** (English/Gaeilge)
- **Behavior settings** (auto-center, clustering, etc.)
- **Distance filtering**

## Files to Add/Update

### 1. New Files to Create

#### `scripts/settings-manager.js`
- Complete settings management system
- Handles localStorage persistence
- Provides callbacks for settings changes
- Creates and manages the settings modal

#### Updated CSS in `css/map.css`
- Add the settings modal styles
- Include dark theme support
- Mobile responsive design

### 2. Files to Update

#### `index.html`
- Add settings button to sidebar
- Include settings-manager.js script
- The settings modal is automatically created

#### `scripts/distance-utils.js`
- Update to use settings manager for units
- Add formatting functions that respect user preferences

#### `scripts/map-app.js`
- Initialize with settings awareness
- Listen for settings changes
- Update displays when settings change

## Implementation Steps

### Step 1: Add the Settings Manager
1. Create `scripts/settings-manager.js` with the provided code
2. Add the CSS styles to your `css/map.css` file
3. Update your `index.html` to include the settings button and script

### Step 2: Update Your Existing Modules

#### In your `map-manager.js`:
```javascript
// Listen for map style changes
settingsManager.onSettingsChange((settings) => {
  if (settings.mapStyle !== currentMapStyle) {
    map.setStyle(`mapbox://styles/${settings.mapStyle}`);
  }
});
```

#### In your `sidebar-manager.js`:
```javascript
// Use settings for distance display
function updateSidebarItem(item, referencePoint) {
  const showDistances = settingsManager.getSetting('showDistances');
  const distanceUnit = settingsManager.getSetting('distanceUnit');
  
  if (showDistances && referencePoint) {
    const distance = calculateDistanceFromReference(referencePoint, item);
    // Update display with formatted distance
  }
}
```

#### In your `data-loader.js`:
```javascript
// Listen for data set changes
settingsManager.onSettingsChange((settings) => {
  if (settings.dataSet !== currentDataSet) {
    loadData(settings.dataSet);
  }
});
```

### Step 3: Initialize the Settings System

Add to your main initialization function:
```javascript
function initializeApp() {
  // Wait for settings manager to be available
  if (typeof settingsManager === 'undefined') {
    setTimeout(initializeApp, 100);
    return;
  }
  
  // Initialize other components
  initializeMap();
  setupSettingsListeners();
  
  // Load initial data based on settings
  const initialDataSet = settingsManager.getSetting('dataSet');
  loadData(initialDataSet);
}
```

## Settings API Reference

### Getting Settings
```javascript
const distanceUnit = settingsManager.getSetting('distanceUnit');
const currentLocation = settingsManager.getSetting('currentLocation');
```

### Setting Values
```javascript
settingsManager.setSetting('distanceUnit', 'miles');
settingsManager.setSetting('mapStyle', 'mapbox/satellite-v9');
```

### Listening for Changes
```javascript
settingsManager.onSettingsChange((settings) => {
  // Handle settings changes
  console.log('Settings updated:', settings);
});
```

### Utility Functions
```javascript
// Format distance with user's preferred unit
const formattedDistance = settingsManager.formatDistance(distanceKm);

// Get conversion multiplier
const multiplier = settingsManager.getDistanceMultiplier();
```

## Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `distanceUnit` | string | 'km' | 'km' or 'miles' |
| `dataSet` | string | 'data/2025-data.json' | Path to data file |
| `mapStyle` | string | 'mapbox/streets-v12' | Mapbox style |
| `showDistances` | boolean | true | Show distances in sidebar |
| `autoCenter` | boolean | true | Auto-center on data load |
| `currentLocation` | object | null | {lat, lng, name} |
| `theme` | string | 'light' | 'light' or 'dark' |
| `clusterPoints` | boolean | true | Enable point clustering |
| `showPopupsOnHover` | boolean | false | Show popups on hover |
| `maxDistance` | number | null | Distance filter in km |
| `language` | string | 'en' | 'en' or 'ga' |

## Features

### 🎯 Current Location
- GPS-based location detection
- Manual coordinate entry
- Persistent location storage
- Distance calculations from user location

### 📱 Responsive Design
- Mobile-friendly settings modal
- Touch-friendly controls
- Adaptive layout

### 🌙 Dark Mode Support
- Complete dark theme
- Automatic theme application
- Consistent styling across components

### 💾 Persistence
- Settings saved to localStorage
- Automatic loading on page refresh
- Reset to defaults option

### 🔄 Real-time Updates
- Immediate application of changes
- No page refresh required
- Smooth transitions

## Browser Support
- Modern browsers with localStorage support
- Geolocation API for current location
- ES6+ features used throughout

## Future Enhancements
- Import/export settings
- Multiple saved locations
- Custom map styles
- Advanced filtering options
- User profiles

## Troubleshooting

### Settings Not Persisting
- Check localStorage availability
- Verify no browser privacy mode restrictions

### Geolocation Not Working
- Ensure HTTPS connection
- Check browser permissions
- Handle permission denied gracefully

### Modal Not Appearing
- Verify CSS is loaded
- Check for JavaScript errors
- Ensure settings-manager.js is loaded before use