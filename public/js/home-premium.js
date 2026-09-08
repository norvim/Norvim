(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token = () => localStorage.getItem('applicantToken');
  const details = {
    jobs: { title:'Jobs Premium', kicker:'NORVIM PLUS · JOBS', tagline:'Get noticed. Get hired faster.', benefits:['Premium profile visibility','Premium badge','Priority presentation where applicable'] },
    marketplace: { title:'Marketplace Premium', kicker:'NORVIM PLUS · MARKETPLACE', tagline:'Stand out. Win more work.', benefits:['Premium worker profile presentation','Premium badge','Priority presentation where applicable'] }
  };
  function openModal(product){
    const d=details[product] || details.jobs;
    let modal=document.getElementById('norvimPremiumModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='norvimPremiumModal'; modal.className='premium-modal';
      modal.innerHTML='<div class="premium-modal-backdrop" data-premium-close></div><div class="premium-modal-card" role="dialog" aria-modal="true" aria-labelledby="premiumModalTitle"><button class="premium-modal-close" type="button" data-premium-close aria-label="Close">×</button><div class="premium-modal-icon">♛</div><span class="premium-home-kicker" id="premiumModalKicker"></span><h2 id="premiumModalTitle"></h2><p id="premiumModalTagline"></p><ul id="premiumModalBenefits"></ul><div class="premium-modal-price"><strong>KSh 100</strong><span>/ 30 days</span></div><button class="premium-home-btn premium-modal-pay" id="premiumModalPay" type="button">Upgrade to Premium →</button><p class="premium-modal-message" id="premiumModalMessage" aria-live="polite"></p></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target.matches('[data-premium-close]'))modal.classList.remove('open')});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});
    }
    modal.dataset.product=product;
    document.getElementById('premiumModalKicker').textContent=d.kicker;
    document.getElementById('premiumModalTitle').textContent=d.title;
    document.getElementById('premiumModalTagline').textContent=d.tagline;
    document.getElementById('premiumModalBenefits').innerHTML=d.benefits.map(x=>`<li>✓ ${esc(x)}</li>`).join('');
    const pay=document.getElementById('premiumModalPay'); pay.disabled=false; pay.textContent='Upgrade to Premium →';
    document.getElementById('premiumModalMessage').textContent='';
    modal.classList.add('open');
    pay.onclick=()=>start(product,pay);
  }
  async function start(product,btn){
    const t=token(); if(!t){ location.href='applicant-login.html'; return; }
    btn.disabled=true; btn.textContent='Starting M-PESA…';
    const msg=document.getElementById('premiumModalMessage');
    try{
      const r=await fetch('/api/premium/request',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({product})});
      const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.message||'Unable to start Premium payment.');
      msg.textContent=d.message||'Complete the M-PESA prompt on your phone.';
      if(d.reference) poll(d.reference, msg);
    }catch(e){msg.textContent=e.message;btn.disabled=false;btn.textContent='Try Again →';}
  }
  function poll(reference,msg){let n=0;const timer=setInterval(async()=>{n++;try{const r=await fetch('/api/payments/verify/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+token()}});const d=await r.json().catch(()=>({}));if(d.status==='success'){msg.textContent='✓ Premium is now active.';clearInterval(timer);}else if(d.status==='failed'||n>=12){msg.textContent=d.status==='failed'?'Payment failed. Please try again.':'Payment is still pending. Check your notifications.';clearInterval(timer);}}catch(e){if(n>=12)clearInterval(timer)}},5000)}
  document.addEventListener('click',e=>{const el=e.target.closest('.premium-open');if(!el)return;e.preventDefault();openModal(el.dataset.premiumProduct)});
})();
