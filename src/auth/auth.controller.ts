// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestWithUser } from './types/request-with-user.type';
import { JwtOrApiKeyGuard } from 'src/common/guards/jwt-or-apikey.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const data = await this.authService.signup(email, password);
      return { message: 'User created. Verification email sent.', data };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const data = await this.authService.login(email, password);
      return { message: 'Login successful', data };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtOrApiKeyGuard)
  @Post('upsert')
  async upsertUser(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new HttpException(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { sub: id, email } = req.user;
    if (!id || !email) {
      throw new HttpException(
        'Invalid user payload',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.authService.upsertUser(id, email);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
