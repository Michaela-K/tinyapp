// const cookieParser = require("cookie-parser");
const {
  getUserByEmail,
  urlsForUser,
  hasUserId,
  passwordChk,
  generateRandomString,
} = require("./helpers");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const express = require("express");
const app = express();
const PORT = 8000; 

const bodyParser = require("body-parser"); //convert the request body from a Buffer into string that we can read
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 24 * 60 * 60 * 1000, //number representing the milliseconds from Date.now() for expiry
  })
  );
  
  app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}!`);
});

//JSON string representing the entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
}); 

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id; //fetching user id from cookie
  //JSON string representing the entire urlDatabase object
  let urls = urlsForUser(user_id, urlDatabase);
  console.log("/urls get user_id: ", user_id);
  console.log("/urls get urlDatabase: ", urlDatabase);
  const templateVars = {
    urls: urls,
    user: users[user_id],
  };
  res.render("urls_index", templateVars); //pass the URL data to our template
  // console.log(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  const user_id = req.session.user_id;
  // console.log("user_id new: ", user_id);
  const templateVars = {
    user: users[user_id],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log('app.get urls/id');
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  const user = users[req.session.user_id];  //entire user obj

  //compare whether the owner of this shortURl is curently logged in
  if(!user || urlDatabase[req.params.id].userID !== user.id){   
    res.status(401).send("Unauthorized: Edit");
  }
  const templateVars = {
    longURL: urlDatabase[req.params.id].longURL,
    shortURL: req.params.id,
    user,
  };
  res.render("urls_show", templateVars);
});

//to see new URL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if(shortURL !== urlDatabase[shortURL]){
    res.status(401).send("Inaccurate shortURL");
  }
  const longURL = urlDatabase[req.params.shortURL]; //redirect short URL section of "url shortening part2"
  res.redirect(longURL.longURL);
});

//Login GET
app.get("/login", (req, res) => {
  const user_id = req.body["user_id"]; //this grabs the user id cookie vs const user_id = req.cookies['user_id'] which assigns it
  const templateVars = {
    user: users[user_id],
  };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const user_id = req.session["user_id"];
  const templateVars = {
    user: users[user_id],
  };
  // console.log(findUserId("me@gmail.com", users));
  res.render("urls_register", templateVars);
});

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("Please Log In to view URLs");
  }else{
    res.redirect(`/login`);
  }
});

//Create short URL and enter Long URL
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("Please Log In/ Register");
  }
  const shortURL = generateRandomString();
  // urlDatabase[shortURL] = req.body.longURL; // the data in the input field will be avaialbe to us in the req.body.longURL variable, which we can store in our urlDatabase object. // Log the POST request body to the console
  let longURL = req.body.longURL;
  const user_id = req.session["user_id"];
  urlDatabase[shortURL] = { longURL: longURL, userID: user_id };
  // console.log("user_id", user_id);
  res.redirect(`/urls`);
});

//to update
app.post(`/urls/:shortURL/update`, (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(401).send("Unauthorized: Update1");
  }
  let longURL = req.body.longURL;
  const user_id = req.session.user_id;
  const userID = user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
    console.log("2");
  } else {
    console.log("3");
    res.status(401).send("Unauthorized: Update2");
  }
  res.redirect("/urls");
});

//to delete       //when its created, I see the user_id and UrlD, disappears when click delete
app.post(`/urls/:shortURL/delete`, (req, res) => {
  const user_id = req.session.user_id;
  const userID = user_id;
  // console.log("del - userID : ", userID);
  const userUrls = urlsForUser(userID, urlDatabase);
  // console.log("del - userUrls : ", userUrls);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("Unauthorized: Delete");
  }
});

//to login POST
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let user_id = hasUserId(email, users);

  if (!email || !password) {
    res.status(400).send("Please provide both an email and password");
  }
  if (passwordChk(email, password, users) && user_id) {
    req.session.user_id = user_id;
  } else {
    res.status(400).send("Please provide valid email and/or password");
  }

  // res.cookie('user_id', `${user_id}`); //res.cookie - To set the values on the cookie. each res.cookie can only set one cookie
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user_id = generateRandomString();

  if (!email || !password) {
    res.status(403).send("Please provide both an email and password");
  } else if (getUserByEmail(email, users)) {
    res.status(403).send("An account already exists for this email address");
    // res.status(403).render("error_show", templateVars); 
  } else {
    users[user_id] = {
      id: user_id,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    req.session.user_id = user_id;
  }
  res.redirect("/urls");
});

const urlDatabase = {
  //to track all the URL's and their shortened forms
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca", //key is the ID
    userID: "aJ48lW",
  },
  s9m5xK: {
    longURL: "http://www.google.com",
    userID: "cJ48lW"
  }
};

const users = {
  xyz123: {
    id: "xyz123",
    email: "me@gmail.com",
    password: "123",
  },
  lmn456: {
    id: "lmn456",
    email: "you@gmail.com",
    password: "123",
  },
};
