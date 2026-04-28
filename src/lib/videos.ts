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
    title: "Video Slot 1",
    description: "Replace public/videos/video1.mp4 with your clip.",
    src: "/videos/video1.mp4",
    poster: "/videos/thumb1.jpg",
  },
  {
    id: "v2",
    title: "Video Slot 2",
    description: "Replace public/videos/video2.mp4 with your clip.",
    src: "/videos/video2.mp4",
    poster: "/videos/thumb2.jpg",
  },
  {
    id: "v3",
    title: "Video Slot 3",
    description: "Replace public/videos/video3.mp4 with your clip.",
    src: "/videos/video3.mp4",
    poster: "/videos/thumb3.jpg",
  },
];

export const isExternal = (src: string) => /^https?:\/\//i.test(src);

export function getEmbedUrl(src: string): string | null {
  // YouTube
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = src.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
