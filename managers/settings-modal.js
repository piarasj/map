/**
 * =====================================================
 * FILE: managers/settings-modal.js (ENHANCED TABBED UI)
 * PURPOSE: Settings modal with tabbed interface, data management, and integration fixes
 * DEPENDENCIES: SettingsManager, FileUploadManager, LucideUtils
 * EXPORTS: SettingsModal
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('🎨 Loading enhanced settings-modal.js (tabbed UI with integration)...');

  // Check dependencies
  const checkDependencies = () => {
    const missing = [];
    if (typeof SettingsManager === 'undefined') missing.push('SettingsManager');
    return missing;
  };

  const missingDeps = checkDependencies();
  if (missingDeps.length > 0) {
    console.error(`❌ SettingsModal missing dependencies: ${missingDeps.join(', ')}`);
    console.log('⏳ Will retry when dependencies are loaded...');
    
    // Wait for dependencies
    const retryInit = () => {
      if (checkDependencies().length === 0) {
        initSettingsModal();
      }
    };
    
    window.addEventListener('mapalister:settingsReady', retryInit);
    window.addEventListener('mapalister:showSettings', retryInit);
    return;
  }

  function initSettingsModal() {
    /**
     * ENHANCED SETTINGS MODAL WITH TABBED INTERFACE AND INTEGRATION
     * Handles all UI interactions, display logic, and component integration
     */
    const SettingsModal = {
      modalCreated: false,
      currentTab: 'map',

      /**
       * Show settings modal
       */
      show() {
        if (!this.modalCreated) {
          this.createSettingsModal();
        }
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'flex';
          this.populateSettingsForm();
          this.updateDataManagementUI();
          
          // Initialize Lucide icons after modal is shown
          setTimeout(() => {
            if (window.LucideUtils) {
              window.LucideUtils.init();
            }
          }, 100);
        }
      },

      /**
       * Close settings modal
       */
      close() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      },

      /**
       * Create tabbed settings modal with enhanced data management
       */
      createSettingsModal() {
        if (this.modalCreated) return;

        const modalHTML = `
          <div id="settings-modal" class="settings-modal" style="display: none;">
            <div class="settings-modal-content">
              <div class="settings-header">
                <div class="settings-title-container">
                  <svg id="settingsLogo" width="32" height="32" viewBox="0 0 32 32" class="settings-pin-logo">
                    <g>
                      <path d="M 6 0 L 26 0 A 6 6 0 0 1 32 6 L 32 16 L 16 16 L 16 3 A 2 2 0 0 0 14 1 L 6 1 A 6 6 0 0 1 6 0" fill="#e11d48"/>
                      <path d="M 32 16 L 32 26 A 6 6 0 0 1 26 32 L 16 32 L 16 16" fill="#f59e0b"/>
                      <path d="M 16 32 L 6 32 A 6 6 0 0 1 0 26 L 0 16 L 16 16" fill="#10b981"/>
                      <path d="M 0 16 L 0 6 A 6 6 0 0 1 6 0 L 16 0 L 16 16" fill="#3b82f6"/>
                      <rect x="3" y="3" width="26" height="26" rx="2" fill="white"/>
                      <text x="16" y="25.4" text-anchor="middle" font-size="23.4" dominant-baseline="baseline" class="settings-pin-emoji">⚙️</text>
                    </g>
                  </svg>
                  <div class="settings-brand-text">
                    <span class="map">Map</span><span class="a">a</span><span class="list">List</span><span class="er">er</span>
                  </div>
                  <h2 class="settings-title">Settings</h2>
                </div>
                <button class="settings-close" onclick="SettingsModal.close()">×</button>
              </div>

              <!-- TABBED NAVIGATION -->
              <div class="settings-tabs">
                <button class="tab-btn active" data-tab="map">
                  🗺️ Map
                </button>
                <button class="tab-btn" data-tab="interface">
                  📱 Interface
                </button>
                <button class="tab-btn" data-tab="overlays">
                  🏛️ Overlays
                </button>
                <button class="tab-btn" data-tab="data">
                  💾 Data
                </button>
              </div>

              <div class="settings-body">
                <!-- TAB 1: MAP & DISPLAY -->
                <div class="tab-content active" id="tab-map">
                  <div class="settings-section">
                    <h3>📍 Map & Display</h3>
                    <div class="settings-row">
                      <div class="setting-item half-width">
                        <label for="distance-unit">Distance Units:</label>
                        <select id="distance-unit">
                          <option value="km">Kilometers (km)</option>
                          <option value="miles">Miles</option>
                        </select>
                      </div>
                      <div class="setting-item half-width">
                        <label for="map-style-setting">Map Style:</label>
                        <select id="map-style-setting">
                          <option value="mapbox/light-v11">Light</option>
                          <option value="mapbox/streets-v12">Streets</option>
                          <option value="mapbox/outdoors-v12">Outdoors</option>
                          <option value="mapbox/satellite-v9">Satellite</option>
                          <option value="mapbox/dark-v11">Dark</option>
                        </select>
                      </div>
                    </div>
                    <div class="setting-item">
                      <label><input type="checkbox" id="auto-center"> Auto-center map when data changes</label>
                    </div>
                  </div>
                </div>

                <!-- TAB 2: INTERFACE -->
                <div class="tab-content" id="tab-interface">
                  <div class="settings-section">
                    <h3>📱 Interface Options</h3>
                    <div class="setting-item">
                      <label for="sidebar-position">Sidebar Position:</label>
                      <select id="sidebar-position">
                        <option value="hidden">Hidden</option>
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                      </select>
                    </div>
                    
                    <div class="settings-section">
                      <h3>⌨️ Keyboard Shortcuts</h3>
                      <div class="shortcuts-grid">
                        <div class="shortcut-item">
                          <kbd>C</kbd>
                          <span>Clear reference marker</span>
                        </div>
                        <div class="shortcut-item">
                          <kbd>S</kbd>
                          <span>Show settings</span>
                        </div>
                        <div class="shortcut-item">
                          <kbd>F</kbd>
                          <span>Upload file</span>
                        </div>
                        <div class="shortcut-item">
                          <kbd>T</kbd>
                          <span>Toggle sidebar position</span>
                        </div>
                        <div class="shortcut-item">
                          <kbd>O</kbd>
                          <span>Toggle Irish counties</span>
                        </div>
                        <div class="shortcut-item">
                          <kbd>I</kbd>
                          <span>Toggle Irish dioceses</span>
                        </div>
                        <div class="shortcut-item save-shortcut">
                          <kbd>Ctrl+S</kbd>
                          <span>💾 Save data with settings</span>
                        </div>
                        <div class="shortcut-item save-shortcut">
                          <kbd>D</kbd>
                          <span>⚡ Quick save</span>
                        </div>
                      </div>
                      <div class="shortcuts-note">
                        <p style="margin: 8px 0 0 0; color: #64748b; font-size: 11px; font-style: italic;">
                          💡 Use <kbd>Ctrl+S</kbd> (or <kbd>Cmd+S</kbd> on Mac) to save your data with all current settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TAB 3: IRISH OVERLAYS (FIXED HTML) -->
                <div class="tab-content" id="tab-overlays">
                  <div class="settings-section">
                    <h3>🗺️ Irish Overlays</h3>
                    <div class="settings-row">
                      <div class="setting-item half-width">
                        <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">🏛️ Irish Counties</h4>
                        <label><input type="checkbox" id="show-irish-counties"> Show county boundaries</label>
                        <div class="overlay-sub-setting counties-sub-setting">
                          <label for="counties-style">Style:</label>
                          <select id="counties-style">
                            <option value="borders">Borders</option>
                            <option value="filled">Filled</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div class="overlay-sub-setting counties-sub-setting">
                          <label for="counties-opacity">Opacity: <span id="counties-opacity-value">30%</span></label>
                          <input type="range" id="counties-opacity" min="0" max="1" step="0.1" value="0.3">
                        </div>
                      </div>
                      <div class="setting-item half-width">
                        <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">⛪ Irish Dioceses</h4>
                        <label><input type="checkbox" id="show-irish-dioceses"> Show diocese boundaries</label>
                        <div class="overlay-sub-setting dioceses-sub-setting">
                          <label for="dioceses-style">Style:</label>
                          <select id="dioceses-style">
                            <option value="borders">Borders</option>
                            <option value="filled">Filled</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div class="overlay-sub-setting dioceses-sub-setting">
                          <label for="dioceses-opacity">Opacity: <span id="dioceses-opacity-value">50%</span></label>
                          <input type="range" id="dioceses-opacity" min="0" max="1" step="0.1" value="0.5">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TAB 4: DATA MANAGEMENT -->
                <div class="tab-content" id="tab-data">
                  <div class="settings-section">
                    <h3>💾 Data Management</h3>
                    
                    <!-- Enhanced Data Status Display -->
                    <div class="data-management-section">
                      <div id="current-data-status" class="current-data-display">
                        <div class="data-status-header">
                          <span class="data-status-icon">📊</span>
                          <span class="data-status-text">Default dataset loaded</span>
                        </div>
                        <div class="data-status-details">
                          <span id="data-feature-count">Loading...</span>
                        </div>
                      </div>
                      
                      <div class="data-management-actions">
                        <button id="upload-geojson-btn" class="data-action-btn primary">
                          <span class="btn-icon">📁</span>
                          <span class="btn-text">Upload GeoJSON File</span>
                        </button>
                        
                        <button id="download-data-btn" class="data-action-btn secondary" style="display: none;">
                          <span class="btn-icon">💾</span>
                          <span class="btn-text">Download with Settings</span>
                        </button>
                        
                        <button id="clear-uploaded-btn" class="data-action-btn danger" style="display: none;">
                          <span class="btn-icon">🗑️</span>
                          <span class="btn-text">Return to Default</span>
                        </button>
                      </div>
                      
                      <div id="upload-history" class="upload-history" style="display: none;">
                        <h4>Recent Uploads</h4>
                        <div id="upload-history-list"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="settings-footer">
                <button onclick="SettingsManager.resetSettings()" class="footer-btn reset-btn">
                  🔄 Reset to Defaults
                </button>
                <button onclick="SettingsModal.close()" class="footer-btn close-btn">
                  ✅ Close
                </button>
              </div>
            </div>
          </div>
        `;

        // Enhanced CSS for tabbed interface and data management
        const style = document.createElement('style');
        style.textContent = `
          /* MODAL BASE STYLES */
          .settings-modal { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; 
            justify-content: center; z-index: 1000; font-family: 'Outfit', sans-serif;
          }
          .settings-modal-content { 
            background: white; border-radius: 12px; max-width: 680px; width: 90%; 
            max-height: 85vh; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
          }
          .settings-header { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 20px; border-bottom: 2px solid #f1f5f9; 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
          }
          .settings-title-container { display: flex; align-items: center; gap: 12px; }
          .settings-pin-logo { cursor: pointer; transition: transform 0.2s ease; flex-shrink: 0; }
          .settings-pin-logo:hover { transform: scale(1.05); }
          .settings-brand-text { 
            font-size: 1.2em; font-weight: 600; letter-spacing: -0.015em; 
            line-height: 1; display: flex; align-items: center; 
          }
          .settings-brand-text .map { color: #e11d48; } 
          .settings-brand-text .a { color: #f59e0b; } 
          .settings-brand-text .list { color: #3b82f6; }
          .settings-brand-text .er { color: #10b981; }
          .settings-title { margin: 0; color: #334155; font-size: 1.4em; font-weight: 600; }
          .settings-close { 
            background: none; border: none; font-size: 24px; cursor: pointer; 
            color: #666; width: 30px; height: 30px; display: flex; align-items: center; 
            justify-content: center; border-radius: 6px; 
          }
          .settings-close:hover { background: #f1f5f9; color: #dc2626; }

          /* TABBED INTERFACE */
          .settings-tabs {
            display: flex;
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .tab-btn {
            flex: 1;
            padding: 16px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            font-size: 14px;
            color: #64748b;
            border-bottom: 3px solid transparent;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .tab-btn:hover {
            background: #f1f5f9;
            color: #374151;
          }
          
          .tab-btn.active {
            color: #3b82f6;
            background: white;
            border-bottom-color: #3b82f6;
          }
          
          .settings-body { 
            padding: 24px; 
            max-height: 400px;
            overflow-y: auto;
          }
          
          .tab-content {
            display: none;
          }
          
          .tab-content.active {
            display: block;
          }

          /* SETTINGS SECTIONS */
          .settings-section { margin-bottom: 24px; }
          .settings-section h3 { 
            margin: 0 0 16px 0; color: #475569; font-size: 16px; font-weight: 600; 
            border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;
            display: flex; align-items: center; gap: 8px;
          }
          .settings-row { display: flex; gap: 20px; margin-bottom: 16px; }
          .half-width { flex: 1; }
          .setting-item { margin-bottom: 16px; }
          .setting-item label { 
            display: block; margin-bottom: 8px; font-weight: 500; 
            color: #374151; font-size: 14px; 
          }
          .setting-item select, .setting-item input[type="range"] { 
            width: 100%; padding: 10px; border: 2px solid #e5e7eb; 
            border-radius: 6px; font-size: 14px; background: white; 
          }
          .setting-item input[type="checkbox"] { margin-right: 8px; }

          /* OVERLAY SUB-SETTINGS */
          .overlay-sub-setting { 
            margin-left: 20px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 12px; 
          }
          .overlay-sub-setting.enabled { opacity: 1; }
          .counties-sub-setting, .dioceses-sub-setting { 
            margin-left: 20px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 12px; 
          }
          .counties-sub-setting.enabled, .dioceses-sub-setting.enabled { opacity: 1; }
          #counties-opacity-value, #dioceses-opacity-value { 
            font-weight: bold; color: #10b981; 
          }

          /* KEYBOARD SHORTCUTS */
          .shortcuts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }
          
          .shortcut-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 13px;
          }
          
          .shortcut-item.save-shortcut {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border: 1px solid #bbf7d0;
          }
          
          .shortcut-item kbd {
            background: #374151;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 600;
            min-width: 32px;
            text-align: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .save-shortcut kbd {
            background: #10b981;
            color: white;
          }
          
          .shortcut-item span {
            color: #475569;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .shortcuts-note {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px;
          }
          
          .shortcuts-note kbd {
            background: #1e293b;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 10px;
          }

          /* ENHANCED DATA MANAGEMENT */
          .data-management-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          
          .current-data-display {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            transition: all 0.2s ease;
          }
          
          .data-status-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
          }
          
          .data-status-icon {
            font-size: 18px;
          }
          
          .data-status-text {
            font-weight: 600;
            color: #374151;
            font-size: 15px;
          }
          
          .data-status-details {
            font-size: 13px;
            color: #6b7280;
            margin-left: 28px;
          }
          
          .data-management-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .data-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 18px;
            border: 2px solid;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s ease;
            background: white;
          }
          
          .data-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .data-action-btn.primary {
            border-color: #3b82f6;
            color: #3b82f6;
          }
          .data-action-btn.primary:hover {
            background: #3b82f6;
            color: white;
          }
          
          .data-action-btn.secondary {
            border-color: #10b981;
            color: #10b981;
          }
          .data-action-btn.secondary:hover {
            background: #10b981;
            color: white;
          }
          
          .data-action-btn.danger {
            border-color: #ef4444;
            color: #ef4444;
          }
          .data-action-btn.danger:hover {
            background: #ef4444;
            color: white;
          }
          
          .btn-icon {
            font-size: 16px;
            display: flex;
            align-items: center;
          }
          
          .btn-text {
            white-space: nowrap;
            font-weight: 600;
          }
          
          /* UPLOAD HISTORY */
          .upload-history {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 16px;
          }
          
          .upload-history h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #6b7280;
            font-weight: 600;
          }
          
          .upload-history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
          }
          
          .upload-history-item:last-child {
            border-bottom: none;
          }
          
          .upload-history-name {
            font-weight: 600;
            color: #374151;
          }
          
          .upload-history-details {
            color: #6b7280;
            font-size: 12px;
          }

          /* FOOTER */
          .settings-footer { 
            padding: 20px; border-top: 2px solid #f1f5f9; display: flex; 
            gap: 12px; justify-content: flex-end; background: #f8fafc; 
          }
          
          .footer-btn { 
            padding: 12px 20px; border: 2px solid; border-radius: 8px; 
            cursor: pointer; font-size: 14px; font-weight: 500; 
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s ease;
            display: flex; align-items: center; gap: 8px;
          }
          .footer-btn:hover { transform: translateY(-1px); }
          
          .reset-btn {
            background: #ef4444; 
            color: white; 
            border-color: #dc2626;
          }
          
          .close-btn {
            background: #3b82f6; 
            color: white; 
            border-color: #2563eb;
          }

          /* RESPONSIVE DESIGN */
          @media (max-width: 640px) {
            .settings-modal-content {
              width: 95%;
              max-height: 95vh;
            }
            
            .tab-btn {
              padding: 12px 8px;
              font-size: 12px;
            }
            
            .settings-body {
              padding: 16px;
              max-height: 50vh;
            }
            
            .settings-row {
              flex-direction: column;
              gap: 12px;
            }
            
            .data-management-actions {
              grid-template-columns: 1fr;
            }
            
            .shortcuts-grid {
              grid-template-columns: 1fr;
            }
          }
        `;
        
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.bindTabEvents();
        this.bindSettingsEvents();
        this.bindFileUploadEvents();
        this.setupSettingsLogo();
        this.modalCreated = true;
        
        // INTEGRATION: Apply component integration fixes
        this.applyIntegrationFixes();
        
        console.log('✅ Enhanced settings modal created with integration fixes');
      },

      /**
       * INTEGRATION: Apply all component integration fixes
       */
      applyIntegrationFixes() {
        console.log('🔧 Applying integration fixes...');
        
        // 1. Override SettingsManager methods to use our modal
        if (window.SettingsManager) {
          window.SettingsManager.showSettings = () => {
            console.log('📱 Opening tabbed settings modal...');
            this.show();
          };
          
          window.SettingsManager.closeSettings = () => {
            this.close();
          };
          
          // Sync modal creation flag
          window.SettingsManager.modalCreated = this.modalCreated;
          
          console.log('✅ SettingsManager integration complete');
        }
        
        // 2. Initialize FileUploadManager if available
        if (window.FileUploadManager && typeof window.FileUploadManager.init === 'function') {
          window.FileUploadManager.init();
          console.log('✅ FileUploadManager initialized');
        }
        
        // 3. Listen for data upload events
        window.addEventListener('mapalister:dataUploaded', () => {
          setTimeout(() => this.updateDataManagementUI(), 100);
        });
        
        // 4. Ensure proper overlay integration
        this.ensureOverlayIntegration();
        
        console.log('🎉 All integration fixes applied successfully!');
      },

      /**
       * INTEGRATION: Ensure overlay integration works properly
       */
      ensureOverlayIntegration() {
        // Override SettingsManager.setSetting to trigger overlay updates
        if (window.SettingsManager && window.SettingsOverlays) {
          const originalSetSetting = window.SettingsManager.setSetting;
          window.SettingsManager.setSetting = function(key, value) {
            originalSetSetting.call(this, key, value);
            
            // Trigger overlay updates for overlay-related settings
            if (key.includes('irish') || key.includes('Counties') || key.includes('Dioceses')) {
              if (window.SettingsOverlays.handleOverlaySettingChange) {
                window.SettingsOverlays.handleOverlaySettingChange(key, value);
              }
            }
          };
        }
      },

      /**
       * Bind tab switching events
       */
      bindTabEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach((btn) => {
          btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
              targetContent.classList.add('active');
            }
            
            this.currentTab = targetTab;
            
            // Update data management UI when switching to data tab
            if (targetTab === 'data') {
              setTimeout(() => this.updateDataManagementUI(), 100);
            }
          });
        });
      },

      /**
       * Bind settings form events
       */
      bindSettingsEvents() {
        // Select settings
        const selectSettings = {
          'distance-unit': 'distanceUnit',
          'map-style-setting': 'mapStyle',
          'sidebar-position': 'sidebarPosition',
          'counties-style': 'irishCountiesStyle',
          'dioceses-style': 'irishDiocesesStyle'
        };
        
        for (const id in selectSettings) {
          if (selectSettings.hasOwnProperty(id)) {
            const element = document.getElementById(id);
            const key = selectSettings[id];
            if (element) {
              element.addEventListener('change', (e) => {
                window.SettingsManager.setSetting(key, e.target.value);
              });
            }
          }
        }

        // Checkbox settings
        const checkboxSettings = {
          'auto-center': 'autoCenter',
          'show-irish-counties': 'showIrishCounties',
          'show-irish-dioceses': 'showIrishDioceses'
        };
        
        for (const id in checkboxSettings) {
          if (checkboxSettings.hasOwnProperty(id)) {
            const element = document.getElementById(id);
            const key = checkboxSettings[id];
            if (element) {
              element.addEventListener('change', (e) => {
                window.SettingsManager.setSetting(key, e.target.checked);
                
                // Toggle sub-settings
                if (id === 'show-irish-counties') {
                  this.toggleCountiesSubSettings(e.target.checked);
                }
                if (id === 'show-irish-dioceses') {
                  this.toggleDiocesesSubSettings(e.target.checked);
                }
              });
            }
          }
        }

        // Opacity sliders
        const countiesOpacitySlider = document.getElementById('counties-opacity');
        if (countiesOpacitySlider) {
          countiesOpacitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('counties-opacity-value');
            if (valueDisplay) {
              valueDisplay.textContent = Math.round(value * 100) + '%';
            }
            window.SettingsManager.setSetting('irishCountiesOpacity', value);
          });
        }

        const diocesesOpacitySlider = document.getElementById('dioceses-opacity');
        if (diocesesOpacitySlider) {
          diocesesOpacitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const valueDisplay = document.getElementById('dioceses-opacity-value');
            if (valueDisplay) {
              valueDisplay.textContent = Math.round(value * 100) + '%';
            }
            window.SettingsManager.setSetting('irishDiocesesOpacity', value);
          });
        }
      },

      /**
       * Bind file upload events
       */
      bindFileUploadEvents() {
        // Upload button
        const uploadBtn = document.getElementById('upload-geojson-btn');
        if (uploadBtn) {
          uploadBtn.addEventListener('click', () => {
            if (window.FileUploadManager) {
              window.FileUploadManager.triggerFileUpload();
            }
          });
        }

        // Download button
        const downloadBtn = document.getElementById('download-data-btn');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            if (window.FileUploadManager && window.FileUploadManager.downloadDataWithSettings) {
              try {
                window.FileUploadManager.downloadDataWithSettings();
                this.updateSaveStatusSuccess();
              } catch (error) {
                console.error('Save failed:', error);
                this.showToast(`Save failed: ${error.message}`, 'error');
              }
            } else {
              this.showToast('Save functionality not available', 'error');
            }
          });
        }

        // Clear uploaded data button
        const clearBtn = document.getElementById('clear-uploaded-btn');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            if (confirm('Return to default data source? This will clear your uploaded file.')) {
              if (window.FileUploadManager && window.FileUploadManager.clearUploadedData) {
                window.FileUploadManager.clearUploadedData();
              }
              this.updateDataManagementUI();
            }
          });
        }

        // Listen for data upload events to update UI automatically
        window.addEventListener('mapalister:dataUploaded', () => {
          setTimeout(() => this.updateDataManagementUI(), 100);
        });

        // Also listen for data clearing events
        window.addEventListener('mapalister:dataCleared', () => {
          setTimeout(() => this.updateDataManagementUI(), 100);
        });

        console.log('✅ File upload events bound with enhanced tracking');
      },

      /**
       * Setup settings logo interactions
       */
      setupSettingsLogo() {
        const settingsLogo = document.getElementById('settingsLogo');
        if (settingsLogo) {
          settingsLogo.addEventListener('click', () => {
            const pinEmoji = settingsLogo.querySelector('.settings-pin-emoji');
            if (pinEmoji) {
              pinEmoji.style.animation = 'none';
              setTimeout(() => {
                pinEmoji.style.animation = 'spin 1s ease-in-out';
              }, 10);
            }
          });
        }
      },

      /**
       * Toggle counties sub-settings visibility
       */
      toggleCountiesSubSettings(enabled) {
        const subSettings = document.querySelectorAll('.counties-sub-setting');
        subSettings.forEach(setting => {
          if (enabled) {
            setting.classList.add('enabled');
          } else {
            setting.classList.remove('enabled');
          }
        });
      },

      /**
       * Toggle dioceses sub-settings visibility
       */
      toggleDiocesesSubSettings(enabled) {
        const subSettings = document.querySelectorAll('.dioceses-sub-setting');
        subSettings.forEach(setting => {
          if (enabled) {
            setting.classList.add('enabled');
          } else {
            setting.classList.remove('enabled');
          }
        });
      },

      /**
       * Populate settings form with current values
       */
      populateSettingsForm() {
        // Standard settings
        const distanceUnit = document.getElementById('distance-unit');
        const mapStyle = document.getElementById('map-style-setting');
        const sidebarPosition = document.getElementById('sidebar-position');
        
        if (distanceUnit) distanceUnit.value = window.SettingsManager.getSetting('distanceUnit');
        if (mapStyle) mapStyle.value = window.SettingsManager.getSetting('mapStyle');
        if (sidebarPosition) sidebarPosition.value = window.SettingsManager.getSetting('sidebarPosition');
        
        const autoCenter = document.getElementById('auto-center');
        if (autoCenter) autoCenter.checked = window.SettingsManager.getSetting('autoCenter');

        // Counties settings
        const showCounties = document.getElementById('show-irish-counties');
        const countiesStyle = document.getElementById('counties-style');
        const countiesOpacity = document.getElementById('counties-opacity');
        const countiesOpacityValue = document.getElementById('counties-opacity-value');

        if (showCounties) {
          showCounties.checked = window.SettingsManager.getSetting('showIrishCounties');
          this.toggleCountiesSubSettings(showCounties.checked);
        }
        if (countiesStyle) countiesStyle.value = window.SettingsManager.getSetting('irishCountiesStyle');
        if (countiesOpacity) {
          const opacity = window.SettingsManager.getSetting('irishCountiesOpacity');
          countiesOpacity.value = opacity;
          if (countiesOpacityValue) countiesOpacityValue.textContent = Math.round(opacity * 100) + '%';
        }

        // Dioceses settings
        const showDioceses = document.getElementById('show-irish-dioceses');
        const diocesesStyle = document.getElementById('dioceses-style');
        const diocesesOpacity = document.getElementById('dioceses-opacity');
        const diocesesOpacityValue = document.getElementById('dioceses-opacity-value');

        if (showDioceses) {
          showDioceses.checked = window.SettingsManager.getSetting('showIrishDioceses');
          this.toggleDiocesesSubSettings(showDioceses.checked);
        }
        if (diocesesStyle) diocesesStyle.value = window.SettingsManager.getSetting('irishDiocesesStyle');
        if (diocesesOpacity) {
          const opacity = window.SettingsManager.getSetting('irishDiocesesOpacity');
          diocesesOpacity.value = opacity;
          if (diocesesOpacityValue) diocesesOpacityValue.textContent = Math.round(opacity * 100) + '%';
        }
      },

      /**
       * Enhanced data management UI update with recent files tracking
       */
      updateDataManagementUI() {
        const statusDisplay = document.getElementById('current-data-status');
        const featureCountEl = document.getElementById('data-feature-count');
        const downloadBtn = document.getElementById('download-data-btn');
        const clearBtn = document.getElementById('clear-uploaded-btn');
        const uploadHistory = document.getElementById('upload-history');

        if (!statusDisplay) return;

        // Get upload status
        const uploadStatus = window.FileUploadManager ? 
          window.FileUploadManager.getUploadStatus() : 
          { hasUploadedData: false };

        // Update status display with enhanced visual feedback
        const statusIcon = statusDisplay.querySelector('.data-status-icon');
        const statusText = statusDisplay.querySelector('.data-status-text');
        
        if (uploadStatus.hasUploadedData) {
          statusIcon.textContent = '📁';
          statusText.textContent = uploadStatus.currentFileName;
          statusDisplay.style.borderColor = '#10b981';
          statusDisplay.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)';
          statusDisplay.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.1)';
          
          if (featureCountEl) {
            featureCountEl.innerHTML = `
              <span style="color: #10b981; font-weight: 600;">${uploadStatus.featureCount} features loaded</span>
              <span style="color: #6b7280; margin-left: 8px;">• Uploaded data active</span>
            `;
          }
          
          // Show download and clear buttons with animation
          if (downloadBtn) {
            downloadBtn.style.display = 'flex';
            downloadBtn.style.animation = 'fadeIn 0.3s ease';
          }
          if (clearBtn) {
            clearBtn.style.display = 'flex';
            clearBtn.style.animation = 'fadeIn 0.3s ease';
          }
          
        } else {
          statusIcon.textContent = '📊';
          statusText.textContent = 'Default dataset loaded';
          statusDisplay.style.borderColor = '#d1d5db';
          statusDisplay.style.background = 'white';
          statusDisplay.style.boxShadow = 'none';
          
          if (featureCountEl) {
            const featureCount = window.geojsonData ? window.geojsonData.features?.length || 0 : 0;
            featureCountEl.innerHTML = `
              <span style="color: #374151; font-weight: 500;">${featureCount} features loaded</span>
              <span style="color: #6b7280; margin-left: 8px;">• Default data source</span>
            `;
          }
          
          // Hide download and clear buttons
          if (downloadBtn) downloadBtn.style.display = 'none';
          if (clearBtn) clearBtn.style.display = 'none';
        }

        // Enhanced upload history with better formatting
        if (uploadHistory && uploadStatus.uploadHistory && uploadStatus.uploadHistory.length > 0) {
          this.updateUploadHistoryUI(uploadStatus.uploadHistory);
          uploadHistory.style.display = 'block';
          uploadHistory.style.animation = 'slideIn 0.3s ease';
        } else if (uploadHistory) {
          uploadHistory.style.display = 'none';
        }

        // Add fade-in animation CSS if not exists
        if (!document.getElementById('data-animations')) {
          const animStyle = document.createElement('style');
          animStyle.id = 'data-animations';
          animStyle.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `;
          document.head.appendChild(animStyle);
        }
      },

      /**
       * Enhanced upload history UI with improved formatting and recent file tracking
       */
      updateUploadHistoryUI(history) {
        const historyList = document.getElementById('upload-history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        // Show last 3 uploads with enhanced formatting
        history.slice(0, 3).forEach((item, index) => {
          const historyItem = document.createElement('div');
          historyItem.className = 'upload-history-item';
          
          const uploadDate = new Date(item.uploadDate);
          const formattedDate = uploadDate.toLocaleDateString();
          const timeAgo = this.getTimeAgo(uploadDate);
          
          // Add visual indicator for most recent upload
          const isRecent = index === 0;
          
          historyItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px;">${isRecent ? '🟢' : '📄'}</span>
              <div>
                <div class="upload-history-name" style="font-weight: ${isRecent ? '600' : '500'}; color: ${isRecent ? '#10b981' : '#374151'};">
                  ${item.fileName}
                </div>
                <div class="upload-history-details" style="color: #6b7280; font-size: 11px;">
                  ${item.featureCount} features • ${timeAgo}
                </div>
              </div>
            </div>
            <div class="upload-history-details" style="text-align: right; font-size: 10px; color: #9ca3af;">
              ${formattedDate}
            </div>
          `;
          
          // Add hover effect for recent uploads
          if (isRecent) {
            historyItem.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)';
            historyItem.style.border = '1px solid #bbf7d0';
            historyItem.style.borderRadius = '4px';
            historyItem.style.padding = '8px';
            historyItem.style.margin = '4px 0';
          }
          
          historyList.appendChild(historyItem);
        });

        // Add "View All" link if there are more than 3 uploads
        if (history.length > 3) {
          const viewAllItem = document.createElement('div');
          viewAllItem.style.cssText = `
            text-align: center;
            padding: 8px;
            margin-top: 8px;
            border-top: 1px solid #f3f4f6;
          `;
          viewAllItem.innerHTML = `
            <button style="
              background: none;
              border: none;
              color: #3b82f6;
              font-size: 11px;
              cursor: pointer;
              font-weight: 500;
            " onclick="console.log('View all uploads feature coming soon')">
              View all ${history.length} uploads →
            </button>
          `;
          historyList.appendChild(viewAllItem);
        }
      },

      /**
       * Helper method to calculate time ago
       */
      getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      },

      /**
       * Update save status to success
       */
      updateSaveStatusSuccess() {
        const statusContainer = document.querySelector('.current-data-display');
        const statusIndicator = document.querySelector('.data-status-icon');
        const statusText = document.querySelector('.data-status-text');

        if (statusContainer && statusIndicator && statusText) {
          const originalBorder = statusContainer.style.borderColor;
          const originalBackground = statusContainer.style.background;
          
          statusContainer.style.borderColor = '#10b981';
          statusContainer.style.background = '#f0fdf4';
          statusIndicator.textContent = '✅';
          statusText.textContent = 'Data saved successfully!';

          // Revert after 3 seconds
          setTimeout(() => {
            this.updateDataManagementUI();
          }, 3000);
        }
      },

      /**
       * Enhanced toast notification
       */
      showToast(message, type = 'info') {
        const colors = {
          success: '#22c55e',
          info: '#3b82f6',
          warning: '#f59e0b',
          error: '#ef4444'
        };
        
        // Remove any existing toast
        const existingToast = document.querySelector('.settings-toast');
        if (existingToast) {
          existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'settings-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${colors[type] || colors.info};
          color: white;
          padding: 14px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10001;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          max-width: 320px;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 300);
          }
        }, 3000);
      }
    };

    // Export SettingsModal to window
    window.SettingsModal = SettingsModal;

    // FORCE OVERRIDE - Ensure tabbed modal always takes precedence
    setTimeout(() => {
      if (window.SettingsModal && window.SettingsManager) {
        console.log('🔧 FORCING settings modal override...');
        
        // Force override the methods
        window.SettingsManager.showSettings = function() {
          console.log('📱 USING TABBED MODAL');
          window.SettingsModal.show();
        };
        
        window.SettingsManager.closeSettings = function() {
          console.log('📱 CLOSING TABBED MODAL');
          window.SettingsModal.close();
        };
        
        // Prevent settings-manager from creating its own modal
        window.SettingsManager.createSettingsModal = function() {
          console.log('🚫 Blocked basic modal creation - using tabbed modal instead');
          // Do nothing - we want the tabbed modal
        };
        
        // Mark modal as created so settings-manager doesn't try to create one
        window.SettingsManager.modalCreated = true;
        
        console.log('✅ Settings modal override FORCED successfully');
      }
    }, 1000);

    // Dispatch event to indicate SettingsModal is ready
    window.dispatchEvent(new CustomEvent('mapalister:settingsModalReady'));

    console.log('✅ Enhanced Settings Modal with integration loaded');
  }

  // Initialize immediately if dependencies are available
  if (missingDeps.length === 0) {
    initSettingsModal();
  }

})();