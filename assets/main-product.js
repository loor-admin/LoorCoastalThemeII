(() => {
  function initGallery(gallery, variants) {
    const slides = [...gallery.querySelectorAll('[data-slide]')];
    if (!slides.length) return () => {};

    const thumbs = [...gallery.querySelectorAll('[data-thumb]')];
    const stage = gallery.querySelector('.pdp-gallery__stage');
    const thumbList = gallery.querySelector('.pdp-gallery__thumbs');
    const placeholder = gallery.querySelector('[data-gallery-placeholder]');
    const previous = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const count = gallery.querySelector('[data-gallery-count]');
    const stacked = gallery.classList.contains('pdp-gallery--stacked');
    const colorIndex = Number(gallery.dataset.colorIndex);
    const variantMedia = JSON.parse(gallery.querySelector('[data-variant-media]').textContent);
    const normalizeColor = value => (value || '').trim().toLowerCase();
    const assignedColors = new Map();

    variants.forEach(variant => {
      const mediaId = variantMedia[variant.id];
      const color = normalizeColor(variant.options[colorIndex]);
      if (!mediaId || !color) return;
      const key = String(mediaId);
      if (!assignedColors.has(key)) assignedColors.set(key, new Set());
      assignedColors.get(key).add(color);
    });

    const items = slides.map((slide, i) => ({
      slide,
      thumb: thumbs[i],
      id: slide.dataset.mediaId,
      color: normalizeColor(slide.dataset.mediaColor),
      zoom: slide.querySelector('[data-gallery-zoom]')
    }));
    let visible = [];
    let active = 0;
    let lastColor;
    let lastVariantId;

    function show(position) {
      active = visible.length ? (position + visible.length) % visible.length : 0;
      items.forEach(item => {
        const selected = item === visible[active];
        const hide = stacked ? !visible.includes(item) : !selected;
        if (hide && !item.slide.hidden) item.slide.querySelector('video')?.pause();
        item.slide.hidden = hide;
        item.thumb?.classList.toggle('is-active', selected);
        item.thumb?.setAttribute('aria-pressed', String(selected));
      });
      if (count) count.textContent = `${active + 1} / ${visible.length}`;
    }

    previous?.addEventListener('click', () => show(active - 1));
    next?.addEventListener('click', () => show(active + 1));
    items.forEach(item => item.thumb?.addEventListener('click', () => show(visible.indexOf(item))));

    const lightbox = gallery.querySelector('[data-gallery-lightbox]');
    let opener;
    if (typeof lightbox?.showModal === 'function') {
      const image = lightbox.querySelector('[data-lightbox-image]');
      const controls = lightbox.querySelector('[data-lightbox-controls]');
      const lightboxCount = lightbox.querySelector('[data-lightbox-count]');
      let position = 0;

      function showImage(offset) {
        const images = visible.filter(item => item.zoom);
        position = (offset + images.length) % images.length;
        const zoom = images[position].zoom;
        image.src = zoom.dataset.galleryZoom;
        image.alt = zoom.querySelector('img').alt;
        controls.hidden = images.length < 2;
        lightboxCount.textContent = `${position + 1} / ${images.length}`;
      }

      items.forEach(item => {
        if (!item.zoom) return;
        item.zoom.disabled = false;
        item.zoom.addEventListener('click', () => {
          if (item.slide.hidden || lightbox.open) return;
          opener = item.zoom;
          showImage(visible.filter(entry => entry.zoom).indexOf(item));
          lightbox.showModal();
        });
      });
      lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
      lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', () => showImage(position - 1));
      lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => showImage(position + 1));
      lightbox.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        showImage(position + (event.key === 'ArrowLeft' ? -1 : 1));
      });
      lightbox.addEventListener('close', () => {
        image.removeAttribute('src');
        if (!opener?.closest('[hidden]')) opener?.focus();
      });
    }

    return (variant, chosenColor) => {
      const color = normalizeColor(chosenColor ?? variant?.options[colorIndex]);
      if (color === lastColor && variant?.id === lastVariantId) return;
      lastColor = color;
      lastVariantId = variant?.id;
      if (lightbox?.open) lightbox.close();

      visible = items.filter(item => {
        if (!color || item.color === '*') return true;
        if (item.color) return item.color === color;
        const colors = assignedColors.get(item.id);
        return !colors || colors.has(color);
      });
      const featuredId = String(variantMedia[variant?.id]);
      const featured = visible.find(item => item.id === featuredId);
      if (featured) visible = [featured, ...visible.filter(item => item !== featured)];

      items.forEach(item => {
        if (item.thumb) item.thumb.hidden = !visible.includes(item);
      });
      visible.forEach((item, i) => {
        if (item.thumb) {
          thumbList.append(item.thumb);
          item.thumb.setAttribute('aria-label', `${gallery.dataset.viewLabel} ${i + 1}`);
        }
      });
      if (stacked) {
        [...visible].reverse().forEach(item => {
          if (stage.firstElementChild !== item.slide) stage.prepend(item.slide);
        });
      }
      if (thumbList) {
        thumbList.hidden = visible.length < 2;
        thumbList.scrollTop = 0;
        thumbList.scrollLeft = 0;
        gallery.classList.toggle('pdp-gallery--with-thumbnails', visible.length > 1);
      }
      [previous, next, count].forEach(control => {
        if (control) control.hidden = visible.length < 2;
      });
      placeholder.hidden = visible.length > 0;
      show(0);
    };
  }

  function init(root) {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const form = root.querySelector('[data-product-form]');
    if (!form) return;
    const fitDialog = root.querySelector('[data-fit-dialog]');
    const fitTrigger = root.querySelector('[data-fit-open]');
    if (fitDialog && fitTrigger && typeof fitDialog.showModal === 'function') {
      fitTrigger.addEventListener('click', () => { if (!fitDialog.open) fitDialog.showModal(); });
      fitDialog.querySelector('[data-fit-close]').addEventListener('click', () => fitDialog.close());
      fitDialog.addEventListener('close', () => { if (fitTrigger.isConnected) fitTrigger.focus(); });
    }
    const select = form.querySelector('[data-variant-select]');
    const variants = JSON.parse(root.querySelector('[data-variants]').textContent);
    const gallery = root.querySelector('[data-gallery]');
    const updateGallery = initGallery(gallery, variants);
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
      updateGallery(variant, inputs.find(input => input.dataset.optionIndex === gallery.dataset.colorIndex)?.value);
      inputs.forEach(el => { const label = form.querySelector(`[data-option-label="${el.dataset.optionIndex}"]`); if (label) label.textContent = el.value; });
      const subtitle = root.querySelector('[data-product-subtitle]');
      if (subtitle) {
        const getValue = (index, fallback) => {
          const position = Number(index);
          if (position < 0) return fallback;
          const input = inputs.find(el => Number(el.dataset.optionIndex) === position);
          return input ? input.value : (variant?.options[position] || '');
        };
        const lensColor = getValue(subtitle.dataset.lensIndex, subtitle.dataset.lensFallback);
        const parts = [getValue(subtitle.dataset.colorIndex, subtitle.dataset.colorFallback), [lensColor, lensColor && subtitle.dataset.lensSuffix].filter(Boolean).join(' ')].filter(Boolean);
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
    const rec = root.querySelector('[data-recommendations]'); if (rec && rec.dataset.useApi === 'true' && !rec.querySelector('.pdp-recommendations')) fetch(rec.dataset.url).then(r => r.ok ? r.text() : Promise.reject()).then(html => { const parsed = new DOMParser().parseFromString(html, 'text/html'); const content = parsed.querySelector('[data-recommendations] .pdp-recommendations'); if (content) rec.append(content); }).catch(() => {});
  }
  document.querySelectorAll('[data-main-product]').forEach(init);
  document.addEventListener('shopify:section:load', event => event.target.querySelectorAll('[data-main-product]').forEach(init));
})();


