import type { NextFunction, Request, Response } from "express";
import {
  verifyTeamToken,
  type TeamRole,
  type TeamUser,
} from "../auth/team-auth.js";

export interface TeamRequest extends Request {
  teamUser?: TeamUser;
}

export const requireTeamAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Authentication required",
      details: "Sign in with an Ilonggo Speak team account.",
    });
  }

  try {
    (req as TeamRequest).teamUser = verifyTeamToken(token);
    return next();
  } catch (error: any) {
    return res.status(401).json({
      error: "Authentication failed",
      details: error?.message || "The team session is invalid.",
    });
  }
};

export const requireTeamRole =
  (...roles: TeamRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as TeamRequest).teamUser;

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        details: "Sign in with an Ilonggo Speak team account.",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "Permission denied",
        details: `This action requires one of these roles: ${roles.join(", ")}.`,
      });
    }

    return next();
  };
