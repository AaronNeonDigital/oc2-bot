const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');
const db = require('../database/database');

/**
 * Sets the minimum CPR requirement for a specific difficulty level
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        // Get command options
        const difficulty = interaction.options.getInteger('difficulty');
        const cprValue = interaction.options.getInteger('cpr');

        // Validate that this difficulty exists
        if (!config.crimeLevels[difficulty]) {
            await interaction.editReply(`❌ Invalid difficulty level: ${difficulty}. Must be between 1-10.`);
            return;
        }

        // Store the old value for reference
        const oldCpr = config.crimeLevels[difficulty].minCpr;

        // Update the CPR value
        config.setMinimumCpr(difficulty, cprValue);

        // Save the updated thresholds
        db.saveCprThresholds();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ CPR Threshold Updated')
            .setDescription(`Successfully updated CPR threshold for difficulty ${difficulty} (${config.crimeLevels[difficulty].name}).`)
            .addFields(
                { name: 'Old Value', value: `${oldCpr}`, inline: true },
                { name: 'New Value', value: `${cprValue}`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Set CPR error:', error);
        await interaction.editReply('❌ Failed to update CPR threshold: ' + error.message);
    }
};