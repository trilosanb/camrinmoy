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
  var contactForms = d.querySelectorAll("[data-contact-form]");
  contactForms.forEach(function (form) {
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

      var actionUrl = form.getAttribute("action");

      if (actionUrl) {
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        if (status) {
          status.classList.remove("err");
          status.classList.add("ok");
          status.style.display = "block";
          status.textContent = "Sending enquiry...";
        }

        var formData = new FormData(form);

        fetch(actionUrl, {
          method: "POST",
          body: formData
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (btn) btn.disabled = false;
            if (data.success) {
              if (status) {
                status.classList.remove("err");
                status.classList.add("ok");
                status.style.display = "block";
                status.textContent = "Thank you! Your enquiry has been sent successfully. We will get back to you shortly.";
              }
              form.reset();
            } else {
              if (status) {
                status.classList.remove("ok");
                status.classList.add("err");
                status.style.display = "block";
                status.textContent = data.message || "Something went wrong. Please try again or email us directly.";
              }
            }
          })
          .catch(function () {
            if (btn) btn.disabled = false;
            if (status) {
              status.classList.remove("ok");
              status.classList.add("err");
              status.style.display = "block";
              status.textContent = "Unable to send message. Please check your network connection or email us directly.";
            }
          });
      } else {
        var subject = encodeURIComponent("Website enquiry — " + name.value.trim());
        var svc = form.elements["service"] ? form.elements["service"].value : "";
        var body = encodeURIComponent(
          "Name: " + name.value.trim() + "\n" +
          "Email: " + email.value.trim() + "\n" +
          (form.elements["phone"] ? "Phone: " + form.elements["phone"].value.trim() + "\n" : "") +
          (svc ? "Service of interest: " + svc + "\n" : "") +
          "\n" + message.value.trim()
        );
        window.location.href = "mailto:mrinmoy@camrinmoy.com?subject=" + subject + "&body=" + body;

        if (status) {
          status.classList.add("ok");
          status.style.display = "block";
          status.textContent = "Thanks — your email client should open with the message ready to send. If it doesn't, write to mrinmoy@camrinmoy.com or message +91 88118 86677 on WhatsApp.";
        }
        form.reset();
      }
    });
  });

  /* -------- Blog list PDF download (Iframe method) -------- */
  d.querySelectorAll(".download-pdf-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var url = btn.getAttribute("data-url");
      if (!url) return;

      var printUrl = url + (url.indexOf("?") !== -1 ? "&" : "?") + "print=true";
      
      // Remove any existing print iframe
      var oldIframe = d.getElementById("pdf-print-iframe");
      if (oldIframe) {
        oldIframe.parentNode.removeChild(oldIframe);
      }

      var iframe = d.createElement("iframe");
      iframe.id = "pdf-print-iframe";
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      iframe.src = printUrl;
      d.body.appendChild(iframe);

      // Cleanup iframe after some time (15 seconds) to allow printing to complete
      setTimeout(function () {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 15000);
    });
  });

  /* -------- Article actions (PDF / Share) -------- */
  var printBtn = d.querySelector(".print-article-btn");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  var shareBtn = d.querySelector(".share-article-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var shareData = {
        title: d.title,
        text: d.querySelector(".dek") ? d.querySelector(".dek").textContent : "",
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(function (err) {
          console.log("Error sharing", err);
        });
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(function () {
          showToast("Link copied to clipboard!");
        }).catch(function () {
          var input = d.createElement("input");
          input.value = window.location.href;
          d.body.appendChild(input);
          input.select();
          d.execCommand("copy");
          d.body.removeChild(input);
          showToast("Link copied to clipboard!");
        });
      }
    });
  }

  // Toast helper
  function showToast(msg) {
    var toast = d.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = msg;
    d.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("show");
    }, 100);

    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  /* -------- Selected Engagements: Stage Board Auto-Cycle -------- */
  var stageBoard = d.querySelector(".engagements-stage-board");
  if (stageBoard) {
    var stageCards = Array.prototype.slice.call(stageBoard.querySelectorAll(".stage-card"));
    if (stageCards.length > 1) {
      var currentStageIdx = 0;
      stageCards.forEach(function (card, idx) {
        if (card.classList.contains("stage-card--featured")) {
          currentStageIdx = idx;
        }
      });

      var stageTimer = null;
      var stageHovered = false;

      var setFeaturedStage = function (index) {
        stageCards.forEach(function (card, idx) {
          card.classList.toggle("stage-card--featured", idx === index);
        });
        currentStageIdx = index;
      };

      var nextStage = function () {
        if (stageHovered) return;
        var nextIdx = (currentStageIdx + 1) % stageCards.length;
        setFeaturedStage(nextIdx);
      };

      var startStageCycle = function () {
        if (stageTimer) clearInterval(stageTimer);
        stageTimer = setInterval(nextStage, 3500);
      };

      var stopStageCycle = function () {
        if (stageTimer) {
          clearInterval(stageTimer);
          stageTimer = null;
        }
      };

      stageCards.forEach(function (card, idx) {
        card.addEventListener("mouseenter", function () {
          stageHovered = true;
          stopStageCycle();
          setFeaturedStage(idx);
        });
      });

      stageBoard.addEventListener("mouseleave", function () {
        stageHovered = false;
        startStageCycle();
      });

      startStageCycle();
    }
  }

  /* -------- Google Reviews Carousel (Left to Right) -------- */
  var reviewsTrack = d.getElementById("reviewsTrack");
  var reviewsPrevBtn = d.getElementById("reviewsPrevBtn");
  var reviewsNextBtn = d.getElementById("reviewsNextBtn");
  var reviewsCounter = d.getElementById("reviewsCounter");

  if (reviewsTrack && reviewsPrevBtn && reviewsNextBtn) {
    var getCardWidth = function () {
      var card = reviewsTrack.querySelector(".review-card");
      if (!card) return 320;
      var gap = 20; // 1.25rem = 20px gap
      return card.offsetWidth + gap;
    };

    var updateReviewsControls = function () {
      var maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
      var current = reviewsTrack.scrollLeft;
      reviewsPrevBtn.disabled = current <= 8;
      reviewsNextBtn.disabled = maxScroll > 0 ? (current >= maxScroll - 8) : true;

      if (reviewsCounter) {
        var cards = reviewsTrack.querySelectorAll(".review-card");
        var total = cards.length;
        if (total > 0) {
          var cardW = getCardWidth();
          var visibleCount = Math.max(1, Math.round(reviewsTrack.clientWidth / cardW));
          var firstVisible = Math.min(total, Math.max(1, Math.floor(current / cardW) + 1));
          var lastVisible = Math.min(total, firstVisible + visibleCount - 1);
          reviewsCounter.textContent = "Reviews " + firstVisible + "–" + lastVisible + " of " + total;
        }
      }
    };

    reviewsPrevBtn.addEventListener("click", function () {
      var w = getCardWidth();
      reviewsTrack.scrollBy({ left: -w, behavior: "smooth" });
    });

    reviewsNextBtn.addEventListener("click", function () {
      var w = getCardWidth();
      reviewsTrack.scrollBy({ left: w, behavior: "smooth" });
    });

    // Touch & Mouse Drag to scroll left-to-right smoothly
    var isDragging = false;
    var startX = 0;
    var startScrollLeft = 0;
    var moved = false;

    reviewsTrack.addEventListener("mousedown", function (e) {
      isDragging = true;
      moved = false;
      reviewsTrack.classList.add("is-dragging");
      startX = e.pageX - reviewsTrack.offsetLeft;
      startScrollLeft = reviewsTrack.scrollLeft;
    });

    window.addEventListener("mouseup", function () {
      if (isDragging) {
        isDragging = false;
        reviewsTrack.classList.remove("is-dragging");
      }
    });

    reviewsTrack.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      var x = e.pageX - reviewsTrack.offsetLeft;
      var walk = (x - startX) * 1.2;
      if (Math.abs(walk) > 4) moved = true;
      reviewsTrack.scrollLeft = startScrollLeft - walk;
    });

    // Prevent accidental link navigation while dragging
    reviewsTrack.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (moved) {
          e.preventDefault();
        }
      });
    });

    reviewsTrack.addEventListener("scroll", function () {
      updateReviewsControls();
    }, { passive: true });

    window.addEventListener("resize", updateReviewsControls, { passive: true });
    setTimeout(updateReviewsControls, 100);
  }

  /* -------- Check for auto-print parameter -------- */
  if (window.location.search.indexOf("print=true") !== -1) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.print();
      }, 600);
    });
  }
})();
