(function () {
  "use strict";

  function showStatus(message, isError) {
    var status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("form-status--error", "form-status--success");
    status.classList.add(isError ? "form-status--error" : "form-status--success");
    status.classList.add("is-visible");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var form = document.getElementById("profile-form");
    if (!form || !window.klenSupabase) return;

    var sessionResult = await window.klenSupabase.auth.getSession();
    var session = sessionResult.data.session;
    if (!session) return;

    var userId = session.user.id;

    var profileResult = await window.klenSupabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    var profile = profileResult.data;
    if (!profile) return;

    document.getElementById("first-name").value = profile.first_name || "";
    document.getElementById("last-name").value = profile.last_name || "";
    document.getElementById("rank").value = profile.rank || "";
    document.getElementById("agency").value = profile.agency || "";
    document.getElementById("email").value = profile.email || "";
    document.getElementById("ori").value = profile.ori || "";
    document.getElementById("personal-cell").value = profile.personal_cell || "";
    document.getElementById("business-cell").value = profile.business_cell || "";
    document.getElementById("bio").value = profile.bio || "";

    var avatarPreview = document.getElementById("avatar-preview");
    if (profile.avatar_url && avatarPreview) {
      avatarPreview.src = profile.avatar_url;
      avatarPreview.hidden = false;
    }

    var avatarInput = document.getElementById("avatar-input");
    var pendingAvatarFile = null;

    if (avatarInput) {
      avatarInput.addEventListener("change", function () {
        var file = avatarInput.files[0];
        if (!file) return;
        pendingAvatarFile = file;
        if (avatarPreview) {
          avatarPreview.src = URL.createObjectURL(file);
          avatarPreview.hidden = false;
        }
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;

      var avatarUrl = profile.avatar_url || null;

      if (pendingAvatarFile) {
        var filePath = userId + "/" + Date.now() + "-" + pendingAvatarFile.name;
        var uploadResult = await window.klenSupabase.storage
          .from("avatars")
          .upload(filePath, pendingAvatarFile, { upsert: true });

        if (uploadResult.error) {
          showStatus(uploadResult.error.message, true);
          submitBtn.disabled = false;
          return;
        }

        var publicUrlResult = window.klenSupabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = publicUrlResult.data.publicUrl;
      }

      var updateResult = await window.klenSupabase
        .from("profiles")
        .update({
          rank: document.getElementById("rank").value.trim(),
          agency: document.getElementById("agency").value.trim(),
          personal_cell: document.getElementById("personal-cell").value.trim(),
          business_cell: document.getElementById("business-cell").value.trim(),
          bio: document.getElementById("bio").value.trim(),
          avatar_url: avatarUrl
        })
        .eq("id", userId);

      submitBtn.disabled = false;

      if (updateResult.error) {
        showStatus(updateResult.error.message, true);
        return;
      }

      profile.avatar_url = avatarUrl;
      pendingAvatarFile = null;
      showStatus("Profile saved.", false);
    });
  });
})();
