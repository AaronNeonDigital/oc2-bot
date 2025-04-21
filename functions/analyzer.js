const { config } = require('../config/config');
const db = require('../database/database');

const crimeAnalyzer = {
    // Check if a user meets the CPR requirement for a crime
    userMeetsCprRequirement: function(userCpr, crimeDifficulty) {
        const minCpr = config.getMinimumCpr(crimeDifficulty);
        console.log(`Checking CPR: User CPR ${userCpr}, Required for difficulty ${crimeDifficulty}: ${minCpr}`);
        return userCpr >= minCpr;
    },

    // Get users who don't meet CPR requirements for their slots
    getUsersBelowRequiredCpr: function(crime) {
        const crimeDifficulty = crime.difficulty;
        const requiredCpr = config.getMinimumCpr(crimeDifficulty);
        console.log(`Analyzing crime ID ${crime.id}, Name: ${crime.name}, Difficulty: ${crimeDifficulty}, Required CPR: ${requiredCpr}`);

        const failingUsers = [];

        crime.slots.forEach(slot => {
            if (slot.user_id) {
                console.log(`Checking user ${slot.user_id}, Position: ${slot.position}, CPR: ${slot.checkpoint_pass_rate}`);
                if (!this.userMeetsCprRequirement(slot.checkpoint_pass_rate, crimeDifficulty)) {
                    console.log(`User ${slot.user_id} does not meet CPR requirement for difficulty ${crimeDifficulty}`);
                    failingUsers.push({
                        userId: slot.user_id,
                        position: slot.position,
                        currentCpr: slot.checkpoint_pass_rate,
                        requiredCpr: requiredCpr,
                        cprDifference: requiredCpr - slot.checkpoint_pass_rate
                    });
                }
            }
        });

        return failingUsers;
    },

    // Analyze all active crimes
    analyzeActiveCrimes: function() {
        const data = db.getCrimeData();
        console.log(`Total crimes: ${data.crimes.length}`);

        const results = {
            totalCrimes: data.crimes.length,
            activeCrimes: 0,
            crimesWithLowCpr: []
        };

        // Go through each crime
        data.crimes.forEach(crime => {
            // Only analyze recruiting or planning crimes
            if (['Recruiting', 'Planning'].includes(crime.status)) {
                results.activeCrimes++;
                console.log(`Analyzing active crime: ${crime.name}, ID: ${crime.id}, Status: ${crime.status}`);

                const failingUsers = this.getUsersBelowRequiredCpr(crime);
                console.log(`Found ${failingUsers.length} failing users in crime ${crime.id}`);

                if (failingUsers.length > 0) {
                    results.crimesWithLowCpr.push({
                        crimeId: crime.id,
                        crimeName: crime.name,
                        crimeDifficulty: crime.difficulty,
                        status: crime.status,
                        requiredCpr: config.getMinimumCpr(crime.difficulty),
                        users: failingUsers
                    });
                }
            }
        });

        console.log(`Active crimes: ${results.activeCrimes}, Crimes with CPR issues: ${results.crimesWithLowCpr.length}`);
        return results;
    },

    // Get summary stats grouped by difficulty
    getSummaryByDifficulty: function() {
        const data = db.getCrimeData();
        const activeByDifficulty = {};
        const problemsByDifficulty = {};

        // Initialize with all difficulties
        Object.keys(config.crimeLevels).forEach(difficulty => {
            activeByDifficulty[difficulty] = 0;
            problemsByDifficulty[difficulty] = {
                totalSlots: 0,
                problematicSlots: 0,
                requiredCpr: config.getMinimumCpr(difficulty)
            };
        });

        // Count active crimes by difficulty
        data.crimes.forEach(crime => {
            if (['Recruiting', 'Planning'].includes(crime.status)) {
                activeByDifficulty[crime.difficulty] = (activeByDifficulty[crime.difficulty] || 0) + 1;

                // Count problem slots
                const requiredCpr = config.getMinimumCpr(crime.difficulty);

                crime.slots.forEach(slot => {
                    if (slot.user_id) {
                        problemsByDifficulty[crime.difficulty].totalSlots++;

                        if (!this.userMeetsCprRequirement(slot.checkpoint_pass_rate, crime.difficulty)) {
                            problemsByDifficulty[crime.difficulty].problematicSlots++;
                        }
                    }
                });
            }
        });

        return {
            activeByDifficulty,
            problemsByDifficulty
        };
    },

    // Get most problematic users (those participating in multiple crimes with low CPR)
    getProblematicUsers: function() {
        const data = db.getCrimeData();
        const userProblems = {};

        // Go through each crime
        data.crimes.forEach(crime => {
            if (['Recruiting', 'Planning'].includes(crime.status)) {
                const requiredCpr = config.getMinimumCpr(crime.difficulty);

                // Check each slot
                crime.slots.forEach(slot => {
                    if (slot.user_id) {
                        // Initialize user entry if needed
                        if (!userProblems[slot.user_id]) {
                            userProblems[slot.user_id] = {
                                totalSlots: 0,
                                problematicSlots: 0,
                                positions: {},
                                crimes: []
                            };
                        }

                        // Count this slot
                        userProblems[slot.user_id].totalSlots++;

                        // Initialize position entry if needed
                        if (!userProblems[slot.user_id].positions[slot.position]) {
                            userProblems[slot.user_id].positions[slot.position] = {
                                totalSlots: 0,
                                problematicSlots: 0
                            };
                        }

                        // Count this position
                        userProblems[slot.user_id].positions[slot.position].totalSlots++;

                        // Check if problematic
                        if (!this.userMeetsCprRequirement(slot.checkpoint_pass_rate, crime.difficulty)) {
                            userProblems[slot.user_id].problematicSlots++;
                            userProblems[slot.user_id].positions[slot.position].problematicSlots++;

                            // Add crime details
                            userProblems[slot.user_id].crimes.push({
                                crimeId: crime.id,
                                crimeName: crime.name,
                                position: slot.position,
                                currentCpr: slot.checkpoint_pass_rate,
                                requiredCpr: requiredCpr,
                                cprDifference: requiredCpr - slot.checkpoint_pass_rate
                            });
                        }
                    }
                });
            }
        });

        // Filter to only problematic users and sort by number of problematic slots
        const problematicUsers = Object.entries(userProblems)
            .filter(([userId, data]) => data.problematicSlots > 0)
            .map(([userId, data]) => ({
                userId: userId,
                ...data
            }))
            .sort((a, b) => b.problematicSlots - a.problematicSlots);

        return problematicUsers;
    }
};

module.exports = crimeAnalyzer;