(function () {
  "use strict";

  function showError(message) {
    var status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
  }

  function clearError() {
    var status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = "";
    status.classList.remove("is-visible");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("register-form");
    if (!form) return;

    if (!window.klenSupabase) {
      showError("Registration is not configured yet. Please contact the site administrator.");
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearError();

      var firstName = document.getElementById("first-name").value.trim();
      var lastName = document.getElementById("last-name").value.trim();
      var rank = document.getElementById("rank").value.trim();
      var agency = document.getElementById("agency").value.trim();
      var email = document.getElementById("email").value.trim();
      var ori = document.getElementById("ori").value.trim();
      var password = document.getElementById("password").value;
      var confirmPassword = document.getElementById("confirm-password").value;

      if (!ori) {
        showError("The ORI field is required.");
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }

      if (password.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }

      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;

      var signUpResult = await window.klenSupabase.auth.signUp({ email: email, password: password });

      if (signUpResult.error) {
        showError(signUpResult.error.message);
        submitBtn.disabled = false;
        return;
      }

      var user = signUpResult.data.user;
      var session = signUpResult.data.session;

      if (!session || !user) {
        showError("Check your email to confirm your account, then log in to finish registering.");
        submitBtn.disabled = false;
        return;
      }

      var insertResult = await window.klenSupabase.from("profiles").insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        rank: rank,
        agency: agency,
        email: email,
        ori: ori,
        approved: false
      });

      if (insertResult.error) {
        showError(insertResult.error.message);
        submitBtn.disabled = false;
        return;
      }

      window.location.href = window.KLEN_BASEURL + "/pending-approval/";
    });
  });
})();
