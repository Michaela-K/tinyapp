const express = require("express");
const app = express();
const PORT = 8000; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {         //to track all the URL's and their shortened forms
  "b2xVn2": "http://www.lighthouselabs.ca",   //key is the ID
  "9sm5xK": "http://www.google.com",
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const bodyParser = require("body-parser");             //convert the request body from a Buffer into string that we can read
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Homepage!");
});

app.get("/urls", (req, res) => {
  //JSON string representing the entire urlDatabase object
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);       //pass the URL data to our template
});

app.get("/urls.json", (req, res) => {
  //JSON string representing the entire urlDatabase object
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {      //to present the form to the user
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {  //The : in front of shortURL indicates that shortURL is a route parameter. This means that the value in this part of the url will be available in the req.params object.
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: req.params.longURL,
  };
  res.render("urls_show", templateVars);
});
                                        //why doesnt my curl work??
app.get("/u/:shortURL", (req, res) => {               //?????is this ok if we have the one above?
  const longURL = urlDatabase[req.params.shortURL];   //redirect short URL section of "url shortening part2"
  res.redirect(longURL);     
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();               //?????LINE 6 "url shortening part2"
  urlDatabase[shortURL] = {shortURL: req.body.longURL}; // the data in the input field will be avaialbe to us in the req.body.longURL variable, which we can store in our urlDatabase object. // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);                    //?????????
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

function generateRandomString(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
generateRandomString(6);
