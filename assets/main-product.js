(() => {
  function init(root) {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const form = root.querySelector('[data-product-form]');
    if (!form) return;
    const select = form.querySelector('[data-variant-select]');
    const variants = JSON.parse(root.querySelector('[data-variants]').textContent);
    const add = form.querySelector('[data-add]');
    const sticky = root.querySelector('[data-sticky-add]');
    const money = (cents) => {
      const format = root.dataset.moneyFormat;
      const number = (value, precision, thousands, decimal) => (value / 100).toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, thousands).replace('.', decimal);
      return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, token) => ({amount: number(cents, 2, ',', '.'), amount_no_decimals: number(cents, 0, ',', '.'), amount_with_comma_separator: number(cents, 2, '.', ','), amount_no_decimals_with_comma_separator: number(cents, 0, '.', ','), amount_with_space_separator: number(cents, 2, ' ', ','), amount_no_decimals_with_space_separator: number(cents, 0, ' ', ',')}[token] || number(cents, 2, ',', '.')));
    };
    const update = () => {
      const inputs = [...form.querySelectorAll('[data-option-index]')].filter(el => el.tagName === 'SELECT' || el.checked);
      const chosen = inputs.map(el => el.value);
      const variant = chosen.length ? variants.find(v => v.options.every((value, i) => value === chosen[i])) : variants.find(v => String(v.id) === select.value);
      inputs.forEach(el => { const label = form.querySelector(`[data-option-label="${el.dataset.optionIndex}"]`); if (label) label.textContent = el.value; });
      const subtitle = root.querySelector('[data-product-subtitle]');
      if (subtitle) {
        const getValue = (index, fallback) => {
          const position = Number(index);
          if (position < 0) return fallback;
          const input = inputs.find(el => Number(el.dataset.optionIndex) === position);
          return input ? input.value : (variant?.options[position] || '');
        };
        const parts = [getValue(subtitle.dataset.colorIndex, subtitle.dataset.colorFallback), getValue(subtitle.dataset.lensIndex, subtitle.dataset.lensFallback)].filter(Boolean);
        subtitle.textContent = parts.join(' / ');
        subtitle.hidden = parts.length === 0;
      }
      if (variant) select.value = String(variant.id);
      const available = !!variant && variant.available;
      const stock = root.querySelector('[data-stock]'); if (stock) stock.hidden = !available;
      if (variant) {
        root.querySelectorAll('[data-price], [data-sticky-price]').forEach(el => el.textContent = money(variant.price));
        const compare = root.querySelector('[data-compare]'); const sale = root.querySelector('[data-sale]');
        const onSale = variant.compare_at_price > variant.price;
        if (compare) { compare.hidden = !onSale; compare.textContent = onSale ? money(variant.compare_at_price) : ''; }
        if (sale) sale.hidden = !onSale;
        const url = new URL(location.href); url.searchParams.set('variant', variant.id); history.replaceState({}, '', url);
      }
      if (add) { add.disabled = !available; add.textContent = available ? root.dataset.addLabel + (add.dataset.showPrice === 'true' ? ' — ' + money(variant.price) : '') : (variant ? root.dataset.soldLabel : root.dataset.unavailableLabel); }
      if (sticky) { sticky.disabled = !available || !add; sticky.textContent = available ? root.dataset.addLabel : (variant ? root.dataset.soldLabel : root.dataset.unavailableLabel); }
    };
    if (form.querySelector('[data-picker]')) { form.classList.add('js-ready'); form.addEventListener('change', update); update(); }
    else { select.addEventListener('change', update); update(); }
    form.querySelectorAll('[data-quantity-change]').forEach(button => button.addEventListener('click', () => { const input = form.querySelector('[name="quantity"]'); input.value = Math.max(1, (Number(input.value) || 1) + Number(button.dataset.quantityChange)); }));
    const slides = [...root.querySelectorAll('[data-slide]')]; const thumbs = [...root.querySelectorAll('[data-thumb]')]; let index = 0;
    const show = next => { if (!slides.length) return; index = (next + slides.length) % slides.length; slides.forEach((slide, i) => slide.hidden = i !== index); thumbs.forEach((thumb, i) => { thumb.classList.toggle('is-active', i === index); thumb.setAttribute('aria-pressed', String(i === index)); }); const count = root.querySelector('[data-gallery-count]'); if (count) count.textContent = `${index + 1} / ${slides.length}`; };
    root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(index - 1)); root.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(index + 1)); thumbs.forEach(t => t.addEventListener('click', () => show(Number(t.dataset.thumb))));
    const rec = root.querySelector('[data-recommendations]'); if (rec && rec.dataset.useApi === 'true' && !rec.querySelector('.pdp-recommendations')) fetch(rec.dataset.url).then(r => r.ok ? r.text() : Promise.reject()).then(html => { const parsed = new DOMParser().parseFromString(html, 'text/html'); const content = parsed.querySelector('[data-recommendations] .pdp-recommendations'); if (content) rec.append(content); }).catch(() => {});
  }
  document.querySelectorAll('[data-main-product]').forEach(init);
  document.addEventListener('shopify:section:load', event => event.target.querySelectorAll('[data-main-product]').forEach(init));
})();


