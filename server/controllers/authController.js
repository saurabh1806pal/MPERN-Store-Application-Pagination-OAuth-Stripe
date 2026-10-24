import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '.././config/prisma.js';
// import jwt from 'jsonwebtoken';
import { registerSchema } from '../validators/authValidator.js';
import { createVerificationToken } from '../utils/verificationToken.js'
import { sendVerificationEmail } from '../services/emailService.js';

// To register a new user

export const registerUser = async (req, res) => {
    const validation = registerSchema.safeParse(req.body);

    if(!validation.success){
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        });
    }
    
    const { name, email, password } = validation.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const { token, tokenHash, expiresAt } = createVerificationToken();
        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name, email, passwordHash, emailVerificationTokenHash: tokenHash, emailVerificationTokenExpiresAt: expiresAt
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        try{
            await sendVerificationEmail(user.email, token)
        } catch (error) {
            console.error("Error sending verification email: ", error);
            // Remove the newly created , unverified email if delivery fails
            await prisma.user.delete({where: { id: user.id }});

            return res.status(503).json({
                success: false,
                message: "Failed to send verification email. Please try again later.",
            })
        }

        return res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user,
        })
        
    }catch(error){
        console.error("Error in registerUser: fileName: authController.js", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Verify the Email 
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link",
    });
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.user.findUnique({
    where: {
      emailVerificationTokenHash: tokenHash,
    },
  });

  if (
    !user ||
    !user.emailVerificationTokenExpiresAt ||
    user.emailVerificationTokenExpiresAt <= new Date()
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now log in.",
  });
};