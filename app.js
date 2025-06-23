const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;



// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(__dirname));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'vinay_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Load users from users.json
const usersFile = path.join(__dirname, 'users.json');
let users = {};
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
}

// Home Page
app.get('/', (req, res) => {
  res.render('home');
});

// Contact Page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Show Signup Page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Handle Signup Form
app.post('/signup', (req, res) => {
  const { name, userid, password } = req.body;
  if (!name || !userid || !password) {
    return res.send('❌ All fields are required.');
  }
  if (users[userid]) {
    return res.send('❌ User ID already exists. <a href="/signup">Try again</a>');
  }

  users[userid] = { name, password };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const userFolder = path.join(__dirname, 'uploads', userid);
  if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

  res.redirect('/login');
});

// Show Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle Login
app.post('/login', (req, res) => {
  const { userid, password } = req.body;
  if (users[userid] && users[userid].password === password) {
    req.session.userid = userid;
    res.redirect('/gallery');
  } else {
    res.send('❌ Invalid ID or password. <a href="/login">Try again</a>');
  }
});

// Show User Gallery
app.get('/gallery', (req, res) => {
  const userid = req.session.userid;
  if (!userid || !users[userid]) {
    return res.redirect('/login');
  }

  const folder = path.join(__dirname, 'uploads', userid);
  if (!fs.existsSync(folder)) return res.send('No photos yet.');
  const files = fs.readdirSync(folder);
  res.render('gallery', { userid, files});
});

//css
app.use(express.static('public'));

// Show Upload Page
app.get('/upload', (req, res) => {
  const userid = req.session.userid;
  if (!userid || !users[userid]) {
    return res.redirect('/login');
  }
  res.render('upload');
});

// Handle Upload
app.post('/upload', (req, res) => {
  const userid = req.session.userid;
  if (!userid || !users[userid]) {
    return res.redirect('/login');
  }

  if (!req.files || !req.files.photo) {
    return res.send('❌ No photo selected.');
  }

  const userFolder = path.join(__dirname, 'uploads', userid);
  if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

  const file = req.files.photo;
  const savePath = path.join(userFolder, file.name);

  file.mv(savePath, err => {
    if (err) return res.status(500).send('❌ Upload failed.');
    res.redirect('/gallery');
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
