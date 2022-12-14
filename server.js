const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const bodyParser = require("body-parser");
// const User = require('./models/user');
const Lead = require("./models/leads");
const Task = require("./models/task");
const Document = require("./models/document");

const port = process.env.PORT || 5000;
const ConnectionDB = require("./database");
ConnectionDB();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//seting static files
app.use(express.static("public")); //for servinhg staticfile
app.use("/css", express.static(__dirname + "public/css"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/img", express.static(__dirname + "public/img"));

//setting view engine to EJS
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret:
      "56e8723jixdoi3wxe-0i2e02ircm9qfc'qzhgjjjkbhkow9xuednx@!&t89udjxdwnind",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  email: String,
  userDisplayName: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
  },
  companyName: {
    type: String,
  },
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      console.log(profile.emails[0].value);
      User.findOrCreate(
        {
          username: profile.emails[0].value,
          email: profile.emails[0].value,
          googleId: profile.id,
          userDisplayName: profile.displayName,
        },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to homepage .
    res.redirect("/");
  }
);

app.get("/", (req, res) => {
  res.render("index", { req: req, user: req.user });
});
app.get("/login", (req, res) => {
  res.render("login", { req: req, user: req.user });
});
app.get("/signup", (req, res) => {
  res.render("signup", { req: req, user: req.user });
});
app.get("/leads", (req, res) => {
  res.render("leads", { req: req, user: req.user });
});

app.get("/email/:id", (req, res) => {

  res.render("email", { req: req, user: req.user,em:req.params.id});
});

app.get("/emailtable", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user)
    Lead.find({ userId: req.user.id }).then(function (crm) {
      res.render("emailtable", { req: req, user: req.user, crm: crm });
    })
  } else {
    res.redirect("/login");
  }
 
});
app.get("/dashboard", async (req, res) => {
  if (req.isAuthenticated()) {
    const va = await Task.find({userId: req.user.id })
    console.log(va.length)
    const la = await Document.find({userId: req.user.id })
    console.log(va.length)
    Lead.find({ userId: req.user.id }).then(function (crm) {
      res.render("dashboard", { req: req, user: req.user, crm: crm,Task:va,Document:la });
    })
  } else {
    res.redirect("/login");
  }
});
app.get("/documenttable", (req, res) => {
  if (req.isAuthenticated()) {
    Document.find({ userId: req.user.id }).then(function (crm) {
      console.log(req.crm)
      res.render("documenttable", { req: req, user: req.user, crm: crm });
    })
  } else {
    res.redirect("/login");
  }

});
app.get("/documentform", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("documentform", { req: req, user: req.user });
  } else {
    res.redirect("/login");
  }
});
app.get("/tasktable", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.body)
    Task.find({ userId: req.user.id }).then(function (crm) {
      res.render("tasktable", { req: req, user: req.user, crm: crm });
 
    })
  } else {
    res.redirect("/login");
  }
});
app.get("/taskform", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("taskform", { req: req, user: req.user });
  } else {
    res.redirect("/login");
  }
});
app.get("/leadmanagement", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("leadManagement", { req: req, user: req.user }); 
  } else {
    res.redirect("/login");
  }
});
app.get("/leadtable", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user)
    Lead.find({ userId: req.user.id }).then(function (crm) {
      res.render("leadtable", { req: req, user: req.user, crm: crm });
    })
  } else {
    res.redirect("/login");
  }


});

app.get("/logout", function (req, res) {
  console.log();
  req.logout();
  res.redirect("/");
});





const { readlink } = require('fs/promises');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const fs = require('fs')
const crypto = require('crypto');
let gfs;
const hostname = "https://crmmanager.herokuapp.com"
//create mongoose connection for multer 
const conn = mongoose.createConnection(process.env.MONGO_URI);

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route POST /avatar
// @desc  Uploads PROFILE PHOTO to Database
app.post('/avatar', upload.single('file'), async (req, res) => {
  User.findOneAndUpdate({ _id: req.user.id }, { $set: { Avatar: `${hostname}/api/userprofile/image/${req.file.filename}` } }, { new: true }, (err, doc) => {
    if (err) {
      res.status(200).json({ sucess: false, message: "Try again later something went wrong" })
    }
    else {
      res.status(200).json({ sucess: true })
    }
  });
});

