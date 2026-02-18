const BackgroundBlobs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: "radial-gradient(circle, hsl(var(--blob-1) / 0.4), transparent 70%)",
          animationDelay: "0s",
          animationDuration: "25s",
        }}
      />
      <div
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
        style={{
          background: "radial-gradient(circle, hsl(var(--blob-2) / 0.4), transparent 70%)",
          animationDelay: "-8s",
          animationDuration: "30s",
        }}
      />
      <div
        className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl animate-float"
        style={{
          background: "radial-gradient(circle, hsl(var(--blob-3) / 0.4), transparent 70%)",
          animationDelay: "-15s",
          animationDuration: "22s",
        }}
      />
    </div>
  );
};

export default BackgroundBlobs;
