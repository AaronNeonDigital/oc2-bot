const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');
const db = require('../database/database');
const analyzer = require('../functions/analyzer');

/**
 * Shows statistics about current crimes
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        const data = db.getCrimeData();

        // Count crimes by status and name
        const statusCounts = {};
        const nameCounts = {};
        const difficultyCounts = {};

        data.crimes.forEach(crime => {
            statusCounts[crime.status] = (statusCounts[crime.status] || 0) + 1;
            nameCounts[crime.name] = (nameCounts[crime.name] || 0) + 1;
            difficultyCounts[crime.difficulty] = (difficultyCounts[crime.difficulty] || 0) + 1;
        });

        // Get summary by difficulty
        const summary = analyzer.getSummaryByDifficulty();

        // Create embed for stats
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 Crime Statistics')
            .setDescription(`Total Crimes: ${data.crimes.length}`)
            .addFields(
                {
                    name: 'Status Breakdown',
                    value: Object.entries(statusCounts)
                        .map(([status, count]) => `• ${status}: ${count}`)
                        .join('\n') || 'No crimes found',
                    inline: true
                },
                {
                    name: 'Types',
                    value: Object.entries(nameCounts)
                        .map(([name, count]) => `• ${name}: ${count}`)
                        .join('\n') || 'No crimes found',
                    inline: true
                },
                {
                    name: 'Difficulty',
                    value: Object.entries(difficultyCounts)
                        .sort((a, b) => a[0] - b[0])
                        .map(([diff, count]) => `• Level ${diff}: ${count}`)
                        .join('\n') || 'No crimes found',
                    inline: true
                }
            )
            .addFields(
                {
                    name: 'Active Crime CPR Issues',
                    value: Object.entries(summary.problemsByDifficulty)
                        .filter(([diff, data]) => data.totalSlots > 0)
                        .sort((a, b) => b[0] - a[0])
                        .map(([diff, data]) => {
                            const percentage = data.totalSlots === 0 ? 0 :
                                Math.round((data.problematicSlots / data.totalSlots) * 100);
                            return `• Difficulty ${diff} (${config.crimeLevels[diff].name}): ${data.problematicSlots}/${data.totalSlots} slots (${percentage}%) below ${data.requiredCpr} CPR`;
                        })
                        .join('\n') || 'No active crimes found'
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Stats error:', error);
        await interaction.editReply('❌ Failed to get statistics: ' + error.message);
    }
};