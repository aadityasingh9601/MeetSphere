import mongoose from "mongoose";

const { Schema } = mongoose;

const meetingSchema = new Schema({
  meetingCode: {
    type: String,
    required: true,
  },
  participants: [
    {
      type: String,
    },
  ],
  //So that we can detect if both users have deleted the meeting, so that we can remove that from the database.
  deletedBy: { type: [String], default: [] },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Meeting = new mongoose.model("Meeting", meetingSchema);

export default Meeting;
