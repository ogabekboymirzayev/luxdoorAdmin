interface LeadNotificationPayload {
  id: string;
  name: string;
  phone: string;
  message: string;
  source: string;
  createdAt: Date;
}

function escapeTelegram(text: string) {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export async function notifyNewLead(payload: LeadNotificationPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_BOT_ADMIN_ID;

  if (!token || !chatId) {
    return;
  }

  const createdAt = payload.createdAt.toISOString().replace("T", " ").slice(0, 16);
  const text = [
    "*Yangi lead tushdi*",
    `ID: ${escapeTelegram(payload.id)}`,
    `Ism: ${escapeTelegram(payload.name)}`,
    `Telefon: ${escapeTelegram(payload.phone)}`,
    `Manba: ${escapeTelegram(payload.source)}`,
    `Vaqt: ${escapeTelegram(createdAt)}`,
    `Xabar: ${escapeTelegram(payload.message)}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[LEADS] Telegram notify failed:", body);
  }
}
