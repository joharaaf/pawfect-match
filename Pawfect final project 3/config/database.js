// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create Sequelize instance using your .env (Aiven or local)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PWD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

// Connect + sync models (NO force:true so it doesn't delete data)
async function connectToDB() {
  try {
    await sequelize.authenticate();
    console.log("🐾 DB connected");

    // This keeps your tables and data — just makes sure models match.
    await sequelize.sync();

    console.log("📦 Models synced");
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
}

// Export BOTH so models can use sequelize and app can call connectToDB
module.exports = { sequelize, connectToDB };
