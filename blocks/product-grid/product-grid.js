export default async function decorate(block) {

    const rows = [...block.querySelectorAll(':scope > div')];

    let dataSource = '';

    rows.forEach((row)=>{

        const cols = row.children;

        if(cols.length<2) return;

        if(cols[0].textContent.trim() === 'Data Source'){
            dataSource = cols[1].textContent.trim();
        }

    });

    block.innerHTML = '<div class="product-grid"></div>';

    const grid = block.querySelector('.product-grid');

    const res = await fetch(dataSource);

    const products = await res.json();

    products.forEach(product=>{

        const card = document.createElement('article');

        card.className='product-card';

        card.innerHTML=`
            <img src="${product.images[0]}">

            <h3>${product.name}</h3>

            <p>₹${product.price}</p>
        `;

        grid.append(card);

    });

}