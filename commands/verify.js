const { SlashCommandBuilder } = require("discord.js");
const jsSHA = require("jssha");
const config = require("../config.json");
let data = require("../verification_data.json");
const { save } = require("../utils/save");
const log = require("../utils/log");

// Reply function
const reply = async (interaction, message) => {
  await interaction.reply({ content: message, flags: 64 });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription(
      "Γραψε τον κωδικό επιβεβαίωσης που έλαβες στο @ceid.upatras.gr email σου."
    )
    .addIntegerOption((option) =>
      option
        .setName("code")
        .setDescription("Έλεγξε το email σου (Μπορεί να είναι και στα Spam).")
        .setRequired(true)
    ),
  async execute(interaction) {
    const code = interaction.options.getInteger("code");
    const user = interaction.user;

    const user_id_hashed = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" })
      .update(user.id)
      .getHash("HEX");

    if (!data.users[user_id_hashed]) {
      return reply(
        interaction,
        "Παρακαλώ χρησιμοποίησε πρώτα την εντολή /getcode ακολουθώντας τις οδηγίες."
      );
    }

    const member = await interaction.guild.members.fetch(user.id);
    const userData = data.users[user_id_hashed];

    // Case 1: Check if the user is already registered
    if (userData && userData.registered) {
      await member.roles.add([config.verifiedRole]);
      log(
        member,
        config.verificationFailedLogsChannel,
        "#800080",
        `Αποφάσισε να δώσει στον εαυτό του ξανά τον ρόλο <@&${config.verifiedRole}>`
      );
      return reply(
        interaction,
        "Έχεις ήδη κάνει Register στον Server στο παρελθόν."
      );
    }

    // Case 2: Lockout after more than 10 failed tries
    if (userData.tries >= 10) {
      log(
        member,
        config.verificationFailedLogsChannel,
        "#ff0000",
        "Spamαρε, οπότε κλειδώθηκε."
      );
      return reply(
        interaction,
        "Δεν έχεις άλλες προσπάθειες για επαλήθευση. Παρακαλώ επικοινώνησε με τους διαχειριστές."
      );
    }

    // Case 3: Check if the code entered is correct
    if (userData.code === code) {
      // Case 4: Check if another user with the same AM is already registered
      const alreadyRegisteredUser = Object.values(data.users).find(
        (user) => user.am === userData.am && user.registered
      );

      if (alreadyRegisteredUser) {
        return reply(
          interaction,
          "Αυτός ο ΑΜ έχει ήδη χρησιμοποιηθεί για άλλον χρήστη. Παρακαλώ επικοινώνησε με τους διαχειριστές για βοήθεια."
        );
      }

      userData.registered = true;
      data.verifiedIDs.push(user_id_hashed);
      await member.roles.add([config.ceidasRole, config.verifiedRole]);

      save(data);

      log(
        member,
        config.verificationLogsChannel,
        "#0000FF",
        `Επαλήθευσε τον λογαριασμό του και έλαβε τον ρόλο <@&${config.ceidasRole}> και <@&${config.verifiedRole}>.`
      );

      return reply(
        interaction,
        `Η επαλήθευσή σου ήταν επιτυχής, ${user.username}! Καλωσήρθες στον server!`
      );
    } else {
      userData.tries++;
      save(data);

      return reply(
        interaction,
        `Ο κωδικός που εισήγαγες είναι λάθος. Παρακαλώ έλεγξε ξανά το email σου. Απομένουν **${
          10 - userData.tries
        }** προσπάθειες ακόμα.`
      );
    }
  },
};
