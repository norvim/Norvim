/* Norvim admin dialogs: custom in-page dialogs for Android WebView/TWA compatibility. */
(function () {
  if (window.norvimAdminDialog) return;
  window.norvimAdminDialog = function (options = {}) {
    return new Promise(resolve => {
      const old = document.getElementById('norvim-admin-dialog');
      if (old) old.remove();
      const needsReason = options.requireReason === true;
      const overlay = document.createElement('div');
      overlay.id = 'norvim-admin-dialog';
      overlay.setAttribute('role', 'presentation');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:18px;';
      const panel = document.createElement('section');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'norvim-admin-dialog-title');
      panel.style.cssText = 'box-sizing:border-box;width:min(100%,460px);max-height:90vh;overflow:auto;background:#fff;color:#172033;border-radius:14px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.3);font:16px/1.45 system-ui,sans-serif;';
      const title=document.createElement('h2'); title.id='norvim-admin-dialog-title'; title.textContent=options.title||'Confirm action'; title.style.cssText='margin:0 0 10px;font-size:20px;';
      const message=document.createElement('p'); message.textContent=options.message||''; message.style.cssText='margin:0 0 14px;';
      panel.append(title,message);
      let input=null;
      if(needsReason){
        input=document.createElement('textarea'); input.rows=4; input.maxLength=1200; input.required=true;
        input.placeholder=options.placeholder||'Enter the reason (at least 5 characters)';
        input.setAttribute('aria-label','Suspension reason');
        input.style.cssText='box-sizing:border-box;width:100%;min-height:110px;padding:12px;border:1px solid #9aa4b2;border-radius:8px;font:inherit;resize:vertical;';
        panel.append(input);
        const hint=document.createElement('small'); hint.textContent='This reason will be shown to the account holder. Minimum 5 characters.'; hint.style.cssText='display:block;margin:6px 0 14px;color:#526071;'; panel.append(hint);
      }
      const actions=document.createElement('div'); actions.style.cssText='display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;';
      const cancel=document.createElement('button'); cancel.type='button'; cancel.textContent=options.cancelText||'Cancel';
      cancel.style.cssText='padding:10px 16px;border:1px solid #9aa4b2;border-radius:8px;background:#f3f5f8;color:#172033;font-weight:600;';
      const submit=document.createElement('button'); submit.type='button'; submit.textContent=options.confirmText||(needsReason?'Submit suspension':'Continue');
      submit.style.cssText='padding:10px 16px;border:0;border-radius:8px;background:#1769aa;color:#fff;font-weight:700;';
      actions.append(cancel,submit); panel.append(actions); overlay.append(panel); document.body.append(overlay);
      let finished=false;
      const close=value=>{if(finished)return;finished=true;document.removeEventListener('keydown',onKey);overlay.remove();resolve(value);};
      const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close(null);} if(e.key==='Enter' && (e.ctrlKey||e.metaKey) && needsReason){e.preventDefault();submit.click();}};
      cancel.addEventListener('click',()=>close(null));
      submit.addEventListener('click',()=>{
        if(needsReason){const value=(input.value||'').trim();if(value.length<5){input.setCustomValidity('Please enter at least 5 characters.');input.reportValidity();input.focus();return;}input.setCustomValidity('');close(value);}
        else close(true);
      });
      overlay.addEventListener('click',e=>{if(e.target===overlay)close(null);});
      document.addEventListener('keydown',onKey);
      (input||submit).focus();
    });
  };
})();
