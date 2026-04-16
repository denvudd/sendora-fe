import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

interface BookingConfirmationEmailParams {
  guestName: string
  startsAt: Date
  endsAt: Date
  timezone: string
  workspaceName: string
}

interface BookingConfirmationEmailResult {
  subject: string
  html: string
}

export function buildBookingConfirmationEmail({
  guestName,
  startsAt,
  endsAt,
  timezone,
  workspaceName,
}: BookingConfirmationEmailParams): BookingConfirmationEmailResult {
  const tzStart = new TZDate(startsAt, timezone)
  const tzEnd = new TZDate(endsAt, timezone)

  const dateLabel = format(tzStart, 'EEEE, MMMM d, yyyy')
  const timeLabel = `${format(tzStart, 'h:mm a')} – ${format(tzEnd, 'h:mm a')}`
  const durationMinutes = Math.round(
    (endsAt.getTime() - startsAt.getTime()) / 60000,
  )
  const durationLabel =
    durationMinutes >= 60
      ? `${durationMinutes / 60}h`
      : `${durationMinutes} min`

  const subject = `Appointment confirmed – ${dateLabel}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Sendora</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border-radius:12px;border:1px solid #27272a;overflow:hidden;">

              <!-- Card top accent -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(90deg,#16a34a 0%,#15803d 100%);height:4px;"></td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding:40px 36px;">

                <!-- Status badge -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <span style="display:inline-block;background-color:#14532d;color:#4ade80;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:4px 12px;border-radius:999px;border:1px solid #16a34a;">
                      ✓ Confirmed
                    </span>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;letter-spacing:-0.3px;">
                      Your appointment is confirmed
                    </h1>
                  </td>
                </tr>

                <!-- Sub-heading -->
                <tr>
                  <td style="padding-bottom:36px;">
                    <p style="margin:0;color:#a1a1aa;font-size:15px;line-height:1.5;">
                      Hi ${escapeHtml(guestName)}, we look forward to seeing you. Here are your booking details.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #27272a;padding-bottom:32px;"></td>
                </tr>

                <!-- Details table -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                      <tr>
                        <td style="padding-bottom:20px;vertical-align:top;width:50%;">
                          <p style="margin:0 0 4px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Date</p>
                          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;">${escapeHtml(dateLabel)}</p>
                        </td>
                        <td style="padding-bottom:20px;vertical-align:top;">
                          <p style="margin:0 0 4px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Time</p>
                          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;">${escapeHtml(timeLabel)}</p>
                        </td>
                      </tr>

                      <tr>
                        <td style="vertical-align:top;width:50%;">
                          <p style="margin:0 0 4px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Duration</p>
                          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;">${escapeHtml(durationLabel)}</p>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 4px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Timezone</p>
                          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;">${escapeHtml(timezone)}</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Organized by -->
                <tr>
                  <td style="background-color:#09090b;border-radius:8px;border:1px solid #27272a;padding:16px 20px;">
                    <p style="margin:0 0 2px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Organized by</p>
                    <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;">${escapeHtml(workspaceName)}</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;" align="center">
              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.5;">
                Sent by <a href="https://sendora.app" style="color:#71717a;text-decoration:none;">Sendora</a>. If you did not book this appointment, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
