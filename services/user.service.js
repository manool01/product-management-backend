const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


const JWT_SECRET = process.env.JWT_SECRET;

class UserService {
    static async register({ email, password }) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return { error: "User already exists" };

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ email, password: hashedPassword });
        return { message: "User registered successfully", user: newUser };
    }

    static async login(body) {
        if (!body || !body.email || !body.password) {
            return { error: "Email & password are required" };
        }

        const { email, password } = body;

        const user = await User.findOne({ where: { email } });
        if (!user) return { error: "User not found" };

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return { error: "Invalid password" };

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "1d",
        });

        return { message: "Login successful", token };
    }

}



module.exports = UserService;
