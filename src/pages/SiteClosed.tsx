// src/pages/SiteClosed.tsx
export default function SiteClosed() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-2xl w-full glass-card rounded-3xl p-8 md:p-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Study Zen is currently closed
        </h1>

        <p className="text-muted-foreground text-base md:text-lg leading-7">
          This page is temporarily closed due to extremely low usage. huge disappointment y'all ✌️🎀
        </p>

        <p className="text-muted-foreground text-base md:text-lg leading-7 mt-4">
          There is a chance this closure may become permanent. (i dont wanna pay for nothing, duh)
        </p>

        <div className="mt-8 rounded-2xl border border-border/50 bg-secondary/30 px-5 py-4 text-sm text-muted-foreground">
         tbh I shouldn't have even made this, ma fault 
        </div>
      </div>
    </div>
  );
}
