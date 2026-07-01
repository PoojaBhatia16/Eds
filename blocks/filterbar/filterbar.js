export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  const config = {};

  rows.forEach((row) => {
    const cols = row.children;
    if (cols.length < 2) return;

    const key = cols[0].textContent.trim().toLowerCase();
    const value = cols[1].textContent.trim();

    config[key] = value;
  });

  const filters = (config.filters || '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'filterbar-wrapper';

  filters.forEach((filter) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = filter.toLowerCase();

    btn.innerHTML = `
      <span>${filter}</span>
      <svg width="12" height="12" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6"
              stroke="currentColor"
              fill="none"
              stroke-width="2"
              stroke-linecap="round"/>
      </svg>
    `;

    wrapper.append(btn);
  });

  const right = document.createElement('div');
  right.className = 'filterbar-right';

  right.innerHTML = `
      <input
        class="filter-search"
        type="search"
        placeholder="Search products..."
      />

      <select class="filter-sort">
          <option value="default">Recommended</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="saving">Best Discount</option>
      </select>
  `;

  wrapper.append(right);

  block.append(wrapper);

  // TODO
  // connect with product-grid block
}