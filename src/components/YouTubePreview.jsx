import { useState } from 'react';
import { Play } from 'lucide-react';

export default function YouTubePreview({ videoId, title }) {
  const [playing, setPlaying] = useState(false);
  const id = encodeURIComponent(videoId);

  if (playing) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        className="block h-full w-full border-0 bg-black"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Reproducir ${title}`}
      onClick={() => setPlaying(true)}
      className="relative grid h-full w-full place-items-center overflow-hidden bg-black text-white focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
    >
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-cover" />
      <span className="relative flex h-10 w-14 items-center justify-center rounded-xl bg-black/80">
        <Play size={22} fill="currentColor" aria-hidden="true" />
      </span>
    </button>
  );
}
