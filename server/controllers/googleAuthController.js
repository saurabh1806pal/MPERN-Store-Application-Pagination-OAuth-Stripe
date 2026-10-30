import jwt from "jsonwebtoken";

export const googleLoginCallback = (req, res) => {
    try{
        if(!req.user){
            return res.redirect(`${process.env.CLIENT_URL}/?error=Google authentication failed`);
        }

        const token = jwt.sign(
            {userId: req.user.id},
            process.env.JWT_SECRET,
            {
                expiresIn: "15m",
                issuer: "mpern-store",
                audience: "mpern-store-client"
            }
        )

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        })

        return res.redirect(process.env.CLIENT_URL);

    }catch(error){
        console.error("Error occurred during Google login callback:", error);
        res.redirect(`${process.env.CLIENT_URL}/?error=An error occurred during Google authentication`);
    }
}