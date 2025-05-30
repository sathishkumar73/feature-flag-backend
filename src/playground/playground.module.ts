import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlaygroundController } from './controllers/playground.controller';
import { PlaygroundJwtAuthGuard } from '../common/guards/jwt-token.guard';
import { PlaygroundService } from './services/playground.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PlaygroundController],
  providers: [PlaygroundService, PlaygroundJwtAuthGuard],
})
export class PlaygroundModule {}
