// Initiate Lucide icons
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}

// Vanilla accordion functionality for the FAQ section
const faqTriggers = document.querySelectorAll(".faq-trigger");
faqTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const parent = trigger.parentElement;
    const content = trigger.nextElementSibling;
    const isActive = parent.classList.contains("active");

    // Close all other active items
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("active");
      item.querySelector(".faq-content").style.maxHeight = null;
    });

    // Toggle visibility on target item
    if (!isActive) {
      parent.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});

// Search filter targeting FAQ items
const helpSearch = document.getElementById("helpSearch");
const faqItems = document.querySelectorAll(".faq-item");
const noMatchesNotice = document.getElementById("noMatchesNotice");
const gettingStartedSection = document.getElementById("gettingStartedSection");

helpSearch.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  let matches = 0;

  faqItems.forEach((item) => {
    const question = item
      .querySelector(".faq-trigger span")
      .textContent.toLowerCase();
    const answer = item
      .querySelector(".faq-content-inner")
      .textContent.toLowerCase();

    if (question.includes(query) || answer.includes(query)) {
      item.style.display = "block";
      matches++;
    } else {
      item.style.display = "none";
    }
  });

  // Hide steps helper block if searching
  if (query.length > 0) {
    gettingStartedSection.style.display = "none";
  } else {
    gettingStartedSection.style.display = "block";
  }

  // Toggle fallback display panel if no results are found
  if (matches === 0 && query.length > 0) {
    noMatchesNotice.style.display = "block";
  } else {
    noMatchesNotice.style.display = "none";
  }
});
