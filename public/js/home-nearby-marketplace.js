(() => {
  const section = document.getElementById('homeNearbyMarketplace');
  const grid = document.getElementById('homeNearbyMarketplaceGrid');
  const message = document.getElementById('homeNearbyMarketplaceMessage');
  if (!section || !grid || !message) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  async function loadNearbyMarketplaceJobs() {
    const token = localStorage.getItem('applicantToken');
    if (!token) {
      message.textContent = 'Sign in with an available Worker Profile to see jobs matched to your services and saved location.';
      grid.innerHTML = '<div class="nearby-market-card"><h3>Discover local work</h3><p>Nearby jobs are personalized to your service categories and location.</p><a class="nearby-market-action" href="applicant-login.html">Sign in to view nearby jobs</a></div>';
      return;
    }
    try {
      const response = await fetch('/api/marketplace/requests?radiusKm=25', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not load nearby jobs.');
      const jobs = await response.json();
      if (!Array.isArray(jobs) || jobs.length === 0) {
        message.textContent = 'No matching open jobs are available near your saved location right now.';
        grid.innerHTML = '<div class="nearby-market-card"><h3>No nearby jobs yet</h3><p>Keep your worker profile available and your services and location up to date.</p><a class="nearby-market-action" href="marketplace.html">Explore marketplace</a></div>';
        return;
      }
      message.textContent = `${jobs.length} nearby ${jobs.length === 1 ? 'opportunity' : 'opportunities'} matched to your worker profile.`;
      grid.innerHTML = jobs.slice(0, 6).map(job => {
        const area = [job.location?.area, job.location?.county].filter(Boolean).join(', ') || 'Nearby';
        const distance = Number.isFinite(Number(job.distanceKm)) ? `${Number(job.distanceKm).toFixed(1)} km away` : 'Nearby';
        const budget = Number(job.budget) > 0 ? `KSh ${Number(job.budget).toLocaleString()}` : 'Budget negotiable';
        return `<article class="nearby-market-card"><h3>${escapeHtml(job.title || 'Labour job')}</h3><p>${escapeHtml(job.description || 'Open local labour opportunity.')}</p><p class="nearby-market-meta">📍 ${escapeHtml(area)} · ${escapeHtml(distance)}</p><p class="nearby-market-meta">💰 ${escapeHtml(budget)}${job.serviceCategoryId?.name ? ` · ${escapeHtml(job.serviceCategoryId.name)}` : ''}</p><a class="nearby-market-action" href="marketplace.html">View / respond</a></article>`;
      }).join('');
    } catch (error) {
      console.error('Homepage nearby marketplace jobs:', error);
      message.textContent = 'Nearby jobs could not be loaded at the moment.';
      grid.innerHTML = '<div class="nearby-market-card"><p>Open the Labour Marketplace to try again.</p><a class="nearby-market-action" href="marketplace.html">Open marketplace</a></div>';
    }
  }
  loadNearbyMarketplaceJobs();
})();
