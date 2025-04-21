const { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, ChannelType } = require('discord.js');
const { config } = require('./config/config');
const db = require('./database/database');
const handleDirectMessage = require('./commands/directMessageHandler');
const { commandDefinitions, commandHandlers } = require('./commands');
require('dotenv').config();

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMembers
    ]
});

// Register commands when the bot starts up
async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandDefinitions }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Event handlers
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot User ID: ${client.user.id}`);

    // Register slash commands
    registerCommands();

    // Set bot status
    client.user.setPresence({
        activities: [{ name: 'Monitoring Torn crimes', type: ActivityType.Watching }],
        status: 'online'
    });

    // Load API keys
    config.loadApiKeys();
    console.log(`Loaded ${config.apiKeys.length} API key(s)`);

    // Load custom CPR thresholds
    db.loadCprThresholds();

    // Load initial crime data
    db.loadCrimeData();

    // Set up automatic data refresh (every hour)
    setInterval(async () => {
        try {
            const api = require('./api/api');
            await api.updateCrimeData();
            console.log('Auto-updated crime data');
        } catch (error) {
            console.error('Auto-update failed:', error);
        }
    }, 60 * 60 * 1000); // 1 hour

    // Log admin users
    console.log(`Admin users: ${config.admins.join(', ')}`);
});

// Remove the existing Events.MessageCreate handler and replace with this:

client.on('raw', async packet => {
    // Only process MESSAGE_CREATE events
    if (packet.t !== 'MESSAGE_CREATE') return;

    const data = packet.d;

    // Check if this is a DM (channel_type 1 = DM)
    if (data.channel_type === 1) {
        console.log(`DM detected from raw event: ${data.content} from ${data.author.username}`);

        try {
            // Get the actual user object from Discord
            const user = await client.users.fetch(data.author.id);

            // Create a simplified message object with a reply method
            const simpleMessage = {
                content: data.content,
                author: {
                    id: data.author.id,
                    tag: `${data.author.username}#${data.author.discriminator || '0'}`,
                    username: data.author.username,
                    bot: data.author.bot
                },
                channel: {
                    id: data.channel_id,
                    type: 'DM',
                    send: async (content) => {
                        return user.send(content);
                    }
                },
                // Add the reply method
                reply: async (content) => {
                    return user.send(content);
                }
            };

            // Call your handleDirectMessage with our improved message object
            await handleDirectMessage(simpleMessage, client);
        } catch (error) {
            console.error('Error in custom handleDirectMessage:', error);
        }
    }
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const handler = commandHandlers[interaction.commandName];
    if (handler) {
        try {
            await handler(interaction);
        } catch (error) {
            console.error(`Error handling command ${interaction.commandName}:`, error);

            // Reply to the user if we haven't already
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('❌ An error occurred while processing the command.');
            } else {
                await interaction.reply('❌ An error occurred while processing the command.');
            }
        }
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Handle errors
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});