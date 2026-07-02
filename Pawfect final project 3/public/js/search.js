// public/js/search.js

// Adoption Finder with pill toggles and card grid
(function () {
  var pets = Array.isArray(window.PAWFECT_DATA) ? window.PAWFECT_DATA : [];

  var qInput = document.getElementById("q");
  var typeFilters = document.getElementById("typeFilters");
  var planFilters = document.getElementById("planFilters");
  var resultsGrid = document.getElementById("resultsGrid");
  var resultsCount = document.getElementById("resultsCount");
  var clearFilters = document.getElementById("clearFilters");

  var activeType = "";
  var activePlan = "";

  function normalize(str) {
    return String(str || "").trim().toLowerCase();
  }

  function labelForPlan(planValue) {
    if (planValue === "basic") return "Basic Adoption";
    if (planValue === "foster") return "Foster-to-Adopt";
    if (planValue === "forever") return "Forever Home Support";
    return planValue || "—";
  }

  function getTypeIcon(type) {
    var normalized = normalize(type);
    if (normalized === "dog") return "🐕";
    if (normalized === "cat") return "🐈";
    if (normalized === "rabbit") return "🐰";
    if (normalized === "bird") return "🐦";
    return "🐾";
  }
  
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text || "").replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  function matchesFilters(pet) {
    var nameFilter = normalize(qInput.value);

    if (nameFilter && normalize(pet.name).indexOf(nameFilter) === -1) {
      return false;
    }

    if (activeType && normalize(pet.type) !== activeType) {
      return false;
    }

    if (activePlan && normalize(pet.plan) !== activePlan) {
      return false;
    }

    return true;
  }

  function renderCards(list) {
    resultsGrid.innerHTML = "";

    if (!list.length) {
      resultsGrid.innerHTML = '<div class="empty-state">😿 No pets found. Try adjusting your filters!</div>';
      if (resultsCount) {
        resultsCount.textContent = "0 pets found";
      }
      return;
    }

    list.forEach(function (pet) {
      var card = document.createElement("div");
      card.className = "pet-item";
      
      // Create elements safely to prevent XSS
      var petImage = document.createElement("div");
      petImage.className = "pet-image";
      petImage.textContent = getTypeIcon(pet.type);
      
      var petTitle = document.createElement("h3");
      petTitle.className = "pet-title";
      petTitle.textContent = pet.name;
      
      var petInfo = document.createElement("p");
      petInfo.className = "pet-info";
      petInfo.textContent = pet.type + " • " + pet.age + " years old";
      
      var petDescription = document.createElement("p");
      petDescription.className = "pet-description";
      petDescription.textContent = pet.temperament;
      
      var petBadge = document.createElement("div");
      petBadge.className = "pet-badge";
      petBadge.textContent = labelForPlan(pet.plan);
      
      var adoptBtn = document.createElement("button");
      adoptBtn.className = "btn-adopt";
      adoptBtn.setAttribute("data-name", pet.name);
      adoptBtn.setAttribute("data-type", pet.type);
      adoptBtn.setAttribute("data-breed", pet.breed);
      adoptBtn.setAttribute("data-age", pet.age);
      adoptBtn.textContent = "🐾 Adopt This Pet";
      
      card.appendChild(petImage);
      card.appendChild(petTitle);
      card.appendChild(petInfo);
      card.appendChild(petDescription);
      card.appendChild(petBadge);
      card.appendChild(adoptBtn);
      resultsGrid.appendChild(card);
    });

    if (resultsCount) {
      var count = list.length;
      resultsCount.textContent = count + " pet" + (count === 1 ? "" : "s") + " found";
    }
  }

  function updateResults() {
    var filtered = pets.filter(matchesFilters);
    renderCards(filtered);
  }

  function handleFilterClick(event, filterType) {
    if (event.target.classList.contains("filter-button")) {
      var buttons = event.currentTarget.querySelectorAll(".filter-button");
      buttons.forEach(function (button) {
        button.classList.remove("active");
      });
      
      event.target.classList.add("active");
      
      if (filterType === "type") {
        activeType = event.target.getAttribute("data-value");
      } else if (filterType === "plan") {
        activePlan = event.target.getAttribute("data-value");
      }
      
      updateResults();
    }
  }

  function handleClearFilters() {
    qInput.value = "";
    activeType = "";
    activePlan = "";
    
    document.querySelectorAll(".filter-button").forEach(function (button) {
      button.classList.remove("active");
    });
    
    if (typeFilters) {
      typeFilters.querySelector(".filter-button").classList.add("active");
    }
    if (planFilters) {
      planFilters.querySelector(".filter-button").classList.add("active");
    }
    
    updateResults();
  }

  if (qInput) {
    qInput.addEventListener("input", updateResults);
  }

  if (typeFilters) {
    typeFilters.addEventListener("click", function (e) {
      handleFilterClick(e, "type");
    });
    typeFilters.querySelector(".filter-button").classList.add("active");
  }

  if (planFilters) {
    planFilters.addEventListener("click", function (e) {
      handleFilterClick(e, "plan");
    });
    planFilters.querySelector(".filter-button").classList.add("active");
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", handleClearFilters);
  }
  
  // Event delegation for adopt buttons
  resultsGrid.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-adopt")) {
      var name = e.target.getAttribute("data-name");
      var type = e.target.getAttribute("data-type");
      var breed = e.target.getAttribute("data-breed");
      var age = e.target.getAttribute("data-age");
      adoptPet(name, type, breed, age);
    }
  });

  renderCards(pets);
})();

// Temporary pet adoption feature
function adoptPet(name, type, breed, age) {
  fetch('/adopt-pet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, type, breed, age })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('🎉 Great choice! ' + name + ' has been added to your adoption list.\n\n⚠️ Please contact our support team to finalize the adoption process.');
    } else {
      alert(data.message || 'Please sign in to adopt a pet!');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred. Please sign in to adopt a pet!');
  });
}
