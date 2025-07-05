/**
 * =====================================================
 * FILE: managers/settings-ui-enhancement.js
 * PURPOSE: Enhance SettingsManager with file upload UI
 * DEPENDENCIES: SettingsManager, FileUploadManager
 * EXPORTS: Enhanced SettingsManager functions
 * =====================================================
 */

(function() {
  'use strict';
  
  console.log('📁 Loading settings-ui-enhancement.js...');

  // Wait for both SettingsManager and FileUploadManager to be ready
  const waitForDependencies = () => {
    if (typeof window.SettingsManager === 'undefined' || 
        typeof window.FileUploadManager === 'undefined') {
      setTimeout(waitForDependencies, 100);
      return;
    }
    
    enhanceSettingsManager();
  };

  function enhanceSettingsManager() {
    /**
     * ENHANCE EXISTING SETTINGS MANAGER WITH FILE UPLOAD FUNCTIONALITY
     */
    
    // Store original createSettingsModal method
    const originalCreateSettingsModal = window.SettingsManager.createSettingsModal;
    
    // Override createSettingsModal to include file upload section
    window.SettingsManager.createSettingsModal = function() {
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
              <button class="settings-close" onclick="SettingsManager.closeSettings()">&times;</button>
            </div>
            <div class="settings-body">
              
              <!-- NEW: Data Management Section -->
              <div class="settings-section">
                <h3>📁 Data Management</h3>
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

              <!-- Existing sections... -->
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
              </div>
              <div class="settings-section">
                <h3>📱 Interface</h3>
                <div class="settings-row">
                  <div class="setting-item half-width">
                    <label for="sidebar-position">Sidebar Position:</label>
                    <select id="sidebar-position">
                      <option value="left">Left Side</option>
                      <option value="right">Right Side</option>
                    </select>
                  </div>
                  <div class="setting-item half-width">
                    <label><input type="checkbox" id="auto-center"> Auto-center map when data changes</label>
                  </div>
                </div>
              </div>
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
                      <label for="dioceses-opacity">Opacity: <span id="dioceses-opacity-value">30%</span></label>
                      <input type="range" id="dioceses-opacity" min="0" max="1" step="0.1" value="0.3">
                    </div>
                  </div>
                </div>
                <div class="settings-note">
                  <p><strong>💡 Keyboard shortcuts:</strong> <code>C</code> Clear reference, <code>S</code> Settings, <code>T</code> Toggle sidebar</p>
                </div>
              </div>
              <div class="settings-section">
                <h3>🚀 Future Features</h3>
                <div class="setting-item">
                  <div class="feature-preview">
                    <h4>🔗 Data Sharing</h4>
                    <p>Share maps with embedded settings (Coming Soon)</p>
                    <button disabled style="opacity: 0.5;">Generate Share Link</button>
                  </div>
                </div>
                <div class="setting-item">
                  <div class="feature-preview">
                    <h4>📈 Analytics</h4>
                    <p>Data analysis and reporting tools (Coming Soon)</p>
                    <button disabled style="opacity: 0.5;">View Analytics</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings-footer">
              <button onclick="SettingsManager.resetSettings()" style="background: #ef4444; color: white; border-color: #dc2626;">Reset to Defaults</button>
              <button onclick="SettingsManager.closeSettings()" style="background: #3b82f6; color: white; border-color: #2563eb;">Close</button>
            </div>
          </div>
        </div>
      `;

      // Enhanced CSS for file upload functionality
      const style = document.createElement('style');
      style.textContent = `
        .settings-modal { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; 
          justify-content: center; z-index: 1000; font-family: 'Outfit', sans-serif;
        }
        .settings-modal-content { 
          background: white; border-radius: 12px; max-width: 680px; width: 90%; 
          max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
        }
        .settings-header { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 20px; border-bottom: 2px solid #f1f5f9; 
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
          border-radius: 12px 12px 0 0; 
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
        .settings-body { padding: 20px; }
        .settings-section { margin-bottom: 20px; }
        .settings-section h3 { 
          margin: 0 0 15px 0; color: #475569; font-size: 16px; font-weight: 600; 
          border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;
        }
        
        /* NEW: Data Management Styles */
        .data-management-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .current-data-display {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .data-status-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .data-status-icon {
          font-size: 16px;
        }
        
        .data-status-text {
          font-weight: 600;
          color: #374151;
        }
        
        .data-status-details {
          font-size: 12px;
          color: #6b7280;
          margin-left: 24px;
        }
        
        .data-management-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        
        .data-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 2px solid;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          background: white;
          flex: 1;
          min-width: 140px;
        }
        
        .data-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
          font-size: 14px;
        }
        
        .btn-text {
          white-space: nowrap;
        }
        
        .upload-history {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
        }
        
        .upload-history h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .upload-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12px;
        }
        
        .upload-history-item:last-child {
          border-bottom: none;
        }
        
        .upload-history-name {
          font-weight: 500;
          color: #374151;
        }
        
        .upload-history-details {
          color: #6b7280;
          font-size: 11px;
        }
        
        /* Existing styles continue... */
        .settings-row { display: flex; gap: 16px; margin-bottom: 12px; }
        .half-width { flex: 1; }
        .setting-item { margin-bottom: 12px; }
        .setting-item label { 
          display: block; margin-bottom: 6px; font-weight: 500; 
          color: #374151; font-size: 14px; 
        }
        .setting-item select, .setting-item input[type="range"] { 
          width: 100%; padding: 8px; border: 2px solid #e5e7eb; 
          border-radius: 6px; font-size: 14px; background: white; 
        }
        .setting-item input[type="checkbox"] { margin-right: 8px; }
        .overlay-sub-setting { 
          margin-left: 16px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 8px; 
        }
        .overlay-sub-setting.enabled { opacity: 1; }
        .counties-sub-setting, .dioceses-sub-setting { 
          margin-left: 16px; opacity: 0.6; transition: opacity 0.3s; margin-bottom: 8px; 
        }
        .counties-sub-setting.enabled, .dioceses-sub-setting.enabled { opacity: 1; }
        #counties-opacity-value, #dioceses-opacity-value { 
          font-weight: bold; color: #10b981; 
        }
        .settings-note { 
          background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; 
          padding: 12px; margin: 12px 0; font-size: 13px; 
        }
        .settings-note p { margin: 0 0 8px 0; color: #0369a1; }
        .settings-note code { 
          background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 3px; 
          padding: 2px 4px; font-size: 11px; font-family: monospace; 
        }
        .feature-preview { 
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; 
          padding: 12px; margin: 8px 0; 
        }
        .feature-preview h4 { margin: 0 0 6px 0; color: #475569; font-size: 14px; }
        .feature-preview p { margin: 0 0 8px 0; color: #6b7280; font-size: 12px; }
        .feature-preview button { 
          padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; 
          background: #f9fafb; color: #6b7280; cursor: not-allowed; font-size: 12px;
        }
        .settings-footer { 
          padding: 16px 20px; border-top: 2px solid #f1f5f9; display: flex; 
          gap: 10px; justify-content: flex-end; background: #f8fafc; 
          border-radius: 0 0 12px 12px; 
        }
        .settings-footer button { 
          padding: 10px 16px; border: 2px solid; border-radius: 6px; 
          cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s ease;
        }
        .settings-footer button:hover { transform: translateY(-1px); }
        
        /* Responsive design for data management */
        @media (max-width: 640px) {
          .data-management-actions {
            flex-direction: column;
          }
          
          .data-action-btn {
            min-width: auto;
            justify-content: center;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Uploaded data indicator animation */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .uploaded-data {
          animation: pulse 2s infinite;
        }
      `;
      
      document.head.appendChild(style);
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.bindSettingsEvents();
      this.bindFileUploadEvents(); // NEW: Bind file upload events
      this.setupSettingsLogo();
      this.modalCreated = true;
    };

    // Add new method to bind file upload events
    window.SettingsManager.bindFileUploadEvents = function() {
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
          if (window.FileUploadManager) {
            window.FileUploadManager.downloadDataWithSettings();
          }
        });
      }

      // Clear uploaded data button
      const clearBtn = document.getElementById('clear-uploaded-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('Return to default data source? This will clear your uploaded file.')) {
            if (window.FileUploadManager) {
              window.FileUploadManager.clearUploadedData();
            }
            this.updateDataManagementUI();
          }
        });
      }

      console.log('✅ File upload events bound');
    };

    // Add new method to update data management UI
    window.SettingsManager.updateDataManagementUI = function() {
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

      // Update status display
      const statusIcon = statusDisplay.querySelector('.data-status-icon');
      const statusText = statusDisplay.querySelector('.data-status-text');
      
      if (uploadStatus.hasUploadedData) {
        statusIcon.textContent = '📁';
        statusText.textContent = `${uploadStatus.currentFileName}`;
        statusDisplay.style.borderColor = '#10b981';
        statusDisplay.style.background = '#f0fdf4';
        
        if (featureCountEl) {
          featureCountEl.textContent = `${uploadStatus.featureCount} features loaded`;
        }
        
        // Show download and clear buttons
        if (downloadBtn) downloadBtn.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'flex';
        
      } else {
        statusIcon.textContent = '📊';
        statusText.textContent = 'Default dataset loaded';
        statusDisplay.style.borderColor = '#d1d5db';
        statusDisplay.style.background = 'white';
        
        if (featureCountEl) {
          const featureCount = window.geojsonData ? window.geojsonData.features?.length || 0 : 0;
          featureCountEl.textContent = `${featureCount} features loaded`;
        }
        
        // Hide download and clear buttons
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
      }

      // Update upload history
      if (uploadHistory && uploadStatus.uploadHistory && uploadStatus.uploadHistory.length > 0) {
        this.updateUploadHistoryUI(uploadStatus.uploadHistory);
        uploadHistory.style.display = 'block';
      } else if (uploadHistory) {
        uploadHistory.style.display = 'none';
      }
    };

    // Add method to update upload history UI
    window.SettingsManager.updateUploadHistoryUI = function(history) {
      const historyList = document.getElementById('upload-history-list');
      if (!historyList) return;

      historyList.innerHTML = '';

      history.slice(0, 3).forEach(item => { // Show only last 3 uploads
        const historyItem = document.createElement('div');
        historyItem.className = 'upload-history-item';
        
        const uploadDate = new Date(item.uploadDate);
        const formattedDate = uploadDate.toLocaleDateString();
        
        historyItem.innerHTML = `
          <div>
            <div class="upload-history-name">${item.fileName}</div>
            <div class="upload-history-details">${item.featureCount} features</div>
          </div>
          <div class="upload-history-details">${formattedDate}</div>
        `;
        
        historyList.appendChild(historyItem);
      });
    };

    // Override populateSettingsForm to include data management UI update
    const originalPopulateSettingsForm = window.SettingsManager.populateSettingsForm;
    window.SettingsManager.populateSettingsForm = function() {
      // Call original method
      originalPopulateSettingsForm.call(this);
      
      // Update data management UI
      this.updateDataManagementUI();
    };

    // Listen for data upload events to update UI
    window.addEventListener('mapalister:dataUploaded', () => {
      if (window.SettingsManager.updateDataManagementUI) {
        window.SettingsManager.updateDataManagementUI();
      }
    });

    console.log('✅ SettingsManager enhanced with file upload functionality');
  }

  // Start waiting for dependencies
  waitForDependencies();

})();