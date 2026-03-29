import type { Config, Context } from "@netlify/functions";

interface ContactFormBody {
  nom: string;
  email: string;
  telephone: string;
  message: string;
  source: string;
  sujet: string;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
}

const SENDER = { name: "Finaneo", email: "contact@finaneo.fr" };
const NOTIFICATION_RECIPIENT = "jeffrey.aldebert@gmail.com";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<Response> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set");
  }

  return fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

function buildNotificationEmail(data: ContactFormBody): BrevoEmailPayload {
  return {
    sender: SENDER,
    to: [{ email: NOTIFICATION_RECIPIENT, name: "Jeffrey Aldebert" }],
    subject: `Nouveau message de contact - ${data.sujet}`,
    htmlContent: `
      <h2>Nouveau message depuis le formulaire de contact</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:Arial,sans-serif;">
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Nom</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.nom}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Email</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Telephone</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.telephone}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Sujet</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.sujet}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Source</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.source}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;">Message</td>
          <td style="padding:8px 12px;border:1px solid #ddd;">${data.message}</td>
        </tr>
      </table>
    `,
  };
}

function buildConfirmationEmail(data: ContactFormBody): BrevoEmailPayload {
  return {
    sender: SENDER,
    to: [{ email: data.email, name: data.nom }],
    subject: "Finaneo - Nous avons bien recu votre message",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Merci pour votre message, ${data.nom} !</h2>
        <p>Nous avons bien recu votre demande concernant <strong>${data.sujet}</strong>.</p>
        <p>Notre equipe vous repondra dans les meilleurs delais.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#666;font-size:13px;">
          Ceci est un email automatique, merci de ne pas y repondre directement.<br/>
          Pour toute question, contactez-nous a <a href="mailto:contact@finaneo.fr">contact@finaneo.fr</a>.
        </p>
      </div>
    `,
  };
}

export default async function handler(
  req: Request,
  _context: Context
): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let data: ContactFormBody;

  try {
    data = (await req.json()) as ContactFormBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // Validate required fields
  const requiredFields: (keyof ContactFormBody)[] = [
    "nom",
    "email",
    "message",
    "sujet",
  ];
  const missingFields = requiredFields.filter((field) => !data[field]?.trim());

  if (missingFields.length > 0) {
    return jsonResponse(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      400
    );
  }

  try {
    // Send both emails in parallel
    const [notificationRes, confirmationRes] = await Promise.all([
      sendBrevoEmail(buildNotificationEmail(data)),
      sendBrevoEmail(buildConfirmationEmail(data)),
    ]);

    if (!notificationRes.ok) {
      const errorBody = await notificationRes.text();
      console.error("Brevo notification email error:", errorBody);
      return jsonResponse(
        { error: "Failed to send notification email" },
        502
      );
    }

    if (!confirmationRes.ok) {
      const errorBody = await confirmationRes.text();
      console.error("Brevo confirmation email error:", errorBody);
      return jsonResponse(
        { error: "Failed to send confirmation email" },
        502
      );
    }

    return jsonResponse({ success: true, message: "Emails sent successfully" }, 200);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("send-contact-email error:", errorMessage);
    return jsonResponse({ error: errorMessage }, 500);
  }
}

export const config: Config = {
  path: "/api/send-contact-email",
  preferStatic: true,
};
