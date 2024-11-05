// database.js
const fs = require('fs');
const path = require('path');
const SQL = require('sql.js');

// Function to initialize the database
async function initializeDatabase() {
    const dbPath = path.join(__dirname, 'jobsDatabase.sqlite');
    let databaseData;

    try {
        databaseData = fs.readFileSync(dbPath);
    } catch (err) {
        console.error("Error reading database file:", err);
        throw err;
    }

    // Load SQL.js as a module and return the database instance
    const SQLModule = await SQL();
    return new SQLModule.Database(databaseData);
}

// Export the function
module.exports = initializeDatabase;
