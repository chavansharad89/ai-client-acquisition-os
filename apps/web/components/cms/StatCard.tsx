const TONE_STYLES = {
  positive: 'text-foreground',
  neutral: 'text-foreground',
  muted: 'text-muted-foreground',
} as const;

export function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${TONE_STYLES[tone]}`}>{value}</p>
    </div>
  );
}
