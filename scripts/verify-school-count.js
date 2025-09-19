const fs = require('fs');
const path = require('path');

// Read the constants file
const constantsPath = path.join(__dirname, '../utils/constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Extract school names from constants file
const schoolMatches = constantsContent.match(/'([^']+)',/g);
const schoolsFromConstants = schoolMatches ? schoolMatches.map(match => match.slice(1, -2)) : [];

console.log(`Schools in constants file: ${schoolsFromConstants.length}`);

// Read all SQL files
const sqlFiles = [
    '../database/populate-schools-carlow-cavan-clare.sql',
    '../database/populate-schools-cork.sql', 
    '../database/populate-schools-remaining-counties.sql',
    '../database/populate-schools-final-counties.sql'
];

let allSchoolsFromSQL = [];

sqlFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Extract school names from SQL INSERT statements
    const sqlMatches = content.match(/\('([^']+)', '[^']+'\),?/g);
    if (sqlMatches) {
        const schools = sqlMatches.map(match => {
            const schoolName = match.match(/\('([^']+)',/)[1];
            return schoolName;
        });
        allSchoolsFromSQL = allSchoolsFromSQL.concat(schools);
        console.log(`${path.basename(filePath)}: ${schools.length} schools`);
    }
});

console.log(`Total schools in SQL files: ${allSchoolsFromSQL.length}`);

// Check for duplicates in SQL files
const uniqueSchoolsFromSQL = [...new Set(allSchoolsFromSQL)];
console.log(`Unique schools in SQL files: ${uniqueSchoolsFromSQL.length}`);

// Check if all schools from constants are in SQL
const missingSchools = schoolsFromConstants.filter(school => !uniqueSchoolsFromSQL.includes(school));
const extraSchools = uniqueSchoolsFromSQL.filter(school => !schoolsFromConstants.includes(school));

console.log(`\nMissing schools (in constants but not in SQL): ${missingSchools.length}`);
if (missingSchools.length > 0) {
    console.log('Missing schools:');
    missingSchools.forEach(school => console.log(`  - ${school}`));
}

console.log(`\nExtra schools (in SQL but not in constants): ${extraSchools.length}`);
if (extraSchools.length > 0) {
    console.log('Extra schools:');
    extraSchools.forEach(school => console.log(`  - ${school}`));
}

console.log(`\nVerification: ${missingSchools.length === 0 ? 'PASS' : 'FAIL'}`);



























