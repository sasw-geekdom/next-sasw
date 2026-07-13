// Branded transactional emails in SASTW voice. Terse, active, one metaphor.
// Inline styles only — email clients don't load external CSS or web fonts.

const MAGENTA = "#ff32a0";
const BLACK = "#000000";
const INK = "#111111";
const MUTED = "#52525b";

function shell(bodyInner: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background:${BLACK};padding:24px 28px;">
                <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;text-transform:uppercase;">
                  SASTW<span style="color:${MAGENTA};"> </span>
                </div>
                <div style="color:${MAGENTA};font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">
                  Sept 28 – Oct 2 · Year 11
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${bodyInner}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;color:${MUTED};font-size:12px;line-height:18px;">
                San Antonio Startup + Tech Week · Downtown at TPR<br/>
                The current runs through SA. Plug in.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<div style="font-size:26px;font-weight:700;line-height:1.1;color:${INK};margin:0 0 12px 0;">${text}</div>`;
}

function paragraph(text: string): string {
  return `<p style="font-size:15px;line-height:22px;color:${INK};margin:0 0 14px 0;">${text}</p>`;
}

export function speakerSubmissionEmail(input: {
  name: string;
  sessionTitle: string;
}): { subject: string; html: string } {
  const first = input.name.split(" ")[0];
  return {
    subject: "Got your session. We'll be in touch.",
    html: shell(
      heading("You pitched. We got it.") +
        paragraph(`Thanks, ${first}.`) +
        paragraph(
          `Your session — <strong>${input.sessionTitle}</strong> — is in the review queue for San Antonio Startup + Tech Week.`,
        ) +
        paragraph(
          "We read every one. You'll hear back once the Circuit lineup takes shape.",
        ) +
        paragraph("Plug in."),
    ),
  };
}

export function registrationEmail(input: { name: string }): {
  subject: string;
  html: string;
} {
  const first = input.name.split(" ")[0];
  return {
    subject: "You're on the list. Plug in.",
    html: shell(
      heading("You're in.") +
        paragraph(`See you downtown, ${first}.`) +
        paragraph(
          "San Antonio Startup + Tech Week runs Sept 28 – Oct 2, anchored at Texas Public Radio.",
        ) +
        paragraph(
          "Schedule drops soon. We'll send the sessions, the Bash, and where to be.",
        ) +
        paragraph("Plug in."),
    ),
  };
}
