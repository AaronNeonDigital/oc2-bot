const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');

/**
 * Shows the CPR thresholds for each crime difficulty
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎯 CPR Thresholds by Difficulty')
            .setDescription('Here are the minimum Checkpoint Pass Rate (CPR) requirements for each crime difficulty level:')
            .setTimestamp();

        // Add each difficulty level
        Object.entries(config.crimeLevels)
            .sort((a, b) => a[0] - b[0])
            .forEach(([difficulty, data]) => {
                embed.addFields({
                    name: `Difficulty ${difficulty} (${data.name})`,
                    value: `Minimum CPR: ${data.minCpr}`
                });
            });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Threshold error:', error);
        await interaction.editReply('❌ Failed to display thresholds: ' + error.message);
    }
};