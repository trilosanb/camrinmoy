/* =============================================================
   MRINMOY & CO. — site scripts (vanilla, no dependencies)
   ============================================================= */
(function () {
  "use strict";

  var d = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------- Footer year -------- */
  var yr = d.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* -------- Sticky header shadow -------- */
  var header = d.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------- Mobile menu -------- */
  var toggle = d.querySelector(".nav-toggle");
  var menu = d.getElementById("mobile-menu");
  if (toggle && menu) {
    var closeMenu = function () {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      d.body.style.overflow = "";
    };
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
      d.body.style.overflow = !open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* -------- Back to top -------- */
  var toTop = d.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* -------- Scroll reveal -------- */
  var revealables = d.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* -------- Accordions (services + FAQ) --------
     Any button with [data-acc] toggles aria-expanded on its parent [data-acc-item]. */
  d.querySelectorAll("[data-acc]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest("[data-acc-item]");
      if (!item) return;
      var open = item.getAttribute("aria-expanded") === "true";
      // optional single-open groups
      var group = item.getAttribute("data-acc-group");
      if (group && !open) {
        d.querySelectorAll('[data-acc-group="' + group + '"]').forEach(function (other) {
          if (other !== item) other.setAttribute("aria-expanded", "false");
        });
      }
      item.setAttribute("aria-expanded", String(!open));
    });
  });

  /* -------- Blog: search + category filter -------- */
  var blogRoot = d.querySelector("[data-blog]");
  if (blogRoot) {
    var searchInput = blogRoot.querySelector("[data-blog-search]");
    var catBtns = blogRoot.querySelectorAll("[data-blog-cat]");
    var posts = Array.prototype.slice.call(blogRoot.querySelectorAll("[data-post]"));
    var empty = blogRoot.querySelector("[data-blog-empty]");
    var activeCat = "all";

    var apply = function () {
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      var shown = 0;
      posts.forEach(function (p) {
        var cat = p.getAttribute("data-cat") || "";
        var text = (p.getAttribute("data-search") || p.textContent || "").toLowerCase();
        var matchCat = activeCat === "all" || cat === activeCat;
        var matchText = !q || text.indexOf(q) !== -1;
        var vis = matchCat && matchText;
        p.style.display = vis ? "" : "none";
        if (vis) shown++;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    };

    if (searchInput) searchInput.addEventListener("input", apply);
    catBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        activeCat = b.getAttribute("data-blog-cat") || "all";
        catBtns.forEach(function (x) { x.classList.toggle("is-active", x === b); });
        apply();
      });
    });
  }

  /* -------- Work: category filter -------- */
  var workRoot = d.querySelector("[data-work]");
  if (workRoot) {
    var wBtns = workRoot.querySelectorAll("[data-work-filter]");
    var wItems = Array.prototype.slice.call(workRoot.querySelectorAll("[data-work-item]"));
    var wActive = "all";
    var wApply = function () {
      wItems.forEach(function (it) {
        var cat = it.getAttribute("data-cat") || "";
        var vis = wActive === "all" || cat === wActive;
        it.style.display = vis ? "" : "none";
      });
    };
    wBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        wActive = b.getAttribute("data-work-filter") || "all";
        wBtns.forEach(function (x) { x.classList.toggle("is-active", x === b); });
        wApply();
      });
    });
  }

  /* -------- Contact form: validation + submit -------- */
  var form = d.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");

    var setErr = function (field, msg) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("err", !!msg);
      var slot = wrap.querySelector(".field__msg");
      if (slot) slot.textContent = msg || "";
    };

    var validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements["name"];
      var email = form.elements["email"];
      var message = form.elements["message"];

      if (!name.value.trim()) { setErr(name, "Please enter your name."); ok = false; } else setErr(name, "");
      if (!validEmail(email.value.trim())) { setErr(email, "Enter a valid email address."); ok = false; } else setErr(email, "");
      if (message.value.trim().length < 10) { setErr(message, "A little more detail helps (10+ characters)."); ok = false; } else setErr(message, "");

      if (!ok) return;

      /* ---------------------------------------------------------
         No backend is wired by default. Two ready options:
         (A) MAILTO (works everywhere, opens the visitor's email app) — active below.
         (B) Replace the block below with a fetch() to a form service
             (Formspree / Web3Forms) — see README for the 3-line snippet.
         --------------------------------------------------------- */
      var subject = encodeURIComponent("Website enquiry — " + name.value.trim());
      var svc = form.elements["service"] ? form.elements["service"].value : "";
      var body = encodeURIComponent(
        "Name: " + name.value.trim() + "\n" +
        "Email: " + email.value.trim() + "\n" +
        (form.elements["phone"] ? "Phone: " + form.elements["phone"].value.trim() + "\n" : "") +
        (svc ? "Service of interest: " + svc + "\n" : "") +
        "\n" + message.value.trim()
      );
      // TODO: replace with the firm's real address before go-live.
      window.location.href = "mailto:contact@camrinmoy.com?subject=" + subject + "&body=" + body;

      if (status) {
        status.classList.add("ok");
        status.textContent = "Thanks — your email client should open with the message ready to send. If it doesn't, write to contact@camrinmoy.com or message +91 88118 86677 on WhatsApp.";
      }
      form.reset();
    });
  }
})();
