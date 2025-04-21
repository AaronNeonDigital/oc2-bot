const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');
const db = require('../database/database');

/**
 * Adjusts all CPR thresholds by a percentage
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        // Get command options
        const percentage = interaction.options.getInteger('percentage');

        // Apply the percentage adjustment
        const result = config.adjustAllCpr(percentage);

        // Save the updated thresholds
        db.saveCprThresholds();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ CPR Thresholds Adjusted')
            .setDescription(`All CPR thresholds have been adjusted by ${percentage > 0 ? '+' : ''}${percentage}%.`)
            .addFields(
                {
                    name: 'Updated Values',
                    value: Object.entries(config.crimeLevels)
                        .sort((a, b) => a[0] - b[0])
                        .map(([diff, data]) => {
                            const oldValue = result.oldValues[diff];
                            const arrow = data.minCpr > oldValue ? '↑' : data.minCpr < oldValue ? '↓' : '→';
                            return `• Difficulty ${diff} (${data.name}): ${oldValue} ${arrow} ${data.minCpr}`;
                        })
                        .join('\n')
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Adjust CPR error:', error);
        await interaction.editReply('❌ Failed to adjust CPR thresholds: ' + error.message);
    }
};