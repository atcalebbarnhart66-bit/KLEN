(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.klenSupabase) return;

    var sessionResult = await window.klenSupabase.auth.getSession();
    var session = sessionResult.data.session;
    if (!session) return;

    var profileResult = await window.klenSupabase
      .from("profiles")
      .select("first_name")
      .eq("id", session.user.id)
      .maybeSingle();

    var nameEl = document.getElementById("dashboard-greeting-name");
    if (nameEl && profileResult.data) {
      nameEl.textContent = profileResult.data.first_name;
    }
  });
})();
