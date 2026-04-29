import { useEffect } from "react";
import jobImage from "@/assets/job-application.jpeg";

interface JobApplicationPopupProps {
  open: boolean;
  onClose: () => void;
}

const MCDONALDS_URL = "https://careers.mcdonalds.com/";

const JobApplicationPopup = ({ open, onClose }: JobApplicationPopupProps) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      window.open(MCDONALDS_URL, "_blank", "noopener,noreferrer");
      onClose();
    }, 3500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card border-4 border-accent rounded-2xl p-6 shadow-2xl max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground">
          You beat them all.
        </h2>
        <p className="text-sm text-muted-foreground italic">Time for the real final boss...</p>
        <img
          src={jobImage}
          alt="Job application"
          className="w-full rounded-xl border-2 border-border shadow-lg"
        />
        <p className="text-xs text-muted-foreground">Redirecting to McDonald's careers...</p>
        <button
          onClick={onClose}
          className="text-xs underline text-muted-foreground hover:text-foreground"
        >
          skip
        </button>
      </div>
    </div>
  );
};

export default JobApplicationPopup;
