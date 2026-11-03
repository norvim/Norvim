const mongoose = require('mongoose');
const conversationSchema = new mongoose.Schema({
 contextType: { type: String, enum: ['job','marketplace'], required: true, index: true },
 contextId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
 participants: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
 participantTypes: [{ type: String, enum: ['applicant','employer'], required: true }],
 participantNames: [{ type: String, default: '' }],
 lastMessageAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });
conversationSchema.index({ contextType: 1, contextId: 1, participants: 1 });
module.exports = mongoose.model('Conversation', conversationSchema);
