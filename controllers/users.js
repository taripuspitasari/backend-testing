const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");
const {body, validationResult} = require("express-validator");

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("notes");
  response.json(users);
});

usersRouter.post(
  "/",
  body("username")
    .isLength({min: 3})
    .withMessage("username must be at least 3 characters long"),
  body("password")
    .isLength({min: 5})
    .withMessage("Password must be at least 5 characters long"),
  async (request, response, next) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({errors: errors.array()});
    }

    const {username, name, password} = request.body;
    try {
      const existingUser = await User.findOne({username});
      if (existingUser) {
        return response.status(400).json({error: "Username already taken"});
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        name,
        passwordHash,
      });

      const savedUser = await user.save();
      response.status(201).json(savedUser);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = usersRouter;
