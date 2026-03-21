import { ChatInputCommandInteraction } from 'discord.js';
import { UsersManager } from '../../Classes/UsersManager.ts';
import { GuildsManager } from '../../Classes/GuildsManager.ts';

export default {
    name: 'interactionCreate',
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction: ChatInputCommandInteraction, client: any) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Fetch user and guild data
        let dbUser = null;
        let dbGuild = null;

        if (interaction.guild) {
            try {
                dbUser = await UsersManager.fetch(interaction.user.id, interaction.guild.id);
                dbGuild = await GuildsManager.fetch(interaction.guild.id);
            } catch (error) {
                console.error('Error fetching user/guild data:', error);
            }
        }

        try {
            // Handle subcommands vs regular commands
            const subcommandGroup = interaction.options.getSubcommandGroup(false);
            const subcommand = interaction.options.getSubcommand(false);
            
            if (subcommandGroup !== null || subcommand !== null) {
                // This has subcommands (either group or individual)
                const subcommandFullName = subcommandGroup 
                    ? `${interaction.commandName}.${subcommandGroup}.${subcommand}`
                    : `${interaction.commandName}.${subcommand}`;
                const commandToExecute = subcommandGroup 
                    ? client.subCommands.get(subcommandFullName)
                    : client.subCommands.get(subcommandFullName);
                
                if (commandToExecute && commandToExecute.execute) {
                    await commandToExecute.execute(interaction, client, dbGuild?.document, dbUser?.document);
                } else {
                    console.error(`No subcommand matching ${subcommandFullName} was found.`);
                    const errorMessage = {
                        content: 'This subcommand is not available!',
                        ephemeral: true
                    };

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage);
                    } else {
                        await interaction.reply(errorMessage);
                    }
                }
            } else {
                // This is a regular command (no subcommands)
                await command.execute(interaction, client, dbGuild?.document, dbUser?.document);
            }
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: 'There was an error while executing this command!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
