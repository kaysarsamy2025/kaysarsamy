export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  tags: string[];
  readingTime: string;
  draft: boolean;
  coAuthors?: string[];
  views?: number;
};

export type PostDetail = PostSummary & {
  content: string;
};

const TACOS_API_URL = process.env.TACOS_API_URL?.trim();
const TACOS_API_KEY = process.env.TACOS_API_KEY?.trim() || "";
const POSTS_REVALIDATE_SECONDS = 600;

type FetchWithApiKeyOptions = {
  tags?: string[];
  revalidateSeconds?: number;
};

const fetchWithApiKey = async (
  url: string,
  options: FetchWithApiKeyOptions = {},
) => {
  if (!TACOS_API_URL) {
    throw new Error("TACOS_API_URL is not configured.");
  }

  const { tags, revalidateSeconds } = options;
  const res = await fetch(url, {
    ...(process.env.NODE_ENV === "production"
      ? {
          next: {
            revalidate: revalidateSeconds ?? POSTS_REVALIDATE_SECONDS,
            ...(tags ? { tags } : {}),
          },
        }
      : { cache: "no-store" }),
    headers: {
      "X-TACOS-Key": TACOS_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
};

export async function getPosts(limit?: number): Promise<PostSummary[]> {
  if (!TACOS_API_URL) {
    console.warn("[posts] TACOS_API_URL is not configured. Returning empty post list.");
    return [];
  }

  try {
    const posts: PostSummary[] = await fetchWithApiKey(
      `${TACOS_API_URL}/posts`,
      { tags: ["posts"] },
    );
    // Posts already sorted by publishedAt desc from the API
    return limit ? posts.slice(0, limit) : posts;
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  if (!TACOS_API_URL) {
    console.warn(`[posts] TACOS_API_URL is not configured. Post ${slug} unavailable.`);
    return null;
  }

  try {
    const post: PostDetail = await fetchWithApiKey(
      `${TACOS_API_URL}/posts/${slug}`,
      { tags: ["posts", `post:${slug}`] },
    );
    return post;
  } catch (err) {
    console.error(`Error fetching post ${slug}:`, err);
    return null;
  }
}
