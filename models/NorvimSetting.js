const mongoose = require('mongoose');
const schema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, value: { type: mongoose.Schema.Types.Mixed, default: null } }, { timestamps: true });
module.exports = mongoose.model('NorvimSetting', schema);
