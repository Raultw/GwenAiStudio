import { NotificationProvider } from './provider.interface.js';
import { 
  CancellationNotificationData, 
  ConfirmationNotificationData,
  NotificationChannel, 
  NotificationResult, 
  NotificationSendOptions 
} from './types.js';
import { ResendEmailNotificationProvider } from './resendEmailProvider.js';
import { SmtpEmailNotificationProvider } from './smtpEmailProvider.js';
import { MockEmailNotificationProvider } from './mockEmailProvider.js';
import { GmailSmtpEmailNotificationProvider } from './gmailSmtpEmailProvider.js';

export { ResendEmailNotificationProvider } from './resendEmailProvider.js';
export { SmtpEmailNotificationProvider } from './smtpEmailProvider.js';
export { MockEmailNotificationProvider } from './mockEmailProvider.js';
export { GmailSmtpEmailNotificationProvider } from './gmailSmtpEmailProvider.js';

/**
 * Factory function to create the appropriate email notification provider
 * based on environment configuration.
 */
export function createEmailProvider(): NotificationProvider {
  const mode = (process.env.EMAIL_PROVIDER_MODE || '').toLowerCase().trim();
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // Automated testing always uses Mock provider to protect against accidental sends
  if (isTest || mode === 'mock') {
    return new MockEmailNotificationProvider();
  }

  // Gmail SMTP provider
  if (mode === 'gmail_smtp') {
    const deliveryEnv = (process.env.EMAIL_DELIVERY_ENV || '').toLowerCase().trim();
    const realTestSendEnabled = ['true', '1'].includes(
      (process.env.GMAIL_ENABLE_REAL_SEND_IN_TEST || '').toLowerCase().trim()
    );
    const hasTestAllowlist = Boolean((process.env.GMAIL_TEST_ALLOWED_RECIPIENTS || '').trim());

    // Render builds run with NODE_ENV=production even when the application is
    // deliberately operating as a restricted test environment. Permit Gmail
    // there only while all outbound-test safeguards remain explicitly enabled.
    if (isProd && !(deliveryEnv === 'test' && realTestSendEnabled && hasTestAllowlist)) {
      throw new Error('gmail_smtp_not_allowed_in_production: Gmail SMTP requires EMAIL_DELIVERY_ENV=test, explicit real-test-send enablement and a non-empty allowlist.');
    }
    return new GmailSmtpEmailNotificationProvider();
  }

  // Resend provider (preferred for testing deliveries and API-based sending)
  if (mode === 'resend' || (process.env.RESEND_API_KEY && mode !== 'smtp' && mode !== 'gmail_smtp')) {
    return new ResendEmailNotificationProvider();
  }

  // SMTP provider
  if (mode === 'smtp' || (isProd && process.env.SMTP_HOST)) {
    return new SmtpEmailNotificationProvider();
  }

  // Default fallback in development/preview: Resend if API key exists, else Mock
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailNotificationProvider();
  }

  return new MockEmailNotificationProvider();
}

/**
 * Unified EmailNotificationProvider that delegates to the configured provider
 * (Resend, SMTP or Mock) according to environment.
 */
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel = 'email';
  private delegate: NotificationProvider;

  constructor(customDelegate?: NotificationProvider) {
    this.delegate = customDelegate || createEmailProvider();
  }

  public setDelegate(provider: NotificationProvider): void {
    this.delegate = provider;
  }

  public getDelegate(): NotificationProvider {
    return this.delegate;
  }

  public isConfigured(): boolean {
    return this.delegate.isConfigured();
  }

  public async sendCancellation(
    data: CancellationNotificationData,
    options?: NotificationSendOptions
  ): Promise<NotificationResult> {
    return this.delegate.sendCancellation(data, options);
  }

  public async sendConfirmation(
    data: ConfirmationNotificationData,
    options?: NotificationSendOptions
  ): Promise<NotificationResult> {
    if (!this.delegate.sendConfirmation) {
      return { channel: this.channel, recipient: data.clienteEmail || 'sin_email', status: 'failed', success: false, error: 'confirmation_not_supported', idempotencyKey: options?.idempotencyKey };
    }
    return this.delegate.sendConfirmation(data, options);
  }
}

