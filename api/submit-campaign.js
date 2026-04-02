// api/submit-campaign.js
// Vercel Serverless Function — receives campaign form data and creates a Notion page

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: "Server misconfigured: missing Notion credentials" });
  }

  try {
    const body = req.body;

    const {
      title,
      description,
      pricing,
      startDate,
      endDate,
      branches,
      tags,
      client,
      link,
    } = body;

    // ── Status auto-logic ──
    const today = new Date().toISOString().slice(0, 10);
    let status = "Active";
    if (startDate && startDate > today) {
      status = "Scheduled";
    }
    if (endDate && endDate < today) {
      status = "Expired";
    }

    // ── Build Notion properties ──
    const properties = {
      "Campaign Title": {
        title: [{ text: { content: title || "Untitled Campaign" } }],
      },
      Status: {
        select: { name: status },
      },
    };

    if (description) {
      properties["Description"] = {
        rich_text: [{ text: { content: description } }],
      };
    }

    if (pricing) {
      properties["Pricing"] = {
        rich_text: [{ text: { content: pricing } }],
      };
    }

    if (startDate) {
      properties["Start Date"] = { date: { start: startDate } };
    }

    if (endDate) {
      properties["End Date"] = { date: { start: endDate } };
    }

    // branches comes as JSON string from FormData, or array from JSON body
    const branchList = Array.isArray(branches) ? branches : JSON.parse(branches || "[]");
    if (branchList.length > 0) {
      properties["Branches"] = {
        multi_select: branchList.map((b) => ({ name: b })),
      };
    }

    // tags comes as JSON string from FormData, or array from JSON body
    const tagList = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
    if (tagList.length > 0) {
      properties["Tags"] = {
        multi_select: tagList.map((t) => ({ name: t })),
      };
    }

    if (client) {
      properties["Client"] = { select: { name: client } };
    }

    if (link) {
      properties["Campaign Link"] = { url: link };
    }

    // ── Send to Notion ──
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.json().catch(() => ({}));
      console.error("Notion API error:", err);
      return res.status(notionRes.status).json({
        error: "Failed to create campaign in Notion",
        details: err.message || JSON.stringify(err),
      });
    }

    const notionData = await notionRes.json();

    return res.status(200).json({
      success: true,
      id: notionData.id,
      url: notionData.url,
      status,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
