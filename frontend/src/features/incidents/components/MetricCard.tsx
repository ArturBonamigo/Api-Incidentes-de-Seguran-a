type MetricCardProps = {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger" | "success";
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
