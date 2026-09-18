(function () {
  "use strict";

  var dataScript = document.getElementById("agency-data");
  var svg = document.querySelector(".ks-map");
  var panel = document.getElementById("detail-panel");
  var searchInput = document.getElementById("agency-search");
  var searchCount = document.getElementById("search-count");
  var countySelect = document.getElementById("county-select");

  if (!dataScript || !svg || !panel) return;

  var counties = JSON.parse(dataScript.textContent);
  var bySlug = {};
  counties.forEach(function (c) {
    bySlug[c.slug] = c;
  });

  var paths = Array.prototype.slice.call(svg.querySelectorAll("path[data-slug]"));
  var pinnedSlug = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPopulation(value) {
    if (!value) return "unavailable";
    return Number(value).toLocaleString("en-US");
  }

  function renderPanel(slug) {
    var county = bySlug[slug];
    if (!county) {
      panel.innerHTML = '<p class="detail-panel__empty">Hover, tap, or select a county to see its agencies here.</p>';
      return;
    }

    var agencyItems = (county.agencies || []).map(function (agency) {
      var canLink = county.page && agency.url;
      var nameHtml = canLink
        ? '<a class="agency-name" href="' + escapeHtml(agency.url) + '">' + escapeHtml(agency.name) + "</a>"
        : '<span class="agency-name">' + escapeHtml(agency.name) + "</span>";
      return "<li>" + nameHtml + '<span class="agency-type">' + escapeHtml(agency.type) + "</span></li>";
    }).join("");

    var stateHtml = pinnedSlug === slug
      ? '<span class="detail-panel__state">Pinned &mdash; press Escape or select another county to change</span>'
      : "";

    panel.innerHTML =
      '<div class="detail-panel__header">' +
        stateHtml +
        '<p class="detail-panel__eyebrow">Kansas County</p>' +
        '<h2 class="detail-panel__title">' + escapeHtml(county.name) + " County</h2>" +
        '<p class="detail-panel__meta">County seat: ' + escapeHtml(county.seat || "Unconfirmed") + " &middot; " +
          "Projected population: " + formatPopulation(county.population) + " &middot; " +
          (county.agencies ? county.agencies.length : 0) + " agenc" + ((county.agencies && county.agencies.length === 1) ? "y" : "ies") + " on file</p>" +
      "</div>" +
      '<ul class="agency-list">' + agencyItems + "</ul>";
  }

  function clearStates() {
    paths.forEach(function (p) {
      p.classList.remove("is-selected");
    });
  }

  function setActive(slug, pin) {
    clearStates();
    var target = svg.querySelector('path[data-slug="' + slug + '"]');
    if (target) {
      target.classList.add("is-selected");
    }
    if (pin) {
      pinnedSlug = slug;
    }
    renderPanel(slug);
  }

  paths.forEach(function (path) {
    var slug = path.getAttribute("data-slug");

    path.addEventListener("mouseenter", function () {
      if (pinnedSlug) return;
      clearStates();
      renderPanel(slug);
    });

    path.addEventListener("mouseleave", function () {
      if (pinnedSlug) return;
      renderPanel(pinnedSlug);
    });

    path.addEventListener("focus", function () {
      if (pinnedSlug) return;
      clearStates();
      renderPanel(slug);
    });

    path.addEventListener("click", function () {
      if (pinnedSlug === slug) {
        pinnedSlug = null;
        clearStates();
        renderPanel(null);
        return;
      }
      setActive(slug, true);
      scrollPanelIntoViewOnMobile();
    });

    path.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (pinnedSlug === slug) {
          pinnedSlug = null;
          clearStates();
          renderPanel(null);
        } else {
          setActive(slug, true);
        }
      } else if (event.key === "Escape") {
        pinnedSlug = null;
        clearStates();
        renderPanel(null);
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && pinnedSlug) {
      pinnedSlug = null;
      clearStates();
      renderPanel(null);
    }
  });

  function scrollPanelIntoViewOnMobile() {
    if (window.matchMedia && window.matchMedia("(max-width: 979px)").matches) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (countySelect) {
    countySelect.addEventListener("change", function () {
      var slug = countySelect.value;
      if (!slug) return;
      setActive(slug, true);
      scrollPanelIntoViewOnMobile();
    });
  }

  // ---------------------------------------------------------------------
  // Search: filters by county name or agency name, highlights matches
  // ---------------------------------------------------------------------
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var query = searchInput.value.trim().toLowerCase();

      if (!query) {
        paths.forEach(function (p) {
          p.classList.remove("is-match", "is-dimmed");
        });
        if (searchCount) searchCount.textContent = "";
        return;
      }

      var matchCount = 0;

      paths.forEach(function (path) {
        var slug = path.getAttribute("data-slug");
        var county = bySlug[slug];
        var nameMatch = county.name.toLowerCase().indexOf(query) !== -1;
        var agencyMatch = (county.agencies || []).some(function (a) {
          return a.name.toLowerCase().indexOf(query) !== -1;
        });
        var isMatch = nameMatch || agencyMatch;

        path.classList.toggle("is-match", isMatch);
        path.classList.toggle("is-dimmed", !isMatch);

        if (isMatch) matchCount++;
      });

      if (searchCount) {
        searchCount.textContent = matchCount + " matching count" + (matchCount === 1 ? "y" : "ies");
      }
    });
  }
})();
