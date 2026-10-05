import type { Request, Response } from "express";
import {
  authenticateTeamAccount,
  listTeamUsers,
  signTeamToken,
} from "../auth/team-auth.js";
import type { TeamRequest } from "../middleware/team-auth.middleware.js";

export const login = (req: Request, res: Response) => {
  try {
    const username =
      typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!username || !password) {
      return res.status(400).json({
        error: "Validation failed",
        details: "Username and password are required.",
      });
    }

    const user = authenticateTeamAccount(username, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        details: "The username or password is incorrect.",
      });
    }

    return res.status(200).json({
      data: {
        token: signTeamToken(user),
        user,
      },
    });
  } catch (error: any) {
    console.error("[teamLogin Error]:", error);
    return res.status(500).json({
      error: "Team authentication is not configured",
      details: error?.message || "Unable to authenticate the team account.",
    });
  }
};

export const me = (req: Request, res: Response) =>
  res.status(200).json({ data: (req as TeamRequest).teamUser });

export const teamMembers = (_req: Request, res: Response) => {
  try {
    return res.status(200).json({ data: listTeamUsers() });
  } catch (error: any) {
    return res.status(500).json({
      error: "Team configuration unavailable",
      details: error?.message || "Unable to read team accounts.",
    });
  }
};
