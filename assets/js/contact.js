(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var contactEmail = form.getAttribute("data-contact-email");

  var requiredFields = ["first-name", "last-name", "rank", "agency", "email", "message"];

  function setError(fieldName, hasError) {
    var wrapper = form.querySelector('[data-field="' + fieldName + '"]');
    if (!wrapper) return;
    wrapper.classList.toggle("has-error", hasError);
    var input = document.getElementById(fieldName);
    if (input) {
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    var valid = true;
    var firstInvalid = null;

    requiredFields.forEach(function (fieldName) {
      var input = document.getElementById(fieldName);
      var value = input.value.trim();
      var fieldValid = value.length > 0;

      if (fieldName === "email" && fieldValid) {
        fieldValid = isValidEmail(value);
      }

      setError(fieldName, !fieldValid);

      if (!fieldValid) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (!valid && firstInvalid) {
      firstInvalid.focus();
    }

    return valid;
  }

  function buildMailto() {
    var firstName = document.getElementById("first-name").value.trim();
    var lastName = document.getElementById("last-name").value.trim();
    var rank = document.getElementById("rank").value.trim();
    var agency = document.getElementById("agency").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var message = document.getElementById("message").value.trim();

    var subject = "KLEN Contact: " + lastName + ", " + agency;

    var bodyLines = [
      "Name: " + firstName + " " + lastName,
      "Rank: " + rank,
      "Agency: " + agency,
      "Email: " + email,
      "Phone: " + (phone || "(not provided)"),
      "",
      "Message:",
      message
    ];

    var params = [
      "subject=" + encodeURIComponent(subject),
      "body=" + encodeURIComponent(bodyLines.join("\n"))
    ].join("&");

    return "mailto:" + contactEmail + "?" + params;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.classList.remove("is-visible");

    if (!validate()) {
      status.textContent = "Please correct the highlighted fields before sending.";
      status.classList.add("is-visible");
      return;
    }

    window.location.href = buildMailto();
  });
})();
