import { BoltShader } from "@/components/site/bolt-shader";

export function FormPage({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2 lg:gap-16 lg:py-0">
        {/* Left — the bolt, standing on its own (desktop, sticky) */}
        <div className="hidden lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:items-center lg:justify-center lg:self-start">
          <div className="w-full max-w-md">
            <BoltShader color="#ff32a0" />
          </div>
        </div>

        {/* Right — form header + form */}
        <div className="flex flex-col justify-center lg:py-16">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta sm:text-sm">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-md text-pretty text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
