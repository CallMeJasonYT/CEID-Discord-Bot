const fs = require("fs");

let hold_save = false;

function save(data) {
  if (hold_save) {
    return;
  }
  hold_save = true;
  setTimeout(() => {
    fs.writeFile(
      "./verification_data.json",
      JSON.stringify(data, null, 2),
      (err) => {
        if (err) console.log(err);
      }
    );
    hold_save = false;
  }, 1000 * 30);
}

module.exports = { save };
