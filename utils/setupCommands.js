const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

const commands = [];
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Started clearing old application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config.clientID, config.ceidServerID),
      { body: [] }
    );

    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config.clientID, config.ceidServerID),
      {
        body: commands,
      }
    );

    console.log(
      "Successfully reloaded the following application (/) commands:"
    );
    commands.forEach((com) => {
      console.log("/" + com.name);
    });
  } catch (error) {
    console.error(error);
  }
})();
