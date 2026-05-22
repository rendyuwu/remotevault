type Strength = "weak" | "fair" | "good" | "strong";

interface StrengthMeterProps {
  strength: Strength;
}

const LABELS: Record<Strength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

export function StrengthMeter(props: StrengthMeterProps) {
  return (
    <>
      <div class={`strength-meter ${props.strength}`}>
        <span class="bar" />
        <span class="bar" />
        <span class="bar" />
        <span class="bar" />
      </div>
      <div class="strength-label">
        <span class={`level ${props.strength}`}>{LABELS[props.strength]}</span>
      </div>
    </>
  );
}
