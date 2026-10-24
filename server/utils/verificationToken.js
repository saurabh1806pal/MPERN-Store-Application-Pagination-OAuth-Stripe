import crypto from "crypto";

export function createVerificationToken(){
    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return { token, tokenHash, expiresAt };
}

// The raw token goes into the email link; only its SHA-256 hash is stored in PostgreSQL. This means someone who reads the database cannot directly use the stored hash as the verification token.