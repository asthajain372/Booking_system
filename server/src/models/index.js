// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database.config');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Booking = require('./Booking')(sequelize, Sequelize.DataTypes);

// Define associations
User.associate({ Booking });
Booking.associate({ User });

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  User,
  Booking,
  testConnection
};