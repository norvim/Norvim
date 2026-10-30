const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
 conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
 senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
 senderType: { type: String, enum: ['applicant','employer'], required: true },
 body: { type: String, required: true, trim: true, maxlength: 4000 },
 readBy: [{ type: mongoose.Schema.Types.ObjectId }],
 hiddenFor: [{ accountId: { type: mongoose.Schema.Types.ObjectId, required: true }, accountType: { type: String, enum: ['applicant','employer'], required: true } }],
 createdAt: { type: Date, default: Date.now, index: true }
});
module.exports = mongoose.model('Message', messageSchema);
