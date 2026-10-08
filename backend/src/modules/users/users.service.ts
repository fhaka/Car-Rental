import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/password";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./users.schemas";

const SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const usersService = {
  async list(query: ListUsersQuery) {
    const { page, pageSize, search, role, isActive, sortBy, sortOrder } = query;
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.user.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw AppError.notFound("User not found");
    return user;
  },

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw AppError.conflict("A user with this email already exists", "DUPLICATE_EMAIL");

    const passwordHash = await hashPassword(input.password);
    return prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
      },
      select: SAFE_SELECT,
    });
  },

  async update(id: string, input: UpdateUserInput, actingUserId: string) {
    if (id === actingUserId && input.isActive === false) {
      throw AppError.badRequest("You cannot deactivate your own account", "SELF_DEACTIVATION");
    }
    if (id === actingUserId && input.role) {
      throw AppError.badRequest("You cannot change your own role", "SELF_ROLE_CHANGE");
    }
    const user = await prisma.user.update({ where: { id }, data: input, select: SAFE_SELECT });
    return user;
  },
};
