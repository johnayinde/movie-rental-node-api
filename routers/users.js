const express = require("express");
const router = express.Router();
const { userValidation } = require("../validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const _ = require("lodash");
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
	const { error, value } = userValidation(req.body);
	if (error) return res.status(404).send(error.details[0].message);

	let user = await User.findOne({ email: req.body.email });
	if (user) return res.status(400).send("User already registered!");

	user = new User(_.pick(req.body, ["name", "email", "password"]));

	const salt = await bcrypt.genSalt(10);
	user.password = await bcrypt.hash(user.password, salt);
	await user.save();

	const token = user.generateAuthToken();
	res
		.header("x-auth-token", token)
		.status(200)
		.send(_.pick(user, ["name", "email"]));
});
router.get("/me", auth, async (req, res) => {
	const user = await User.findById(req.user._id).select("-password");
	res.status(201).send(user);
});

module.exports = router;
