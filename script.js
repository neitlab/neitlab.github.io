// ==============================
// NEIT website script.js
// ==============================

// ---------- Helpers ----------
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function escapeHtml(value) {
  if (typeof value !== "string") return "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNewsDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function sortNewsByDate(items) {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
}


// ---------- Mobile navigation ----------
function initMobileNav() {
  const navToggle = qs(".nav-toggle");
  const siteNav = qs("#site-nav");

  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  qsa(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}


// ---------- Active navigation ----------
function initActiveNav() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  qsa(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    link.classList.remove("active");

    if (href === currentPath) {
      link.classList.add("active");
    }

    if (currentPath === "index.html" && href === "index.html") {
      link.classList.add("active");
    }
  });
}


// ---------- Footer year ----------
function initFooterYear() {
  const yearEl = qs("#current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}


// ---------- News data ----------
async function loadNewsData() {
  try {
    const response = await fetch("data/news.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load news.json (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("news.json must contain an array.");
    }

    return data;
  } catch (error) {
    console.error("Error loading news data:", error);
    return [];
  }
}

function buildNewsLink(item, options = {}) {
  const rawUrl =
    typeof item.link_url === "string" ? item.link_url.trim() : "";

  if (!rawUrl || item.show_link === false) {
    return "";
  }

  const url = escapeHtml(rawUrl);
  const label = escapeHtml(item.link_text || "Read more");
  const isExternal =
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://");

  return `
    <div class="news-actions">
      <a
        class="button ${options.primary ? "primary" : "secondary"}"
        href="${url}"
        ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}
      >
        ${label}
      </a>
    </div>
  `;
}

// ---------- News builders ----------
function buildHomepageNewsCard(item) {
  const id = escapeHtml(item.id || "");
  const title = escapeHtml(item.title || "Untitled update");
  const summary = escapeHtml(item.summary || "");
  const date = formatNewsDate(item.date || "");

  return `
    <article class="news-item">
      <div class="news-meta">${date}${item.pinned ? " • Pinned" : ""}</div>

      <h3>
        <a href="news.html#${id}">
          ${title}
        </a>
      </h3>

      <p>${summary}</p>

      ${buildNewsLink(item)}
    </article>
  `;
}

function buildNewsContent(content) {
  if (!content) return "";

  if (Array.isArray(content)) {
    return content
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  return `<p>${escapeHtml(content)}</p>`;
}

function buildNewsPageItem(item) {
  const id = escapeHtml(item.id || "");
  const title = escapeHtml(item.title || "Untitled update");
  const summary = escapeHtml(item.summary || "");
  const date = formatNewsDate(item.date || "");
  const category = escapeHtml(item.category || "Update");

  return `
    <article class="card news-entry" id="${id}">
      <div class="news-meta">${date}${item.pinned ? " • Pinned" : ""}</div>

      <div class="tag-list" style="margin:0 0 1rem 0;">
        <span class="tag">${category}</span>
      </div>

      <h2>${title}</h2>

      ${
        summary
          ? `<p class="intro-text">${summary}</p>`
          : ""
      }

      <div class="news-content">
        ${buildNewsContent(item.content)}
      </div>

      ${buildNewsLink(item, { primary: true })}
    </article>
  `;
}


// ---------- Homepage news ----------
async function renderHomepageNews() {
  const container = qs("#homepage-news-list");
  if (!container) return;

  const newsItems = await loadNewsData();

  if (!newsItems.length) {
    container.innerHTML = "<p>No news available yet.</p>";
    return;
  }

  const visibleNews = newsItems.filter(
    (item) => item.is_visible !== false
  );
  
  const sorted = sortNewsByDate(visibleNews);
  container.innerHTML = sorted.slice(0, 3).map(buildHomepageNewsCard).join("");
}


// ---------- News page ----------
async function renderNewsPage() {
  const container = qs("#news-page-list");
  if (!container) return;

  const newsItems = await loadNewsData();

  if (!newsItems.length) {
    container.innerHTML = "<p>No news entries available yet.</p>";
    return;
  }

  const visibleNews = newsItems.filter(
    (item) => item.is_visible !== false
  );
  
  const sorted = sortNewsByDate(visibleNews);
  container.innerHTML = sorted.map(buildNewsPageItem).join("");
}


// =====================================================
// PUBLICATIONS
// =====================================================

let allPublications = [];

async function loadPublicationsData() {
  try {
    const response = await fetch("./data/publications.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load publications.json (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("publications.json must contain an array.");
    }

    return data;
  } catch (error) {
    console.error("Error loading publications:", error);
    return [];
  }
}

function buildPublicationItem(item) {
  const year = item.year || "";
  const type = item.type || "";
  const title = escapeHtml(item.title || "");
  const venue = item.venue ? escapeHtml(item.venue) : "";
  const link = item.link || "";

  const metaParts = [];
  if (year) metaParts.push(escapeHtml(String(year)));
  if (type) metaParts.push(escapeHtml(type));

  if (link) {
    metaParts.push(
      `<a class="inline-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Scholar link</a>`
    );
  }

  return `
    <article class="publication-item">
      <div class="publication-meta">${metaParts.join(" · ")}</div>
      <h3>${title}</h3>
      ${venue ? `<p>${venue}</p>` : ""}
    </article>
  `;
}

function populatePublicationYears(items) {
  const yearSelect = qs("#publication-year");
  if (!yearSelect) return;

  const years = [...new Set(
    items
      .map((item) => item.year)
      .filter((year) => year && year !== "N/A")
  )].sort((a, b) => Number(b) - Number(a));

  yearSelect.innerHTML = `<option value="all">All years</option>`;

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });
}

function getFilteredPublications() {
  const searchInput = qs("#publication-search");
  const yearSelect = qs("#publication-year");

  const searchTerm = (searchInput?.value || "").trim().toLowerCase();
  const selectedYear = yearSelect?.value || "all";

  return allPublications.filter((item) => {
    const matchesYear =
      selectedYear === "all" || String(item.year) === selectedYear;

    const haystack = [
      item.title || "",
      item.authors || "",
      item.venue || "",
      item.type || ""
    ].join(" ").toLowerCase();

    const matchesSearch = !searchTerm || haystack.includes(searchTerm);

    return matchesYear && matchesSearch;
  });
}

function renderFilteredPublications() {
  const container = qs("#publications-list");
  const countEl = qs("#publications-count");
  if (!container) return;

  const filtered = getFilteredPublications();

  if (!filtered.length) {
    container.innerHTML = "<p>No publications match the current filters.</p>";
    if (countEl) {
      countEl.textContent = "Showing 0 publications";
    }
    return;
  }

  container.innerHTML = filtered.map(buildPublicationItem).join("");

  if (countEl) {
    const label = filtered.length === 1 ? "publication" : "publications";
    countEl.textContent = `Showing ${filtered.length} ${label}`;
  }
}

async function renderPublicationsPage() {
  const container = qs("#publications-list");
  if (!container) return;

  allPublications = await loadPublicationsData();

  if (!allPublications.length) {
    container.innerHTML = "<p>No publications available yet.</p>";
    const countEl = qs("#publications-count");
    if (countEl) {
      countEl.textContent = "No publications available.";
    }
    return;
  }

  populatePublicationYears(allPublications);
  renderFilteredPublications();

  const searchInput = qs("#publication-search");
  const yearSelect = qs("#publication-year");

  if (searchInput) {
    searchInput.addEventListener("input", renderFilteredPublications);
  }

  if (yearSelect) {
    yearSelect.addEventListener("change", renderFilteredPublications);
  }
}

async function renderHomepagePublicationCount() {
  const statEl = qs("#publication-count-stat");
  if (!statEl) return;

  const publications = await loadPublicationsData();
  statEl.textContent = publications.length || "—";
}


// =====================================================
// POSITIONS
// =====================================================

async function loadPositionsData() {
  try {
    const response = await fetch("./data/positions.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load positions.json (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("positions.json must contain an array.");
    }

    return data;
  } catch (error) {
    console.error("Error loading positions:", error);
    return [];
  }
}

function buildPositionCard(item) {
  const status = escapeHtml(item.status || "");
  const title = escapeHtml(item.title || "Untitled opportunity");
  const summary = escapeHtml(item.summary || "");
  const email = item.contact_email || "contact@neitlab.org";
  const applyUrl = item.apply_url || "";
  const details = Array.isArray(item.details) ? item.details : [];

  const showContactLink =
    item.show_contact_link === true && Boolean(item.contact_email);

  const showApplyLink =
    item.show_apply_link === true && Boolean(item.apply_url);

  const detailsHtml = details.length
    ? `
      <ul class="content-list">
        ${details
          .map((detail) => `<li>${escapeHtml(detail)}</li>`)
          .join("")}
      </ul>
    `
    : "";

  const actionLinks = [];

  if (showContactLink) {
    actionLinks.push(`
      <a
        class="button secondary"
        href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(
          `Enquiry about ${item.title || "joining NEIT"}`
        )}"
      >
        Contact about this position
      </a>
    `);
  }

  if (showApplyLink) {
    actionLinks.push(`
      <a
        class="button primary"
        href="${escapeHtml(applyUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Apply
      </a>
    `);
  }

  const actionsHtml = actionLinks.length
    ? `<div class="position-actions">${actionLinks.join("")}</div>`
    : "";

  return `
    <article class="job-card">
      ${status ? `<div class="job-meta">${status}</div>` : ""}
      <h3>${title}</h3>
      ${summary ? `<p>${summary}</p>` : ""}
      ${detailsHtml}
      ${actionsHtml}
    </article>
  `;
}

async function renderPositionsPage() {
  const container = qs("#positions-list");
  if (!container) return;

  const positions = await loadPositionsData();

  if (!positions.length) {
    container.innerHTML = "<p>No opportunities listed.</p>";
    return;
  }

  const openPositions = positions.filter((p) => p.is_open !== false);

  if (!openPositions.length) {
    container.innerHTML = "<p>No open positions at the moment.</p>";
    return;
  }

  container.innerHTML = openPositions.map(buildPositionCard).join("");
}


// =====================================================
// PEOPLE
// =====================================================

async function loadPeopleData() {
  try {
    const response = await fetch("./data/people.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load people.json (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("people.json must contain an array.");
    }

    return data;
  } catch (error) {
    console.error("Error loading people data:", error);
    return [];
  }
}

function buildPeopleLinks(links) {
  if (!Array.isArray(links) || !links.length) return "";

  return `
    <ul class="clean-list">
      ${links.map((link) => {
        const label = escapeHtml(link.label || "Link");
        const rawUrl = link.url || "#";
        const url = escapeHtml(rawUrl);
        const isExternal =
          rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
        return `
          <li>
            <a class="muted-link" href="${url}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              ${label}
            </a>
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

function buildPersonCard(person) {
  const name = escapeHtml(person.name || "Unnamed");
  const role = escapeHtml(person.role || "");
  const bio = escapeHtml(person.bio || "");
  const initials = escapeHtml(person.initials || "NEIT");
  const image = person.image ? escapeHtml(person.image) : "";
  const linksHtml = buildPeopleLinks(person.links);

  const avatarHtml = image
    ? `<img class="person-photo" src="${image}" alt="${name}">`
    : `<div class="person-avatar">${initials}</div>`;

  return `
    <article class="person-card">
      ${avatarHtml}
      <h3>${name}</h3>
      ${role ? `<div class="role">${role}</div>` : ""}
      ${bio ? `<p>${bio}</p>` : ""}
      ${linksHtml}
    </article>
  `;
}

async function renderPeoplePage() {
  const piContainer = qs("#people-pi-list");
  const teamContainer = qs("#people-team-list");

  if (!piContainer && !teamContainer) return;

  const people = await loadPeopleData();

  if (!people.length) {
    if (piContainer) {
      piContainer.innerHTML = "<p>No profile information available yet.</p>";
    }
    if (teamContainer) {
      teamContainer.innerHTML = "<p>No people listed yet.</p>";
    }
    return;
  }

  const visiblePeople = people.filter((person) => person.is_visible !== false);

  const piPeople = visiblePeople.filter(
    (person) => person.group === "pi" || person.group === "pi_side"
  );

  const teamPeople = visiblePeople.filter(
    (person) => person.group === "team"
  );

  if (piContainer) {
    piContainer.innerHTML = piPeople.length
      ? piPeople.map(buildPersonCard).join("")
      : "<p>No principal investigator profile available yet.</p>";
  }

  if (teamContainer) {
    teamContainer.innerHTML = teamPeople.length
      ? teamPeople.map(buildPersonCard).join("")
      : "<p>No students or collaborators listed yet.</p>";
  }
}


// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initActiveNav();
  initFooterYear();

  renderHomepageNews();
  renderNewsPage();

  renderPublicationsPage();
  renderHomepagePublicationCount();

  renderPositionsPage();
  renderPeoplePage();
});