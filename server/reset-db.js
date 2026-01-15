// reset-db.js
require('dotenv').config();
const { sequelize } = require('./models');

async function resetDatabase() {
  try {
    console.log('⚠️  Resetting database...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop all tables
    await sequelize.drop();
    
    // Enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Sync all models with force: true
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();