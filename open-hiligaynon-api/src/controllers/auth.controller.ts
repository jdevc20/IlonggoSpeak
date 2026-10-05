import type { Request, Response } from "express";
import {
  authenticateTeamAccount,
  listTeamUsers,
  signTeamToken,
} from "../auth/team-auth.js";
import type { TeamRequest } from "../middleware/team-auth.middleware.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";

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

export const teamMembers = (req: Request, res: Response) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit, 20, 100);
    if (!pagination) {
      return res.status(400).json({
        error: "Invalid pagination parameter",
        details: "'page' must be positive and 'limit' must be between 1 and 100.",
      });
    }

    const members = listTeamUsers();
    const items = members.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );

    return res.status(200).json({
      items,
      meta: buildPaginationMeta(members.length, pagination.page, pagination.limit),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Team configuration unavailable",
      details: error?.message || "Unable to read team accounts.",
    });
  }
};
