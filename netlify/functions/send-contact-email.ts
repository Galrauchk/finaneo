interface FormData {
  type: 'credit-immobilier' | 'defiscalisation' | 'rachat-credit' | 'contact';
  nom: string;
  email: string;
  telephone?: string;
  message?: string;
  montant?: string;
  duree?: string;
  sujet?: string;
  _honeypot?: string;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
}

const SENDER = { name: 'Finaneo', email: 'contact@finaneo.fr' };
const RECIPIENT = 'jeffrey.aldebert@gmail.com';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function sendBrevo(payload: BrevoEmailPayload): Promise<Response> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set');

  return fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSubject(data: FormData): string {
  const nom = escapeHtml(data.nom);
  switch (data.type) {
    case 'credit-immobilier':
      return `[Finaneo] Lead crédit immo - ${nom}`;
    case 'defiscalisation':
      return `[Finaneo] Lead défiscalisation - ${nom}`;
    case 'rachat-credit':
      return `[Finaneo] Lead rachat crédit - ${nom}`;
    case 'contact':
    default:
      return `[Finaneo] Contact - ${nom}`;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'credit-immobilier': return 'Crédit immobilier';
    case 'defiscalisation': return 'Défiscalisation';
    case 'rachat-credit': return 'Rachat de crédit';
    case 'contact': return 'Contact général';
    default: return type;
  }
}

function buildRow(label: string, value: string | undefined): string {
  if (!value?.trim()) return '';
  return `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5;width:160px;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(value)}</td>
    </tr>`;
}

function buildNotificationEmail(data: FormData): BrevoEmailPayload {
  const rows = [
    buildRow('Type', getTypeLabel(data.type)),
    buildRow('Nom', data.nom),
    buildRow('Email', data.email),
    buildRow('Téléphone', data.telephone),
    buildRow('Sujet', data.sujet),
    buildRow('Montant', data.montant ? `${data.montant} €` : undefined),
    buildRow('Durée', data.duree ? `${data.duree} ans` : undefined),
    buildRow('Message', data.message),
  ].filter(Boolean).join('');

  return {
    sender: SENDER,
    to: [{ email: RECIPIENT, name: 'Jeffrey Aldebert' }],
    subject: getSubject(data),
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#0A2540;">Nouveau lead — ${getTypeLabel(data.type)}</h2>
        <table style="border-collapse:collapse;width:100%;">
          ${rows}
        </table>
        <p style="color:#999;font-size:12px;margin-top:16px;">Envoyé depuis finaneo.fr</p>
      </div>`,
  };
}

function getConfirmationBody(data: FormData): string {
  const nom = escapeHtml(data.nom);

  switch (data.type) {
    case 'credit-immobilier':
      return `
        <h2 style="color:#0A2540;">Merci ${nom}, votre demande de simulation crédit est bien reçue !</h2>
        <p>Nous avons enregistré votre demande de simulation de crédit immobilier${data.montant ? ` pour un montant de <strong>${escapeHtml(data.montant)} €</strong>` : ''}${data.duree ? ` sur <strong>${escapeHtml(data.duree)} ans</strong>` : ''}.</p>
        <p>Un conseiller vous recontactera sous 24h pour affiner votre projet et vous proposer les meilleures conditions du marché.</p>`;
    case 'defiscalisation':
      return `
        <h2 style="color:#0A2540;">Merci ${nom}, votre demande de bilan fiscal est bien reçue !</h2>
        <p>Nous avons bien pris en compte votre demande concernant la défiscalisation.</p>
        <p>Un conseiller en gestion de patrimoine vous recontactera sous 24h pour réaliser votre bilan fiscal personnalisé.</p>`;
    case 'rachat-credit':
      return `
        <h2 style="color:#0A2540;">Merci ${nom}, votre demande d'étude de rachat est bien reçue !</h2>
        <p>Nous avons enregistré votre demande de rachat de crédit${data.montant ? ` pour un montant de <strong>${escapeHtml(data.montant)} €</strong>` : ''}.</p>
        <p>Un conseiller spécialisé vous recontactera sous 24h pour étudier votre dossier et vous proposer la meilleure solution.</p>`;
    case 'contact':
    default:
      return `
        <h2 style="color:#0A2540;">Merci ${nom}, votre message est bien reçu !</h2>
        <p>Nous avons bien reçu votre message${data.sujet ? ` concernant <strong>${escapeHtml(data.sujet)}</strong>` : ''}.</p>
        <p>Notre équipe vous répondra dans les meilleurs délais.</p>`;
  }
}

function buildConfirmationEmail(data: FormData): BrevoEmailPayload {
  return {
    sender: SENDER,
    to: [{ email: data.email, name: data.nom }],
    subject: 'Finaneo — Nous avons bien reçu votre demande',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${getConfirmationBody(data)}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#666;font-size:13px;">
          Ceci est un email automatique envoyé par Finaneo.<br/>
          Pour toute question, contactez-nous à <a href="mailto:contact@finaneo.fr">contact@finaneo.fr</a>.
        </p>
      </div>`,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let data: FormData;
  try {
    data = (await req.json()) as FormData;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Honeypot anti-spam
  if (data._honeypot) {
    // Silently accept but don't send email
    return json({ success: true }, 200);
  }

  // Validate required fields
  if (!data.nom?.trim() || !data.email?.trim()) {
    return json({ error: 'Les champs nom et email sont requis.' }, 400);
  }

  if (!data.type) {
    data.type = 'contact';
  }

  // Validate type
  const validTypes = ['credit-immobilier', 'defiscalisation', 'rachat-credit', 'contact'];
  if (!validTypes.includes(data.type)) {
    return json({ error: 'Type de formulaire invalide.' }, 400);
  }

  try {
    const [notifRes, confirmRes] = await Promise.all([
      sendBrevo(buildNotificationEmail(data)),
      sendBrevo(buildConfirmationEmail(data)),
    ]);

    if (!notifRes.ok) {
      const err = await notifRes.text();
      console.error('Brevo notification error:', err);
      return json({ error: 'Erreur lors de l\'envoi de la notification.' }, 502);
    }

    if (!confirmRes.ok) {
      const err = await confirmRes.text();
      console.error('Brevo confirmation error:', err);
      // Don't fail if confirmation fails — the lead is already captured
    }

    return json({ success: true, message: 'Votre demande a bien été envoyée.' }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('send-contact-email error:', msg);
    return json({ error: msg }, 500);
  }
}

export const config = {
  path: '/.netlify/functions/send-contact-email',
  preferStatic: true,
};
