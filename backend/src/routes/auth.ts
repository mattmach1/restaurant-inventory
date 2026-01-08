import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        organizationId: organization.id,
        role: "admin", // First user is admin
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Error in registration", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

export default router;