app.post('/banner', upload.single('file'), async (req, res) => {
  User.findOneAndUpdate({ _id: req.user.id }, { $set: { banner: `${hostname}/api/userprofile/image/${req.file.filename}` } }, { new: true }, (err, doc) => {
    if (err) {
      res.status(200).json({ sucess: false, message: "Try again later something went wrong" })
    }
    else {
      res.status(200).json({ sucess: true })
    }
  });
});


app.post('/editdetails', upload.single('file'), async (req, res) => {
  User.findOneAndUpdate({ _id: req.user.id }, { $set: { name: req.body.name }, $set: { email: req.body.email }, $set: { mobileNo: req.body.mobileNo } }, { new: true }, (err, doc) => {
    if (err) {
      res.status(200).json({ sucess: false, message: "Try again later something went wrong" })
    }
    else {
      res.status(200).json({ sucess: true })
    }
  });
});


// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // Check if mimetype
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/jpg') {
      const bucket = new mongoose.mongo.GridFSBucket(conn, { bucketName: 'uploads' })
      let readStream = bucket.openDownloadStream(file._id)
      readStream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /deleteavatar/:id
// @desc  Delete profilephoto
app.delete('/deleteavatar/:id', async (req, res) => {
  try {

    await gfs.files.deleteOne({ filename: req.params.id })
    res.status(200).json({ Success: true })
  } catch (error) {
    res.status(404).json({
      err: 'Not found'
    });
  }
});





app.post("/login", function (req, res) {
  console.log(req.session.returnTo);
  const user = new User({
    username: req.body.email,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect(req.session.returnTo || "/");
      });
    }
  });
});

app.post("/register", function (req, res) {
  User.register(
    {
      username: req.body.username,
      userDisplayName: req.body.name,
      email: req.body.username,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/login");
      } else {
        console.log(req);
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});


app.post("/lead", upload.single('file'), async function (req, res) {
  try {

    console.log(req.user)
    const lead = new Lead({
      leadOwner: req.body.leadowner,
      firstName: req.body.firstname,
      title: req.body.title,
      mobile: req.body.mobile,
      leadSource: req.body.leadsource,
      company: req.body.company,
      annualRevenue: req.body.annualrevenue,
      lastName: req.body.lastname,
      leadEmail: req.body.email,
      website: req.body.website,
      numberOfEmployee: req.body.employees,
      rating: req.body.rating,
      street: req.body.street,
      state: req.body.state,
      city: req.body.state,
      zipcode: req.body.zipcode,
      description: req.body.description,
      attachment: `/api/userprofile/image/${req.file.filename}`,
      userId: req.user.id

    });

    const saved = await lead.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error.message);
    res.status(500).send(" Internal Server Error!! ");
  }
});

app.post("/document", upload.single('file'), async function (req, res) {
  try {
    console.log(req.file)
    const document = new Document({
      name: req.body.name,
      owner: req.body.owner,
      contact: req.body.contact,
      leads: req.body.leads,
      companies: req.body.companies,
      deals: req.body.deals,
      userId: req.user.id,
      uploads: `/api/userprofile/image/${req.file.filename}`

    });

    const saved = await document.save();
    res.redirect('/documenttable');
  } catch (error) {
    console.error(error.message);
    res.status(500).send(" Internal Server Error!! ");
  }
});


app.post("/tasks", async function (req, res) {
  try {
    console.log(req.user)
    const task = new Task({
      taskName: req.body.taskname,
      dueDate: req.body.duedate,
      dueTime: req.body.duetime,
      priority: req.body.priority,
      status: req.body.status,
      userId: req.user.id,


    });

    const saved = await task.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error.message);
    res.status(500).send(" Internal Server Error!! ");
  }
});









app.post("/email", async function (req, res) {
  try {
  
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLEINT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GOOGLE_CLIENT_REFRESH;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'axilldcunha@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: ' <axilldcunha@gmail.com>',
      to: req.body.tomail,
      subject: req.body.subject,
      text: 'CRM- Encryptors',
      html: req.body.ebody,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

sendMail()
  .then((result) => console.log('Email sent...', result))
  
  .catch((error) => console.log(error.message));
  res.redirect('/emailtable')
  } catch (error) {
    console.error(error.message);
    res.status(500).send(" Internal Server Error!! ");
  }
});












// //   app.use("/api/image",require("./multer"))
//   app.use("/api/auth",require("./routes/Auth/userAuth"))
app.listen(port, () => console.log(`Server up and running...at ${port}`));
