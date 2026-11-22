const mongoose = require('mongoose');
const schema = new mongoose.Schema({ installId: { type: String, required: true, unique: true, index: true }, platform: { type: String, default: 'unknown' }, userAgent: { type: String, maxlength: 500, default: '' }, firstSeenAt: { type: Date, default: Date.now }, lastSeenAt: { type: Date, default: Date.now } });
module.exports = mongoose.model('AppInstallation', schema);
