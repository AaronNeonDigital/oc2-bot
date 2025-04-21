const api = require('../api/api');

/**
 * Updates crime data from Torn API
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        await api.updateCrimeData();
        await interaction.editReply('✅ Crime data updated successfully from Torn API!');
    } catch (error) {
        console.error('Update command error:', error);
        await interaction.editReply('❌ Failed to update crime data: ' + error.message);
    }
};