const path = require('path');
const {existsSync, readFileSync, writeFileSync} = require("node:fs");
require('dotenv').config();

// Default crime difficulty levels and CPR requirements
const defaultCrimeLevels = {
    1: { minCpr: 10, name: "Mob Mentality / Pet Project" },
    2: { minCpr: 20, name: "Cash Me If You Can / Best Of The Lot" },
    3: { minCpr: 30, name: "Smoke And Wing Mirrors / Market Forces" },
    4: { minCpr: 40, name: "Snow Blind / Stage Fright" },
    5: { minCpr: 50, name: "Leave No Trace" },
    6: { minCpr: 60, name: "Honey Trap" },
    7: { minCpr: 70, name: "Blast From The Past" },
    8: { minCpr: 80, name: "Break The Bank" },
    9: { minCpr: 90, name: "???" },
    10: { minCpr: 100, name: "??" }
};

// Main configuration object
const config = {
    // Admin user IDs that can manage API keys
    admins: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [],

    // API keys and management
    apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : [],
    currentKeyIndex: 0,
    apiBaseUrl: 'https://api.torn.com/v2',

    // Bot data storage
    dataPath: path.join(__dirname, '../data'),

    // Crime levels
    crimeLevels: { ...defaultCrimeLevels },

    // Save API keys to file
    saveApiKeys: function() {
        const keysPath = path.join(this.dataPath, 'api_keys.json');
        try {
            writeFileSync(
                keysPath,
                JSON.stringify({ apiKeys: this.apiKeys }, null, 2)
            );
            console.log(`Saved ${this.apiKeys.length} API keys to ${keysPath}`);
            return true;
        } catch (error) {
            console.error("Error saving API keys:", error);
            return false;
        }
    },

    // Load API keys from file
    loadApiKeys: function() {
        const keysPath = path.join(this.dataPath, 'api_keys.json');
        try {
            if (existsSync(keysPath)) {
                const data = JSON.parse(readFileSync(keysPath, 'utf8'));
                if (data.apiKeys && Array.isArray(data.apiKeys)) {
                    this.apiKeys = data.apiKeys;
                    console.log(`Loaded ${this.apiKeys.length} API keys from ${keysPath}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Error loading API keys:", error);
            return false;
        }
    },

    // Add a new API key
    addApiKey: function(apiKey) {
        // Check if key already exists
        if (this.apiKeys.includes(apiKey)) {
            return { success: false, message: 'This API key already exists' };
        }

        // Add the key
        this.apiKeys.push(apiKey);

        // Save keys to file
        if (this.saveApiKeys()) {
            return {
                success: true,
                message: 'API key added successfully',
                count: this.apiKeys.length
            };
        } else {
            // Remove the key if saving failed
            this.apiKeys.pop();
            return { success: false, message: 'Failed to save API key' };
        }
    },

    // Remove an API key
    removeApiKey: function(apiKey) {
        // Check if key exists
        if (!this.apiKeys.includes(apiKey)) {
            return { success: false, message: 'This API key does not exist' };
        }

        // Remove the key
        this.apiKeys = this.apiKeys.filter(key => key !== apiKey);

        // Save keys to file
        if (this.saveApiKeys()) {
            return {
                success: true,
                message: 'API key removed successfully',
                count: this.apiKeys.length
            };
        } else {
            return { success: false, message: 'Failed to save changes' };
        }
    },

    // List API keys (with obfuscation for security)
    listApiKeys: function() {
        return this.apiKeys.map((key, index) => {
            // Show only first 4 and last 4 characters of each key
            const firstPart = key.substring(0, 4);
            const lastPart = key.substring(key.length - 4);
            const middlePart = '*'.repeat(Math.min(8, key.length - 8));

            return {
                index: index + 1,
                key: `${firstPart}${middlePart}${lastPart}`
            };
        });
    },

    // Check if a user is an admin
    isAdmin: function(userId) {
        return this.admins.includes(userId);
    },

    // Reset crime levels to defaults
    resetCrimeLevels: function() {
        console.log('Resetting CPR thresholds to defaults');
        this.crimeLevels = { ...defaultCrimeLevels };
        console.log('New thresholds:', JSON.stringify(this.crimeLevels));
        return this.crimeLevels;
    },

    // Get the minimum CPR for a difficulty level
    getMinimumCpr: function(difficulty) {
        return this.crimeLevels[difficulty]?.minCpr || 0;
    },

    // Set the minimum CPR for a difficulty level
    setMinimumCpr: function(difficulty, cprValue) {
        if (this.crimeLevels[difficulty]) {
            this.crimeLevels[difficulty].minCpr = cprValue;
            return true;
        }
        return false;
    },

    // Set all CPR values to the same value
    setAllCpr: function(cprValue) {
        for (const difficulty in this.crimeLevels) {
            this.crimeLevels[difficulty].minCpr = cprValue;
        }
        return this.crimeLevels;
    },

    // Adjust all CPR values by a percentage
    adjustAllCpr: function(percentage) {
        const oldValues = {};

        for (const difficulty in this.crimeLevels) {
            oldValues[difficulty] = this.crimeLevels[difficulty].minCpr;

            // Calculate new value with percentage adjustment
            let newValue = Math.round(oldValues[difficulty] * (1 + percentage / 100));

            // Ensure the value is between 0-100
            newValue = Math.max(0, Math.min(100, newValue));

            // Update the value
            this.crimeLevels[difficulty].minCpr = newValue;
        }

        return { oldValues, newValues: this.crimeLevels };
    },

    // Get the next API key in rotation
    getNextApiKey: function() {
        if (this.apiKeys.length === 0) {
            throw new Error('No API keys configured');
        }

        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }
};

module.exports = {
    config,
    defaultCrimeLevels
};