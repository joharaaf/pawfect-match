// app.js


require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");

const { sequelize, connectToDB } = require("./config/database");
const { Plan } = require("./model/plan");
const { Feedback } = require("./model/feedback");
const { User } = require("./model/User");

connectToDB(); 
sequelize.sync();


const app = express();

// ================== VIEW ENGINE ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================== MIDDLEWARE ==================
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'pawfect-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ================== MAIN PAGES ==================

app.get("/", async (req, res) => {
  try {
    const [planCount, userCount, feedbackCount] = await Promise.all([
      Plan.count(),
      User.count(),
      Feedback.count()
    ]);

    res.render("index", {
      pageTitle: "Home",
      activePage: "home",
      currentUser: req.session.user || null,
      stats: {
        plans: planCount,
        users: userCount,
        feedback: feedbackCount
      }
    });
  } catch (error) {
    console.error("Error loading stats:", error);
    res.render("index", {
      pageTitle: "Home",
      activePage: "home",
      currentUser: req.session.user || null,
      stats: {
        plans: 0,
        users: 0,
        feedback: 0
      }
    });
  }
});

// ================== ADOPT PAGE ==================

app.get("/adopt", (req, res) => {
  res.render("adopt", {
    pageTitle: "Adopt a Pet",
    activePage: "adopt",
    currentUser: req.session.user || null
  });
});

// ================== PLAN DETAILS ==================

app.get("/plan-details", (req, res) => {
  Plan.findAll({ order: [["price", "ASC"]] })
    .then(plans => {
      res.render("plan-details", {
        pageTitle: "Adoption Plans",
        activePage: "plans",
        currentUser: req.session.user || null,
        plans,
        success: req.query.success || null,
        error: req.query.error || null
      });
    })
    .catch(err => {
      console.error(err);
      res.render("plan-details", {
        pageTitle: "Adoption Plans",
        activePage: "plans",
        currentUser: req.session.user || null,
        plans: [],
        success: req.query.success || null,
        error: req.query.error || "Could not load plans"
      });
    });
});

// ================== PROFILE ==================

app.get("/profile", async (req, res) => {
  try {
    // Get all users for display
    const users = await User.findAll({
      order: [["id", "DESC"]],
      limit: 10
    });

    res.render("profile", {
      pageTitle: "Profile",
      activePage: "profile",
      users,
      currentUser: req.session.user || null,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error("Error loading users:", error);
    res.render("profile", {
      pageTitle: "Profile",
      activePage: "profile",
      users: [],
      currentUser: req.session.user || null,
      success: req.query.success || null,
      error: req.query.error || null
    });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.redirect("/profile?error=Invalid+email+or+password");
    }
    
    // Verify password
    // TODO: In production, use bcrypt.compare() for hashed passwords
    if (user.password !== password) {
      return res.redirect("/profile?error=Invalid+email+or+password");
    }
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      age: user.age
    };
    
    // Redirect to welcome page
    res.redirect("/welcome");
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/profile");
  }
});

// Welcome/Dashboard page
app.get("/welcome", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/profile");
  }
  
  // Include adopted pets in user object
  const userWithPets = {
    ...req.session.user,
    adoptedPets: req.session.adoptedPets || []
  };
  
  res.render("welcome", {
    pageTitle: "Welcome",
    activePage: "profile",
    user: userWithPets,
    currentUser: req.session.user
  });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
});

// Temporary pet adoption route
app.post("/adopt-pet", (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: "Please sign in first" });
  }
  
  const { name, type, breed, age } = req.body;
  
  // Initialize adopted pets array if it doesn't exist
  if (!req.session.adoptedPets) {
    req.session.adoptedPets = [];
  }
  
  // Check if pet is already adopted
  const alreadyAdopted = req.session.adoptedPets.some(pet => pet.name === name);
  
  if (!alreadyAdopted) {
    req.session.adoptedPets.push({ name, type, breed, age, adoptedAt: new Date() });
  }
  
  res.json({ success: true });
});

// ================== ADD USER (WEB FORM) ==================

app.post("/users", (req, res) => { 
  const { username, email, password, age, joinDate } = req.body;

  // TODO: In production, hash password using bcrypt before storing
  User.create({
    username,
    email,
    password,
    age,
    joinDate
  })
    .then(() => res.redirect("/profile?success=Account+created+successfully!"))
    .catch(err => {
      console.error("Error saving user:", err);
      res.redirect("/profile?error=Error+creating+account");
    });
});

// ================== ADD PLAN (WEB FORM) ==================

app.post("/plans", (req, res) => {   
  const { planName, price, description } = req.body;

  // Validate minimum price
  const priceValue = parseFloat(price);
  if (isNaN(priceValue) || priceValue < 1) {
    return res.redirect("/plan-details?error=Price+must+be+at+least+1+SAR");
  }

  Plan.create({
    name: planName,
    price: priceValue,
    description: description || "No description provided"
  })
    .then(() => res.redirect("/plan-details?success=Plan+added+successfully!"))
    .catch(err => {
      console.error("Error saving plan:", err);
      res.redirect("/plan-details?error=Error+adding+plan");
    });
});

// ================== SUPPORT + SEARCH ==================

app.get("/support", async (req, res) => {
  try {
    const keyword = (req.query.search || "").toLowerCase();

    const all = await Feedback.findAll({
      order: [["createdAt", "DESC"]]
    });

    const feedbackList = keyword
      ? all.filter(item =>
          (item.name || "").toLowerCase().includes(keyword) ||
          (item.email || "").toLowerCase().includes(keyword) ||
          (item.subject || "").toLowerCase().includes(keyword) ||
          (item.message || "").toLowerCase().includes(keyword) ||
          (item.planName || "").toLowerCase().includes(keyword)
        )
      : all;

    res.render("support", {
      pageTitle: "Support",
      activePage: "support",
      currentUser: req.session.user || null,
      feedbackList,
      keyword,
      success: req.query.success || null,
      error: req.query.error || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading support page");
  }
});

// ================== FEEDBACK (WEB) ==================

app.post("/feedback", (req, res) => {
  const { name, email, subject, message, planName } = req.body;

  Feedback.create({ name, email, subject, message, planName })
    .then(() => res.redirect("/support?success=Feedback+submitted+successfully!"))
    .catch(err => {
      console.error("Error saving feedback:", err);
      res.redirect("/support?error=Error+submitting+feedback");
    });
});

app.delete("/feedback/:id", (req, res) => {
  Feedback.destroy({ where: { id: req.params.id } })
    .then(() => res.redirect("/support"))
    .catch(err => {
      console.error("Error deleting feedback:", err);
      res.status(500).send("Error deleting feedback");
    });
});

// ================== 404 ==================
app.use((req, res) => {
  res.status(404).send("Page not found");
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🐾 Pawfect Match running at http://localhost:${PORT}`);
});
