const supabase = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header is missing.",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format.",
            });
        }

        const accessToken = authHeader.replace("Bearer ", "").trim();

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Access token is missing.",
            });
        }

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token.",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);

        return res.status(401).json({
            success: false,
            message: "Authentication failed.",
        });
    }
};

module.exports = authMiddleware;