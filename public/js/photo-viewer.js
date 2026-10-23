(() => {
  function open(src, alt='Profile photo') {
    if (!src) return;
    let modal=document.getElementById('norvimPhotoViewer');
    if(!modal){
      modal=document.createElement('div'); modal.id='norvimPhotoViewer'; modal.className='norvim-photo-viewer'; modal.innerHTML='<button type="button" class="norvim-photo-close" aria-label="Close">×</button><img class="norvim-photo-full" alt=""><div class="norvim-photo-caption"></div>';
      modal.addEventListener('click',e=>{if(e.target===modal||e.target.classList.contains('norvim-photo-close'))modal.classList.remove('open');}); document.body.appendChild(modal);
    }
    modal.querySelector('img').src=src; modal.querySelector('img').alt=alt; modal.querySelector('.norvim-photo-caption').textContent=alt||'Profile photo'; modal.classList.add('open');
  }
  document.addEventListener('click',e=>{const img=e.target.closest('img.norvim-profile-photo');if(!img)return;e.preventDefault();e.stopPropagation();open(img.currentSrc||img.src,img.alt);});
  window.openNorvimProfilePhoto=open;
})();
