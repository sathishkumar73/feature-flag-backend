import {
  Controller,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WaitListSignupService } from './wait-list-signup.service';
import { Request } from 'express';

@ApiTags('Wait List Signup')
@Controller('wait-list-signup')
export class WaitListSignupController {
  constructor(private readonly waitListSignupService: WaitListSignupService) {}

  @ApiOperation({ summary: 'Get all wait list signup entries (root only)' })
  @ApiResponse({ status: 200, description: 'Returns all wait list signup entries' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getWaitList(@Req() req: Request) {
    const email = req.headers['x-user-email'] as string | undefined;
    if (!email) throw new ForbiddenException('No user email provided');
    return this.waitListSignupService.getWaitListForRootUser(email);
  }
}
