(() => {
  const slot = document.getElementById('norvimAdSlot');
  if (!slot) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let tracked = false;
  fetch('/api/advertising/active').then(async r => {
    if (r.status === 204) return [];
    const d = await r.json(); if (!r.ok) throw Error(d.message || ''); return Array.isArray(d) ? d : [d];
  }).then(ads => {
    if (!ads.length) { slot.hidden = true; slot.innerHTML = ''; return; }
    slot.hidden = false;
    slot.innerHTML = ads.map((ad, i) => {
      const media = ad.mediaType === 'video'
        ? `<video id="norvimAdVideo-${i}" class="norvim-ad-media" muted playsinline preload="metadata" controls src="${esc(ad.mediaUrl)}"></video>`
        : `<img id="norvimAdImage-${i}" class="norvim-ad-media" src="${esc(ad.mediaUrl)}" alt="${esc(ad.title)}" loading="lazy">`;
      return `<article class="norvim-ad-card" data-ad-id="${esc(ad._id)}" data-destination="${esc(ad.destinationUrl||'')}"><div class="norvim-ad-label">SPONSORED</div><div class="norvim-ad-media-wrap">${media}</div><div class="norvim-ad-copy"><span>${esc(ad.advertiserName)}</span><h3>${esc(ad.title)}</h3>${ad.description ? `<p>${esc(ad.description)}</p>` : ''}${ad.destinationUrl ? `<span class="market-btn market-primary norvimAdLink" role="link" tabindex="0">Learn More →</span>` : ''}</div></article>`;
    }).join('');
    ads.forEach((ad, i) => {
      let tracked = false;
      const track = () => { if (tracked) return; tracked = true; fetch('/api/advertising/' + encodeURIComponent(ad._id) + '/view', { method:'POST', headers:{'Content-Type':'application/json'} }).catch(()=>{}); };
      const video = document.getElementById('norvimAdVideo-' + i);
      if (video) video.addEventListener('timeupdate', () => { if (video.duration && video.currentTime / video.duration >= 0.25) track(); });
      else setTimeout(track, 2000 + (i * 300));
    });
    slot.querySelectorAll('.norvim-ad-card').forEach(card => {
      const destination = card.dataset.destination || '';
      const click = () => {
        fetch('/api/advertising/' + encodeURIComponent(card.dataset.adId) + '/click', {method:'POST'}).catch(()=>{});
        if (destination) window.open(destination, '_blank', 'noopener,noreferrer');
      };
      card.addEventListener('click', e => { if (e.target.closest('video,button,a')) return; click(); });
      card.querySelector('.norvimAdLink')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); click(); });
      card.querySelector('.norvimAdLink')?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(); } });
    });
  }).catch(() => { slot.hidden = true; slot.innerHTML = ''; });
})();
