import React, { useState } from "react";
import styles from "./Highlight.module.css";
import {
  HighlightNote,
  HighlightScene,
} from "../../components/HighlightScene/HighlightScene";
import { SectionDots } from "../../components/SectionDots/SectionDots";

/* ── Texts of the floating notes ─────────────────────────────────────────────
 * One note per tower, from the smallest tower to the tallest one (6 notes —
 * keep it 6, the same number as HL_BARS in highlightConfig.ts). Edit freely. */
const NOTES: HighlightNote[] = [
  {
    num: "01",
    title: "Start small",
    text: "Every landmark began as a single, modest block.",
  },
  {
    num: "02",
    title: "Stay consistent",
    text: "Steady layers beat short bursts of effort.",
  },
  {
    num: "03",
    title: "Build on basics",
    text: "Strong foundations carry the tallest ideas.",
  },
  {
    num: "04",
    title: "Keep refining",
    text: "Small improvements compound into big change.",
  },
  {
    num: "05",
    title: "Welcome feedback",
    text: "Good work gets sharper when it is shared.",
  },
  {
    num: "06",
    title: "Aim higher",
    text: "Growth never really finishes. It just rises.",
  },
];

/**
 * Extra showcase section (design only, not tied to any project): a 3D skyline
 * that works like a bar graph, with short notes floating above it.
 * Sits between Capabilities and Professional Overview.
 */
export const Highlight: React.FC = () => {
  const [noGl, setNoGl] = useState(false);

  return (
    <section
      id="highlight"
      className={`${styles.section} ${noGl ? styles.noGl : ""}`}
      aria-labelledby="highlight-title"
    >
      {/* 3D gravity-wave dot background (behind the text and the 3D scene).
          landHole: the dots hide over the 3D land, which has its own waves. */}
      <SectionDots mode="fill" landHole />

      <div className={`${styles.inner} ${styles.head}`}>
        <h2 id="highlight-title" className={styles.title}>
          Every great build rises one layer at a time.
        </h2>
        <p className={styles.lead}>
          A small visual note on how good things take shape: steady, layered and
          always climbing.
        </p>
      </div>

      <div className={`${styles.inner} ${styles.stageBox}`}>
        <div className={styles.stageWrap}>
          <HighlightScene notes={NOTES} onUnsupported={() => setNoGl(true)} />
        </div>
      </div>

      {/* the sentences: left column under the title on wide screens, under the
          3D scene on tablets / phones (and whenever WebGL is missing) */}
      <div className={`${styles.inner} ${styles.legendBox}`}>
        <ol className={styles.legend}>
          {NOTES.map((n) => (
            <li key={n.num} className={styles.legendItem}>
              <span className={styles.legendNum}>{n.num}</span>
              <span className={styles.legendTitle}>{n.title}</span>
              <span className={styles.legendText}>{n.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Highlight;
