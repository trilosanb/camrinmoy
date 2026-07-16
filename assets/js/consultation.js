/* =============================================================
   MRINMOY & CO. — Consultation Form Flow Script
   ============================================================= */
(function (window) {
  "use strict";

  // ====== CONFIGURE THIS ======
  // You can paste your Google Apps Script URL here, or save it in your browser's localStorage as "SCRIPT_URL"
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLgAOtpmYwrgnbpfBQRLIsQg2I6WGp-O7ybOzKb-pKmvEu7Xtqhx1hJD1VzfhmUWfB/exec";
  // =============================

  var answers = {
    fullName: "", email: "", whatsapp: "",
    investingNow: "", whereInvested: [], professionalHelp: "", portfolioReview: "",
    wantToStart: "", insuranceHeld: [], followUpDate: ""
  };

  var stepIndex = 0;

  // linear base order; branching decided at runtime
  function getFlow() {
    var flow = ["fullName", "email", "whatsapp", "investingNow"];
    if (answers.investingNow === "Yes") {
      flow.push("whereInvested", "professionalHelp", "portfolioReview");
    } else if (answers.investingNow === "No") {
      flow.push("wantToStart");
    }
    flow.push("insuranceHeld", "followUpDate", "done");
    return flow;
  }

  function currentFlow() { return getFlow(); }

  function showStep(name) {
    document.querySelectorAll(".step").forEach(function (s) { s.classList.remove("active"); });
    var targetStep = document.querySelector('.step[data-step="' + name + '"]');
    if (targetStep) {
      targetStep.classList.add("active");
    }
    var flow = currentFlow();
    var idx = flow.indexOf(name);
    if (idx !== -1) {
      var pct = Math.round((idx / (flow.length - 1)) * 100);
      var fill = document.getElementById("progressFill");
      if (fill) fill.style.width = pct + "%";
    }
  }

  function selectYN(key, val, el) {
    answers[key] = val;
    el.parentElement.querySelectorAll(".yn-btn").forEach(function (b) { b.classList.remove("selected"); });
    el.classList.add("selected");
    hideErr(el.closest(".step"));
  }

  function toggleChip(key, val, el) {
    var arr = answers[key];
    if (val === 'None of the Above') {
      answers[key] = [val];
      el.parentElement.querySelectorAll(".chip").forEach(function (c) {
        if (c === el) c.classList.add("selected");
        else c.classList.remove("selected");
      });
    } else {
      var noneIdx = arr.indexOf('None of the Above');
      if (noneIdx > -1) {
        arr.splice(noneIdx, 1);
        el.parentElement.querySelectorAll(".chip").forEach(function (c) {
          if (c.textContent.trim().toLowerCase() === 'none of the above') {
            c.classList.remove("selected");
          }
        });
      }
      var i = arr.indexOf(val);
      if (i > -1) {
        arr.splice(i, 1);
        el.classList.remove("selected");
      } else {
        arr.push(val);
        el.classList.add("selected");
      }
    }
    hideErr(el.closest(".step"));
  }

  function hideErr(stepEl) {
    var err = stepEl.querySelector(".err");
    if (err) err.style.display = "none";
  }

  // Exposed function so step flow transition can also trigger error hiding
  window.hideErr = hideErr;

  function showErr(stepEl) {
    var err = stepEl.querySelector(".err");
    if (err) err.style.display = "block";
  }

  function validate(name) {
    var stepEl = document.querySelector('.step[data-step="' + name + '"]');
    if (!stepEl) return true;
    var ok = true;
    if (name === "fullName") ok = document.getElementById("fullName").value.trim().length > 0;
    if (name === "email") ok = /\S+@\S+\.\S+/.test(document.getElementById("email").value.trim());
    if (name === "whatsapp") ok = document.getElementById("whatsapp").value.trim().length >= 7;
    if (name === "investingNow") ok = answers.investingNow !== "";
    if (name === "whereInvested") ok = answers.whereInvested.length > 0;
    if (name === "professionalHelp") ok = answers.professionalHelp !== "";
    if (name === "portfolioReview") ok = answers.portfolioReview !== "";
    if (name === "wantToStart") ok = answers.wantToStart !== "";
    if (name === "insuranceHeld") ok = answers.insuranceHeld.length > 0;
    
    if (!ok) showErr(stepEl); else hideErr(stepEl);
    return ok;
  }

  function syncField(name) {
    var el = document.getElementById(name);
    if (el) {
      if (name === "fullName" || name === "email" || name === "whatsapp") {
        answers[name] = el.value.trim();
      } else if (name === "followUpDate") {
        answers[name] = el.value;
      }
    }
  }

  function next() {
    var flow = currentFlow();
    var name = flow[stepIndex];
    syncField(name);
    if (!validate(name)) return;
    stepIndex++;
    showStep(flow[stepIndex]);
  }

  function startConsultation() {
    var introSec = document.getElementById("consultationIntro");
    var formSec = document.getElementById("consultationFormSection");
    if (introSec && formSec) {
      introSec.style.display = "none";
      formSec.style.display = "block";
    }
    stepIndex = 0;
    showStep(currentFlow()[0]);
  }

  function resetIntro() {
    var introSec = document.getElementById("consultationIntro");
    var formSec = document.getElementById("consultationFormSection");
    if (introSec && formSec) {
      introSec.style.display = "block";
      formSec.style.display = "none";
    }
  }

  function back() {
    var flow = currentFlow();
    if (stepIndex === 0) return;
    stepIndex--;
    showStep(flow[stepIndex]);
  }

  function submitForm() {
    syncField("followUpDate");
    var btn = document.getElementById("submitBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    var payload = {
      fullName: answers.fullName,
      email: answers.email,
      whatsapp: answers.whatsapp,
      investingNow: answers.investingNow,
      whereInvested: answers.whereInvested,
      professionalHelp: answers.professionalHelp,
      portfolioReview: answers.portfolioReview,
      wantToStart: answers.wantToStart,
      insuranceHeld: answers.insuranceHeld,
      followUpDate: answers.followUpDate
    };

    // Resolve URL (check localStorage if not hardcoded in the file)
    var targetUrl = localStorage.getItem("LEADS_SCRIPT_URL") || localStorage.getItem("SCRIPT_URL") || SCRIPT_URL;

    function saveLeadLocally(lead) {
      var localLeads = [];
      try {
        localLeads = JSON.parse(localStorage.getItem("LOCAL_LEADS") || "[]");
      } catch (e) {
        localLeads = [];
      }
      lead.timestamp = new Date().toISOString();
      localLeads.unshift(lead);
      localStorage.setItem("LOCAL_LEADS", JSON.stringify(localLeads));
    }

    if (targetUrl) {
      fetch(targetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(function () {
        saveLeadLocally(payload);
        stepIndex++;
        showStep("done");
      }).catch(function () {
        saveLeadLocally(payload);
        stepIndex++;
        showStep("done"); // fallback to success message
      });
    } else {
      console.warn("Google Apps Script URL is not configured. Submission simulated.");
      saveLeadLocally(payload);
      setTimeout(function () {
        stepIndex++;
        showStep("done");
      }, 800);
    }
  }

  // Expose functions globally for HTML inline event handlers
  window.next = next;
  window.back = back;
  window.selectYN = selectYN;
  window.toggleChip = toggleChip;
  window.submitForm = submitForm;
  window.startConsultation = startConsultation;
  window.resetIntro = resetIntro;

  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    showStep("fullName");
  });

})(window);
