const WEBHOOK_SECRET = "hotpot-date-2026";
const TARGET_EMAIL = "18640865859@163.com";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (WEBHOOK_SECRET && payload.secret !== WEBHOOK_SECRET) {
      return json({ ok: false, error: "Invalid secret" });
    }

    const body = String(payload.text || "No date details received.");
    GmailApp.sendEmail(TARGET_EMAIL, payload.subject || "Hotpot date survey result", body, {
      name: "Date Invite"
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
