import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { supabase } from '../utils/supabaseClient';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sign up a new user via Supabase, then mirror into Prisma.
   */
  async signup(email: string, password: string) {
    // 1) Create the user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/verify-email',
      },
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    const user = data.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Unexpected signup response from auth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const defaultName = user.email!.split('@')[0];

    // 2) Mirror into Prisma User table
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id:    user.id,      // reuse Supabase UUID
        email: user.email!,
        name:  defaultName,
        role:  'USER',       // default role
      },
      update: {
        email: user.email!,  // sync email if it ever changes
        name:  defaultName,  // keep name in sync
      },
    });

    return {
      message: 'User created. Verification email sent.',
      user: data.user,
    };
  }

  /**
   * Authenticate via Supabase, then ensure Prisma user exists.
   */
  async login(email: string, password: string) {
    // 1) Let Supabase verify credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    const user = data.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Unexpected login response from auth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const defaultName = user.email!.split('@')[0];

    // 2) Upsert into Prisma (in case you later create users via admin UI)
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id:    user.id,
        email: user.email!,
<<<<<<< Updated upstream
        role:  'USER',
      },
      update: {
        // you could sync additional metadata here if needed
      },
    });

    return { message: 'Login successful', session: data };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // 2) Upsert into Prisma (in case you later create users via admin UI)
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id:    user.id,
        email: user.email!,
        name:  user.email!.split('@')[0], // Use email username as default name
=======
        name:  defaultName,
>>>>>>> Stashed changes
        role:  'USER',
      },
      update: {
        email: user.email!,         // sync email
        name:  defaultName,         // sync name
      },
    });

    return {
      message: 'Login successful',
      session: data,
    };
  }
}
