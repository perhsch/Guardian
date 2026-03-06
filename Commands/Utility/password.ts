import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// @ts-ignore — generate-password has no bundled types
import passwordGenerator from 'generate-password';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('generate-password')
        .setDescription('Generate a secure password.')
        .setDMPermission(false)
        .addStringOption((option) =>
            option.setName('length').setDescription('Length of the password').setRequired(true)
        )
        .addBooleanOption((option) =>
            option.setName('numbers').setDescription('Include numbers').setRequired(false)
        )
        .addBooleanOption((option) =>
            option.setName('symbols').setDescription('Include symbols').setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const length = interaction.options.getString('length', true);
        const numbers = interaction.options.getBoolean('numbers') ?? true;
        const symbols = interaction.options.getBoolean('symbols') ?? false;

        const password: string = passwordGenerator.generate({ length, numbers, symbols });

        await interaction.user.send(`Your secure password is: ${password}`);
        return interaction.reply('I have sent you a DM with your secure password!');
    },
};
