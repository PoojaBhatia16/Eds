export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  const config = {};

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    config[
      cols[0].textContent.trim().toLowerCase()
    ] = cols[1].textContent.trim();
  });

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'browse-filterbar';

  wrapper.innerHTML = `
<div class="browse-filterbar-inner">

    <!-- Gender -->

    <div class="filter-dropdown-wrap">

        <button class="filter-dropdown-btn"
                data-panel="genderPanel"
                id="genderBtn">

            Gender

            <svg width="10" height="10"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2">

                <polyline points="6 9 12 15 18 9"></polyline>

            </svg>

        </button>

        <div class="filter-dropdown-panel"
             id="genderPanel">

            <div class="panel-pills">

                <button class="panel-pill active"
                        data-filter="gender"
                        data-value="all">
                    All
                </button>

                <button class="panel-pill"
                        data-filter="gender"
                        data-value="women">
                    Women
                </button>

                <button class="panel-pill"
                        data-filter="gender"
                        data-value="men">
                    Men
                </button>

                <button class="panel-pill"
                        data-filter="gender"
                        data-value="kids">
                    Kids
                </button>

                <button class="panel-pill"
                        data-filter="gender"
                        data-value="unisex">
                    Unisex
                </button>

            </div>

        </div>

    </div>

    <!-- Category -->

    <div class="filter-dropdown-wrap">

        <button class="filter-dropdown-btn"
                data-panel="categoryPanel"
                id="categoryBtn">

            Category

            <svg width="10"
                 height="10"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2">

                <polyline points="6 9 12 15 18 9"></polyline>

            </svg>

        </button>

        <div class="filter-dropdown-panel"
             id="categoryPanel">

            <div
                class="panel-checks"
                id="categoryFilters">
            </div>

            <button
                class="panel-done-btn">

                Done

            </button>

        </div>

    </div>

    <!-- Size -->

    <div class="filter-dropdown-wrap">

        <button class="filter-dropdown-btn"
                data-panel="sizePanel"
                id="sizeBtn">

            Size

            <svg width="10"
                 height="10"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2">

                <polyline points="6 9 12 15 18 9"></polyline>

            </svg>

        </button>

        <div
            class="filter-dropdown-panel"
            id="sizePanel">

            <div
                class="panel-pills"
                id="sizeFilters">

            </div>

            <button
                class="panel-done-btn">

                Done

            </button>

        </div>

    </div>

    <!-- Price -->

    <div class="filter-dropdown-wrap">

        <button class="filter-dropdown-btn"
                data-panel="pricePanel"
                id="priceBtn">

            Price

            <svg width="10"
                 height="10"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2">

                <polyline points="6 9 12 15 18 9"></polyline>

            </svg>

        </button>

        <div
            class="filter-dropdown-panel"
            id="pricePanel">

            <div class="panel-price">

                <input
                    id="priceMin"
                    type="number"
                    placeholder="₹ Min">

                <span>—</span>

                <input
                    id="priceMax"
                    type="number"
                    placeholder="₹ Max">

            </div>

        </div>

    </div>

    <!-- Condition -->

    <div class="filter-dropdown-wrap">

        <button class="filter-dropdown-btn"
                data-panel="conditionPanel"
                id="conditionBtn">

            Condition

            <svg width="10"
                 height="10"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2">

                <polyline points="6 9 12 15 18 9"></polyline>

            </svg>

        </button>

        <div
            class="filter-dropdown-panel"
            id="conditionPanel">

            <div class="panel-pills">

                <button
  class="panel-pill active"
  data-value="all">
  All
</button>

<button
  class="panel-pill"
  data-value="Excellent">
  Excellent
</button>

<button
  class="panel-pill"
  data-value="Good">
  Good
</button>

<button
  class="panel-pill"
  data-value="Fair">
  Fair
</button>

            </div>

        </div>

    </div>

    <button
        class="browse-clear-all"
        id="clearFilters">

        Clear all

    </button>

    <div class="browse-topbar-right">

        <span
            class="browse-count"
            id="browseCount">

            0 items

        </span>

        <div class="browse-sort">

            <button
                class="browse-sort-trigger"
                id="sortTrigger">

                <span id="sortLabel">
                    Sort : Recommended
                </span>

            </button>

        </div>

    </div>

</div>

<div
class="browse-active-filters"
id="activeFilters">
</div>
`;

  block.append(wrapper);
