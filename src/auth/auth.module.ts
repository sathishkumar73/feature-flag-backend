// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
      signOptions: { algorithm: 'HS256', expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
