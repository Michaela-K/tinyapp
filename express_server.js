const express = require("express");
const app = express();
const PORT = 8000;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
const {
  getUserByEmail,
  urlsForUser,
  hasUserId,
  passwordChk,
  generateRandomString,
} = require("./helpers");
const { urlDatabase, users } = require("./databases");

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}!`);
});

// get URLS
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  let urls = urlsForUser(user_id, urlDatabase);
  const templateVars = {
    urls: urls,
    user: users[user_id],
  };
  res.render("urls_index", templateVars);
});

//get URLS NEW
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const user_id = req.session.user_id;
  const templateVars = {
    user: users[user_id],
  };
  return res.render("urls_new", templateVars);
});

//get URLS/:id
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const user = users[req.session.user_id];
  if (!user || urlDatabase[req.params.id].userID !== user.id) {
    return res.status(401).send("Unauthorized: Edit");
  }
  const templateVars = {
    longURL: urlDatabase[req.params.id].longURL,
    shortURL: req.params.id,
    user,
  };
  return res.render("urls_show", templateVars);
});

//get ShortUrl
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL];
  if (shortURL == undefined || longURL == undefined) {
    return res.status(401).send("Inaccurate URL");
  }
  return res.redirect(longURL.longURL);
});

//get Login
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect(`/urls`);
  }
  const user_id = req.body["user_id"];
  const templateVars = {
    user: users[user_id],
  };
  return res.render("urls_login", templateVars);
});

//get Register
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect(`/urls`);
  }
  const user_id = req.session["user_id"];
  const templateVars = {
    user: users[user_id],
  };
  return res.render("urls_register", templateVars);
});

//    "/"
app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.status(401).send("You're already logged in");
  }
  return res.redirect(`/login`);
});

/////////Post begins//////////////////

//post /URls
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("Please Log In/ Register");
  }
  const shortURL = generateRandomString();
  let longURL = req.body.longURL;
  const user_id = req.session["user_id"];
  urlDatabase[shortURL] = { longURL: longURL, userID: user_id };
  return res.redirect(`/urls`);
});

//post Update/Edit URL
app.post(`/urls/:shortURL/update`, (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    return res.status(401).send("Unauthorized: Update1");
  }
  let longURL = req.body.longURL;
  const user_id = req.session.user_id;
  const userID = user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = longURL;
    return res.redirect("/urls");
  } else {
    res.status(401).send("Unauthorized: Update2");
  }
  return res.redirect("/urls");
});

// post Delete URL
app.post(`/urls/:shortURL/delete`, (req, res) => {
  const user_id = req.session.user_id;
  const userID = user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  } else {
    return res.status(401).send("Unauthorized: Delete");
  }
});

//post Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let user_id = hasUserId(email, users);

  if (!email || !password) {
    return res.status(400).send("Please provide both an email and password");
  }
  if (passwordChk(email, password, users) && user_id) {
    req.session.user_id = user_id;
  } else {
    return res.status(400).send("Please provide valid email and/or password");
  }
  return res.redirect("/urls");
});

//post Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//post Register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user_id = generateRandomString();

  if (!email || !password) {
    return res.status(403).send("Please provide both an email and password");
  } else if (getUserByEmail(email, users)) {
    return res
      .status(403)
      .send("An account already exists for this email address");
  } else {
    users[user_id] = {
      id: user_id,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    req.session.user_id = user_id;
  }
  return res.redirect("/urls");
});
