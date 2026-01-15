// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      field: 'email'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    verification_token: {
      type: DataTypes.STRING,
      field: 'verification_token'
    },
    reset_token: {
      type: DataTypes.STRING,
      field: 'reset_token'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = (models) => {
    User.hasMany(models.Booking, {
      foreignKey: 'user_id',
      as: 'bookings'
    });
  };

  return User;
};