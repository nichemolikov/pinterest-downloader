import express from "express";
import * as cheerio from "cheerio";

const app = express();
app.use(express.json());

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

    const hashtagRegex = /#[\w\u0080-\uffff]+/g;
    const descriptionHashtags = description.match(hashtagRegex) || [];
    const titleHashtags = title.match(hashtagRegex) || [];
    const style = Array.from(new Set([...descriptionHashtags, ...titleHashtags])).join(' ');

    return { title, thumbnail, description, style };
}

function extractVideoUrl(html: string): string | null {
    const $ = cheerio.load(html);
    const videoUrl = $('meta[property="og:video:secure_url"]').attr("content") ||
        $('meta[property="og:video"]').attr("content");
    if (videoUrl) return videoUrl;

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
                return urls.find(u => u.includes('720p') || u.includes('V_720P')) || urls[0];
            }
        } catch (e) { }
    }

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

// Map the specific route
app.post("/api/resolve", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "URL is required" });
    if (!validatePinterestUrl(url)) return res.status(400).json({ error: "Please provide a valid public Pinterest URL" });

    try {
        const html = await fetchHtml(url);
        const metadata = extractMetadata(html);
        const videoUrl = extractVideoUrl(html);

        if (!videoUrl) {
            return res.status(404).json({ error: "Could not find a public video at this URL." });
        }

        res.json({
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            videoUrl: videoUrl,
            description: metadata.description,
            style: metadata.style,
        });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

// Also handle the general path if Vercel doesn't strip the prefix
app.post("/resolve", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "URL is required" });
    if (!validatePinterestUrl(url)) return res.status(400).json({ error: "Please provide a valid public Pinterest URL" });

    try {
        const html = await fetchHtml(url);
        const metadata = extractMetadata(html);
        const videoUrl = extractVideoUrl(html);

        if (!videoUrl) {
            return res.status(404).json({ error: "Could not find a public video at this URL." });
        }

        res.json({
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            videoUrl: videoUrl,
            description: metadata.description,
            style: metadata.style,
        });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

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

app.get("/download", async (req, res) => {
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

export default app;
