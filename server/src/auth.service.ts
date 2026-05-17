import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create Tenant and Admin User in a transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          slug: data.companyName.toLowerCase().replace(/ /g, '-'),
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      const token = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        tenantId: tenant.id,
        role: user.role,
      });

      return { user, token, tenant };
    });
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      tenant: user.tenant,
    };
  }

  async validateUser(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }
}
