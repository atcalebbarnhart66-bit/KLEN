(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.klenSupabase) return;

    var sessionResult = await window.klenSupabase.auth.getSession();
    var session = sessionResult.data.session;
    if (!session) return;

    var profileResult = await window.klenSupabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    var profile = profileResult.data;

    if (profile && profile.approved) {
      window.location.href = window.KLEN_BASEURL + "/dashboard/";
      return;
    }

    var nameEl = document.getElementById("pending-name");
    if (nameEl && profile) {
      nameEl.textContent = (profile.first_name + " " + profile.last_name).trim();
    }
  });
})();
