import {
  Controller,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Body,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { WaitListSignupService } from './wait-list-signup.service';
import { Request } from 'express';
import { verifyInviteToken } from '../utils/jwt';

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

  @ApiOperation({ summary: 'Update wait list signup status (root only)' })
  @ApiResponse({ status: 200, description: 'Wait list signup status updated' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, status: { type: 'string', enum: ['APPROVED', 'PENDING', 'REVOKED'] } } } })
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateWaitListStatus(
    @Body() body: { email: string; status: 'APPROVED' | 'PENDING' | 'REVOKED' },
    @Req() req: Request
  ) {
    if (!body.email) throw new ForbiddenException('No waitlist user email provided');
    await this.assertRootUser(req);
    return this.waitListSignupService.updateWaitListStatus(body.email, body.status);
  }

  @ApiOperation({ summary: 'Verify invite token and return email if valid and matches beta_users' })
  @ApiResponse({ status: 200, description: 'Invite token is valid and matches beta_users' })
  @ApiBody({ schema: { properties: { token: { type: 'string' } } } })
  @Put('verify-invite')
  @HttpCode(HttpStatus.OK)
  async verifyInvite(@Body('token') token: string) {
    try {
      // Use service method to look up beta_users by invite_token
      const email = await this.waitListSignupService.verifyBetaUserInviteTokenByToken(token);
      if (!email) {
        return { valid: false, error: 'Token does not match or user not found' };
      }
      return { valid: true, email };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  private async assertRootUser(req: Request) {
    const rootEmail = req.headers['x-user-email'] as string | undefined;
    if (!rootEmail) throw new ForbiddenException('No user email provided');
    await this.waitListSignupService.ensureRootUser(rootEmail);
    return rootEmail;
  }
}
