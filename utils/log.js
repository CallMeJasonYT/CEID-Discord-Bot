const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const log = async (guildMember, channelId, embedColor, description) => {
  try {
    const channel = await guildMember.guild.channels.fetch(channelId);

    if (!channel) {
      console.error(`Log channel with ID "${channelId}" not found.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: `${guildMember.user.username}#${guildMember.user.discriminator}`,
        iconURL: guildMember.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `** Ο χρήστης:** ${guildMember.user.username}#${guildMember.user.discriminator}\n` +
          `**με User ID:** ${guildMember.id}\n\n` +
          description
      )
      .setTimestamp();

    const hasLockedOut = description.includes("κλειδώθηκε");

    const components = hasLockedOut
      ? [
          new ActionRowBuilder().setComponents(
            new ButtonBuilder()
              .setCustomId(`resetID_${guildMember.id}`)
              .setLabel("Reset Tries")
              .setStyle(ButtonStyle.Primary)
          ),
        ]
      : [];

    await channel.send({
      embeds: [embed],
      components: components,
    });
  } catch (error) {
    console.error("Error sending log message:", error.message || error);
  }
};

module.exports = log;
