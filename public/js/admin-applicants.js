let allApplicants = [];
const token = () => localStorage.getItem("adminToken");
const escApplicant = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function applicantAdminApi(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { Authorization: "Bearer " + token(), ...(options.headers || {}), ...(options.body ? { "Content-Type": "application/json" } : {}) } });
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
        <div class="applicant-admin-actions">${verified ? `<button class="${suspended ? "applicant-reactivate" : "applicant-suspend"}" onclick="setApplicantSuspension('${applicant._id}',${!suspended})">${suspended ? "Reactivate Account" : "Suspend Account"}</button>` : `<button class="applicant-delete" onclick="deleteUnverifiedApplicant('${applicant._id}')">Delete Unverified Account</button>`}</div>
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
    if (!confirm(isSuspended ? "Suspend this verified applicant account? They will not be able to log in or use applicant-only features." : "Reactivate this applicant account?")) return;
    try { const result = await applicantAdminApi("/api/admin/applicants/" + encodeURIComponent(id) + "/suspension", { method: "PUT", body: JSON.stringify({ isSuspended }) }); alert(result.message || "Account status updated."); await loadApplicants(); }
    catch (error) { alert(error.message); }
};
loadApplicants();
