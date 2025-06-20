// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from '@getbrevo/brevo';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly emailApi: TransactionalEmailsApi;

  constructor() {
    this.emailApi = new TransactionalEmailsApi();
    this.emailApi.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );
  }

  async sendBetaInvite(email: string, firstName: string, inviteLink: string) {
    const sendSmtpEmail = new SendSmtpEmail();

    // Use template if provided
    if (process.env.BREVO_TEMPLATE_ID) {
      sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID);
    } else {
      sendSmtpEmail.subject = '🎉Your Beta Invite';
      sendSmtpEmail.htmlContent = `
        <html>
          <body style="font-family: Inter, sans-serif; color: #111;">
            <table width="100%" style="max-width:600px;margin:auto">
              <tr>
                <td style="padding:32px;text-align:center">
                  <img src="https://gradualrollout.com/logo.png" width="120" alt="GradualRollout logo" />
                  <h1 style="margin-top:24px;font-size:24px">
                    Welcome, ${firstName}! 🎉
                  </h1>
                  <p style="font-size:16px;line-height:24px;margin:16px auto;max-width:440px">
                    Thanks for trusting GradualRollout. Click below to activate your private-beta access.
                  </p>
                  <a href="${inviteLink}"
                     style="display:inline-block;padding:14px 32px;border-radius:8px;background:#2563eb;color:#fff;
                            text-decoration:none;font-weight:600">
                    Activate My Beta Access
                  </a>
                  <p style="font-size:14px;color:#666;margin-top:32px">
                    If the button doesn't work, copy &amp; paste this URL:<br/>
                    <span style="word-break:break-all">${inviteLink}</span>
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
    }

    sendSmtpEmail.to = [{ email, name: firstName }];
    sendSmtpEmail.params = {
      first_name: firstName,
      invite_link: inviteLink,
    };
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'GradualRollout Team',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@gradualrollout.com',
    };

    try {
      const response = await this.emailApi.sendTransacEmail(sendSmtpEmail);
      this.logger.log(
        `Invite email sent to ${email}: ${JSON.stringify(response.body)}`
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to send invite to ${email}`, error);
      throw error;
    }
  }
}
