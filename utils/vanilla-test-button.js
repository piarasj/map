/**
 * =====================================================
 * FILE: utils/vanilla-test-button.js
 * PURPOSE: Quick "vanilla test" button for clearing all data and hard reloading
 * DEPENDENCIES: None
 * EXPORTS: None (self-initializing)
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🧪 Loading vanilla-test-button.js...');

  // Wait for DOM to be ready
  const init = () => {
    // Create the button
    const button = document.createElement('button');
    button.id = 'vanilla-test-btn';
    button.innerHTML = '🧪 Vanilla Test';
    button.title = 'Clear all data and hard reload (Ctrl+Shift+R)';
    
    // Style the button
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      z-index: 9999;
      transition: all 0.2s ease;
    `;
    
    // Hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
    });
    
    // Click handler
    button.addEventListener('click', async () => {
      button.innerHTML = '🧹 Clearing...';
      button.disabled = true;
      
      try {
        // 1. Clear localStorage
        localStorage.clear();
        console.log('✅ localStorage cleared');
        
        // 2. Clear sessionStorage
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');
        
        // 3. Clear IndexedDB
        if (window.indexedDB) {
          const databases = await window.indexedDB.databases();
          for (const db of databases) {
            window.indexedDB.deleteDatabase(db.name);
            console.log(`✅ IndexedDB deleted: ${db.name}`);
          }
        }
        
        // 4. Unregister service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('✅ Service worker unregistered');
          }
        }
        
        // 5. Clear cache storage
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log(`✅ Cache deleted: ${cacheName}`);
          }
        }
        
        console.log('🎉 All data cleared! Reloading...');
        
        // 6. Hard reload (bypass cache)
        setTimeout(() => {
          window.location.reload(true);
        }, 100);
        
      } catch (error) {
        console.error('❌ Error during vanilla test:', error);
        button.innerHTML = '❌ Error';
        setTimeout(() => {
          button.innerHTML = '🧪 Vanilla Test';
          button.disabled = false;
        }, 2000);
      }
    });
    
    // Keyboard shortcut: Ctrl+Shift+R or Cmd+Shift+R
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        button.click();
      }
    });
    
    // Add to page
    document.body.appendChild(button);
    console.log('✅ Vanilla test button added (Ctrl+Shift+R or click button)');
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
