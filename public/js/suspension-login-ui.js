/* Norvim suspended-login notice and appeal form. No prompt()/confirm() required. */
(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  window.showSuspensionLoginNotice = function (options) {
    options = options || {};
    var old = document.getElementById("norvimSuspensionLoginModal");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "norvimSuspensionLoginModal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "norvimSuspensionTitle");
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(8,18,32,.78);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;";
    overlay.innerHTML = `
      <section style="width:min(100%,480px);background:#fff;color:#172235;border-radius:16px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,.35);font-family:Arial,sans-serif;max-height:90vh;overflow:auto;">
        <div style="font-size:30px;margin-bottom:8px" aria-hidden="true">🔒</div>
        <h2 id="norvimSuspensionTitle" style="margin:0 0 10px;color:#a32323">Account suspended</h2>
        <p style="margin:0 0 8px;line-height:1.5">You cannot log in while your account is suspended.</p>
        <div style="background:#fff3f1;border-left:4px solid #c33;padding:12px;border-radius:7px;margin:12px 0 16px">
          <strong>Reason for suspension</strong>
          <p id="norvimSuspensionReason" style="margin:6px 0 0;white-space:pre-wrap;line-height:1.5"></p>
        </div>
        <div id="norvimAppealArea">
          <p style="line-height:1.5;margin:0 0 8px">If you believe this suspension is a mistake, you may appeal it. Explain your situation below. Your account will remain suspended while Norvim reviews your appeal.</p>
          <label for="norvimAppealExplanation" style="display:block;font-weight:700;margin:10px 0 6px">Your appeal</label>
          <textarea id="norvimAppealExplanation" rows="4" maxlength="2000" placeholder="Explain why you believe your account should be reviewed..." style="box-sizing:border-box;width:100%;padding:11px;border:1px solid #cbd3df;border-radius:8px;font:inherit;resize:vertical"></textarea>
          <div id="norvimAppealStatus" role="status" aria-live="polite" style="min-height:22px;margin:8px 0;color:#334155"></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button type="button" id="norvimSubmitAppeal" style="flex:1;background:#123b66;color:#fff;border:0;border-radius:8px;padding:12px 16px;font-weight:700">Submit Appeal</button>
            <button type="button" id="norvimCloseSuspension" style="background:#e8edf3;color:#172235;border:0;border-radius:8px;padding:12px 16px">Close</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    document.getElementById("norvimSuspensionReason").textContent = options.reason || "No reason was recorded. Please contact Norvim support for clarification.";

    var close = function () { overlay.remove(); };
    document.getElementById("norvimCloseSuspension").addEventListener("click", close);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) close(); });

    var submit = document.getElementById("norvimSubmitAppeal");
    var status = document.getElementById("norvimAppealStatus");
    if (!options.appealToken) {
      document.getElementById("norvimAppealArea").innerHTML = '<p style="color:#9b2525">An appeal session could not be created. Please contact Norvim support.</p><button type="button" id="norvimCloseSuspension" style="background:#e8edf3;border:0;border-radius:8px;padding:12px 16px">Close</button>';
      document.getElementById("norvimCloseSuspension").addEventListener("click", close);
      return;
    }

    submit.addEventListener("click", async function () {
      var explanation = document.getElementById("norvimAppealExplanation").value.trim();
      if (explanation.length < 10) {
        status.textContent = "Please explain your situation in at least 10 characters.";
        return;
      }
      submit.disabled = true;
      submit.textContent = "Submitting...";
      status.textContent = "Sending your appeal to Norvim...";
      try {
        var response = await fetch("/api/account/suspension-appeals", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + options.appealToken },
          body: JSON.stringify({ explanation: explanation })
        });
        var result = await response.json();
        if (!response.ok) throw new Error(result.message || "Your appeal could not be submitted.");
        document.getElementById("norvimAppealArea").innerHTML = '<div style="background:#eaf8ef;color:#176236;padding:13px;border-radius:8px;line-height:1.5"><strong>Appeal submitted</strong><br>' + escapeHtml(result.message || "Your review request has been sent to Norvim administrators.") + '<br>Your account remains suspended until an administrator makes a decision.</div><button type="button" id="norvimCloseSuspension" style="margin-top:14px;background:#e8edf3;border:0;border-radius:8px;padding:12px 16px">Close</button>';
        document.getElementById("norvimCloseSuspension").addEventListener("click", close);
      } catch (error) {
        status.textContent = error.message || "Could not submit your appeal. Please try again.";
        submit.disabled = false;
        submit.textContent = "Submit Appeal";
      }
    });
    document.getElementById("norvimAppealExplanation").focus();
  };
})();
