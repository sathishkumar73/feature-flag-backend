// src/auth/auth.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { supabase } from '../utils/supabaseClient';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PUBLIC  ────────────────
   * Sign‑up a new user via Supabase email/password.
   */
  async signup(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email`,
      },
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    const user = data.user;
    if (!user?.id || !user.email) {
      throw new HttpException(
        'Unexpected signup response from auth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.syncUserToDatabase(user.id, user.email);

    return {
      message: 'User created. Verification email sent.',
      user: data.user,
    };
  }

  /**
   * PUBLIC  ────────────────
   * Log‑in via Supabase email/password and ensure Prisma mirror exists.
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    const user = data.user;
    if (!user?.id || !user.email) {
      throw new HttpException(
        'Unexpected login response from auth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.syncUserToDatabase(user.id, user.email);

    return {
      message: 'Login successful',
      session: data,
    };
  }

  /**
   * PUBLIC  ────────────────
   * Manual sync helper (used e.g. in background jobs).
   */
  async upsertUser(id: string, email: string) {
    await this.syncUserToDatabase(id, email);
    return { message: 'User synced' };
  }

  // ──────────────────────── PRIVATE HELPERS ──────────────────────── //

  private getDefaultName(email: string): string {
    return email.split('@')[0];
  }

  /**
   * Mirrors a Supabase user into Prisma `user` table and links any
   * `beta_users` rows that share the same email.
   */
  private async syncUserToDatabase(userId: string, email: string) {
    const defaultName = this.getDefaultName(email);

    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        name: defaultName,
        role: 'USER',
      },
      update: {
        email,
        name: defaultName,
      },
    });

    await this.prisma.beta_users.update({
      where: {
        email,
        userId: userId,
      },
      data: {
        last_login_at: new Date(),
      },
    });
  }
}
