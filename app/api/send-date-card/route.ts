const targetEmail = "18640865859@163.com";

type DateCardPayload = {
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
  const dishes = payload.dishes?.length ? payload.dishes.join(", ") : "Not selected";
  const recipient = targetEmail;
  const text = [
    "有人完成了你的火锅约会调查：",
    `锅底：${payload.soup ?? "未选择"}`,
    `配菜：${dishes}`,
    `日期：${payload.date ?? "未选择"}`,
    `时间：${payload.time ?? "未选择"}`,
    "散步：接受",
  ].join("\\n");

  if (gmailWebhookUrl) {
    const gmailResponse = await fetch(gmailWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: gmailWebhookSecret,
        to: recipient,
        subject: "火锅约会调查结果",
        text,
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
      subject: "火锅约会调查结果",
      text,
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
