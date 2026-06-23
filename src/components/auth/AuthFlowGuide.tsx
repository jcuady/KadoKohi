type Step = {
  title: string;
  body?: string;
};

type Props = {
  steps: readonly (string | Step)[];
  title?: string;
  variant?: 'success' | 'muted';
};

function normalizeStep(step: string | Step): Step {
  return typeof step === 'string' ? { title: step } : step;
}

export default function AuthFlowGuide({ steps, title = 'What happens next', variant = 'muted' }: Props) {
  const isSuccess = variant === 'success';
  const normalized = steps.map(normalizeStep);

  return (
    <div
      className={
        isSuccess
          ? 'mb-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-4'
          : 'mb-5 rounded-2xl border border-kado-dark/8 bg-white/70 px-4 py-4'
      }
    >
      <p
        className={
          isSuccess
            ? 'text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800/80 mb-3'
            : 'text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/50 mb-3'
        }
      >
        {title}
      </p>
      <ol className="space-y-3">
        {normalized.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={
                isSuccess
                  ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-black text-white'
                  : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kado-dark text-[11px] font-black text-kado-cream'
              }
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-kado-dark leading-snug">{step.title}</p>
              {step.body ? (
                <p className="text-xs text-kado-dark/60 mt-0.5 leading-relaxed">{step.body}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
