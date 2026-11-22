let allEmployers = [];
console.log("admin-employers.js connected");
const employerEsc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const employerContainer = id => document.getElementById(id);

async function loadEmployers() {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) { const el = employerContainer("employerAdminMessage"); if (el) el.textContent = "Your admin session has expired. Please sign in again."; return; }
  const message = employerContainer("employerAdminMessage");
  try {
    const response = await fetch("/api/admin/employers", { cache: "no-store", headers: { Authorization: "Bearer " + adminToken } });
    const employers = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(employers)) throw new Error(employers.message || "Failed to load employers.");
    allEmployers = employers;
    renderEmployers();
    if (message) message.textContent = `${employers.length} employer account(s) loaded.`;
  } catch (error) {
    console.error(error);
    if (message) message.textContent = error.message || "Failed to load employers.";
    employerContainer("unverifiedEmployers").innerHTML = '<p class="employer-admin-empty">Could not load unverified employers.</p>';
    employerContainer("verifiedEmployers").innerHTML = '<p class="employer-admin-empty">Could not load verified employers.</p>';
  }
}

function renderEmployers() {
  const query = (employerContainer("searchEmployer")?.value || "").trim().toLowerCase();
  const matches = allEmployers.filter(e => [e.companyName, e.email, e.phone].some(v => String(v || "").toLowerCase().includes(query)));
  const unverified = matches.filter(e => e.isVerified !== true);
  const verified = matches.filter(e => e.isVerified === true);
  employerContainer("unverifiedEmployerCount").textContent = unverified.length;
  employerContainer("verifiedEmployerCount").textContent = verified.length;
  const card = (e, isVerified) => `<article class="employer-admin-card">
    ${e.logo ? `<img class="norvim-profile-photo" src="${employerEsc(e.logo)}" alt="${employerEsc(e.companyName)} logo">` : ""}
    <div><span class="employer-admin-badge ${isVerified ? "verified" : "unverified"}">${isVerified ? "Verified" : "Unverified"}</span> <span class="employer-admin-badge">${employerEsc(e.status || "Active")}</span></div>
    <h4>${employerEsc(e.companyName || "Unnamed company")}</h4>
    <p><b>Email:</b> ${employerEsc(e.email || "Not provided")}</p><p><b>Phone:</b> ${employerEsc(e.phone || "Not provided")}</p>
    <p><b>Jobs posted:</b> ${Number(e.jobsPosted || 0)} · <b>Active:</b> ${Number(e.activeJobs || 0)} · <b>Closed:</b> ${Number(e.closedJobs || 0)}</p>
    ${isVerified ? `<div class="employer-admin-actions"><button class="primary" type="button" data-admin-action="employer-suspension" data-account-id="${employerEsc(e._id)}">${e.status === "Suspended" ? "Activate" : "Suspend"}</button></div>` : `<div class="employer-admin-actions"><button class="danger" onclick="deleteUnverifiedEmployer('${e._id}')">Delete Unverified Account</button></div>`}
  </article>`;
  employerContainer("unverifiedEmployers").innerHTML = unverified.length ? unverified.map(e => card(e, false)).join("") : '<p class="employer-admin-empty">No unverified employers match this search.</p>';
  employerContainer("verifiedEmployers").innerHTML = verified.length ? verified.map(e => card(e, true)).join("") : '<p class="employer-admin-empty">No verified employers match this search.</p>';
}

function searchEmployers() { renderEmployers(); }
window.searchEmployers = searchEmployers;
window.toggleEmployerStatus = async function(id) {
  const employer = allEmployers.find(e => String(e._id) === String(id));
  if (!employer) return alert("Employer account not found. Refresh the list and try again.");
  const isSuspended = employer.status !== "Suspended";
  let reason = "";
  if (isSuspended) {
    reason = await window.norvimAdminDialog({ title: "Suspend employer", message: "Enter the reason for suspending this employer. This will be shown to them.", requireReason: true, confirmText: "Suspend account" });
    if (reason === null) return;
  } else {
    const approved = await window.norvimAdminDialog({ title: "Reactivate employer", message: "Restore this employer account?", confirmText: "Reactivate" });
    if (!approved) return;
  }
  const message = employerContainer("employerAdminMessage");
  try {
    if (message) message.textContent = isSuspended ? "Suspending employer…" : "Reactivating employer…";
    const response = await fetch(`/api/admin/employers/${encodeURIComponent(id)}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("adminToken") }, body: JSON.stringify({ isSuspended: Boolean(isSuspended), reason: reason.trim() }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
    if (message) message.textContent = data.message || "Employer status updated.";
    await loadEmployers();
  } catch (error) { if (message) message.textContent = "Suspension update failed: " + error.message; console.error("Employer suspension update failed:", error); }
};
window.deleteUnverifiedEmployer = async function(id) {
  const employer = allEmployers.find(e => String(e._id) === String(id));
  if (!employer) return alert("Employer account not found in the current list.");
  if (employer.isVerified === true) return alert("Verified employer accounts cannot be deleted from this control.");
  if (!confirm(`Permanently delete the unverified employer account for ${employer.companyName || employer.email}? This cannot be undone.`)) return;
  try {
    const response = await fetch(`/api/admin/employers/${id}`, { method: "DELETE", headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to delete unverified employer.");
    if (employerContainer("employerAdminMessage")) employerContainer("employerAdminMessage").textContent = data.message || "Unverified employer deleted.";
    await loadEmployers();
  } catch (error) { alert(error.message || "Failed to delete unverified employer."); }
};

// Delegated click handling for dynamically rendered employer cards.
document.addEventListener("click", event => {
  const button = event.target.closest?.('[data-admin-action="employer-suspension"]');
  if (!button) return;
  event.preventDefault();
  window.toggleEmployerStatus(button.dataset.accountId);
});

loadEmployers();
