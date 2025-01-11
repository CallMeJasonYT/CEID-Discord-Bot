const { SlashCommandBuilder, EmbedBuilder, Collection } = require("discord.js");
const fs = require("fs");
const config = require("../config.json");
const log = require("../utils/log");

const reply = async (interaction, message) => {
  await interaction.reply({ content: message, flags: 64 });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Διαγράφει έναν καθορισμένο αριθμό μηνυμάτων.")
    .addIntegerOption((option) =>
      option
        .setName("num_of_msgs")
        .setDescription("Εισάγετε από 2 έως 100 μηνύματα για διαγραφή.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const num_of_msgs = interaction.options.getInteger("num_of_msgs");

    if (!Number.isInteger(num_of_msgs)) {
      return reply(interaction, "Παρακαλώ εισάγετε ακέραιο από 2 εώς 100.");
    }

    if (num_of_msgs < 2 || num_of_msgs > 100) {
      return reply(interaction, "Παρακαλώ εισάγετε ακέραιο από 2 εώς 100.");
    }

    await clearchannel(interaction, num_of_msgs);
  },
};

async function clearchannel(interaction, num_of_msgs) {
  try {
    let object = await interaction.channel.messages.fetch({
      limit: num_of_msgs,
    });
    if (object.size === 0) {
      return reply(interaction, "Δεν βρέθηκαν μηνύματα για διαγραφή");
    }
    let array = [];
    let people = [];

    object.forEach((msg) => {
      array.push(msg);
      if (!people.includes(msg.author.id)) {
        people.push(msg.author.id);
      }
    });

    array.reverse();
    let formated = "";

    for (let i in array) {
      let content = array[i].content.replace(
        /(\r\n|\n|\r)/gm,
        "\n" + array[i].author.tag + " : "
      );
      formated += array[i].author.tag + " : " + content + "\n";
    }

    let ppl = "";
    for (let i in people) {
      ppl += `<@${people[i]}> , `;
    }
    ppl = ppl.slice(0, -2);

    var d = new Date();
    let output = new EmbedBuilder()
      .setTitle("Cleared Messages")
      .setDescription(
        `Cleared **${array.length} messages** by moderator <@${
          interaction.user.id
        }> (${interaction.user.tag}, ${
          interaction.user.id
        })\n\nAt ${d.toLocaleString()}\n\nOn the channel <#${
          interaction.channel.id
        }>\nPeople involved : ${ppl}`
      );

    d = d.toLocaleDateString();
    d = d.replace(/\//g, "_");

    fs.writeFile(
      "Messages_Cleared_Logs/" + interaction.channel.name + "_" + d + ".txt",
      formated,
      (err) => {
        if (err) throw err;
      }
    );

    await interaction.channel.bulkDelete(array).then(() => {
      interaction.channel
        .send(`Deleted ${num_of_msgs} messages.`)
        .then((msg) => msg.delete({ timeout: 3000 }));

      interaction.client.channels.cache.get(config.clearedMsgsChannel).send({
        embeds: [output],
        files: [
          {
            attachment:
              "Messages_Cleared_Logs/" +
              interaction.channel.name +
              "_" +
              d +
              ".txt",
            name: `${interaction.channel.name}_${d}.txt`,
          },
        ],
      });
    });
  } catch (error) {
    console.log(error);
  }
}
