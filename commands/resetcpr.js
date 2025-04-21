const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');
const db = require('../database/database');

/**
 * Resets all CPR thresholds to their default values
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        // Reset to defaults
        config.resetCrimeLevels();

        // Save the reset thresholds
        db.saveCprThresholds();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ CPR Thresholds Reset')
            .setDescription('All CPR thresholds have been reset to their default values.')
            .addFields(
                {
                    name: 'Default Values',
                    value: Object.entries(config.crimeLevels)
                        .sort((a, b) => a[0] - b[0])
                        .map(([diff, data]) => `• Difficulty ${diff} (${data.name}): ${data.minCpr}`)
                        .join('\n')
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Reset CPR error:', error);
        await interaction.editReply('❌ Failed to reset CPR thresholds: ' + error.message);
    }
};