// Form Validation Enhancement
(function () {
  function addValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        validateField(input);
      });

      input.addEventListener("input", function () {
        if (input.classList.contains("error")) {
          validateField(input);
        }
      });
    });

    form.addEventListener("submit", function (e) {
      let isValid = true;

      inputs.forEach(function (input) {
        if (!validateField(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        const firstError = form.querySelector(".error");
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  function validateField(input) {
    const row = input.closest(".form-row");
    if (!row) return true;

    removeError(row);

    if (input.hasAttribute("required") && !input.value.trim()) {
      showError(row, input, "This field is required");
      return false;
    }

    if (input.type === "email" && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        showError(row, input, "Please enter a valid email address");
        return false;
      }
    }

    if (input.hasAttribute("minlength")) {
      const minLength = parseInt(input.getAttribute("minlength"));
      if (input.value.length > 0 && input.value.length < minLength) {
        showError(
          row,
          input,
          "Must be at least " + minLength + " characters"
        );
        return false;
      }
    }

    if (input.type === "number") {
      const min = input.getAttribute("min");
      const max = input.getAttribute("max");
      const value = parseFloat(input.value);

      if (input.value && isNaN(value)) {
        showError(row, input, "Please enter a valid number");
        return false;
      }

      if (min !== null && value < parseFloat(min)) {
        showError(row, input, "Must be at least " + min);
        return false;
      }

      if (max !== null && value > parseFloat(max)) {
        showError(row, input, "Must be no more than " + max);
        return false;
      }
    }

    input.classList.remove("error");
    return true;
  }

  function showError(row, input, message) {
    input.classList.add("error");

    const existing = row.querySelector(".error-message");
    if (existing) {
      existing.textContent = message;
      return;
    }

    const errorMsg = document.createElement("span");
    errorMsg.className = "error-message";
    errorMsg.textContent = message;
    row.appendChild(errorMsg);
  }

  function removeError(row) {
    const errorMsg = row.querySelector(".error-message");
    if (errorMsg) {
      errorMsg.remove();
    }
  }

  addValidation("contactForm");
  addValidation("registerForm");
  addValidation("signinForm");
  addValidation("planForm");
})();
