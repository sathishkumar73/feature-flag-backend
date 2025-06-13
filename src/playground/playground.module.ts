import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlaygroundController } from './controllers/playground.controller';
import { PlaygroundJwtAuthGuard } from '../common/guards/jwt-token.guard';
import { PlaygroundService } from './services/playground.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
  ],
  controllers: [PlaygroundController],
  providers: [PlaygroundService, PlaygroundJwtAuthGuard],
})
export class PlaygroundModule {}
