(function () {
  "use strict";

  if (!window.supabase || !window.SUPABASE_URL || window.SUPABASE_URL.indexOf("YOUR_SUPABASE") === 0) {
    return;
  }

  var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  window.klenSupabase = client;

  function initials(profile) {
    var f = (profile.first_name || "").charAt(0);
    var l = (profile.last_name || "").charAt(0);
    return (f + l).toUpperCase() || "?";
  }

  function renderLoggedOut() {
    var buttons = document.getElementById("auth-buttons");
    var menu = document.getElementById("user-menu");
    if (buttons) buttons.hidden = false;
    if (menu) menu.hidden = true;
  }

  function renderLoggedIn(profile) {
    var buttons = document.getElementById("auth-buttons");
    var menu = document.getElementById("user-menu");
    if (buttons) buttons.hidden = true;
    if (!menu) return;
    menu.hidden = false;

    var nameEl = document.getElementById("user-menu-name");
    var avatarImg = document.getElementById("user-menu-avatar");
    var initialsEl = document.getElementById("user-menu-initials");

    if (nameEl) {
      nameEl.textContent = ((profile.first_name || "") + " " + (profile.last_name || "")).trim();
    }

    if (profile.avatar_url) {
      if (avatarImg) {
        avatarImg.src = profile.avatar_url;
        avatarImg.hidden = false;
      }
      if (initialsEl) initialsEl.hidden = true;
    } else {
      if (avatarImg) avatarImg.hidden = true;
      if (initialsEl) {
        initialsEl.hidden = false;
        initialsEl.textContent = initials(profile);
      }
    }
  }

  function currentPath() {
    return window.location.pathname + window.location.search;
  }

  function redirect(path) {
    window.location.href = path;
  }

  function guardPage(session, profile, body) {
    var requireAuth = body.getAttribute("data-require-auth") === "true";
    var requireApproved = body.getAttribute("data-require-approved") === "true";

    if (!requireAuth && !requireApproved) return;

    if (!session) {
      redirect(window.KLEN_BASEURL + "/login/?redirect=" + encodeURIComponent(currentPath()));
      return;
    }

    if (requireApproved && (!profile || !profile.approved)) {
      redirect(window.KLEN_BASEURL + "/pending-approval/");
    }
  }

  async function init() {
    var body = document.body;
    var sessionResult = await client.auth.getSession();
    var session = sessionResult.data.session;

    var profile = null;
    if (session) {
      var profileResult = await client
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      profile = profileResult.data;
    }

    if (session && profile) {
      renderLoggedIn(profile);
    } else {
      renderLoggedOut();
    }

    guardPage(session, profile, body);

    var toggle = document.getElementById("user-menu-toggle");
    var menu = document.getElementById("user-menu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      document.addEventListener("click", function (event) {
        if (!menu.contains(event.target)) {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    var signoutButtons = document.querySelectorAll("[data-signout]");
    signoutButtons.forEach(function (btn) {
      btn.addEventListener("click", async function () {
        await client.auth.signOut();
        redirect(window.KLEN_BASEURL + "/");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
