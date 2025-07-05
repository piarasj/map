# Dynamic Data Configuration Implementation Guide

## Overview

This guide shows how to replace the hardcoded "deacons" references and "dataset" property with a flexible, dynamic system that can handle any GeoJSON file with any grouping property.

## Current Problems Solved

1. **Hardcoded filename**: `deacons.geojson` is fixed in code
2. **Hardcoded source names**: `'deacons'` in map sources and layers
3. **Hardcoded property**: `'dataset'` property is fixed for grouping
4. **Hardcoded labels**: "Deacons" appears in UI text
5. **No file upload preparation**: System isn't ready for dynamic file loading

## Implementation Steps

### Step 1: Add the Dynamic Configuration System

Add the first artifact (`dynamic_data_config.js`) to your project. This provides:

- `DataConfig` - Central configuration management
- `EnhancedMapManager` - Dynamic map layer management  
- `EnhancedDatasetFilterManager` - Dynamic filtering
- `DynamicMapaListerIntegration` - Updated integration
- File upload preparation (for future implementation)

```javascript
// Include the dynamic_data_config.js file in your project
<script src="scripts/dynamic_data_config.js"></script>
```

### Step 2: Apply Integration Updates

Apply the second artifact (`integration_updates.js`) to update your existing `combined.js`:

```javascript
// Load the integration updates after your main scripts
<script src="scripts/integration_updates.js"></script>
<script>
// Apply the updates
applyDynamicUpdates();
initializeWithCurrentConfig();
</script>
```

### Step 3: Update Your HTML Loading Messages

Update your `index.html` to use dynamic loading messages:

```html
<!-- Replace static loading messages -->
<div class="selector-text placeholder" id="selectorText">Loading data...</div>

<div class="dropdown-menu" id="dropdownMenu">
  <div class="loading" style="padding: 20px; text-align: center; color: #666;">
    Loading datasets...
  </div>
</div>

<div id="listings">
  <div class="loading">Loading data...</div>
</div>
```

### Step 4: Configure Different Data Sources

Now you can easily switch between different data files:

```javascript
// Example 1: Load priests data with region grouping
await loadDataFile('priests.geojson', 'Priests', 'region');

// Example 2: Load churches data with denomination grouping  
await loadDataFile('churches.geojson', 'Churches', 'denomination');

// Example 3: Update configuration manually
DataConfig.updateDataSource({
  filename: 'schools.geojson',
  displayName: 'Schools',
  sourceKey: 'schools',
  groupingProperty: 'type',
  groupingDisplayName: 'School Type'
});
```

### Step 5: Prepare for File Upload (Optional)

To enable file upload functionality in the future:

```javascript
// Prepare the file upload system
prepareFileUpload();

// Add an upload button to your UI
<button onclick="triggerFileUpload()">📁 Upload GeoJSON</button>
```

## Configuration Examples

### Default Configuration (Deacons)
```javascript
{
  filename: 'deacons.geojson',
  displayName: 'Deacons', 
  sourceKey: 'deacons',
  groupingProperty: 'dataset',
  groupingDisplayName: 'Dataset'
}
```

### Example: Schools Configuration
```javascript
DataConfig.updateDataSource({
  filename: 'schools.geojson',
  displayName: 'Schools',
  sourceKey: 'schools', 
  groupingProperty: 'school_type',
  groupingDisplayName: 'School Type',
  defaultGroupingValues: ['Primary', 'Secondary', 'Special Needs', 'Private']
});
```

### Example: Medical Centers Configuration
```javascript
DataConfig.updateDataSource({
  filename: 'medical_centers.geojson',
  displayName: 'Medical Centers',
  sourceKey: 'medical_centers',
  groupingProperty: 'facility_type', 
  groupingDisplayName: 'Facility Type',
  defaultGroupingValues: ['Hospital', 'Clinic', 'Pharmacy', 'Specialist']
});
```

## Dynamic Behavior

### Map Sources and Layers
- **Before**: Fixed `'deacons'` source and `'deacons-markers'` layer
- **After**: Dynamic `${sourceKey}` and `${sourceKey}-markers` based on configuration

### UI Labels  
- **Before**: Hardcoded "Deacons" and "datasets"
- **After**: Dynamic `${displayName}` and `${groupingDisplayName}`

### Property Access
- **Before**: Fixed `feature.properties.dataset`  
- **After**: Dynamic `feature.properties[groupingProperty]`

### Color Mapping
- **Before**: Fixed color mapping for specific dataset values
- **After**: Dynamic color generation based on actual data values

## File Structure

