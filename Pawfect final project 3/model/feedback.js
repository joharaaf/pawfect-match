// model/feedback.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Feedback = sequelize.define(
  "Feedback",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "feedback",
    timestamps: true
  }
);

module.exports = { Feedback };
