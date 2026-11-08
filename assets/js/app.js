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
    return `<article class="movie-card">
      <div class="poster">${poster ? `<img src="${escapeHTML(poster)}" alt="${escapeHTML(movie.title)} poster" loading="lazy" onerror="this.style.display='none'">` : `<div class="poster-placeholder">iS</div>`}
        <span class="category-tag">${escapeHTML(movie.category || "Movie")}</span>
      </div>
      <div class="movie-info"><h3>${escapeHTML(movie.title)}</h3>
        ${movie.release_year ? `<span class="movie-year">${escapeHTML(movie.release_year)}</span>` : ""}
        ${movie.description ? `<p>${escapeHTML(movie.description)}</p>` : ""}
        ${link ? `<a class="button button-small button-primary" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">Open authorized link ↗</a>` : `<span class="muted">No link available</span>`}
      </div>
    </article>`;
  }

  function render(list) {
    grid.innerHTML = list.length ? list.map(card).join("") :
      `<div class="empty-state">No movies found yet. Please check back later.</div>`;
  }

  async function loadMovies() {
    try {
      const client = window.createIaidonSupabaseClient();
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
      grid.innerHTML = "";
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
