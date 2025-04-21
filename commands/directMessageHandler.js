const { ChannelType } = require('discord.js');
const { config } = require('../config/config');

/**
 * Processes direct message commands
 * @param {Object} message - Discord message object
 * @param {Object} client - Discord client
 */
const handleDirectMessage = async (message, client) => {
    // Debug logging
    console.log(`DM received from ${message.author.tag} (${message.author.id}): ${message.content}`);

    // Ignore messages from bots
    if (message.author.bot) {
        console.log("Ignoring message from bot");
        return;
    }

    // Check channel type
    console.log(message);

    if (message.channel.type !== 'DM') {
        console.log(`Ignoring message from non-DM channel type: ${message.channel.type}`);
        return;
    }

    // Check if user is admin
    const isAdmin = config.isAdmin(message.author.id);
    console.log(`User admin status: ${isAdmin}`);
    console.log(`Admin list: ${config.admins}`);

    if (!isAdmin) {
        console.log(`User ${message.author.id} is not in admin list: ${config.admins}`);
        await message.reply('❌ You do not have permission to use admin commands.');
        return;
    }

    const content = message.content.trim();
    console.log(`Processing command: ${content}`);

    // Process commands
    try {
        if (content.startsWith('!addkey')) {
            console.log('Executing addkey command');
            await addApiKey(message);
        }
        else if (content.startsWith('!removekey')) {
            console.log('Executing removekey command');
            await removeApiKey(message);
        }
        else if (content.startsWith('!listkeys')) {
            console.log('Executing listkeys command');
            await listApiKeys(message);
        }
        else if (content.startsWith('!help')) {
            console.log('Executing help command');
            await showHelp(message);
        }
        else {
            console.log('Unknown command');
            await message.reply('Unknown command. Type `!help` for a list of available commands.');
        }
    } catch (error) {
        console.error('Error processing DM command:', error);
        try {
            await message.reply('An error occurred while processing your command.');
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
};

/**
 * Add an API key
 * @param {Object} message - Discord message
 */
const addApiKey = async (message) => {
    const content = message.content.trim();
    const parts = content.split(' ');

    if (parts.length < 2) {
        await message.reply('❌ Please provide an API key. Usage: `!addkey YOUR_API_KEY`');
        return;
    }

    const apiKey = parts[1].trim();

    // Simple validation (Torn API keys are alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(apiKey)) {
        await message.reply('❌ Invalid API key format. Torn API keys should only contain letters and numbers.');
        return;
    }

    const result = config.addApiKey(apiKey);

    if (result.success) {
        await message.reply(`✅ API key added successfully. You now have ${result.count} key(s) configured.`);
    } else {
        await message.reply(`❌ Failed to add API key: ${result.message}`);
    }
};

/**
 * Remove an API key
 * @param {Object} message - Discord message
 */
const removeApiKey = async (message) => {
    const content = message.content.trim();
    const parts = content.split(' ');

    if (parts.length < 2) {
        await message.reply('❌ Please provide an API key. Usage: `!removekey YOUR_API_KEY`');
        return;
    }

    const apiKey = parts[1].trim();
    const result = config.removeApiKey(apiKey);

    if (result.success) {
        await message.reply(`✅ API key removed successfully. You now have ${result.count} key(s) remaining.`);
    } else {
        await message.reply(`❌ Failed to remove API key: ${result.message}`);
    }
};

/**
 * List all API keys (obfuscated)
 * @param {Object} message - Discord message
 */
const listApiKeys = async (message) => {
    const apiKeys = config.listApiKeys();

    if (apiKeys.length === 0) {
        await message.reply('No API keys configured. Use `!addkey YOUR_API_KEY` to add a key.');
        return;
    }

    const keyList = apiKeys.map(key => `${key.index}. ${key.key} (obfuscated)`).join('\n');

    await message.reply(`**🔑 API Keys (${apiKeys.length}):**\n${keyList}`);
};

/**
 * Show DM help
 * @param {Object} message - Discord message
 */
const showHelp = async (message) => {
    const help = [
        '**🔑 API Key Management Commands:**',
        '`!addkey YOUR_API_KEY` - Add a new API key',
        '`!removekey YOUR_API_KEY` - Remove an existing API key',
        '`!listkeys` - List all API keys (obfuscated)',
        '`!help` - Show this help message',
        '',
        'These commands are only available to bot administrators.',
        'For security reasons, API key management can only be done via DM.'
    ].join('\n');

    await message.reply(help);
};

module.exports = handleDirectMessage;