// Here, we are creating the Authorization middleware function for the user.
import { prisma } from "../config/prisma.js";

export const authorizeRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try{
            // Check if the user is authenticated 
            if(!req.user?.id){
                return res.status(401).json({
                    success: false,
                    message: "User is not Authenticated, Please login"
                })
            }

            // Fetch the user current role from the Postgrews
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    role: true,
                }
            });

            if(!user){
                return res.status(401).json({
                    success: false,
                    message:"User account not found"
                });
            }

            // Check whether the user's role is permitted
            if(!allowedRoles.includes(user.role)){
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to perform this action"
                })
            }

            // Attach the role to the request

            req.user.role = user.role;

            next();

        }catch(error){
            console.error(error.message)
        }
    }
}