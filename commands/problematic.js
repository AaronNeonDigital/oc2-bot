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

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🔍 Problematic Users (Low CPR)')
            .setDescription(`Found ${problematicUsers.length} users with CPR below requirements.\nShowing top 10 users with most issues.`)
            .setTimestamp();

        // Process top problematic users
        const topUsers = problematicUsers.slice(0, 10);

        // Build each user entry
        topUsers.forEach(user => {
            // Get the primary position
            const primaryPos = Object.keys(user.positions)[0];

            // Get the representation of the SINGLE crime that has issues
            const crime = user.crimes[0]; // Just take the first crime for simplicity

            embed.addFields({
                name: `User ${user.username} [${user.userId}] (${user.problematicSlots}/${user.totalSlots} slots)`,
                value: `• ${primaryPos}: ${user.problematicSlots}/${user.totalSlots} slots with low CPR\n\n` +
                    `**Issues:**\n` +
                    `• ${crime.crimeName}: ${crime.position} CPR ${crime.currentCpr}/${crime.requiredCpr}`
            });
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Problematic users error:', error);
        await interaction.editReply('❌ Failed to analyze problematic users: ' + error.message);
    }
};