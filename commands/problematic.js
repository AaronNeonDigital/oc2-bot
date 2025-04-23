const { EmbedBuilder } = require('discord.js');
const analyzer = require('../functions/analyzer');

/**
 * Shows the most problematic users with low CPR
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        const problematicUsers = analyzer.getProblematicUsers();

        if (problematicUsers.length === 0) {
            await interaction.editReply('✅ No users with CPR issues found in active crimes.');
            return;
        }

        // Create main embed
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🔍 Problematic Users (Low CPR)')
            .setDescription(`Found ${problematicUsers.length} users with CPR below requirements.\nShowing top 10 users with most issues.`)
            .setTimestamp();

        // Add top 10 problematic users
        const topUsers = problematicUsers.slice(0, 10);

        topUsers.forEach(user => {
            // Get positions with issues
            const problemPositions = Object.entries(user.positions)
                .filter(([pos, data]) => data.problematicSlots > 0)
                .map(([pos, data]) => `• ${pos}: ${data.problematicSlots}/${data.totalSlots} slots with low CPR`)
                .join('\n');

            // List crime details (limit to 3 per user to avoid too long messages)
            const crimeDetails = user.crimes
                .slice(0, 3)
                .map(crime =>
                    `• ${crime.crimeName}: ${crime.position} CPR ${crime.currentCpr}/${crime.requiredCpr}`
                )
                .join('\n');

            const moreText = user.crimes.length > 3 ? `... and ${user.crimes.length - 3} more crime(s)` : '';

            embed.addFields({
                name: `User ${user.username} [${user.userId}] (${user.problematicSlots}/${user.totalSlots} slots)`,
                value: `${problemPositions}\n\n**Issues:**\n${crimeDetails}${moreText ? '\n' + moreText : ''}`
            });
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Problematic users error:', error);
        await interaction.editReply('❌ Failed to analyze problematic users: ' + error.message);
    }
};