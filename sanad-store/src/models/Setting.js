const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: 'متجر سند' },
  whatsappNumber: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroSubtitle: { type: String, default: '' }
});

module.exports = mongoose.model('Setting', settingSchema);
