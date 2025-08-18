const mongoose = require('mongoose');

const MarkaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a marka name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  logo: {
    type: String,
    default: 'no-logo.jpg'
  },
  website: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug from name
MarkaSchema.pre('save', function(next) {
  this.slug = this.name.toLowerCase().replace(/ /g, '-');
  next();
});

module.exports = mongoose.model('Marka', MarkaSchema);