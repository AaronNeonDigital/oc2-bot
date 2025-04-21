const fs = require('fs');
const path = require('path');
const { config, defaultCrimeLevels } = require('../config/config');

// Make sure the data directory exists
if (!fs.existsSync(config.dataPath)) {
    fs.mkdirSync(config.dataPath, { recursive: true });
}

const db = {
    crimeData: null,

    // Save crime data to a JSON file
    saveCrimeData: function(data) {
        this.crimeData = data;
        fs.writeFileSync(
            path.join(config.dataPath, 'crimes.json'),
            JSON.stringify(data, null, 2)
        );
        return data;
    },

    // Load crime data from file or initialize empty
    loadCrimeData: function() {
        try {
            if (fs.existsSync(path.join(config.dataPath, 'crimes.json'))) {
                this.crimeData = JSON.parse(
                    fs.readFileSync(path.join(config.dataPath, 'crimes.json'), 'utf8')
                );
            } else {
                this.crimeData = { crimes: [], _metadata: {} };
                this.saveCrimeData(this.crimeData);
            }
        } catch (error) {
            console.error('Error loading crime data:', error);
            this.crimeData = { crimes: [], _metadata: {} };
        }
        return this.crimeData;
    },

    // Get crime data
    getCrimeData: function() {
        if (!this.crimeData) {
            return this.loadCrimeData();
        }
        return this.crimeData;
    },

    // Save custom CPR thresholds
    saveCprThresholds: function() {
        fs.writeFileSync(
            path.join(config.dataPath, 'cpr_thresholds.json'),
            JSON.stringify(config.crimeLevels, null, 2)
        );
        return config.crimeLevels;
    },

    // Load custom CPR thresholds
    loadCprThresholds: function() {
        try {
            if (fs.existsSync(path.join(config.dataPath, 'cpr_thresholds.json'))) {
                const thresholds = JSON.parse(
                    fs.readFileSync(path.join(config.dataPath, 'cpr_thresholds.json'), 'utf8')
                );

                // Update config with loaded thresholds
                Object.keys(thresholds).forEach(difficulty => {
                    if (config.crimeLevels[difficulty]) {
                        config.crimeLevels[difficulty].minCpr = thresholds[difficulty].minCpr;
                    }
                });

                console.log('Loaded custom CPR thresholds');
                return config.crimeLevels;
            }
        } catch (error) {
            console.error('Error loading CPR thresholds:', error);
            // Revert to defaults if there's an error
            config.resetCrimeLevels();
        }
        return config.crimeLevels;
    }
};

module.exports = db;