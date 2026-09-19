(function () {
  "use strict";

  function showError(message) {
    var status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("login-form");
    if (!form) return;

    if (!window.klenSupabase) {
      showError("Login is not configured yet. Please contact the site administrator.");
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var redirectTo = params.get("redirect");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var email = document.getElementById("email").value.trim();
      var password = document.getElementById("password").value;
      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;

      var result = await window.klenSupabase.auth.signInWithPassword({ email: email, password: password });

      if (result.error) {
        showError(result.error.message);
        submitBtn.disabled = false;
        return;
      }

      var userId = result.data.user.id;
      var profileResult = await window.klenSupabase
        .from("profiles")
        .select("approved")
        .eq("id", userId)
        .maybeSingle();
      var approved = profileResult.data && profileResult.data.approved;

      if (redirectTo) {
        window.location.href = redirectTo;
      } else if (approved) {
        window.location.href = window.KLEN_BASEURL + "/dashboard/";
      } else {
        window.location.href = window.KLEN_BASEURL + "/pending-approval/";
      }
    });
  });
})();
