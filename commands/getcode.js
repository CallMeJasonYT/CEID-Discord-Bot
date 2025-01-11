const { SlashCommandBuilder } = require("discord.js");
const jsSHA = require("jssha");
const config = require("../config.json");
const sendMail = require("../gmail.js");
const refreshToken = require("../refresh_token.js");
let data = require("../backups/verification_data.json");
const { save } = require("../utils/save");
const log = require("../utils/log");

const SendEmail = async (front, text) => {
  const options = {
    to: front + "@ceid.upatras.gr",
    subject: "C.E.I.D. Discord Server",
    text: text,
    textEncoding: "base64",
    headers: [
      { key: "X-Application-Developer", value: "Amit Agarwal" },
      { key: "X-Application-Version", value: "v1.0.0.2" },
    ],
  };
  const messageId = await sendMail(options);
  return messageId;
};

const reply = async (interaction, message) => {
  await interaction.reply({ content: message, flags: 64 });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getcode")
    .setDescription("Παρακαλώ συμπλήρωσε το @ceid.upatras.gr email σου.")
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription(
          "Γραψε το username του email σου (πχ st1234567). Μην ξεχάσεις να γράψεις st."
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const mail = interaction.options.getString("email").toLowerCase();
    const user = interaction.user;
    const user_id_hashed = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" })
      .update(user.id)
      .getHash("HEX");
    const shaObj_AM = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" });
    shaObj_AM.update(mail);
    const AM_HASHED = shaObj_AM.getHash("HEX");

    if (data.users[user_id_hashed] && data.users[user_id_hashed].registered) {
      return reply(interaction, "Έχεις ήδη κάνει register.");
    }

    if (
      data.users[user_id_hashed] &&
      data.users[user_id_hashed].send_mail_tries > 3
    ) {
      reply(
        interaction,
        "Δεν έχεις άλλες Προσπάθειες, Παρακαλώ επικοινώνησε με τους διαχειριστές."
      );
      const member = await interaction.guild.members.fetch(user.id);
      log(
        member,
        config.verificationFailedLogsChannel,
        "#ff0000",
        "Spamαρε, οπότε κλειδώθηκε."
      );
      return;
    }

    if (!data.users[user_id_hashed]) {
      data.users[user_id_hashed] = {
        am: AM_HASHED,
        code: null,
        tries: 0,
        send_mail_tries: 0,
        registered: false,
      };
    } else {
      data.users[user_id_hashed].send_mail_tries++;
    }

    if (data.blacklist.includes(mail)) {
      return reply(interaction, "-_-");
    }

    if (/[^a-zA-Z0-9]/.test(mail)) {
      return reply(interaction, "Invalid E-mail Address.");
    }

    const test4 = mail.match(/\d+/g);
    if (test4) {
      if (test4.join("").length !== 7 || !mail.includes("st")) {
        return reply(interaction, "Invalid E-mail Address.");
      }
    }

    if (mail.length <= 3 || mail.length >= 30) {
      return reply(interaction, "Invalid E-mail address.");
    }

    if (data.verifiedIDs.includes(AM_HASHED)) {
      return reply(
        interaction,
        "Αυτός ο ΑΜ έχει ήδη χρησιμοποιηθεί στον server. Δικαιούσε 1 account ανα φοιτητή. Παρακαλώ επικοινώνησε με τους διαχειριστές για τυχόν πρόβλημα."
      );
    }

    let num;
    do {
      num = Math.floor(Math.random() * 10000) + 1;
    } while (data.codes[num]);

    data.codes[num] = user_id_hashed;
    data.users[user_id_hashed].code = num;
    data.users[user_id_hashed].am = AM_HASHED;

    const text = `Γεια ${user.username}#${user.discriminator}!\n\nΟ κωδικός σου είναι ο : " ${num} ".\n\nΠαρακαλώ γράψε "/verify ${num}" για να δεις τον υπόλοιπο server\n\nΑν δεν γνωρίζεις τι είναι αυτό το email τότε κάποιος χρησιμοποίησε τον AM σου στον Discord Server μας. Παρακαλώ αγνόησε αυτό το email.`;

    try {
      await SendEmail(mail, text);
      console.log("Στάλθηκε mail στον χρήστη : ", user.username);
    } catch (error) {
      console.error(error);
      refreshToken();
      return reply(interaction, "Google API Error, παρακαλώ Προσπαθήστε ξανά.");
    }

    save(data);
    reply(
      interaction,
      `Στέλνουμε μήνυμα στην διεύθυνση \`${mail}@ceid.upatras.gr\` ... \nΤσέκαρε το στην ιστοσελίδα https://webmail.ceid.upatras.gr/ για να το δείς πιο γρήγορα (στο gmail αργει να έρθει)`
    );
  },
};
