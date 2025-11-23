#!/usr/bin/env node

/**
 * Script to add diocese values to city parishes in parishes_ecc.geojson
 * Maps city names to their corresponding dioceses
 */

const fs = require('fs');
const path = require('path');

// City to Diocese mapping based on Irish ecclesiastical geography
const cityToDiocese = {
  'Belfast': 'Down and Connor',
  'Dublin': 'Dublin',
  'Cork': 'Cork and Ross',
  'Limerick': 'Limerick',
  'Galway': 'Galway and Kilmacduagh',
  'Waterford': 'Waterford and Lismore',
  'Kilkenny': 'Ossory',
  'Derry': 'Derry',
  'Drogheda': 'Armagh',
  'Sligo': 'Elphin',
  'Clonmel': 'Waterford and Lismore',
  'Wexford': 'Ferns',
  'Maryborough': 'Kildare and Leighlin',
  'Athlone': 'Ardagh and Clonmacnois'
};

// Extract city name from canonical field
function extractCity(canonical) {
  if (!canonical) return null;
  const match = canonical.match(/^([^:]+) city:/);
  return match ? match[1].trim() : null;
}

// Main function
function fixDioceses() {
  const filePath = path.join(__dirname, 'data', 'parishes_ecc.geojson');
  
  console.log('📖 Reading parishes_ecc.geojson...');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let pointCount = 0;
  let updatedCount = 0;
  let missingCount = 0;
  const missingCities = new Set();
  
  // Process each feature
  data.features.forEach(feature => {
    // Only process Point features (city parishes)
    if (feature.geometry.type === 'Point') {
      pointCount++;
      
      const canonical = feature.properties.canonical;
      const county = feature.properties.county;
      const city = extractCity(canonical);
      
      if (city && cityToDiocese[city]) {
        feature.properties.diocese = cityToDiocese[city];
        updatedCount++;
      } else if (county === 'Dublin' || county === 'Wicklow') {
        // Dublin suburbs and Wicklow towns are in Dublin archdiocese
        feature.properties.diocese = 'Dublin';
        updatedCount++;
      } else if (county === 'Cork') {
        // Cork suburbs
        feature.properties.diocese = 'Cork and Ross';
        updatedCount++;
      } else {
        missingCount++;
        if (city) {
          missingCities.add(city);
        }
        console.warn(`⚠️  No diocese mapping for: ${canonical || feature.properties.parish} (${county})`);
      }
    }
  });
  
  // Write updated file
  const outputPath = path.join(__dirname, 'data', 'parishes_ecc_fixed.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  // Summary
  console.log('\n✅ Processing complete!');
  console.log(`📍 Total Point features: ${pointCount}`);
  console.log(`✓  Updated with diocese: ${updatedCount}`);
  console.log(`⚠  Missing diocese mapping: ${missingCount}`);
  
  if (missingCities.size > 0) {
    console.log(`\n🔍 Cities needing diocese mapping:`);
    Array.from(missingCities).sort().forEach(city => {
      console.log(`   - ${city}`);
    });
  }
  
  console.log(`\n📝 Output saved to: ${outputPath}`);
  console.log('💡 Review the file, then rename it to replace parishes_ecc.geojson');
}

// Run the script
try {
  fixDioceses();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
