console.log("post-job.js connected");

const form = document.getElementById("jobForm");

form.addEventListener("submit", async function (e) {
    console.log("Form submitted");
    e.preventDefault();

   const formData = new FormData(form);
   const button = document.getElementById("postJobBtn");
   button.disabled = true;
   button.textContent = "Posting Job...";

    try {
       const token = localStorage.getItem("employerToken");

const response = await fetch("/api/jobs", {
    method: "POST",
    headers: {
        "Authorization": "Bearer " + token
    },
    body: formData
});

        const data = await response.json();
        button.disabled = false;
        button.textContent = "Post Job";

        if (response.status === 402 && data.code === "JOB_POSTING_SUBSCRIPTION_REQUIRED") {
            const walletFirst = confirm(`${data.message}\n\nPress OK to pay from your Norvim wallet, or Cancel to pay by M-PESA.`);
            await startEmployerJobPlan(walletFirst ? "wallet" : "mpesa");
            return;
        }
        alert(data.message);

        if (data.success) {
            form.reset();
        }

    } catch (error) {
        button.disabled = false;
        button.textContent = "Post Job";
        console.error(error);
        alert("Failed to post job.");
    }
});
async function startEmployerJobPlan(paymentMode) {
  const token = localStorage.getItem("employerToken");
  try {
    const r = await fetch("/api/employer/job-posting/subscribe", { method: "POST", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ paymentMode }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.message || "Unable to start subscription payment.");
    if (d.status === "success") { alert(d.message); return; }
    if (d.reference) {
      alert((d.message || "Complete payment.") + "\n\nAfter approving the M-PESA prompt, press OK to verify payment.");
      const vr = await fetch("/api/employer/job-posting/verify/" + encodeURIComponent(d.reference), { headers: { "Authorization": "Bearer " + token } });
      const vd = await vr.json().catch(() => ({})); if (!vr.ok) throw Error(vd.message || "Unable to verify payment.");
      if (vd.status === "success") alert("Payment confirmed. You can now post jobs for 30 days."); else alert("Payment status: " + vd.status + ". If you have paid, wait a moment and verify again.");
    }
  } catch (e) { alert(e.message || "Subscription payment failed."); }
}
