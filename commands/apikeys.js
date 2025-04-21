const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');

/**
 * Handles API key management commands
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    // Check if user is admin
    if (!config.isAdmin(interaction.user.id)) {
        // Updated to use the correct method for ephemeral messages
        await interaction.reply({
            content: '❌ You do not have permission to manage API keys.',
            ephemeral: true
        });
        return;
    }

    // Simple defer without ephemeral option
    await interaction.deferReply();

    try {
        // Get subcommand
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            // Handle list command
            const apiKeys = config.listApiKeys();

            if (apiKeys.length === 0) {
                await interaction.editReply('No API keys configured. Use `/apikeys add` to add a key.');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🔑 API Keys')
                .setDescription(`${apiKeys.length} API key(s) configured`)
                .addFields(
                    apiKeys.map(key => ({
                        name: `Key #${key.index}`,
                        value: `\`${key.key}\` (obfuscated)`
                    }))
                )
                .setFooter({ text: 'Keys are masked for security. Use DMs to add/remove keys.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
        else {
            await interaction.editReply(
                '⚠️ For security reasons, API key management can only be done via DM.\n' +
                'Please send me a direct message with one of these commands:\n\n' +
                '`!addkey YOUR_API_KEY` - Add a new API key\n' +
                '`!removekey YOUR_API_KEY` - Remove an existing API key\n' +
                '`!listkeys` - List all API keys (obfuscated)\n\n' +
                'Your API keys are sensitive information and should not be shared in public channels.'
            );
        }
    } catch (error) {
        console.error('API keys command error:', error);
        await interaction.editReply('❌ An error occurred while managing API keys.');
    }
};