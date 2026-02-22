import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as cheerio from "cheerio";

// --- Backend Logic Helpers (simulating /lib) ---

function validatePinterestUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname.includes("pinterest.com") || parsed.hostname.includes("pin.it")) &&
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error("Failed to fetch page");
  return await response.text();
}

function extractMetadata(html: string) {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() || "Pinterest Video";
  const thumbnail = $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");

  const description = $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") || "";

  // Extract style/hashtags from description or title
  const hashtagRegex = /#[\w\u0080-\uffff]+/g;
  const descriptionHashtags = description.match(hashtagRegex) || [];
  const titleHashtags = title.match(hashtagRegex) || [];
  const style = Array.from(new Set([...descriptionHashtags, ...titleHashtags])).join(' ');

  return { title, thumbnail, description, style };
}

function extractVideoUrl(html: string): string | null {
  const $ = cheerio.load(html);

  // 1. Try OpenGraph video tag
  const videoUrl = $('meta[property="og:video:secure_url"]').attr("content") ||
    $('meta[property="og:video"]').attr("content");

  if (videoUrl) return videoUrl;

  // 2. Search in __PWS_DATA__ (Modern Pinterest)
  const pwsData = $('#__PWS_DATA__').html();
  if (pwsData) {
    try {
      const data = JSON.parse(pwsData);
      const urls: string[] = [];
      const search = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          const val = obj[key];
          if (typeof val === 'string' && val.startsWith('https://') && val.includes('.mp4')) {
            urls.push(val);
          } else {
            search(val);
          }
        }
      };
      search(data);
      if (urls.length > 0) {
        // Prefer 720p or similar high quality
        return urls.find(u => u.includes('720p') || u.includes('V_720P')) || urls[0];
      }
    } catch (e) {
      console.error("Failed to parse __PWS_DATA__");
    }
  }

  // 3. Fallback regex for other script tags
  const scripts = $("script");
  let foundUrl: string | null = null;
  scripts.each((_, script) => {
    const content = $(script).html();
    if (content) {
      const match = content.match(/https:\/\/(?:v1\.pinimg\.com\/videos\/|[^"']+\/)[^"']+\.mp4(?:\?[^"']+)?/g);
      if (match) {
        foundUrl = match.find(url => url.includes('720p') || url.includes('V_720P')) || match[0];
        return false;
      }
    }
  });

  return foundUrl;
}

// --- Server Setup ---

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Resolve Pinterest URL
  app.post("/api/resolve", async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!validatePinterestUrl(url)) {
      return res.status(400).json({ error: "Please provide a valid public Pinterest URL" });
    }

    try {
      const html = await fetchHtml(url);
      const metadata = extractMetadata(html);
      const videoUrl = extractVideoUrl(html);

      if (!videoUrl) {
        return res.status(404).json({
          error: "Could not find a public video at this URL. It might be a static image or a private pin."
        });
      }

      res.json({
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        videoUrl: videoUrl,
        description: metadata.description,
        style: metadata.style,
      });
    } catch (error) {
      console.error("Error resolving URL:", error);
      res.status(500).json({ error: "An error occurred while processing the request. Please try again later." });
    }
  });

  // Proxy/Stream Video (Optional but helpful for cross-origin issues)
  app.get("/api/download", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) return res.status(400).send("Missing URL");

    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Failed to fetch video");

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'attachment; filename="pinterest-video.mp4"');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      res.status(500).send("Error downloading video");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
