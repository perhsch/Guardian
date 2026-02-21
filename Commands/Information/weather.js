const Discord = require(`discord.js`);
const weather = require(`weather-js`);

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('weather')
        .setDescription('Check the weather of a state or country.')
        .addStringOption((option) =>
            option
                .setName('location')
                .setDescription('The location to check the weather for.')
                .setRequired(true)
        ),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        const location = interaction.options.getString('location');
        weather.find({ search: location, degreeType: 'F' }, function (err, result) {
            if (err) {
                console.log(err);
                interaction.reply('There was an error while fetching the weather data.');
                return;
            }
            if (!result || result.length === 0) {
                interaction.reply(`No weather data found for ${location}.`);
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

            // Determine embed color based on temperature (F)
            let color = 0x2b9af3; // default blue
            const tempNum = Number(temperature);
            if (!Number.isNaN(tempNum)) {
                if (tempNum <= 32)
                    color = 0x3aa6ff; // icy
                else if (tempNum <= 50)
                    color = 0x6bc6ff; // cool
                else if (tempNum <= 68)
                    color = 0x55d7a3; // mild
                else if (tempNum <= 85)
                    color = 0xffb86b; // warm
                else color = 0xff6b6b; // hot
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

            interaction.reply({ embeds: [embed] });
        });
    },
};
