export const config = { runtime: "edge" };

export default async function handler(req) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = "7dfb9ef910744afbac29cbbb49f17b68";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "save") {
      const body = await req.json();
      const props = {
        Respuesta: { title: [{ text: { content: body.Respuesta } }] },
      };
      Object.entries(body).forEach(([k, v]) => {
        if (k !== "Respuesta" && v !== null) props[k] = { number: v };
      });

      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + NOTION_TOKEN,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties: props }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "load") {
      const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + NOTION_TOKEN,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sorts: [{ timestamp: "created_time", direction: "ascending" }] }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
