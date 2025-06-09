import type { UserRepository } from "../../../entities/user/api/repository";
import { UserDomain } from "../../../entities/user/model";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import { type Result, failure, success } from "../../../shared/lib/types/result";
import type { CreateUserRequest, PaginatedResponse, UpdateUserRequest, User } from "../../../shared/types";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: CreateUserRequest): Promise<Result<User, AppError>> {
    try {
      // Validate input
      const validationResult = UserDomain.validateCreate(userData);
      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      // Check for existing username
      const existingUser = await this.userRepository.findByUsername(validationResult.data.username);
      if (existingUser) {
        return failure(ErrorFactory.validation("Username already exists", "username"));
      }

      // Check for existing email
      const existingEmail = await this.userRepository.findByEmail(validationResult.data.email);
      if (existingEmail) {
        return failure(ErrorFactory.validation("Email already exists", "email"));
      }

      const user = await this.userRepository.create(validationResult.data);
      return success(user);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to create user", error instanceof Error ? error : undefined));
    }
  }

  async getUserById(id: number): Promise<Result<User, AppError>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        return failure(ErrorFactory.notFound("User", id));
      }

      return success(user);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to retrieve user", error instanceof Error ? error : undefined));
    }
  }

  async getUsers(
    options: { limit?: number; offset?: number } = {},
  ): Promise<Result<PaginatedResponse<User>, AppError>> {
    try {
      const result = await this.userRepository.findAll(options);
      return success(result);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to retrieve users", error instanceof Error ? error : undefined));
    }
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<Result<User, AppError>> {
    try {
      // Validate input
      const validationResult = UserDomain.validateUpdate(userData);
      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return failure(ErrorFactory.notFound("User", id));
      }

      const validatedData = validationResult.data;

      // Check for email conflict if email is being updated
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const existingEmail = await this.userRepository.findByEmail(validatedData.email);
        if (existingEmail) {
          return failure(ErrorFactory.validation("Email already exists", "email"));
        }
      }

      const updatedUser = await this.userRepository.update(id, validatedData);
      if (!updatedUser) {
        return failure(ErrorFactory.notFound("User", id));
      }

      return success(updatedUser);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to update user", error instanceof Error ? error : undefined));
    }
  }

  async deleteUser(id: number): Promise<Result<boolean, AppError>> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return failure(ErrorFactory.notFound("User", id));
      }

      const result = await this.userRepository.delete(id);
      return success(result);
    } catch (error) {
      return failure(ErrorFactory.database("Failed to delete user", error instanceof Error ? error : undefined));
    }
  }
}
