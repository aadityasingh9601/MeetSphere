import Joi from "joi";

const userSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().required().min(5).max(20),
  password: Joi.string().required().min(8).max(16),
});

export default userSchema;
