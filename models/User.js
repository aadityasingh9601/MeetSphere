import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  history: [
    {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
    },
  ],
});

const User = new mongoose.model("User", userSchema);

export default User;
