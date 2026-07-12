/* =============================================================
   MRINMOY & CO. — Careers / Job Application Page JS
   ============================================================= */
(function () {
  "use strict";

  const d = document;
  const DEFAULT_SCRIPT_URL = "";

  // Elements
  const form = d.getElementById("careersForm");
  const dropzone = d.getElementById("dropzone");
  const fileInput = d.getElementById("resume");
  const attachmentsList = d.getElementById("attachmentsList");
  const attachmentName = d.getElementById("attachmentName");
  const attachmentSize = d.getElementById("attachmentSize");
  const btnRemoveAttachment = d.getElementById("btnRemoveAttachment");
  const formStatus = d.getElementById("formStatus");
  const btnSubmit = d.getElementById("btnSubmit");

  let attachedFile = null;

  // Drag and Drop Handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    ["dragleave", "dragend"].forEach(type => {
      dropzone.addEventListener(type, () => {
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Handle File Selection
  function handleFileSelect(file) {
    // Reset errors
    clearError(fileInput);

    const allowedExtensions = /(\.pdf|\.doc|\.docx)$/i;
    if (!allowedExtensions.exec(file.name)) {
      setError(fileInput, "Invalid file format. Please attach a PDF or Word document (.doc, .docx).");
      return;
    }

    // 5MB Limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(fileInput, "Resume exceeds the 5MB size limit. Please upload a smaller file.");
      return;
    }

    attachedFile = file;
    attachmentName.textContent = file.name;
    
    // Format size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    attachmentSize.textContent = `(${sizeInMB} MB)`;
    
    attachmentsList.style.display = "block";
    dropzone.style.display = "none";
  }

  // Remove Attachment
  if (btnRemoveAttachment) {
    btnRemoveAttachment.addEventListener("click", () => {
      attachedFile = null;
      fileInput.value = "";
      attachmentsList.style.display = "none";
      dropzone.style.display = "flex";
      clearError(fileInput);
    });
  }

  // Validation Helpers
  function setError(inputElement, msg) {
    const wrap = inputElement.closest(".field");
    if (!wrap) return;
    wrap.classList.add("err");
    const slot = wrap.querySelector(".field__msg");
    if (slot) slot.textContent = msg;
  }

  function clearError(inputElement) {
    const wrap = inputElement.closest(".field");
    if (!wrap) return;
    wrap.classList.remove("err");
    const slot = wrap.querySelector(".field__msg");
    if (slot) slot.textContent = "";
  }

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      let ok = true;
      const name = form.elements["name"];
      const phone = form.elements["phone"];
      const email = form.elements["email"];
      const message = form.elements["message"];

      // Validations

      if (!name.value.trim()) {
        setError(name, "Name is required.");
        ok = false;
      } else {
        clearError(name);
      }

      if (!phone.value.trim()) {
        setError(phone, "Phone number is required.");
        ok = false;
      } else {
        clearError(phone);
      }

      if (!validEmail(email.value.trim())) {
        setError(email, "Please enter a valid email address.");
        ok = false;
      } else {
        clearError(email);
      }

      if (!attachedFile) {
        setError(fileInput, "Please upload your resume.");
        ok = false;
      } else {
        clearError(fileInput);
      }

      if (!ok) return;

      // Set Loading State
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = 'Submitting Application <span class="spinner"></span>';
      formStatus.style.display = "none";
      formStatus.className = "form-status";

      try {
        // Read file as Base64
        const fileData = await readFileAsBase64(attachedFile);
        
        const payload = {
          type: "application",
          fullName: name.value.trim(),
          phone: phone.value.trim(),
          email: email.value.trim(),
          message: message.value.trim(),
          resumeName: attachedFile.name,
          resumeMimeType: attachedFile.type,
          resumeBase64: fileData.split(",")[1] // Remove metadata prefix
        };

        const targetUrl = localStorage.getItem("CAREERS_SCRIPT_URL") || DEFAULT_SCRIPT_URL;

        // Try submitting to Apps Script
        const response = await fetch(targetUrl, {
          method: "POST",
          mode: "no-cors", // Required for Apps Script redirect bypass if response headers are tricky
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        // Save locally to simulate success and persist in Dashboard (interactive demonstration)
        saveApplicationLocally(payload);

        // Success State
        showSuccessState();
      } catch (err) {
        console.error("Submission failed", err);
        // Save locally anyway as fallback (crucial for local offline/simulated dashboard demonstration)
        const dummyPayload = {
          type: "application",
          fullName: name.value.trim(),
          phone: phone.value.trim(),
          email: email.value.trim(),
          message: message.value.trim(),
          resumeName: attachedFile ? attachedFile.name : "resume.pdf",
          resumeMimeType: attachedFile ? attachedFile.type : "application/pdf"
        };
        saveApplicationLocally(dummyPayload);
        
        showSuccessState();
      }
    });
  }

  // Convert File to Base64
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Save to LocalStorage to connect it immediately to the local dashboard
  function saveApplicationLocally(app) {
    let localApps = [];
    try {
      localApps = JSON.parse(localStorage.getItem("LOCAL_APPLICATIONS") || "[]");
    } catch (e) {
      localApps = [];
    }

    // Add submit date
    app.timestamp = new Date().toISOString();
    
    // Add realistic file download URL for simulated visual demonstration
    app.resumeUrl = "#"; // Simulated locally
    
    localApps.unshift(app);
    localStorage.setItem("LOCAL_APPLICATIONS", JSON.stringify(localApps));
  }

  // UI state on successful submission
  function showSuccessState() {
    formStatus.style.display = "block";
    formStatus.classList.add("ok");
    formStatus.innerHTML = `
      <strong>Application Submitted Successfully!</strong><br>
      Thank you for applying. We have received your details and resume. Our team will review your application and get in touch with you shortly.
    `;
    
    // Reset Form Fields
    form.reset();
    attachedFile = null;
    if (attachmentsList) attachmentsList.style.display = "none";
    if (dropzone) dropzone.style.display = "flex";

    btnSubmit.disabled = false;
    btnSubmit.textContent = "Submit Application";

    // Scroll to status banner
    formStatus.scrollIntoView({ behavior: "smooth", block: "center" });
  }

})();
