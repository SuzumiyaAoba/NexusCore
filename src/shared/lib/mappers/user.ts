import type { User } from "../../types";
import type { User as DbUser } from "../db/schema";

export type UserInfo = Pick<User, "id" | "username" | "displayName" | "email" | "avatarUrl" | "createdAt">;

export function mapToUser(user: DbUser): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export function mapToUserInfo(user: DbUser): UserInfo {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
