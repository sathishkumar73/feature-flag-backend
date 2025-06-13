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
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard';
import { AuthCredentialsDto } from './dtos/auth-credentials.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created. Verification email sent.' })
  @ApiBadRequestResponse({ description: 'Email and password are required or invalid.' })
  async signup(@Body() body: AuthCredentialsDto) {
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
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiBadRequestResponse({ description: 'Email and password are required or invalid.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@Body() body: AuthCredentialsDto) {
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
  @ApiOperation({ summary: 'Upsert (create or update) a user from JWT' })
  @ApiResponse({ status: 200, description: 'User upserted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiBadRequestResponse({ description: 'Invalid user payload.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error.' })
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
