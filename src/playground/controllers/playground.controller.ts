import {
    Controller,
    Post,
    Body,
    Patch,
    Param,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    Headers,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtService } from '@nestjs/jwt';
  import { PlaygroundService } from '../services/playground.service';
  import { RequestPlaygroundTokenDto } from '../dtos/request-playground-token.dto';
  import { UpsertPlaygroundFlagDto } from '../dtos/upsert-playground.dto';
  import { PlaygroundJwtAuthGuard } from '../../common/guards/jwt-token.guard';

  
  @ApiTags('Playground')
  @Controller('playground')
  export class PlaygroundController {
    constructor(
      private readonly playgroundService: PlaygroundService,
      private readonly jwtService: JwtService,
    ) {}
  
    @Post('api-key')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate temporary JWT API key for playground session' })
    @ApiResponse({ status: 200, description: 'JWT API key token returned.' })
    async generatePlaygroundApiKey(@Body() body: RequestPlaygroundTokenDto) {
      const { sessionId } = body;
      if (!sessionId) {
        throw new BadRequestException('sessionId is required');
      }
  
      const token = this.jwtService.sign(
        {
          scope: 'playground',
          sessionId,
          permissions: ['read', 'write'], // customize as needed
        },
        { expiresIn: '1h' },
      );
  
      return { apiKey: token };
    }
  
    @Patch('flags/:sessionId/upsert')
    @UseGuards(PlaygroundJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upsert a playground flag by sessionId' })
    @ApiBearerAuth()
    async upsertFlag(
      @Param('sessionId') sessionId: string,
      @Body() body: UpsertPlaygroundFlagDto,
    ) {
      // sessionId in param should match JWT payload sessionId (enforced by guard)
      return this.playgroundService.upsertFlag(sessionId, body);
    }
  
    @Get('flags/:sessionId/:flagKey')
    @UseGuards(PlaygroundJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a specific playground flag by sessionId and flagKey' })
    @ApiBearerAuth()
    async getFlag(
      @Param('sessionId') sessionId: string,
      @Param('flagKey') flagKey: string,
    ) {
      const flag = await this.playgroundService.getFlag(sessionId, flagKey);
      if (!flag) {
        throw new NotFoundException(`Playground flag '${flagKey}' for session '${sessionId}' not found.`);
      }
      return flag;
    }
  }
  