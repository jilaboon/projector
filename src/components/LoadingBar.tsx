'use client';

export default function LoadingBar({ label }: { label?: string }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      {/* Track */}
      <div
        style={{
          width: '320px',
          height: '8px',
          backgroundColor: '#27272a',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        {/* Sliding gradient bar */}
        <div
          style={{
            height: '100%',
            width: '40%',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)',
            animation: 'loadingSlide 0.8s ease-in-out infinite',
          }}
        />
      </div>
      {label && (
        <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>{label}</p>
      )}
      <style>{`
        @keyframes loadingSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
