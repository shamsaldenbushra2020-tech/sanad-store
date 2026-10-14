const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  meta: { type: String, default: '' },
  image: { type: String, default: '' }
}, { timestamps: true });

// تحويل _id الافتراضي في موجنو إلى id لكي يعمل مع كود الواجهة الأمامية بدون تعديل
productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Product', productSchema);