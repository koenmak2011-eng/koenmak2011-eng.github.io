import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bearBg from "@/assets/bear-background.jpg";
import { VIDEOS } from "@/lib/videos";
import VideoCard from "@/components/VideoCard";

const Videos = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <img src={bearBg} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-14">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">
            🎬 Videos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            Featured clips from the Arcade. Drop your own into <code>public/videos/</code> or paste links in <code>src/lib/videos.ts</code>.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {VIDEOS.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/">
            <Button variant="ghost">← Back to Arcade</Button>
          </Link>
        </div>

        <footer className="text-center mt-10 text-[10px] text-muted-foreground">
          Oliver Ware is not a certified bear. 🐻
        </footer>
      </div>
    </div>
  );
};

export default Videos;
