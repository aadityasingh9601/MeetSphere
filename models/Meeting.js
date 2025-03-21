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
  date: {
    type: Date,
    default: Date.now,
  },
});

const Meeting = new mongoose.model("Meeting", meetingSchema);

export default Meeting;
