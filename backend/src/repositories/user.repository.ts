import { prisma } from './prisma.js';
import { User, Prisma } from '@prisma/client';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { facility: true };
}>;

export class UserRepository {
  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        facility: true,
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        facility: true,
      },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { employeeId },
      include: {
        facility: true,
      },
    });
  }

  async findAll(filter?: { facilityId?: string; role?: Prisma.EnumRoleFilter['equals'] }): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      where: {
        ...(filter?.facilityId ? { facilityId: filter.facilityId } : {}),
        ...(filter?.role ? { role: filter.role } : {}),
      },
      include: {
        facility: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRelations> {
    return prisma.user.create({
      data,
      include: {
        facility: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRelations> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        facility: true,
      },
    });
  }

  async count(filter?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where: filter });
  }
}

export const userRepository = new UserRepository();
