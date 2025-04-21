const axios = require('axios');
const { config } = require('../config/config');
const db = require('../database/database');

const api = {
    // Fetch crime data from Torn API
    fetchCrimeData: async function() {
        try {
            const apiKey = config.getNextApiKey();
            const response = await axios.get(`${config.apiBaseUrl}/faction/crimes`, {
                headers: {
                    'Authorization': `ApiKey ${apiKey}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('API Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // Update local crime data from API
    updateCrimeData: async function() {
        try {
            const data = await this.fetchCrimeData();
            db.saveCrimeData(data);
            return data;
        } catch (error) {
            console.error('Failed to update crime data:', error);
            throw error;
        }
    }
};

module.exports = api;