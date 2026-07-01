export default function decorate(block) {
  const rows = [...block.children];

  const title = rows[0]?.textContent || '';
  const subtitle = rows[1]?.textContent || '';

  block.innerHTML = `
      <section class="browse-banner">
          <h1>${title}</h1>

          <div class="banner-meta">
              <span id="bannerCount">0</span>
              <p>${subtitle}</p>
          </div>
      </section>
  `;
}