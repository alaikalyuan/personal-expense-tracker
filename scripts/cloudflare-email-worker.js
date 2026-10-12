/**
 * Cloudflare Email Worker for SakuTrack (sakutrack.my.id)
 *
 * How to deploy (100% FREE in Cloudflare):
 * 1. Log in to your Cloudflare Dashboard (https://dash.cloudflare.com).
 * 2. Select your domain: "sakutrack.my.id".
 * 3. Go to: Compute (Workers) > Workers & Pages > Create Application > Create Worker.
 * 4. Paste this code into the Worker editor and click "Deploy".
 * 5. Back on your domain "sakutrack.my.id", go to: Email Routing > Routing Rules.
 * 6. Under "Custom addresses" or "Catch-all address", set:
 *    - Action: "Send to a Worker"
 *    - Destination: Select your created Worker.
 * 7. That's it! Every forwarded QRIS email will be posted directly to SakuTrack.
 */

export default {
  async email(message, env, ctx) {
    try {
      const rawEmail = await new Response(message.raw).text();
      const to = message.to;
      const from = message.from;
      const subject = message.headers.get("subject") || "Bukti Transaksi";

      // Your deployed SakuTrack app URL
      const appEndpoint = env.SAKUTRACK_URL || "https://sakutrack.my.id/api/email/inbound";

      const res = await fetch(appEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          from,
          subject,
          text: rawEmail,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`SakuTrack webhook error [${res.status}]:`, errorText);
      } else {
        console.log("Successfully forwarded transaction email to SakuTrack.");
      }
    } catch (err) {
      console.error("Cloudflare Email Worker exception:", err);
    }
  },
};
