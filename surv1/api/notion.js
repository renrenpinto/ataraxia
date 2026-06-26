export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = "7dfb9ef910744afbac29cbbb49f17b68";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { action } = req.query;

  // Parse body manually from stream
  async function parseBody() {
    return new Promise((resolve, reject) => {
      if (req.body) {
        resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
        return;
      }
      let data = "";
      req.on("data", chunk => { data += chunk; });
      req.on("end", () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch(e) { reject(e); }
      });
      req.on("error", reject);
    });
  }

  try {
    if (action === "save") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

      const body = await parseBody();
      if (!body || !body.Respuesta) return res.status(400).json({ error: "Missing Respuesta" });

      const props = {
        Respuesta: { title: [{ text: { content: body.Respuesta } }] },
      };
      Object.entries(body).forEach(([k, v]) => {
        if (k === "Respuesta" || v === null || v === undefined) return;
        if (k === "comentario") {
          props[k] = { rich_text: [{ text: { content: String(v) } }] };
        } else {
          props[k] = { number: Number(v) };
        }
      });

      const r = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + NOTION_TOKEN,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties: props }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "load") {
      const r = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + NOTION_TOKEN,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sorts: [{ timestamp: "created_time", direction: "ascending" }] }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
