import jwt from "jsonwebtoken";
const JWT_SECRET = "supersecret";

export const secure = (req, res, next) => {
  try {
    let token;

    const authHead = req.headers.authorization;

    if (authHead && authHead.startsWith("Bearer ")) {
      token = authHead.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();

  } catch (e) {
    console.log("Error:", e);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


