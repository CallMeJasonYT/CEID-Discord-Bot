const jsSHA = require("jssha");
const data = require("../verification_data.json");
const { save } = require("../utils/save");

const reply = async (interaction, message) => {
  await interaction.reply({ content: message, flags: 64 });
};

module.exports = async (interaction) => {
  if (interaction.customId.startsWith("resetID_")) {
    const userID = interaction.customId.split("_")[1];
    const encryptedUserID = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" })
      .update(userID)
      .getHash("HEX");

    if (data.users[encryptedUserID]) {
      const userData = data.users[encryptedUserID];

      if (!userData.registered) {
        delete data.users[encryptedUserID];

        for (const key in data.codes) {
          if (data.codes[key] === encryptedUserID) {
            delete data.codes[key];
          }
        }

        const index = data.verifiedIDs.indexOf(encryptedUserID);
        if (index > -1) {
          data.verifiedIDs.splice(index, 1);
        }

        save(data);

        await interaction.update({
          content: `Οι προσπάθειες του χρήστη <@${userID}> έχουν επαναφερθεί.`,
          components: [],
        });
      } else {
        await reply(
          interaction,
          "Ο χρήστης έχει ήδη ολοκληρώσει την επαλήθευση."
        );
      }
    } else {
      await reply(interaction, "Ο χρήστης δεν βρέθηκε στα δεδομένα.");
    }
  }
};
