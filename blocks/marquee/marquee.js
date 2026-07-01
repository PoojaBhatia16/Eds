/*
 * blocks/marquee/marquee.js
 *
 * Authored as:
 *   | Marquee |
 *   | Ready-To-Wear · Vintage Finds · One of a Kind · Sustainable Fashion · Second Life Clothing |
 *
 * The scroll is pure CSS (@keyframes in marquee.css). We just split the phrases,
 * rebuild the track with ✦ separators, and duplicate it once so the -50%
 * keyframe loops seamlessly. No GSAP — CSP-safe.
 */

export default function decorate(block) {
  const raw = block.textContent.trim();
  block.textContent = '';

  const items = raw.split(/[·|✦]/).map((s) => s.trim()).filter(Boolean);
  if (!items.length) return;

  const track = document.createElement('div');
  track.className = 'marquee-track';

  const buildSet = () => items
    .map((t) => `<span class="marquee-item">${t}</span><span class="marquee-dot">✦</span>`)
    .join('');

  // duplicated so translateX(-50%) lands on an identical frame (seamless loop)
  track.innerHTML = buildSet() + buildSet();
  block.append(track);
}