const targetEmail = "18640865859@163.com";

type DateCardPayload = {
  recipient?: string;
  image?: string;
  date?: string;
  time?: string;
  soup?: string;
  dishes?: string[];
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return Response.json(
      {
        error:
          "邮件发送服务还未配置。请在站点环境变量中设置 RESEND_API_KEY 后重新发布。",
      },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as DateCardPayload;
  const image = payload.image ?? "";
  const recipient = payload.recipient === targetEmail ? payload.recipient : targetEmail;

  if (!image.startsWith("data:image/png;base64,")) {
    return Response.json({ error: "图片格式不正确。" }, { status: 400 });
  }

  const imageBase64 = image.replace("data:image/png;base64,", "");
  const dishes = payload.dishes?.length ? payload.dishes.join("、") : "未选择";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Date Invite <onboarding@resend.dev>",
      to: [recipient],
      subject: "新的约会火锅信息卡",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7;">
          <h2>新的约会信息已经提交</h2>
          <p><strong>锅底：</strong>${payload.soup ?? "未选择"}</p>
          <p><strong>配菜：</strong>${dishes}</p>
          <p><strong>日期：</strong>${payload.date ?? "未选择"}</p>
          <p><strong>时间：</strong>${payload.time ?? "未选择"}</p>
          <p>约会信息图片见附件。</p>
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
      { error: `邮件发送失败：${detail}` },
      { status: response.status },
    );
  }

  return Response.json({ ok: true });
}