```
your-project/
├── scripts/
│   ├── combined.js                 # Your existing file
│   ├── dynamic_data_config.js      # New: Dynamic configuration system
│   └── integration_updates.js      # New: Integration updates
├── data/
│   ├── deacons.geojson            # Current file
│   ├── priests.geojson            # Example: Additional data file
│   └── churches.geojson           # Example: Additional data file
└── index.html                      # Updated with dynamic loading
```

## API Reference

### DataConfig Methods
```javascript
DataConfig.getCurrentConfig()              // Get current configuration
DataConfig.updateDataSource(newConfig)     // Update configuration  
DataConfig.analyzeData(geojsonData)        // Analyze GeoJSON structure
DataConfig.getColorMapping()               // Get color mapping
DataConfig.generateColorMapping(values)    // Generate colors for values
```

### Loading Functions
```javascript
loadDataFile(filename, displayName, groupingProperty)  // Load different file
updateDataSource(newConfig)                            // Update config
prepareFileUpload()                                     // Enable file upload
triggerFileUpload()                                     // Open file dialog
```

### Integration Functions  
```javascript
applyDynamicUpdates()           // Apply dynamic updates to existing code
initializeWithCurrentConfig()   // Initialize with current configuration
```

## Migration Path

### Phase 1: Basic Dynamic Support (Current)
- Dynamic filename and property configuration
- Backwards compatibility with existing deacons.geojson
- Manual configuration updates

### Phase 2: File Upload (Future)
- Drag & drop GeoJSON files
- Automatic property detection
- Configuration UI

### Phase 3: Advanced Features (Future)
- Multiple file support
- Data merging and combining
- Export functionality

## Benefits

1. **Flexibility**: Handle any GeoJSON file with any grouping property
2. **Reusability**: Same codebase works for different datasets  
3. **Maintainability**: Central configuration management
4. **Extensibility**: Easy to add new data sources
5. **Future-Ready**: Prepared for file upload functionality
6. **Backwards Compatible**: Existing deacons.geojson continues to work

## Testing

Test with different configurations:

```javascript
// Test 1: Default deacons configuration
console.log('Current config:', DataConfig.getCurrentConfig());

// Test 2: Switch to different data
await loadDataFile('priests.geojson', 'Priests', 'diocese');

// Test 3: Analyze data structure
const analysis = DataConfig.analyzeData(geojsonData);
console.log('Available properties:', analysis.availableProperties);
console.log('Grouping values:', analysis.groupingValues);

// Test 4: Manual configuration
DataConfig.updateDataSource({
  filename: 'test.geojson',
  displayName: 'Test Data',
  sourceKey: 'test',
  groupingProperty: 'category'
});

// Test 5: Color mapping
const colors = DataConfig.getColorMapping();
console.log('Color mapping:', colors);
```

## Error Handling

The system includes comprehensive error handling:

### Missing Files
```javascript
// Gracefully handles missing data files
try {
  await loadDataFile('missing.geojson');
} catch (error) {
  console.error('File not found:', error.message);
  // Shows user-friendly error message
}
```

### Invalid Data Structure
```javascript
// Validates GeoJSON structure
const analysis = DataConfig.analyzeData(invalidData);
if (!analysis) {
  console.warn('Invalid GeoJSON structure');
}
```

### Missing Properties
```javascript
// Handles missing grouping properties gracefully
const groupValue = feature.properties?.[groupingProperty] || 'Unknown';
```

## Backwards Compatibility

The system maintains full backwards compatibility:

```javascript
// Existing code continues to work
const oldStyle = MapaListerConfig.datasetColors['Group I - 2014-2018'];

// New dynamic approach
const newStyle = DataConfig.getColorMapping()['Group I - 2014-2018'];

// Both return the same result
console.log(oldStyle === newStyle); // true
```

## Performance Considerations

### Optimizations Included
- **Lazy Loading**: Colors generated only when needed
- **Caching**: Configuration cached until explicitly updated
- **Minimal DOM Updates**: Only affected elements are updated
- **Efficient Filtering**: Uses Sets for fast membership testing

### Best Practices
```javascript
// Good: Update configuration once
DataConfig.updateDataSource(newConfig);

// Avoid: Multiple small updates
DataConfig.updateDataSource({filename: 'new.geojson'});
DataConfig.updateDataSource({displayName: 'New Data'});
DataConfig.updateDataSource({groupingProperty: 'type'});
```

## Troubleshooting

### Common Issues

#### 1. Map Layers Not Updating
```javascript
// Check if configuration is applied
console.log('Current config:', DataConfig.getCurrentConfig());

// Manually trigger layer update
if (window.MapManager) {
  MapManager.removeExistingLayers(map);
  MapManager.addMarkersToMap(map, geojsonData);
}
```

