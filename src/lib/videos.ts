export interface VideoItem {
  id: string;
  title: string;
  description: string;
  src: string; // path under /public, or external URL
  poster?: string;
}

export const VIDEOS: VideoItem[] = [
  { id: "v1", title: "Arcade Short", description: "Featured YouTube short.", src: "https://youtube.com/shorts/W2Fr1qxq9D4" },
  { id: "v2", title: "Capy Vibes", description: "Pure capybara serenity.", src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: "v3", title: "Arthur Loses Again", description: "A chess tragedy in 30 seconds.", src: "https://youtube.com/shorts/W2Fr1qxq9D4" },
  { id: "v4", title: "Abhay Teddy Disco", description: "Final boss prep montage.", src: "https://youtube.com/shorts/W2Fr1qxq9D4" },
  { id: "v5", title: "Plague Speedrun WR", description: "Greenland fell in 4 minutes.", src: "https://youtube.com/shorts/W2Fr1qxq9D4" },
  { id: "v6", title: "Capy Dash 100%", description: "No skips. No mercy.", src: "https://youtube.com/shorts/W2Fr1qxq9D4" },
];

export const isExternal = (src: string) => /^https?:\/\//i.test(src);

export function getEmbedUrl(src: string): string | null {
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = src.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
