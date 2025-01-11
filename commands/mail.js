const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mail")
    .setDescription("Διαβάστε τα emails των καθηγητών και των γραμματειών."),
  async execute(interaction) {
    fs.readFile("./professors.json", "utf8", async (err, data) => {
      if (err) {
        return interaction.reply({
          content: "Σφάλμα κατά την ανάγνωση των δεδομένων.",
          flags: 64,
        });
      }

      const professors = JSON.parse(data);

      let content = [];
      for (const [name, emails] of Object.entries(professors)) {
        content.push(`**${name}** \t :point_right: \t ${emails.join(", ")}\n`);
      }

      const MAX_MESSAGE_LENGTH = 2000;
      let messages = [];
      let currentMessage = "";
      for (let i = 0; i < content.length; i++) {
        if (currentMessage.length + content[i].length <= MAX_MESSAGE_LENGTH) {
          currentMessage += content[i];
        } else {
          messages.push(currentMessage);
          currentMessage = content[i];
        }
      }

      if (currentMessage.length > 0) {
        messages.push(currentMessage);
      }

      await interaction.reply({ content: "Fetching emails..." });

      for (let i = 0; i < messages.length; i++) {
        await interaction.followUp({ content: messages[i] });
      }
    });
  },
};
