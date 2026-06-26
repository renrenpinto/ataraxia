export default async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = "7dfb9ef910744afbac29cbbb49f17b68";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { action } = req.query;

  try {
    if (action === "save") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const props = {
        Respuesta: { title: [{ text: { content: body.Respuesta } }] },
      };
      Object.entries(body).forEach(([k, v]) => {
        if (k !== "Respuesta" && v !== null) props[k] = { number: Number(v) };
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
