import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  text: { type: String, default: "", trim: true, maxlength: 4000 },
  type: { type: String, enum: ["text", "image", "file", "sticker", "qr_deposit"], default: "text" },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: String, default: "" },
  readBy: { type: [String], default: [] },
}, { timestamps: true })

const conversationSchema = new mongoose.Schema({
  participants: { type: [String], required: true, validate: (value) => value.length === 2 },
  listingId: { type: String, default: "" },
  mutedBy: { type: [String], default: [] },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true })

conversationSchema.index({ participants: 1, updatedAt: -1 })
export default mongoose.model("Conversation", conversationSchema)
