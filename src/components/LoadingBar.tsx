'use client';

export default function LoadingBar() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            animation: 'loadingSlide 0.8s ease-in-out infinite',
            width: '40%',
          }}
        />
      </div>
      <style>{`
        @keyframes loadingSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
