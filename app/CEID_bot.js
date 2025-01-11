const { Client, GatewayIntentBits, Collection } = require("discord.js");
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
const fs = require("fs");
const config = require("../config.json");
let customcommands = require("../custom_commands.json");

bot.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  bot.commands.set(command.data.name, command);
}

var args;

bot.on("ready", () => {
  console.log("Bot is online Nek!");
  bot.channels.cache
    .get(config.apodoxi_kanonismon_channel)
    .messages.fetch(config.entermessage);
  //refreshToken();
});

bot.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    // Handle Slash commands
    const command = bot.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      await interaction.reply({
        content: "There was an error while executing this command.",
        flags: 64,
      });
    }
  } else if (interaction.isButton()) {
    // Handle Buttons
    const buttonHandler = require("../handlers/buttonHandler");
    await buttonHandler(interaction);
  }
});

bot.on("messageCreate", (message) => {
  if (message.channel.type != "dm") {
    if (message.author.bot) {
      return;
    }
    if (
      message.member.roles.cache.some((r) => config.adminRole.includes(r.id))
    ) {
      if (message.content === null) {
        return;
      }
      args = message.content.split(" ");
    }
    if (message.channel.id == config.ideasChannel) {
      react_with_thumbs(message);
    }
    for (command in customcommands) {
      if (message.content.toLocaleLowerCase() === command.name) {
        message.channel.send(command.content);
        return;
      }
    }
  } else {
    args = message.content.split(" ");
    if (args[0] == "!send") {
      let wholemessage = message.content.replace(args[0] + " ", "");
      bot.channels.cache
        .get(config.anomologitaChannel)
        .send(wholemessage)
        .then(function (msg) {
          msg.react("731214599730495539");
        });
      message.react("731214599730495539");
    }
  }
});
async function react_with_thumbs(message) {
  if (message.content.toLocaleLowerCase().startsWith("-")) {
    await message.react("766327473578442782"); //+1
    await message.react("754299806490296342"); //-1
  }
}

//----------------------------------

bot.on("message", (message) => {
  if (message.channel.id === "852907441217994773") {
    let id;
    for (var i = 0; i < message.embeds.length; i++) {
      if (in_title(message, i, "Role removed")) {
        if (in_desk(message, i, config.mutedRole)) {
          id = get_id(message, i);
          if (muted[id]) {
            delete muted[id];
            save();
          }
        }
      } else if (in_title(message, i, "Role added")) {
        if (in_desk(message, i, config.mutedRole)) {
          id = get_id(message, i);
          muted[id] = true;
          save();
        }
      } else if (in_title(message, i, "Roles updated")) {
        if (in_desk(message, i, `**Added:** <@${config.mutedRole}>`)) {
          id = get_id(message, i);
          muted[id] = true;
          save();
        } else if (in_desk(message, i, `**Removed:** <@${config.mutedRole}>`)) {
          id = get_id(message, i);
          if (muted[id]) {
            delete muted[id];
            save();
          }
        }
      }
    }
  }
});

const in_title = (message, i, msg) => {
  if (message.embeds[i].title.includes(msg)) return true;
  else return false;
};

const in_desk = (message, i, msg) => {
  if (message.embeds[i].description.includes(msg)) return true;
  else return false;
};

const get_id = (message, i) => {
  return message.embeds[i].footer.text.slice(4, 22);
};

bot.login(config.token);
