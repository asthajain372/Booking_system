// models/Booking.js
module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_name'
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'customer_email'
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'booking_date'
    },
    booking_type: {
      type: DataTypes.ENUM('FULL', 'HALF', 'CUSTOM'),
      allowNull: false,
      field: 'booking_type'
    },
    booking_slot: {
      type: DataTypes.ENUM('FIRST', 'SECOND'),
      allowNull: true,
      field: 'booking_slot'
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'start_time'
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'end_time'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled'),
      defaultValue: 'confirmed',
      field: 'status'
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['booking_date', 'status']
      },
      {
        fields: ['user_id', 'booking_date']
      },
      {
        fields: ['booking_date', 'booking_type', 'booking_slot']
      },
      {
        fields: ['customer_email']
      }
    ]
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Booking;
};