const { EmbedBuilder } = require('discord.js');
const analyzer = require('../functions/analyzer');
const { config } = require('../config/config');

/**
 * Analyzes current crimes to find users with insufficient CPR
 * @param {Object} interaction - Discord interaction object
 */
module.exports = async (interaction) => {
    await interaction.deferReply();

    try {
        console.log("Running analyze command");
        console.log("Current CPR thresholds:", JSON.stringify(config.crimeLevels));

        const results = analyzer.analyzeActiveCrimes();

        console.log(`Analysis results: ${results.activeCrimes} active crimes, ${results.crimesWithLowCpr.length} with low CPR`);

        if (results.crimesWithLowCpr.length === 0) {
            console.log("No CPR issues found");
            await interaction.editReply('✅ All users meet CPR requirements in active crimes.');
            return;
        }

        // Create an embed for prettier output
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ CPR Issues Detected')
            .setDescription(`Found ${results.crimesWithLowCpr.length} active crimes with users below required CPR.`)
            .setTimestamp();

        // Sort by difficulty (highest first)
        results.crimesWithLowCpr.sort((a, b) => b.crimeDifficulty - a.crimeDifficulty);

        // Add fields for each crime (max 25 fields in an embed)
        const maxCrimes = Math.min(results.crimesWithLowCpr.length, 25);
        console.log(`Adding ${maxCrimes} crimes to embed`);

        for (let i = 0; i < maxCrimes; i++) {
            const crime = results.crimesWithLowCpr[i];

            // Create list of users with issues
            const userList = crime.users.map(user =>
                `• User ${user.userId}: ${user.position} - CPR: ${user.currentCpr}/${user.requiredCpr}`
            ).join('\n');

            console.log(`Adding crime ${crime.crimeId} with ${crime.users.length} problematic users`);

            embed.addFields(
                {
                    name: `${crime.crimeName} (Diff: ${crime.crimeDifficulty}, ID: ${crime.crimeId})`,
                    value: userList
                }
            );
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Analysis error:', error);
        await interaction.editReply('❌ Analysis failed: ' + error.message);
    }
};