#### 2. Colors Not Showing
```javascript
// Check color mapping
console.log('Colors:', DataConfig.getColorMapping());

// Verify grouping values in data
const analysis = DataConfig.analyzeData(geojsonData);
console.log('Found grouping values:', analysis.groupingValues);
```

#### 3. Sidebar Not Updating
```javascript
// Force sidebar rebuild
if (window.SidebarManager && geojsonData) {
  SidebarManager.build(geojsonData);
}
```

#### 4. Integration Not Applied
```javascript
// Check if updates are applied
console.log('Dynamic methods available:', {
  mapManager: typeof MapManager.buildDynamicColorExpression === 'function',
  sidebarManager: typeof SidebarManager.extractGroupingValue === 'function'
});

// Apply updates manually
applyDynamicUpdates();
```

## Advanced Usage

### Custom Property Detection
```javascript
// Automatically detect best grouping property
function detectGroupingProperty(geojsonData) {
  const analysis = DataConfig.analyzeData(geojsonData);
  const candidates = ['dataset', 'group', 'category', 'type', 'class'];
  
  for (const prop of candidates) {
    if (analysis.availableProperties.includes(prop)) {
      return prop;
    }
  }
  
  return 'category'; // fallback
}

// Use detected property
const groupingProp = detectGroupingProperty(geojsonData);
DataConfig.updateDataSource({groupingProperty: groupingProp});
```

### Dynamic Color Schemes
```javascript
// Generate colors based on data characteristics
function generateColorScheme(groupingValues) {
  const schemes = {
    geographic: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    categorical: ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
    sequential: ['#fef3c7', '#fcd34d', '#f59e0b', '#d97706']
  };
  
  // Choose scheme based on data type
  const scheme = groupingValues.some(v => v.includes('Group')) ? 
    schemes.categorical : schemes.geographic;
    
  return DataConfig.generateColorMapping(groupingValues, scheme);
}
```

### Batch Data Loading
```javascript
// Load multiple datasets
async function loadMultipleDatasets(configs) {
  for (const config of configs) {
    try {
      await loadDataFile(config.filename, config.displayName, config.groupingProperty);
      console.log(`✅ Loaded: ${config.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to load: ${config.displayName}`, error);
    }
  }
}

// Usage
await loadMultipleDatasets([
  {filename: 'priests.geojson', displayName: 'Priests', groupingProperty: 'diocese'},
  {filename: 'churches.geojson', displayName: 'Churches', groupingProperty: 'denomination'}
]);
```

## Future Enhancements

### Planned Features
1. **Multiple Dataset Support**: Display multiple datasets simultaneously
2. **Data Validation**: Advanced GeoJSON validation and repair
3. **Export Functionality**: Export filtered data as GeoJSON
4. **Configuration Persistence**: Save/load configuration presets
5. **Real-time Updates**: WebSocket support for live data updates

### Extension Points
```javascript
// Plugin system for custom data processors
DataConfig.addProcessor('census', {
  groupingProperty: 'population_density',
  colorScheme: 'sequential',
  customAnalysis: (data) => {
    // Custom analysis logic
  }
});

// Custom file format support
FileUploadManager.addFormat('.csv', {
  parser: parseCSVToGeoJSON,
  validator: validateCSVStructure
});
```

## Integration with Existing Code

### Minimal Changes Required
The dynamic system is designed to require minimal changes to your existing codebase:

1. **Add two script files** (provided in artifacts)
2. **Call two functions** (`applyDynamicUpdates()` and `initializeWithCurrentConfig()`)
3. **Update loading messages** in HTML (optional)

### Existing Functionality Preserved
- All current features continue to work
- Same UI and UX
- Same performance characteristics
- Same error handling

### New Capabilities Added
- Dynamic file loading
- Flexible property mapping
- Configurable grouping
- File upload preparation
- Color scheme generation

## Summary

This dynamic configuration system transforms your MapaLister from a single-purpose deacons viewer into a flexible, reusable mapping platform that can handle any GeoJSON data with any grouping property. The implementation maintains full backwards compatibility while adding powerful new capabilities for future growth.

Key benefits:
- **Immediate**: Use with different data files right away
- **Flexible**: Configure any grouping property
- **Future-ready**: Prepared for file upload functionality  
- **Maintainable**: Central configuration management
- **Extensible**: Easy to add new features

The system is production-ready and can be deployed immediately while providing a foundation for future enhancements like file upload, multiple dataset support, and advanced data processing capabilities.