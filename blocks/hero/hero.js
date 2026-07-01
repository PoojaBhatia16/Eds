/*
 * blocks/hero/hero.js — RE:WEAR editorial hero (3-column)
 *
 * Author it as a 2-cell table (row 1 = name "Hero", row 2 = two image cells):
 *   | Hero |                       |
 *   | (model image)  | (new-arrival image) |
 *
 * The block keeps EDS's optimized <picture> elements and slots them into the
 * layout. All copy is fixed editorial text baked in below (edit here if needed).
 */

export default function decorate(block) {
  let pics = [...block.querySelectorAll('picture')];
  if (!pics.length) pics = [...block.querySelectorAll('img')];
  const model = pics[0] || null;
  const thumb = pics[1] || null;

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  grid.innerHTML = `
    <div class="hero-left">
      <p class="hero-eyebrow">Buy &amp; Sell · Pre-Loved · Conscious</p>
      <h1 class="hero-title">Give Clothes<br>a <em>Second Life</em></h1>
      <p class="hero-sub">RE:WEAR is a curated thrift marketplace. Discover pre-loved fashion, or sell pieces you no longer wear.</p>
      <a href="/browse" class="btn btn-primary hero-cta">Shop Now</a>
    </div>

    <div class="hero-center">
      <div class="hero-model-wrap">
        <div class="hero-blob"></div>
      </div>
    </div>

    <div class="hero-right">
      <div class="hero-info">
        <p class="hero-info-text">One-of-a-kind pieces with a story, ready to be yours.</p>
      </div>
      <div class="hero-thumb">
        <div class="hero-thumb-overlay">New Arrival</div>
      </div>
      <div class="hero-curated">
        <strong>Curated Vintage &amp;</strong>
        <strong>Thrift Finds, Just For You!</strong>
      </div>
    </div>
  `;

  block.append(grid);

  if (model) {
    model.classList.add('hero-model');
    grid.querySelector('.hero-model-wrap').prepend(model);
  }
  if (thumb) {
    grid.querySelector('.hero-thumb').prepend(thumb);
  }
}