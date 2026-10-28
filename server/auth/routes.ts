import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || "45324416";
      const user = await authStorage.getUser(userId);
      const currentUser = user || {
        id: "45324416",
        email: "tiago@servntrak.pt",
        username: "tiago",
        firstName: "Tiago",
        lastName: "Santos",
        profileImageUrl: null,
        provider: "local",
        createdAt: new Date(),
      };
      res.json({
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profileImageUrl: currentUser.profileImageUrl,
        provider: currentUser.provider,
        createdAt: currentUser.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
