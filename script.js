/**
 * Helper: Generate HMAC-SHA256 signature
 */
async function createSignature(secret, body) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey( "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Helper: Send Email via Resend
   */
  async function sendEmail(env, name, email, message) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use this or your verified domain
        to: "lars@joonify.dev",      // <--- YOUR EMAIL ADDRESS
        reply_to: email,
        subject: `New Contact from ${name} (Joonify)`,
        html: `
          <h3>New Message from Joonify.dev</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f4f4f4; padding: 10px; border-left: 4px solid #86efac;">${message}</blockquote>
        `
      })
    });
    return res.ok;
  }
  
  /**
   * CORE LOGIC: Fetch Analytics & Update DO
   */
  async function runAnalyticsUpdate(env) {
      console.log("Starting Analytics Update...");
      const durableObjectId = env.STATS_DO.idFromName("Joonify-Live-Stats-Singleton");
      const durableObjectStub = env.STATS_DO.get(durableObjectId);
  
      // Timeframe 1: Last 30 Days (For Total Count)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Timeframe 2: Last 23 Hours (For Map Data - Safety buffer for Free Plan limit)
      const oneDayAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  
      const query = `{
        viewer {
          zones(filter: {zoneTag: "${env.CLOUDFLARE_ZONE_ID}"}) {
            
            # 1. Total Count (Last 30 Days)
            httpRequests1dGroups(limit: 30, filter: {date_gt: "${thirtyDaysAgo}"}) {
              uniq { uniques }
            }
            
            # 2. Map Data (Last 23 Hours - Safe Limit)
            httpRequestsAdaptiveGroups(limit: 5000, filter: {datetime_gt: "${oneDayAgo}"}) {
              count
              dimensions {
                clientCountryName
              }
            }
          }
        }
      }`;
  
      const analyticsResponse = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const responseBody = await analyticsResponse.json();
  
      if (responseBody.errors && responseBody.errors.length > 0) {
          throw new Error(`GraphQL Error: ${JSON.stringify(responseBody.errors)}`);
      }
      if (!responseBody.data || !responseBody.data.viewer) {
          throw new Error("Invalid data structure from Cloudflare API.");
      }
  
      const zoneData = responseBody.data.viewer.zones[0];
      
      // --- PROCESS 1: Total Visitors (30 Days) ---
      const dailyGroups = zoneData.httpRequests1dGroups;
      const newVisitorCount = dailyGroups.reduce((total, item) => total + item.uniq.uniques, 0);
  
      // --- PROCESS 2: Map Data (23 Hours) ---
      const adaptiveGroups = zoneData.httpRequestsAdaptiveGroups;
      const countryMap = {};
      
      adaptiveGroups.forEach(item => {
          const code = item.dimensions.clientCountryName;
          const count = item.count;
          
          if(code && code !== "T1" && code !== "XX") { 
              countryMap[code] = (countryMap[code] || 0) + count;
          }
      });
      
      const finalMapData = Object.entries(countryMap).map(([code, count]) => ({ code, count }));
      const countriesServedCount = finalMapData.length;
  
      // --- UPDATE DURABLE OBJECT ---
      const internalRequest = new Request("http://internal/api/get-stats", {
        headers: { 'X-Internal-Secret': env.JOONIFY_HMAC_KEY } 
      });
      const currentStatsResponse = await durableObjectStub.fetch(internalRequest);
      const currentStats = await currentStatsResponse.json();
  
      const updatedStats = { 
        ...currentStats, 
        "visitors-count": newVisitorCount,
        "countries-count": countriesServedCount, // Based on active countries today
        "map-data": finalMapData
      };
  
      const body = JSON.stringify(updatedStats);
      const signature = await createSignature(env.JOONIFY_HMAC_KEY, body);
      
      const updateRequest = new Request("http://internal/api/update", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
          body: body
      });
      
      await durableObjectStub.fetch(updateRequest);
      
      return {
          success: true,
          visitors: newVisitorCount,
          mapDataLength: finalMapData.length,
          mapData: finalMapData
      };
  }
  
  
  /**
   * MAIN WORKER HANDLER
   */
  export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
  
      // --- ROUTE 1: Contact Form ---
      if (url.pathname === "/api/contact" && request.method === "POST") {
        try {
          const { name, email, message } = await request.json();
  
          // Basic Validation
          if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
          }
  
          // Send Email
          const sent = await sendEmail(env, name, email, message);
          
          if (sent) {
            return new Response(JSON.stringify({ success: true }), { 
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
            });
          } else {
            return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
          }
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }
  
      // --- ROUTE 2: Force Update (Manual Trigger) ---
      if (url.pathname === "/api/force-update") {
          const key = url.searchParams.get("key");
          if (key !== env.JOONIFY_HMAC_KEY) {
              return new Response("Unauthorized", { status: 401 });
          }
          try {
              const result = await runAnalyticsUpdate(env);
              return new Response(JSON.stringify(result, null, 2), { 
                  headers: { "Content-Type": "application/json" } 
              });
          } catch (error) {
              return new Response(`Update Failed: ${error.message}`, { status: 500 });
          }
      }
  
      // --- DEFAULT: Route to Durable Object (Stats & WebSocket) ---
      let id = env.STATS_DO.idFromName("Joonify-Live-Stats-Singleton");
      let stub = env.STATS_DO.get(id);
      return stub.fetch(request);
    },
  
    /**
     * SCHEDULED HANDLER (Cron Job)
     */
    async scheduled(controller, env, ctx) {
      ctx.waitUntil(runAnalyticsUpdate(env).catch(err => console.error(err)));
    }
  };
  
  
  /**
   * DURABLE OBJECT CLASS
   */
  export class StatsObject {
    constructor(state, env) { this.state = state; this.env = env; this.sessions = []; }
    
    async fetch(request) {
      const url = new URL(request.url);
  
      // Endpoint to retrieve stats internally/externally
      if (url.pathname === "/api/get-stats") {
        if (request.headers.get('X-Internal-Secret') !== this.env.JOONIFY_HMAC_KEY) return new Response("Forbidden", { status: 403 });
        const stats = await this.env.STATS_KV.get("stats", "json") || {}; 
        return new Response(JSON.stringify(stats), { headers: { 'Content-Type': 'application/json' } });
      }
  
      // Endpoint to update stats securely
      if (url.pathname === "/api/update") {
        const signature = request.headers.get('X-Signature');
        const bodyText = await request.clone().text();
        const isValid = await this.verifySignature(bodyText, this.env.JOONIFY_HMAC_KEY, signature);
        if (!isValid) return new Response("Invalid signature", { status: 401 });
  
        const currentStats = await this.env.STATS_KV.get("stats", "json") || {};
        const newStats = JSON.parse(bodyText);
        const mergedStats = { ...currentStats, ...newStats };
  
        const finalBody = JSON.stringify(mergedStats);
        await this.env.STATS_KV.put("stats", finalBody);
        this.broadcast(finalBody);
        return new Response("Stats updated", { status: 200 });
      }
  
      // WebSocket Upgrade
      if (request.headers.get("Upgrade") === "websocket") {
        const [client, server] = Object.values(new WebSocketPair());
        await this.handleSession(server);
        return new Response(null, { status: 101, webSocket: client });
      }
      return new Response("Not found", { status: 404 });
    }
  
    async handleSession(server) {
      server.accept(); this.sessions.push(server);
      server.addEventListener("close", () => { this.sessions = this.sessions.filter(s => s !== server); });
      const currentStats = await this.env.STATS_KV.get("stats");
      if (currentStats) server.send(currentStats);
    }
    
    broadcast(message) { this.sessions.forEach(s => { try { s.send(message) } catch (err) {} }); }
    
    async verifySignature(body, secret, signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      const sigBuf = Uint8Array.from(signature.match(/../g).map(h => parseInt(h, 16)));
      return crypto.subtle.verify("HMAC", key, sigBuf, encoder.encode(body));
    }
  }