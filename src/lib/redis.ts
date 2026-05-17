import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1, // Minimize noise during build
  lazyConnect: true,       // Don't connect until used
  retryStrategy(times) {
    if (process.env.NEXT_PHASE === 'phase-production-build') return null; // Stop retrying during build
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

export default redis;

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis Get Error (${key}):`, err);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch (err) {
    console.error(`Redis Set Error (${key}):`, err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Redis Delete Error (${key}):`, err);
  }
}

export async function initSearchIndex() {
  try {
    const indices: any = await redis.call("FT._LIST");
    if (Array.isArray(indices) && indices.includes("idx:papers")) return;

    await redis.call(
      "FT.CREATE", "idx:papers", "ON", "HASH", "PREFIX", "1", "paper:", 
      "SCHEMA", 
      "subject_name", "TEXT", "SORTABLE",
      "subject_code", "TEXT", "SORTABLE",
      "department_name", "TEXT", "SORTABLE",
      "semester", "NUMERIC", "SORTABLE",
      "year", "NUMERIC", "SORTABLE",
      "paper_type", "TAG"
    );
    console.log("RediSearch index 'idx:papers' created successfully.");
  } catch (err) {
    console.error("RediSearch Index Error:", err);
  }
}

export async function indexPaper(paper: any) {
  try {
    const key = `paper:${paper.id}`;
    await redis.hset(key, {
      id: paper.id,
      subject_name: paper.subject_name,
      subject_code: paper.subject_code,
      department_name: paper.department_name,
      semester: paper.semester,
      year: paper.year,
      paper_type: paper.paper_type
    });
  } catch (err) {
    console.error(`RediSearch Indexing Error (${paper.id}):`, err);
  }
}

export async function searchPapers(query: string) {
  try {
    const results: any = await redis.call("FT.SEARCH", "idx:papers", query, "LIMIT", "0", "50");
    if (!results || results.length < 1) return { count: 0, papers: [] };

    const count = results[0];
    const papers = [];
    for (let i = 1; i < results.length; i += 2) {
      const fields = results[i + 1];
      const paper: any = {};
      for (let j = 0; j < fields.length; j += 2) {
        paper[fields[j]] = fields[j + 1];
      }
      papers.push(paper);
    }
    return { count, papers };
  } catch (err) {
    console.error("RediSearch Search Error:", err);
    return null;
  }
}
