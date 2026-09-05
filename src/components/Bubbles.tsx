/**
 * Decorative rising bubbles. Positions are a fixed table rather than
 * Math.random() so the layout is identical on every render and every visit —
 * randomised decoration is the thing that makes a page feel machine-made.
 * Hidden entirely under prefers-reduced-motion (see components.css).
 */

type Bubble = { left: number; size: number; duration: number; delay: number; opacity: number };

const BUBBLES: Bubble[] = [
  { left: 6, size: 12, duration: 17, delay: 0, opacity: 0.5 },
  { left: 14, size: 7, duration: 13, delay: 3.5, opacity: 0.4 },
  { left: 23, size: 16, duration: 21, delay: 1.2, opacity: 0.35 },
  { left: 34, size: 9, duration: 15, delay: 6.4, opacity: 0.45 },
  { left: 47, size: 13, duration: 19, delay: 2.8, opacity: 0.3 },
  { left: 58, size: 6, duration: 12, delay: 8.1, opacity: 0.5 },
  { left: 67, size: 18, duration: 24, delay: 4.6, opacity: 0.28 },
  { left: 78, size: 10, duration: 16, delay: 0.9, opacity: 0.42 },
  { left: 86, size: 8, duration: 14, delay: 7.3, opacity: 0.38 },
  { left: 94, size: 14, duration: 20, delay: 5.2, opacity: 0.32 },
];

export function Bubbles() {
  return (
    <div className="bubbles" aria-hidden="true">
      {BUBBLES.map((bubble, index) => (
        <span
          key={index}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            opacity: bubble.opacity,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `-${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
