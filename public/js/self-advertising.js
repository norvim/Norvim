(() => {
  const form=document.getElementById('selfAdForm'), msg=document.getElementById('selfAdMessage'), btn=document.getElementById('selfAdSubmit'), list=document.getElementById('myAdvertisements');
  const applicantToken=localStorage.getItem('applicantToken'), employerToken=localStorage.getItem('employerToken');
  const activeRole=localStorage.getItem('userType');
  const isEmployer=activeRole==='employer';
  const token=isEmployer?employerToken:applicantToken;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const ownerEndpoint=isEmployer?'/api/employer/advertising':'/api/applicant/advertising';
  document.getElementById('applicantAccountLink').hidden=isEmployer;
  document.getElementById('employerAccountLink').hidden=!isEmployer;

  async function api(url, options={}){
    const r=await fetch(url,{...options,headers:{Authorization:'Bearer '+token,...(options.headers||{})}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw Error(d.message||'Request failed.');
    return d;
  }

  async function loadAds(){
    if(!list) return;
    if(!token){list.innerHTML='<p class="market-error">Log in as an applicant or employer to see your adverts.</p>';return;}
    try{
      const ads=await api(ownerEndpoint);
      list.innerHTML=ads.length?ads.map(ad=>{
        const remaining=Number(ad.remainingBudget||0), budget=Number(ad.budget||0), spent=Number(ad.amountSpent||0);
        return `<article class="my-ad-card"><div class="my-ad-card-top"><div><span class="my-ad-label">${esc(ad.mediaType||'ad')}</span><h3>${esc(ad.title)}</h3></div><span class="my-ad-status ${esc(ad.status)}">${esc(ad.status)}</span></div><div class="my-ad-media">${ad.mediaType==='video'?`<video controls preload="metadata" src="${esc(ad.mediaUrl)}"></video>`:`<img src="${esc(ad.mediaUrl)}" alt="${esc(ad.title)}" loading="lazy">`}</div><div class="my-ad-stats"><div><strong>${Number(ad.qualifiedViews||0).toLocaleString()}</strong><span>Qualified views</span></div><div><strong>${Number(ad.impressions||0).toLocaleString()}</strong><span>Impressions</span></div><div><strong>${Number(ad.clicks||0).toLocaleString()}</strong><span>Clicks</span></div><div><strong>KSh ${remaining.toLocaleString()}</strong><span>Remaining</span></div></div><div class="my-ad-budget"><span>Budget: <strong>KSh ${budget.toLocaleString()}</strong></span><span>Spent: <strong>KSh ${spent.toLocaleString()}</strong></span><span>KSh ${Number(ad.costPerView||0).toFixed(2)} / qualified view</span></div><div class="my-ad-actions"><button class="market-btn market-primary" type="button" onclick="rechargeAdvertisement('${esc(ad._id)}')">Recharge Budget</button></div></article>`;
      }).join(''):'<div class="market-empty">You have not posted any adverts yet.</div>';
    }catch(e){list.innerHTML=`<p class="market-error">${esc(e.message)}</p>`;}
  }

  window.rechargeAdvertisement=async id=>{
    const amount=Number(prompt('How much would you like to add to this advert budget? (KSh)','1000'));
    if(!Number.isFinite(amount)||amount<10) return;
    const phone=prompt('M-PESA number (leave blank to use the phone on your profile):','')||'';
    try{
      const d=await api(ownerEndpoint+'/'+encodeURIComponent(id)+'/fund',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,phone:phone.trim()})});
      msg.textContent=d.message||'Advert budget recharge started.';
      if(d.reference) poll(d.reference);
      await loadAds();
    }catch(e){msg.textContent=e.message;}
  };

  async function poll(reference){
    let n=0;
    const timer=setInterval(async()=>{
      n++;
      try{
        const r=await fetch('/api/advertising/payment/verify/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+token}});
        const d=await r.json().catch(()=>({}));
        if(d.status==='success'){
          msg.textContent='✓ Advertising payment successful. Your advert budget has been updated.';
          clearInterval(timer); await loadAds();
        }else if(d.status==='failed'||n>=18){
          msg.textContent=d.status==='failed'?'Advertising payment failed. Please try again.':'Advertising payment is still pending. Check your M-PESA and advert status later.';
          clearInterval(timer); await loadAds();
        }
      }catch(e){if(n>=18){clearInterval(timer);await loadAds();}}
    },5000);
  }

  if(!token){
    msg.textContent='Please log in as an applicant or employer before posting an advert.';
    if(btn) btn.disabled=true;
  }else{
    loadAds();
    form?.addEventListener('submit',async e=>{
      e.preventDefault(); btn.disabled=true; btn.textContent='Posting…'; msg.textContent='';
      const data=new FormData(form);
      try{
        const r=await fetch(ownerEndpoint,{method:'POST',headers:{Authorization:'Bearer '+token},body:data});
        const d=await r.json().catch(()=>({}));
        if(!r.ok) throw Error(d.message||'Unable to post advert.');
        msg.textContent=d.message||'Advert posted.';
        if(d.reference) poll(d.reference);
        if(d.paymentMode==='wallet') form.reset();
        await loadAds();
      }catch(e){msg.textContent=e.message;}
      finally{btn.disabled=false;btn.textContent='Post Advert';}
    });
  }
})();
