document.querySelectorAll('[data-product-page]').forEach((page) => {
  const slides = [...page.querySelectorAll('[data-slide]')];
  const thumbs = [...page.querySelectorAll('[data-thumb]')];
  let index = 0;
  const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, i) => { slide.hidden = i !== index; }); thumbs.forEach((thumb, i) => { thumb.classList.toggle('is-active', i === index); thumb.setAttribute('aria-pressed', String(i === index)); }); page.querySelector('[data-gallery-count]').textContent = `${index + 1} / ${slides.length}`; };
  page.querySelector('[data-gallery-prev]').addEventListener('click', () => show(index - 1));
  page.querySelector('[data-gallery-next]').addEventListener('click', () => show(index + 1));
  thumbs.forEach((thumb) => thumb.addEventListener('click', () => show(Number(thumb.dataset.thumb))));
  show(0);
  const form = page.querySelector('[data-product-form]');
  const select = form.querySelector('[data-variant-select]');
  const variants = JSON.parse(page.querySelector('[data-variants]').textContent);
  const add = form.querySelector('[data-add]');
  const price = page.querySelector('[data-price]');
  const currency = new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' });
  const update = () => {
    const chosen = [...form.querySelectorAll('[data-option-index]:checked')].map((input) => input.value);
    const variant = chosen.length ? variants.find((item) => item.options.every((value, i) => value === chosen[i])) : variants.find((item) => String(item.id) === select.value);
    form.querySelectorAll('[data-option-index]:checked').forEach((input) => { const label = form.querySelector(`[data-option-label="${input.dataset.optionIndex}"]`); if (label) label.textContent = input.value; });
    if (!variant) { add.disabled = true; add.textContent = 'Unavailable'; return; }
    select.value = variant.id; const amount = currency.format(variant.price / 100); price.textContent = amount; add.disabled = !variant.available; add.textContent = variant.available ? `Add to bag — ${amount}` : 'Sold out'; page.querySelector('[data-stock]').hidden = !variant.available;
  };
  form.addEventListener('change', update); form.classList.add('js-ready');
  form.querySelectorAll('[data-quantity-change]').forEach((button) => button.addEventListener('click', () => { const input = form.querySelector('[name="quantity"]'); input.value = Math.max(1, (Number(input.value) || 1) + Number(button.dataset.quantityChange)); }));
});
