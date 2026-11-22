let allApplicants = [];
const token = () => localStorage.getItem("adminToken");
const escApplicant = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function applicantAdminApi(url, options = {}) {
    const adminToken = token();
    if (!adminToken) throw new Error("Your admin session has expired. Please sign in again.");
    const response = await fetch(url, { ...options, cache: "no-store", headers: { Authorization: "Bearer " + adminToken, ...(options.headers || {}), ...(options.body ? { "Content-Type": "application/json" } : {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
}
function applicantCard(applicant) {
    const verified = applicant.isVerified === true;
    const suspended = applicant.isSuspended === true;
    return `<article class="applicant-admin-card">
        <div class="applicant-admin-head"><h3>${escApplicant(applicant.name || "Unnamed applicant")}</h3><span class="applicant-admin-badge ${verified ? "verified" : "unverified"}">${verified ? "Verified" : "Unverified"}${suspended ? " · Suspended" : ""}</span></div>
        <p><strong>Email:</strong> ${escApplicant(applicant.email)}</p><p><strong>Phone:</strong> ${escApplicant(applicant.phone)}</p>
        <small>Registered: ${applicant.createdAt ? new Date(applicant.createdAt).toLocaleString() : "Date unavailable"}</small>
        <div class="applicant-admin-actions">${verified ? `<button type="button" class="${suspended ? "applicant-reactivate" : "applicant-suspend"}" data-admin-action="applicant-suspension" data-account-id="${escApplicant(applicant._id)}" data-suspend="${!suspended}">${suspended ? "Reactivate Account" : "Suspend Account"}</button>` : `<button class="applicant-delete" onclick="deleteUnverifiedApplicant('${applicant._id}')">Delete Unverified Account</button>`}</div>
    </article>`;
}
function renderApplicants() {
    const term = (document.getElementById("searchApplicant")?.value || "").trim().toLowerCase();
    const filtered = allApplicants.filter(a => [a.name, a.email, a.phone].some(v => String(v || "").toLowerCase().includes(term)));
    const unverified = filtered.filter(a => a.isVerified !== true);
    const verified = filtered.filter(a => a.isVerified === true);
    const u = document.getElementById("unverifiedApplicants");
    const v = document.getElementById("verifiedApplicants");
    if (u) u.innerHTML = unverified.length ? unverified.map(applicantCard).join("") : '<p class="applicant-empty">No unverified accounts found.</p>';
    if (v) v.innerHTML = verified.length ? verified.map(applicantCard).join("") : '<p class="applicant-empty">No verified accounts found.</p>';
    const count = document.getElementById("applicantCounts");
    if (count) count.textContent = `${unverified.length} unverified · ${verified.length} verified`;
}
async function loadApplicants() {
    const status = document.getElementById("applicantsLoadMessage");
    try {
        const data = await applicantAdminApi("/api/admin/applicants");
        allApplicants = Array.isArray(data) ? data : [];
        renderApplicants();
        if (status) status.textContent = `${allApplicants.length} applicant accounts loaded.`;
    } catch (error) {
        if (status) status.textContent = "Failed to load applicants: " + error.message;
        document.getElementById("unverifiedApplicants").innerHTML = "";
        document.getElementById("verifiedApplicants").innerHTML = "";
    }
}
window.searchApplicants = renderApplicants;
window.deleteUnverifiedApplicant = async id => {
    if (!confirm("Delete this unverified applicant account? This removes the account and cannot be undone.")) return;
    try { const result = await applicantAdminApi("/api/admin/applicants/" + encodeURIComponent(id), { method: "DELETE" }); alert(result.message || "Account deleted."); await loadApplicants(); }
    catch (error) { alert(error.message); }
};
window.setApplicantSuspension = async (id, isSuspended) => {
    const target = allApplicants.find(a => String(a._id) === String(id));
    if (!target) return alert("Applicant not found. Refresh the list and try again.");
    let reason = "";
    if (isSuspended) {
        reason = await window.norvimAdminDialog({ title: "Suspend applicant", message: "Enter the reason for suspending this applicant. This will be shown to them.", requireReason: true, confirmText: "Suspend account" });
        if (reason === null) return;
    } else {
        const approved = await window.norvimAdminDialog({ title: "Reactivate applicant", message: "Restore this applicant account?", confirmText: "Reactivate" });
        if (!approved) return;
    }
    const status = document.getElementById("applicantsLoadMessage");
    try {
        if (status) status.textContent = isSuspended ? "Suspending applicant…" : "Reactivating applicant…";
        const result = await applicantAdminApi("/api/admin/applicants/" + encodeURIComponent(id) + "/suspension", { method: "PUT", body: JSON.stringify({ isSuspended: Boolean(isSuspended), reason: reason.trim() }) });
        if (status) status.textContent = result.message || "Account status updated.";
        await loadApplicants();
        if (status) status.textContent = result.message || "Applicant account status updated.";
    } catch (error) { if (status) status.textContent = "Suspension update failed: " + error.message; console.error("Applicant suspension update failed:", error); }
};
// Delegated click handling avoids fragile inline onclick attributes on dynamically rendered cards.
document.addEventListener("click", event => {
    const button = event.target.closest?.('[data-admin-action="applicant-suspension"]');
    if (!button) return;
    event.preventDefault();
    window.setApplicantSuspension(button.dataset.accountId, button.dataset.suspend === "true");
});

loadApplicants();

const reminderButton = document.getElementById("sendVerificationReminders");
if (reminderButton) reminderButton.addEventListener("click", async () => {
    if (!confirm("Send a verification reminder email to every applicant and employer account that is still unverified? This will send real emails.")) return;
    const status = document.getElementById("verificationReminderStatus");
    reminderButton.disabled = true; reminderButton.textContent = "Sending reminders…";
    if (status) status.textContent = "Sending to unverified accounts. This may take a moment…";
    try {
        const result = await applicantAdminApi("/api/admin/verification-reminders", { method: "POST", body: JSON.stringify({}) });
        if (status) status.textContent = result.message || "Reminder run complete.";
        alert(result.message || "Reminder run complete.");
    } catch (error) { if (status) status.textContent = "Could not send reminders: " + error.message; alert(error.message); }
    finally { reminderButton.disabled = false; reminderButton.textContent = "Email verification reminders"; }
});
