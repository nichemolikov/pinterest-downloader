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
        $("title").text() || "Pinterest Content";
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

    // Priority 1: Search in __PWS_DATA__ for highest quality variants
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
                // Resolution keywords for sorting (top to bottom)
                const qualityOrder = ['1080p', '720p', 'V_720P', 'v720p', 'V_H264_600', '480p'];

                const sorted = urls.sort((a, b) => {
                    const getRank = (url: string) => {
                        const index = qualityOrder.findIndex(q => url.includes(q));
                        return index === -1 ? 99 : index;
                    };
                    return getRank(a) - getRank(b);
                });

                return sorted[0];
            }
        } catch (e) { }
    }

    // Priority 2: Fallback to og:video
    const videoUrl = $('meta[property="og:video:secure_url"]').attr("content") ||
        $('meta[property="og:video"]').attr("content");
    if (videoUrl) return videoUrl;

    // Priority 3: Regex search for any .mp4 link
    const scripts = $("script");
    let mp4Links: string[] = [];
    scripts.each((_, script) => {
        const content = $(script).html();
        if (content) {
            const matches = content.match(/https:\/\/(?:v1\.pinimg\.com\/videos\/|[^"']+\/)[^"']+\.mp4(?:\?[^"']+)?/g);
            if (matches) mp4Links.push(...matches);
        }
    });

    if (mp4Links.length > 0) {
        const qualityOrder = ['1080p', '720p', 'V_720P', 'v720p', 'V_H264_600', '480p'];
        return mp4Links.sort((a, b) => {
            const getRank = (url: string) => {
                const index = qualityOrder.findIndex(q => url.includes(q));
                return index === -1 ? 99 : index;
            };
            return getRank(a) - getRank(b);
        })[0];
    }

    return null;
}

function extractImageUrl(html: string): string | null {
    const $ = cheerio.load(html);

    // Get base image from meta tags
    let imageUrl = $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content");

    if (imageUrl) {
        // Upgrade to 'originals' quality if it's a thumbnail/shrunk version
        // Pinterest uses patterns like /236x/, /474x/, /736x/ etc.
        const upgraded = imageUrl.replace(/\/\d+x\//, '/originals/');

        // Also try to find it in __PWS_DATA__ for the most definitive 'originals' link
        const pwsData = $('#__PWS_DATA__').html();
        if (pwsData) {
            try {
                const data = JSON.parse(pwsData);
                let foundOriginal = "";
                const search = (obj: any) => {
                    if (foundOriginal) return;
                    if (!obj || typeof obj !== 'object') return;
                    for (const key in obj) {
                        if (key === 'url' && typeof obj[key] === 'string' && obj[key].includes('/originals/')) {
                            foundOriginal = obj[key];
                            return;
                        }
                        search(obj[key]);
                    }
                };
                search(data);
                if (foundOriginal) return foundOriginal;
            } catch (e) { }
        }

        return upgraded;
    }

    return null;
}

// Routes
app.post("/api/resolve", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "URL is required" });
    if (!validatePinterestUrl(url)) return res.status(400).json({ error: "Please provide a valid public Pinterest URL" });

    try {
        const html = await fetchHtml(url);
        const metadata = extractMetadata(html);
        const videoUrl = extractVideoUrl(html);
        const imageUrl = extractImageUrl(html);

        if (!videoUrl && !imageUrl) {
            return res.status(404).json({ error: "Could not find a public video or image at this URL." });
        }

        res.json({
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            videoUrl: videoUrl,
            imageUrl: imageUrl,
            type: videoUrl ? 'video' : 'image',
            description: metadata.description,
            style: metadata.style,
        });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

app.post("/resolve", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "URL is required" });
    if (!validatePinterestUrl(url)) return res.status(400).json({ error: "Please provide a valid public Pinterest URL" });

    try {
        const html = await fetchHtml(url);
        const metadata = extractMetadata(html);
        const videoUrl = extractVideoUrl(html);
        const imageUrl = extractImageUrl(html);

        if (!videoUrl && !imageUrl) {
            return res.status(404).json({ error: "Could not find a public video or image at this URL." });
        }

        res.json({
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            videoUrl: videoUrl,
            imageUrl: imageUrl,
            type: videoUrl ? 'video' : 'image',
            description: metadata.description,
            style: metadata.style,
        });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

app.get("/api/download", async (req, res) => {
    const downloadUrl = req.query.url as string;
    if (!downloadUrl) return res.status(400).send("Missing URL");

    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Failed to fetch media");

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const isVideo = contentType.includes("video");
        const extension = isVideo ? "mp4" : "jpg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="pinterest-media.${extension}"`);

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        res.status(500).send("Error downloading media");
    }
});

app.get("/download", async (req, res) => {
    const downloadUrl = req.query.url as string;
    if (!downloadUrl) return res.status(400).send("Missing URL");

    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Failed to fetch media");

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const isVideo = contentType.includes("video");
        const extension = isVideo ? "mp4" : "jpg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="pinterest-media.${extension}"`);

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        res.status(500).send("Error downloading media");
    }
});

export default app;
