export interface VideoItem {
  id: string;
  title: string;
  description: string;
  src: string; // path under /public, or external URL
  poster?: string;
}

// Drop your .mp4 files into public/videos/ with these names,
// or edit the src paths below. You can also paste a YouTube/Vimeo URL
// — the player will detect and embed it.
export const VIDEOS: VideoItem[] = [
  {
    id: "v1",
    title: "Arcade Short",
    description: "Featured YouTube short.",
    src: "https://youtube.com/shorts/W2Fr1qxq9D4",
  },
];

export const isExternal = (src: string) => /^https?:\/\//i.test(src);

export function getEmbedUrl(src: string): string | null {
  // YouTube (regular, shorts, embed, youtu.be)
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = src.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
