/*!
* Minimal Vanilla JS wrapper bridge for Supabase Client
* Maps global `supabase` object to standard modular fetch scripts
*/
(function (global) {
  'use strict';
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
        return (async function () {
          try {
            var res = await fetch(self.url + '/rest/v1/' + table, {
              method: 'POST',
              headers: { 'apikey': self.key, 'Authorization': 'Bearer ' + self.key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
              body: JSON.stringify(rows)
            });
            if (!res.ok) throw new Error(await res.text());
            return { data: await res.json(), error: null };
          } catch (err) { return { data: null, error: err }; }
        })();
      }
    };
  };
  global.supabase = {
    createClient: function (url, key) {
      return new SupabaseClient(url, key);
    }
  };
})(window);