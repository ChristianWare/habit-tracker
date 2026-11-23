// A face for a 1–10 mood: the mouth turns from a frown to a wide smile,
// and the colour runs from oxblood through gold to green.

export function moodColor(score: number): string {
  if (score <= 2) return "#6b2633";
  if (score <= 4) return "#b4452a";
  if (score <= 6) return "#ff9f00";
  if (score <= 8) return "#6aa84f";
  return "#0b7547";
}

export const MOOD_WORDS = [
  "",
  "Awful",
  "Very low",
  "Low",
  "Meh",
  "Okay",
  "Fine",
  "Good",
  "Very good",
  "Great",
  "Amazing",
];

export default function MoodFace({
  score,
  size = 40,
  muted = false,
}: {
  score: number;
  size?: number;
  muted?: boolean;
}) {
  const color = muted ? "#8a93a6" : moodColor(score);
  // Mouth: a curve from (11,22) to (25,22); the middle point moves down
  // for a smile and up for a frown.
  const bend = (score - 5.5) * 1.3;
  const mouthY = 22.5 - Math.max(0, -bend) * 0.3;
  const open = score >= 9;
  return (
    <svg
      viewBox='0 0 36 36'
      width={size}
      height={size}
      aria-hidden='true'
      style={{ display: "block" }}
    >
      <circle
        cx='18'
        cy='18'
        r='16.5'
        fill={color}
        opacity={muted ? 0.15 : 0.18}
      />
      <circle
        cx='18'
        cy='18'
        r='16.5'
        fill='none'
        stroke={color}
        strokeWidth='2'
      />
      <circle cx='12.5' cy='14' r='1.9' fill={color} />
      <circle cx='23.5' cy='14' r='1.9' fill={color} />
      {score <= 2 ? (
        <>
          <path
            d='M9.5 10.5 13.5 12'
            stroke={color}
            strokeWidth='1.6'
            strokeLinecap='round'
          />
          <path
            d='M26.5 10.5 22.5 12'
            stroke={color}
            strokeWidth='1.6'
            strokeLinecap='round'
          />
        </>
      ) : null}
      <path
        d={`M11 ${mouthY} Q18 ${mouthY + bend * 1.6} 25 ${mouthY}${open ? " Z" : ""}`}
        fill={open ? color : "none"}
        stroke={color}
        strokeWidth='2.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
