import { Resend } from 'resend';
import type { NotificationDigestMode, NotificationDto, NotificationSeverity } from './contracts';

function severityTone(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', color: '#b91c1c', background: '#fee2e2' };
    case 'warning':
      return { label: 'Warning', color: '#b45309', background: '#fef3c7' };
    default:
      return { label: 'Info', color: '#1d4ed8', background: '#dbeafe' };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class EmailService {
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from = process.env.NOTIFICATION_FROM_EMAIL;
  private readonly client = this.apiKey ? new Resend(this.apiKey) : null;

  private get configured() {
    return Boolean(this.apiKey && this.from);
  }

  async sendNotificationEmail(opts: {
    to: string;
    eventType: string;
    title: string;
    body: string;
    severity: NotificationSeverity;
    resourceUrl?: string;
    organizationName?: string;
  }): Promise<{ sent: boolean; error?: string; skipped?: boolean }> {
    if (!this.configured) {
      return { sent: false, skipped: true, error: 'Resend email delivery is not configured' };
    }

    const tone = severityTone(opts.severity);
    const actionMarkup = opts.resourceUrl
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(opts.resourceUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">Open in Manzen</a></p>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:32px;">
          <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${tone.background};color:${tone.color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${tone.label}</div>
          <h1 style="margin:18px 0 12px;font-size:24px;line-height:1.2;">${escapeHtml(opts.title)}</h1>
          <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(opts.body)}</p>
          ${actionMarkup}
          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">This notification was sent by ${escapeHtml(opts.organizationName ?? 'Manzen')}.</p>
        </div>
      </div>
    `;

    try {
      await this.client!.emails.send({
        from: this.from!,
        to: [opts.to],
        subject: opts.title,
        html,
      });

      return { sent: true };
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async sendDigestEmail(opts: {
    to: string;
    organizationName: string;
    notifications: NotificationDto[];
    period: Exclude<NotificationDigestMode, 'immediate'>;
  }): Promise<{ sent: boolean; error?: string; skipped?: boolean }> {
    if (!this.configured) {
      return { sent: false, skipped: true, error: 'Resend email delivery is not configured' };
    }

    const items = opts.notifications
      .map((notification) => `<li style="margin:0 0 10px;line-height:1.6;"><strong>${escapeHtml(notification.title)}</strong><br />${escapeHtml(notification.body)}</li>`)
      .join('');

    try {
      await this.client!.emails.send({
        from: this.from!,
        to: [opts.to],
        subject: `${opts.organizationName} ${opts.period} notification digest`,
        html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h1>${escapeHtml(opts.organizationName)} ${escapeHtml(opts.period)} digest</h1><ul>${items}</ul></div>`,
      });

      return { sent: true };
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
