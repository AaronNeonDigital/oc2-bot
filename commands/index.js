const { SlashCommandBuilder } = require('discord.js');

// Import all command handlers
const updateCommand = require('./update');
const analyzeCommand = require('./analyze');
const statsCommand = require('./stats');
const problematicCommand = require('./problematic');
const thresholdCommand = require('./threshold');
const setCprCommand = require('./setcpr');
const resetCprCommand = require('./resetcpr');
const adjustCprCommand = require('./adjustcpr');
const helpCommand = require('./help');
const apiKeysCommand = require('./apikeys');

// Command definitions for registration
const commandDefinitions = [
    new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update crime data from Torn API'),

    new SlashCommandBuilder()
        .setName('analyze')
        .setDescription('Analyze current crimes and check for users with low CPR'),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show crime statistics'),

    new SlashCommandBuilder()
        .setName('problematic')
        .setDescription('Show the most problematic users (those with low CPR)'),

    new SlashCommandBuilder()
        .setName('threshold')
        .setDescription('Show the CPR thresholds for each crime difficulty'),

    new SlashCommandBuilder()
        .setName('setcpr')
        .setDescription('Set the minimum CPR requirement for a crime difficulty')
        .addIntegerOption(option =>
            option.setName('difficulty')
                .setDescription('The difficulty level (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addIntegerOption(option =>
            option.setName('cpr')
                .setDescription('The minimum CPR value (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

    new SlashCommandBuilder()
        .setName('resetcpr')
        .setDescription('Reset all CPR requirements to default values'),

    new SlashCommandBuilder()
        .setName('adjustcpr')
        .setDescription('Adjust all CPR requirements by a percentage')
        .addIntegerOption(option =>
            option.setName('percentage')
                .setDescription('Percentage to adjust by (e.g., -10 for 10% lower, 20 for 20% higher)')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows information about available commands'),

    new SlashCommandBuilder()
        .setName('apikeys')
        .setDescription('Manage Torn API keys (admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all configured API keys (obfuscated)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('manage')
                .setDescription('Add or remove API keys (via DM for security)')
        )
];

// Command handlers map
const commandHandlers = {
    update: updateCommand,
    analyze: analyzeCommand,
    stats: statsCommand,
    problematic: problematicCommand,
    threshold: thresholdCommand,
    setcpr: setCprCommand,
    resetcpr: resetCprCommand,
    adjustcpr: adjustCprCommand,
    help: helpCommand,
    apikeys: apiKeysCommand
};

module.exports = {
    commandDefinitions,
    commandHandlers
};