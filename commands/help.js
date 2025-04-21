const { EmbedBuilder } = require('discord.js');
const { config, defaultCrimeLevels } = require('../config/config');

/**
 * Shows help information about all available commands
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    try {
        await interaction.deferReply();

        // Create main help embed
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🤖 Torn Crime Bot - Help Guide')
            .setDescription('This bot analyzes Torn faction crimes and monitors CPR requirements.')
            .setTimestamp();

        // Data commands
        embed.addFields({
            name: '📊 Data Commands',
            value: `
• \`/update\` - Fetch the latest crime data from the Torn API
• \`/analyze\` - Check for users with CPR below requirements
• \`/stats\` - Show statistics about current crimes
• \`/problematic\` - List users with the most CPR issues`
        });

        // CPR management commands
        embed.addFields({
            name: '⚙️ CPR Management Commands',
            value: `
• \`/threshold\` - Display current CPR requirements
• \`/setcpr\` - Set CPR for a specific difficulty
• \`/adjustcpr\` - Adjust all CPRs by percentage
• \`/resetcpr\` - Reset to default CPR values`
        });

        // Command examples
        embed.addFields({
            name: '📋 Examples',
            value: `
• \`/analyze\` - List all CPR issues in active crimes
• \`/setcpr difficulty:8 cpr:70\` - Set difficulty 8 to require 70 CPR
• \`/adjustcpr percentage:-10\` - Reduce all CPR requirements by 10%`
        });

        // CPR defaults info - using the imported defaultCrimeLevels
        let defaultCprInfo;
        if (defaultCrimeLevels) {
            defaultCprInfo = Object.entries(defaultCrimeLevels)
                .sort((a, b) => a[0] - b[0])
                .map(([diff, data]) => `Difficulty ${diff} (${data.name}): ${data.minCpr}`)
                .join('\n');
        } else {
            // Fallback if defaultCrimeLevels isn't available
            defaultCprInfo = 'unknown';
        }

        embed.addFields({
            name: '📝 Default CPR Requirements',
            value: defaultCprInfo
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Help command error:', error);

        // Make sure we reply even if there's an error
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply('❌ An error occurred while displaying help information.');
        } else {
            await interaction.reply('❌ An error occurred while displaying help information.');
        }
    }
};