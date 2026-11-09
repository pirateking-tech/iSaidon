(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeURL = (value) => {
    try {
      const u = new URL(value);
      return ["http:", "https:"].includes(u.protocol) ? u.href : "";
    } catch { return ""; }
  };
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  const grid = $("featuredMovies") || $("allMovies");
  if (!grid) return;
  const status = $("homeStatus") || $("libraryStatus");
  let movies = [];

  function card(movie) {
    const poster = safeURL(movie.poster_url);
    const link = safeURL(movie.movie_url);
    const detailHref = movie.id ? `iSaidon.streaming.html?id=${encodeURIComponent(movie.id)}` : "iSaidon.streaming.html";
    const posterContent = `${poster ? `<img src="${escapeHTML(poster)}" alt="${escapeHTML(movie.title)} poster" loading="lazy" onerror="this.style.display='none'">` : `<div class="poster-placeholder">iS</div>`}
        <span class="category-tag">${escapeHTML(movie.category || "Movie")}</span>
        <div class="poster-overlay" aria-label="${escapeHTML(movie.title)} description">
          <h4>${escapeHTML(movie.title)}</h4>
          ${movie.description ? `<p>${escapeHTML(movie.description)}</p>` : `<span class="poster-overlay-empty">No description available.</span>`}
        </div>`;
    return `<article class="movie-card">
      <div class="poster">${$("featuredMovies") ? `<a class="poster-link" href="${escapeHTML(detailHref)}" style="display:block;height:100%;color:inherit;text-decoration:none">${posterContent}</a>` : posterContent}</div>
      <div class="movie-info"><h3>${escapeHTML(movie.title)}</h3>
        ${movie.release_year ? `<span class="movie-year">${escapeHTML(movie.release_year)}</span>` : ""}
        ${$("featuredMovies") ? "" : (link ? `<a class="button button-small button-primary" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">Open authorized link ↗</a>` : `<span class="muted">No link available</span>`)}
      </div>
    </article>`;
  }

  function render(list) {
    grid.innerHTML = list.length ? list.map(card).join("") :
      `<div class="empty-state">No movies found yet. Please check back later.</div>`;
  }

  function renderDetail(movie) {
    const detail = $("movieDetail");
    if (!detail) return;
    const link = safeURL(movie.movie_url);
    const poster = safeURL(movie.poster_url);
    detail.innerHTML = `
      <a class="text-link" href="iSaidon.streaming.html">← Back to movies</a>
      <div class="detail-head">
        <p class="eyebrow">${escapeHTML(movie.category || "Movie")}${movie.release_year ? ` · ${escapeHTML(movie.release_year)}` : ""}</p>
        <h1>${escapeHTML(movie.title)}</h1>
        ${movie.description ? `<p class="detail-desc">${escapeHTML(movie.description)}</p>` : ""}
      </div>
      ${link ? `<div class="video-wrap"><video class="stream-video" controls preload="metadata" ${poster ? `poster="${escapeHTML(poster)}"` : ""} src="${escapeHTML(link)}"></video></div>
      <div class="detail-actions"><a class="button button-primary" href="${escapeHTML(link)}" download>Download</a><a class="button button-quiet" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></div>` : `<div class="empty-state">No streaming or download link is available for this movie.</div>`}
    `;
    const libraryTitle = document.querySelector(".page-title");
    const toolbar = document.querySelector(".toolbar");
    if (libraryTitle) libraryTitle.hidden = true;
    if (toolbar) toolbar.hidden = true;
    if (status) status.hidden = true;
    if (grid) grid.hidden = true;
    detail.hidden = false;
  }

  async function loadMovies() {
    try {
      const client = window.createIaidonSupabaseClient();
      const movieId = $("allMovies") ? new URLSearchParams(location.search).get("id") : "";
      if (movieId) {
        const { data, error } = await client.from("movies")
          .select("id,title,category,poster_url,movie_url,description,release_year")
          .eq("id", movieId).maybeSingle();
        if (error) throw error;
        if (data) { renderDetail(data); return; }
        if (status) status.textContent = "Movie not found.";
      }
      const { data, error } = await client.from("movies")
        .select("id,title,category,poster_url,movie_url,description,release_year,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      movies = data || [];
      if (status) status.textContent = movies.length ? `${movies.length} movie${movies.length === 1 ? "" : "s"} available` : "No movies have been published yet.";
      const filter = $("categoryFilter");
      if (filter) {
        const categories = [...new Set(movies.map(m => m.category).filter(Boolean))].sort();
        filter.innerHTML = `<option value="">All categories</option>` +
          categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
      }
      applyFilters();
    } catch (error) {
      if (status) status.textContent = `Could not load movies: ${error.message}`;
      if (grid) grid.innerHTML = "";
    }
  }

  function applyFilters() {
    const query = ($("movieSearch")?.value || "").trim().toLowerCase();
    const category = $("categoryFilter")?.value || "";
    let list = movies.filter(m =>
      (!query || (m.title || "").toLowerCase().includes(query)) &&
      (!category || m.category === category)
    );
    if ($("featuredMovies")) list = list.slice(0, 4);
    render(list);
  }

  $("movieSearch")?.addEventListener("input", applyFilters);
  $("categoryFilter")?.addEventListener("change", applyFilters);
  loadMovies();
})();
