'use client';

export default function LoadingBar({ label }: { label?: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <div className="w-80 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            animation: 'loadingSlide 0.8s ease-in-out infinite',
            width: '40%',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)',
          }}
        />
      </div>
      {label && <p className="text-zinc-500 text-sm">{label}</p>}
      <style>{`
        @keyframes loadingSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
