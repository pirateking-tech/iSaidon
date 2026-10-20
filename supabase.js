/*!
* Unified Supabase Client Architecture & Streamtape Mobile Optimizer
* Integrates Database Abstractions, Dashboard Processing, and Secure Rendering Engines
*/
(function (global) {
  'use strict';

  // ==========================================
  // SECTION 1: SUPABASE CLIENT CONFIGURATION
  // ==========================================
  var SupabaseClient = function (url, key) {
    this.url = url.replace(/\/\$/, '');
    this.key = key;
  };

  SupabaseClient.prototype.from = function (table) {
    var self = this;
    return {
      select: function (columns) {
        return {
          order: function (column, options) {
            return (async function () {
              try {
                var res = await fetch(self.url + '/rest/v1/' + table + '?select=' + encodeURIComponent(columns || '*') + '&order=' + column + '.' + ((options && options.ascending) ? 'asc' : 'desc'), {
                  method: 'GET',
                  headers: { 'apikey': self.key, 'Authorization': 'Bearer ' + self.key, 'Content-Type': 'application/json' }
                });
                if (!res.ok) throw new Error(await res.text());
                return { data: await res.json(), error: null };
              } catch (err) { return { data: null, error: err }; }
            })();
          }
        };
      },
      insert: function (rows) {
        // Enforce array conversion for seamless batch/single operations
        var processedRows = Array.isArray(rows) ? rows : [rows];
        
        // INTERCEPTOR: Cleans up Streamtape links before writing to the cloud server
        processedRows.forEach(function(row) {
          if (row.streamtape_link && typeof row.streamtape_link === 'string') {
            row.streamtape_link = row.streamtape_link.replace('/v/', '/e/');
          }
        });

        return (async function () {
          try {
            var res = await fetch(self.url + '/rest/v1/' + table, {
              method: 'POST',
              headers: { 'apikey': self.key, 'Authorization': 'Bearer ' + self.key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
              body: JSON.stringify(processedRows)
            });
            if (!res.ok) throw new Error(await res.text());
            return { data: await res.json(), error: null };
          } catch (err) { return { data: null, error: err }; }
        })();
      },
      delete: function () {
        return {
          eq: function (column, value) {
            return (async function () {
              try {
                var res = await fetch(self.url + '/rest/v1/' + table + '?' + column + '=eq.' + encodeURIComponent(value), {
                  method: 'DELETE',
                  headers: { 'apikey': self.key, 'Authorization': 'Bearer ' + self.key, 'Content-Type': 'application/json' }
                });
                if (!res.ok) throw new Error(await res.text());
                return { error: null };
              } catch (err) { return { error: err }; }
            })();
          }
        };
      }
    };
  };

  // ==========================================
  // SECTION 2: AD-SHIELD MOBILE PLAYER ENGINE
  // ==========================================
  /**
   * Generates a sandboxed container for Streamtape.
   * Isolates malicious scripts, popup hooks, and tracking code 
   * to guarantee instant rendering on mobile viewports.
   */
  var generateMobilePlayer = function (streamtapeUrl) {
    if (!streamtapeUrl) return '<div style="color:#ff4444; padding: 10px; font-weight: bold;">⚠️ Video file reference missing</div>';
    
    // Normalizes watch format into lightweight direct embed pipelines
    var workingEmbedUrl = streamtapeUrl.replace('/v/', '/e/');
    
    return `
      <div class="streamtape-mobile-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #111; border-radius: 12px; border: 1px solid #222; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin: 15px auto; max-width: 100%;">
        <iframe 
          src="${workingEmbedUrl}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; z-index: 1;" 
          allowfullscreen="true"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms">
        </iframe>
      </div>
    `;
  };

  // ==========================================
  // SECTION 3: AUTOMATED CONTENT INITIALIZER
  // ==========================================
  /**
   * Scans the active Document Object Model (DOM) to wire up form operations,
   * layout bindings, and display pipelines across Admin & Portal scopes.
   */
  var initializePortalManagement = function (clientInstance) {
    document.addEventListener("DOMContentLoaded", async function () {
      
      // ADMIN INTERFACE PIPELINES
      var adminForm = document.querySelector('form') || document.getElementById('admin-upload-form');
      var publishBtn = document.getElementById('publish-cloud-website') || document.querySelector('button[type="submit"]');
      
      if (adminForm) {
        adminForm.addEventListener('submit', async function (event) {
          event.preventDefault();
          
          var movieTitleInput = document.getElementById('movie-title') || document.querySelector('input[type="text"]');
          var categorySelect = document.getElementById('select-category') || document.querySelector('select');
          var linkInput = document.getElementById('streamtape-link') || document.querySelector('input[name="link"]');
          
          if (!movieTitleInput || !linkInput) return;

          var payload = {
            title: movieTitleInput.value.trim(),
            category: categorySelect ? categorySelect.value : 'General',
            streamtape_link: linkInput.value.trim(),
            created_at: new Date().toISOString()
          };

          if (!payload.title || !payload.streamtape_link) {
            alert("Error: Missing parameters. Complete all form inputs.");
            return;
          }

          if (publishBtn) publishBtn.disabled = true;
          
          var response = await clientInstance.from('movies').insert(payload);
          
          if (publishBtn) publishBtn.disabled = false;

          if (response.error) {
            alert("Cloud write rejected: " + response.error.message);
          } else {
            alert("Successfully published! Video link optimized for mobile streams.");
            adminForm.reset();
            if (typeof global.refreshActiveRecords === 'function') global.refreshActiveRecords();
          }
        });
      }

      // PUBLIC STREAMING PORTAL DISPLAY PIPELINES
      var tamilContainer = document.getElementById('tamil-movies-target') || document.querySelector('.tamil-dubbed-movies-container');
      var hollywoodContainer = document.getElementById('hollywood-movies-target') || document.querySelector('.hollywood-movies-container');
      var bollywoodContainer = document.getElementById('bollywood-movies-target') || document.querySelector('.bollywood-movies-container');
      var animeContainer = document.getElementById('anime-movies-target') || document.querySelector('.anime-cartoons-container');

      // Fetch dynamic link records directly via our customized wrapper client
      var fetchOperation = await clientInstance.from('movies').select('*').order('created_at', { ascending: false });
      
      if (fetchOperation.data) {
        // Flush structural loading flags
        if (tamilContainer) tamilContainer.innerHTML = '';
        if (hollywoodContainer) hollywoodContainer.innerHTML = '';
        if (bollywoodContainer) bollywoodContainer.innerHTML = '';
        if (animeContainer) animeContainer.innerHTML = '';

        fetchOperation.data.forEach(function (movie) {
          // Generate the isolated, mobile-optimized player viewport markup 
          var playerHTML = `
            <div class="movie-card-node" style="margin-bottom: 25px; background: #1a1a1a; padding: 15px; border-radius: 8px;">
              <h3 style="color:#fff; font-family: sans-serif; margin-bottom: 10px;">${movie.title}</h3>
              ${generateMobilePlayer(movie.streamtape_link)}
            </div>
          `;

          // Route content maps into their specific HTML structural rows
          var normCategory = String(movie.category).toLowerCase();
          if (normCategory.includes('tamil') && tamilContainer) {
            tamilContainer.innerHTML += playerHTML;
          } else if (normCategory.includes('hollywood') && hollywoodContainer) {
            hollywoodContainer.innerHTML += playerHTML;
          } else if (normCategory.includes('bollywood') && bollywoodContainer) {
            bollywoodContainer.innerHTML += playerHTML;
          } else if (normCategory.includes('anime') || normCategory.includes('cartoon') && animeContainer) {
            animeContainer.innerHTML += playerHTML;
          } else {
            // Fallback routing if elements miss structural naming criteria
            var globalTarget = document.getElementById('global-movies-loader');
            if (globalTarget) globalTarget.innerHTML += playerHTML;
          }
        });
      }
    });
  };

  // ==========================================
  // SECTION 4: GLOBAL EXPORTS INTERFACE
  // ==========================================
  global.supabase = {
    createClient: function (url, key) {
      var activeInstance = new SupabaseClient(url, key);
      // Auto-attach DOM rendering controls straight to the created client instance context
      initializePortalManagement(activeInstance);
      return activeInstance;
    },
    utils: {
      renderPlayer: generateMobilePlayer
    }
  };

})(window);
