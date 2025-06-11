import { type Result, err, ok } from "neverthrow";
import type { UserRepository } from "../../../entities/user/api/repository";
import { UserDomain } from "../../../entities/user/model";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type { CreateUserRequest, PaginatedResponse, UpdateUserRequest, User } from "../../../shared/types";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: CreateUserRequest): Promise<Result<User, AppError>> {
    try {
      // Validate input
      const validationResult = UserDomain.validateCreate(userData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Check for existing username
      const existingUser = await this.userRepository.findByUsername(validationResult.value.username);
      if (existingUser) {
        return err(ErrorFactory.validation("Username already exists", "username"));
      }

      // Check for existing email
      const existingEmail = await this.userRepository.findByEmail(validationResult.value.email);
      if (existingEmail) {
        return err(ErrorFactory.validation("Email already exists", "email"));
      }

      const user = await this.userRepository.create(validationResult.value);
      return ok(user);
    } catch (error) {
      return err(ErrorFactory.database("Failed to create user", error instanceof Error ? error : undefined));
    }
  }

  async getUserById(id: number): Promise<Result<User, AppError>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        return err(ErrorFactory.notFound("User", id));
      }

      return ok(user);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve user", error instanceof Error ? error : undefined));
    }
  }

  async getUsers(
    options: { limit?: number; offset?: number } = {},
  ): Promise<Result<PaginatedResponse<User>, AppError>> {
    try {
      const result = await this.userRepository.findAll(options);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve users", error instanceof Error ? error : undefined));
    }
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<Result<User, AppError>> {
    try {
      // Validate input
      const validationResult = UserDomain.validateUpdate(userData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return err(ErrorFactory.notFound("User", id));
      }

      const validatedData = validationResult.value;

      // Check for email conflict if email is being updated
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const existingEmail = await this.userRepository.findByEmail(validatedData.email);
        if (existingEmail) {
          return err(ErrorFactory.validation("Email already exists", "email"));
        }
      }

      const updatedUser = await this.userRepository.update(id, validatedData);
      if (!updatedUser) {
        return err(ErrorFactory.notFound("User", id));
      }

      return ok(updatedUser);
    } catch (error) {
      return err(ErrorFactory.database("Failed to update user", error instanceof Error ? error : undefined));
    }
  }

  async deleteUser(id: number): Promise<Result<boolean, AppError>> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return err(ErrorFactory.notFound("User", id));
      }

      const result = await this.userRepository.delete(id);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete user", error instanceof Error ? error : undefined));
    }
  }
}
