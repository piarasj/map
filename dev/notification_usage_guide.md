# MapaLister Notification System Usage Guide

## 🚀 Quick Start

The notification system is automatically initialized and available globally as `window.notifications`.

```javascript
// Simple notification
notifications.showNotification({ message: 'Hello World!' });

// Hide notification
notifications.hideNotification();

// Toggle notification (useful for logo clicks)
notifications.toggleNotification();
```

## 📋 API Reference

### Core Methods

#### `showNotification(options)`
Shows a notification with customizable options.

```javascript
notifications.showNotification({
  message: 'Custom message',     // Text for title bar
  count: 5,                      // Number for favicon badge
  autoHide: true,                // Auto-hide after duration
  duration: 5000                 // Duration in milliseconds
});
```

#### `hideNotification()`
Hides all notification indicators and restores original state.

#### `triggerBounce()`
Triggers the pin bounce animation (4 bounces over 2 seconds).

### Specialized Methods

#### Data Notifications
```javascript
// Data updated (shows for 3 seconds with bounce)
notifications.notifyDataUpdate('New dataset loaded');

// Filter changes (persistent until filters cleared)
notifications.notifyFilterChange(3); // Shows "3 filters active"
notifications.notifyFilterChange(0); // Hides notification

// Location updates (shows for 2 seconds with bounce)
notifications.notifyLocationUpdate();
```

#### System Notifications
```javascript
// Error notifications (shows for 5 seconds)
notifications.notifyError('Failed to load data');

// System status (can be persistent)
notifications.notifySystemStatus('Syncing data...', true);  // Persistent
notifications.notifySystemStatus('Sync complete', false);   // Auto-hide
```

## 🎯 Integration Examples

### Data Loading
```javascript
// In your data loading script
async function loadGeoJSONData(url) {
  try {
    notifications.notifySystemStatus('Loading data...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Process data...
    
    notifications.notifyDataUpdate(`Loaded ${data.features.length} items`);
  } catch (error) {
    notifications.notifyError('Failed to load data');
  }
}
```

### Filter System
```javascript
// In your filter management
function updateActiveFilters() {
  const activeFilters = getActiveFilterCount();
  notifications.notifyFilterChange(activeFilters);
}

// Call whenever filters change
document.addEventListener('filterUpdate', updateActiveFilters);
```

### Location Services
```javascript
// In your location handling
navigator.geolocation.getCurrentPosition(
  (position) => {
    // Update map with new position
    updateUserLocation(position);
    notifications.notifyLocationUpdate();
  },
  (error) => {
    notifications.notifyError('Location access denied');
  }
);
```

### File Upload
```javascript
// In your file upload handler
document.getElementById('fileUpload').addEventListener('change', (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    notifications.notifyDataUpdate(`${files.length} file(s) uploaded`);
  }
});
```

## 🎨 Visual Indicators

### Logo Notification Dot
- **Red circle** appears on the logo SVG
- **Click to toggle** on/off
- **Smooth fade** transition

### Favicon Notifications
- **Red dot**: Simple notification indicator
- **Numbered badge**: Shows count for multiple items
- **Automatic fallback** if canvas fails

### Title Bar Notifications
- **🔴 prefix** indicates active notification
- **Message suffix** shows notification details
- **Auto-restore** to original title

## 🛡️ Error Handling & Fallbacks

The system is designed to fail gracefully:

1. **DOM Element Missing**: Functions continue without logo updates
2. **Canvas Unsupported**: Falls back to title-only notifications  
3. **Favicon Errors**: Continues with logo and title notifications
4. **JavaScript Disabled**: Logo still works as static element

### Manual Fallback
If the notification system fails to initialize:

```javascript
// Check if system is available
if (window.notifications) {
  notifications.showNotification({ message: 'System ready' });
} else {
  // Manual fallback
  document.title = '🔴 MapaLister - Manual notification';
}
```

## 🔧 Customization

### Custom Notification Types
```javascript
// Add custom methods to the notification system
notifications.notifyMapStyleChange = function(styleName) {
  this.showNotification({
    message: `Map style: ${styleName}`,
    autoHide: true,
    duration: 2000
  });
};
```

### Custom Auto-Hide Duration
```javascript
// Different durations for different notification types
notifications.showNotification({
  message: 'Quick notification',
  duration: 1000  // 1 second
});

notifications.showNotification({
  message: 'Important notification', 
  duration: 10000 // 10 seconds
});
```

### Persistent Notifications
```javascript
// Show until manually dismissed
notifications.showNotification({
  message: 'Requires attention',
  autoHide: false
});

// Later, manually hide
notifications.hideNotification();
```

## 📱 Browser Compatibility

- **Modern browsers**: Full functionality including favicon badges
- **Older browsers**: Graceful fallback to title notifications
- **Mobile browsers**: Logo and title notifications work fully
- **PWA mode**: Favicon notifications work in installed apps

## 🔍 Debugging

```javascript
// Check system status
console.log('Notification system:', window.notifications);

// Test all notification types
if (window.notifications) {
  notifications.notifyDataUpdate('Test data update');
  setTimeout(() => notifications.notifyFilterChange(2), 1000);
  setTimeout(() => notifications.notifyLocationUpdate(), 2000);
  setTimeout(() => notifications.notifyError('Test error'), 3000);
}
```

## 🚀 Performance Notes

- **Minimal overhead**: Only creates canvas when needed
- **Memory efficient**: Cleans up timeouts and references
- **No polling**: Event-driven updates only
- **Cached elements**: DOM queries minimized