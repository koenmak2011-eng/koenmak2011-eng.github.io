import { useState } from "react";
import { VideoItem, getEmbedUrl } from "@/lib/videos";

interface Props {
  video: VideoItem;
  compact?: boolean;
}

const VideoCard = ({ video, compact }: Props) => {
  const [errored, setErrored] = useState(false);
  const embed = getEmbedUrl(video.src);

  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-lg hover:border-accent transition-colors">
      <div className="relative w-full aspect-video bg-muted">
        {embed ? (
          <iframe
            src={embed}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : errored ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 gap-2">
            <span className="text-4xl">🎬</span>
            <p className="text-xs text-muted-foreground">
              No video found at <code className="text-foreground">{video.src}</code>
            </p>
            <p className="text-[10px] text-muted-foreground/70">Drop your .mp4 in <code>public/videos/</code></p>
          </div>
        ) : (
          <video
            src={video.src}
            poster={video.poster}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
            onError={() => setErrored(true)}
          />
        )}
      </div>
      {!compact && (
        <div className="p-4">
          <h3 className="font-black text-foreground text-base sm:text-lg">{video.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