// -----------------------------
// STATE
// -----------------------------
const state = {
  gender: 'all',
  categories: [],
  sizes: [],
  condition: 'all',
  priceMin: 0,
  priceMax: Infinity,
  sort: 'default',
  search: '',
};

// -----------------------------
// Sizes
// -----------------------------
const sizeFilters = block.querySelector('#sizeFilters');

[
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'Free Size',
].forEach((size) => {
  const btn = document.createElement('button');

  btn.className = 'panel-pill size-pill';
  btn.dataset.size = size;
  btn.textContent = size;

  sizeFilters.append(btn);
});

// -----------------------------
// Categories
// -----------------------------
const categoryWrap = block.querySelector('#categoryFilters');

const categories = [
  'Tops',
  'Dresses',
  'Bottoms',
  'Outerwear',
  'Accessories',
  'Footwear',
];

categoryWrap.innerHTML = categories.map((cat) => `
<label class="panel-check-item">
<input type="checkbox" data-category="${cat}">
<span class="panel-check-box"></span>
<span>${cat}</span>
</label>
`).join('');

function closeAllPanels() {
  block.querySelectorAll('.filter-dropdown-panel')
    .forEach((panel) => panel.classList.remove('open'));

  block.querySelectorAll('.filter-dropdown-btn')
    .forEach((btn) => btn.classList.remove('open'));
}

block.querySelectorAll('.filter-dropdown-btn').forEach((btn) => {

  btn.addEventListener('click', (e) => {

    e.stopPropagation();

    const panel = block.querySelector(
      '#' + btn.dataset.panel,
    );

    const opened = panel.classList.contains('open');

    closeAllPanels();

    if (!opened) {

      panel.classList.add('open');
      btn.classList.add('open');

    }

  });

});

document.addEventListener('click', () => {

  closeAllPanels();

});

block.querySelectorAll('.filter-dropdown-panel').forEach((panel) => {

  panel.addEventListener('click', (e) => {

    e.stopPropagation();

  });

});

block.querySelectorAll('[data-filter="gender"]').forEach((btn) => {

  btn.addEventListener('click', () => {

    block.querySelectorAll('[data-filter="gender"]')
      .forEach((b) => b.classList.remove('active'));

    btn.classList.add('active');

    state.gender = btn.dataset.value;

    window.dispatchEvent(
  new CustomEvent('browse-filter-change', {
    detail: structuredClone(state),
  }),
);

  });

});
block.querySelectorAll('.size-pill').forEach((btn) => {

  btn.addEventListener('click', () => {

    btn.classList.toggle('active');

    const size = btn.dataset.size;

    if (btn.classList.contains('active')) {

      state.sizes.push(size);

    } else {

      state.sizes = state.sizes.filter(
        (s) => s !== size,
      );

    }

    window.dispatchEvent(
  new CustomEvent('browse-filter-change', {
    detail: structuredClone(state),
  }),
);

  });

});
block.querySelectorAll('[data-category]').forEach((cb) => {

  cb.addEventListener('change', () => {

    const cat = cb.dataset.category;

    if (cb.checked) {

      state.categories.push(cat);

    } else {

      state.categories = state.categories.filter(
        (c) => c !== cat,
      );

    }

    window.dispatchEvent(
  new CustomEvent('browse-filter-change', {
    detail: structuredClone(state),
  }),
);

  });

});
block.querySelectorAll('#conditionPanel .panel-pill')
.forEach((btn) => {

  btn.addEventListener('click', () => {

    block
      .querySelectorAll('#conditionPanel .panel-pill')
      .forEach((b) => b.classList.remove('active'));

    btn.classList.add('active');

    state.condition = btn.textContent;

    window.dispatchEvent(
  new CustomEvent('browse-filter-change', {
    detail: structuredClone(state),
  }),
);

  });

});
block.querySelectorAll('.panel-done-btn').forEach((btn) => {

  btn.onclick = closeAllPanels;

});
}