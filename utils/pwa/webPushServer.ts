import webpush from "web-push";

// Ensure VAPID keys are initialized once on the server
let isConfigured = false;

function ensureVapidConfigured() {
  if (isConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@sakutrack.local";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are missing from environment variables.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: WebPushPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    ensureVapidConfigured();

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      url: payload.url || "/",
      tag: payload.tag || "sakutrack",
    });

    const result = await webpush.sendNotification(pushSubscription, payloadString);
    return { success: true, statusCode: result.statusCode };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.error("Web push send error:", err?.statusCode, err?.message);
    return {
      success: false,
      statusCode: err?.statusCode,
      error: err?.message || "Failed to send notification",
    };
  }
}
