(() => {
    const section = document.getElementById("homepageMediaSection");
    const grid = document.getElementById("homepageMediaGrid");
    if (!section || !grid) return;

    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));

    async function loadHomepageMedia() {
        try {
            const response = await fetch("/api/homepage-media");
            if (!response.ok) throw new Error("Failed to load homepage media");
            const media = await response.json();

            // Important: no media means no section, so the homepage has no empty gap.
            if (!Array.isArray(media) || media.length === 0) {
                section.hidden = true;
                section.setAttribute("aria-hidden", "true");
                grid.innerHTML = "";
                return;
            }

            grid.innerHTML = media.map(item => {
                const visual = item.type === "video"
                    ? `<video class="homepage-media-visual" controls preload="metadata" playsinline src="${esc(item.url)}"></video>`
                    : `<img class="homepage-media-visual" src="${esc(item.url)}" alt="${esc(item.title || "Norvim update")}" loading="lazy">`;

                return `<article class="homepage-media-card">
                    <div class="homepage-media-visual-wrap">${visual}</div>
                    <div class="homepage-media-copy">
                        ${item.title ? `<h3>${esc(item.title)}</h3>` : ""}
                        ${item.caption ? `<p>${esc(item.caption)}</p>` : ""}
                    </div>
                </article>`;
            }).join("");

            section.hidden = false;
            section.removeAttribute("aria-hidden");
        } catch (error) {
            console.error("Failed to load homepage media:", error);
            section.hidden = true;
        }
    }

    loadHomepageMedia();
})();
