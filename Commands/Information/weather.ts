import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import * as EmbedGenerator from '../../Functions/embedGenerator.ts';
// @ts-ignore — weather-js has no types
import weather from 'weather-js';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Check the weather of a state or country.')
        .addStringOption((option) =>
            option
                .setName('location')
                .setDescription('The location to check the weather for.')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, _client: Client) {
        const location = interaction.options.getString('location', true);

        await interaction.deferReply();

        weather.find({ search: location, degreeType: 'F' }, async (err: any, result: any[]) => {
            if (err || !result || result.length === 0) {
                await interaction.editReply(err ? 'There was an error while fetching the weather data.' : `No weather data found for ${location}.`);
                return;
            }

            const current = result[0].current;
            const loc = result[0].location || {};
            const locationName = loc.name || location;
            const temperature = current.temperature;
            const feelsLike = current.feelslike;
            const description = current.skytext;
            const windSpeed = current.winddisplay;
            const humidity = current.humidity;
            const obsTime = current.observationtime || '';
            const image = current.imageUrl || current.image || null;

            let color = 0x2b9af3;
            const tempNum = Number(temperature);
            if (!Number.isNaN(tempNum)) {
                if (tempNum <= 32) color = 0x3aa6ff;
                else if (tempNum <= 50) color = 0x6bc6ff;
                else if (tempNum <= 68) color = 0x55d7a3;
                else if (tempNum <= 85) color = 0xffb86b;
                else color = 0xff6b6b;
            }

            const embed = EmbedGenerator.basicEmbed()
                .setTitle(`Weather — ${locationName}`)
                .setDescription(description)
                .setColor(color)
                .setTimestamp()
                .addFields(
                    { name: 'Temperature', value: `${temperature}°F`, inline: true },
                    { name: 'Feels Like', value: `${feelsLike}°F`, inline: true },
                    { name: 'Humidity', value: `${humidity}%`, inline: true },
                    { name: 'Wind', value: `${windSpeed}`, inline: true },
                    { name: 'Observed', value: `${obsTime}`, inline: true }
                );

            if (image) embed.setThumbnail(image);

            await interaction.editReply({ embeds: [embed] });
        });
    },
};
