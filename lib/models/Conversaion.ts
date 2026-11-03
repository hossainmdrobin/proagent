import "server-only";
import mongoose, { Schema, Types } from "mongoose";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationRecord {
  ownerId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  messages: ConversationMessage[];
}

const MessageSchema = new Schema<ConversationMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 100000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: true },
);

const ConversationSchema = new Schema<ConversationRecord>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "New chat",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

ConversationSchema.index({ ownerId: 1, projectId: 1, updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation ??
  mongoose.model<ConversationRecord>(
    "Conversation",
    ConversationSchema,
  );