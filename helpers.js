const bcrypt = require("bcryptjs");

function getUserByEmail(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return null;
}

function urlsForUser(user_id, urlDatabase) {
  let userUrl = {};
  for (const url in urlDatabase) {
    console.log("fn urlsForUser urlD: ", urlDatabase[url].userID);
    console.log("fn urlsForUser user_id: ", user_id);
    if (urlDatabase[url].userID === user_id) {
      userUrl[url] = urlDatabase[url].longURL;
    }
  }
  return userUrl;
}

function hasUserId(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
  return false;
}
hasUserId();

function passwordChk(email, password, users) {
  for (const user in users) {
    if (
      users[user].email === email &&
      bcrypt.compareSync(password, users[user].password)
    ) {
      return true;
    }
  }
  return false;
}
passwordChk();

function generateRandomString() {
  let length = 6;
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
generateRandomString();

module.exports = {
  getUserByEmail,
  urlsForUser,
  hasUserId,
  passwordChk,
  generateRandomString,
};
