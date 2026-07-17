const targetEmail = "18640865859@163.com";

type DateCardPayload = {
  recipient?: string;
  image?: string;
  date?: string;
  time?: string;
  soup?: string;
  dishes?: string[];
};

function friendlyResendError(detail: string) {
  if (detail.includes("You can only send testing emails")) {
    return "Email failed: Resend is still in test mode. Please verify a sending domain in Resend, then set RESEND_FROM_EMAIL to an address on that domain.";
  }

  return `Email failed: ${detail}`;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const gmailWebhookSecret = process.env.GMAIL_WEBHOOK_SECRET;

  if (!gmailWebhookUrl && !resendApiKey) {
    return Response.json(
      {
        error:
          "Email service is not configured. Please set GMAIL_WEBHOOK_URL or RESEND_API_KEY and redeploy.",
      },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as DateCardPayload;
  const image = payload.image ?? "";
  const recipient = payload.recipient === targetEmail ? payload.recipient : targetEmail;

  if (!image.startsWith("data:image/png;base64,")) {
    return Response.json({ error: "Invalid image format." }, { status: 400 });
  }

  const imageBase64 = image.replace("data:image/png;base64,", "");
  const dishes = payload.dishes?.length ? payload.dishes.join(", ") : "Not selected";

  if (gmailWebhookUrl) {
    const gmailResponse = await fetch(gmailWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: gmailWebhookSecret,
        to: recipient,
        subject: "New hotpot date card",
        soup: payload.soup ?? "Not selected",
        dishes,
        date: payload.date ?? "Not selected",
        time: payload.time ?? "Not selected",
        imageBase64,
      }),
    });

    const gmailDetail = await gmailResponse.text();

    if (!gmailResponse.ok || !gmailDetail.includes("\"ok\":true")) {
      return Response.json(
        { error: `Gmail send failed: ${gmailDetail || gmailResponse.statusText}` },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, provider: "gmail" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Date Invite <${fromEmail}>`,
      to: [recipient],
      subject: "New hotpot date card",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7;">
          <h2>A new date card was submitted</h2>
          <p><strong>Soup base:</strong> ${payload.soup ?? "Not selected"}</p>
          <p><strong>Dishes:</strong> ${dishes}</p>
          <p><strong>Date:</strong> ${payload.date ?? "Not selected"}</p>
          <p><strong>Time:</strong> ${payload.time ?? "Not selected"}</p>
          <p>The date card image is attached.</p>
        </div>
      `,
      attachments: [
        {
          filename: "date-card.png",
          content: imageBase64,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return Response.json(
      { error: friendlyResendError(detail) },
      { status: response.status },
    );
  }

  return Response.json({ ok: true });
}
