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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
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
  return { title, thumbnail };
}

function extractVideoUrl(html: string): string | null {
  const $ = cheerio.load(html);
  
  // Try OpenGraph video tag
  let videoUrl = $('meta[property="og:video:secure_url"]').attr("content") || 
                 $('meta[property="og:video"]').attr("content");

  if (!videoUrl) {
    // Try to find in JSON-LD or script tags where Pinterest often hides the video source
    const scripts = $("script");
    scripts.each((_, script) => {
      const content = $(script).html();
      if (content && content.includes("video_list")) {
        // Rough regex to find mp4 URLs in the blob
        const match = content.match(/https:\/\/[^"']+\.mp4/);
        if (match) {
          videoUrl = match[0];
        }
      }
    });
  }

  return videoUrl || null;
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
