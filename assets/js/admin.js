(() => {
  const $ = (id) => document.getElementById(id);
  const loginPanel = $("loginPanel");
  const dashboard = $("dashboardPanel");
  const pageStatus = $("pageStatus");
  const adminStatus = $("adminStatus");
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  let client;
  const say = (message, target = adminStatus) => { if (target) target.textContent = message; };
  const isAdmin = (session) => session?.user?.app_metadata?.role === "admin";

  function showDashboard(allowed) {
    loginPanel.hidden = allowed;
    dashboard.hidden = !allowed;
  }

  function safeExternalURL(value) {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "";
    } catch { return ""; }
  }

  async function refreshAdminList() {
    const list = $("adminMovieList");
    list.textContent = "Loading…";
    const { data, error } = await client.from("movies")
      .select("id,title,category,created_at")
      .order("created_at", { ascending: false });
    if (error) { list.textContent = error.message; return; }
    if (!data?.length) { list.textContent = "No movies yet."; return; }
    list.innerHTML = data.map(movie => {
      const item = document.createElement("div");
      item.className = "admin-movie-row";
      const title = document.createElement("strong");
      title.textContent = movie.title;
      const category = document.createElement("span");
      category.textContent = movie.category || "";
      const edit = document.createElement("button");
      edit.className = "button button-small button-quiet";
      edit.textContent = "Edit";
      edit.type = "button";
      edit.addEventListener("click", () => loadForEdit(movie.id));
      const del = document.createElement("button");
      del.className = "button button-small button-danger";
      del.textContent = "Delete";
      del.type = "button";
      del.addEventListener("click", () => deleteMovie(movie.id, movie.title));
      item.append(title, category, edit, del);
      return item.outerHTML;
    }).join("");
    // Reattach handlers after rendering safe DOM markup using data IDs.
    [...list.children].forEach((row, i) => {
      row.querySelectorAll("button")[0].addEventListener("click", () => loadForEdit(data[i].id));
      row.querySelectorAll("button")[1].addEventListener("click", () => deleteMovie(data[i].id, data[i].title));
    });
  }

  async function loadForEdit(id) {
    const { data, error } = await client.from("movies").select("*").eq("id", id).single();
    if (error) { say(error.message); return; }
    $("movieId").value = data.id;
    ["title", "category", "poster_url", "movie_url", "description", "release_year"].forEach(key => {
      $(key).value = data[key] ?? "";
    });
    $("saveMovieButton").textContent = "Save changes";
    say("Editing: " + data.title);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteMovie(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await client.from("movies").delete().eq("id", id);
    if (error) { say("Delete failed: " + error.message); return; }
    say("Movie deleted.");
    await refreshAdminList();
  }

  function clearForm() {
    $("movieForm").reset();
    $("movieId").value = "";
    $("saveMovieButton").textContent = "Publish movie";
  }

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    say("Signing in…", pageStatus);
    const { data, error } = await client.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });
    if (error) { say("Sign-in failed: " + error.message, pageStatus); return; }
    if (!isAdmin(data.session)) {
      await client.auth.signOut();
      showDashboard(false);
      say("This account is not an administrator. Ask the project owner to assign the admin role.", pageStatus);
      return;
    }
    showDashboard(true);
    say("Welcome, admin.");
    await refreshAdminList();
  });

  $("movieForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const { data: sessionData } = await client.auth.getSession();
    if (!isAdmin(sessionData.session)) {
      showDashboard(false);
      say("Your admin session has expired. Please sign in again.", pageStatus);
      return;
    }

    const movie = {
      title: $("title").value.trim(),
      category: $("category").value.trim(),
      poster_url: safeExternalURL($("poster_url").value.trim()),
      movie_url: safeExternalURL($("movie_url").value.trim()),
      description: $("description").value.trim() || null,
      release_year: $("release_year").value ? Number($("release_year").value) : null
    };
    if (!movie.title || !movie.category || !movie.poster_url || !movie.movie_url) {
      say("Enter a title, category, valid poster URL and authorized movie URL.");
      return;
    }

    const id = $("movieId").value;
    say(id ? "Saving changes…" : "Publishing…");
    const result = id
      ? await client.from("movies").update(movie).eq("id", id)
      : await client.from("movies").insert(movie);
    if (result.error) { say("Save failed: " + result.error.message); return; }
    say(id ? "Movie updated successfully." : "Movie published successfully.");
    clearForm();
    await refreshAdminList();
  });

  $("clearFormButton").addEventListener("click", clearForm);
  $("logoutButton").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) { say(error.message); return; }
    showDashboard(false);
    say("You have signed out.", pageStatus);
  });

  async function start() {
    try {
      client = window.createIaidonSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session && isAdmin(data.session)) {
        showDashboard(true);
        await refreshAdminList();
      } else {
        showDashboard(false);
        if (data.session) {
          await client.auth.signOut();
          say("This account does not have admin permission.", pageStatus);
        }
      }
      client.auth.onAuthStateChange((_event, session) => {
        if (!session) showDashboard(false);
      });
    } catch (error) {
      showDashboard(false);
      say(error.message, pageStatus);
    }
  }
  start();
})();
