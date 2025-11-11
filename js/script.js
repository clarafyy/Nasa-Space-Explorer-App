// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Get DOM elements
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
// New date inputs
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// DID YOU KNOW: fun facts array and renderer (added)
const didYouKnowText = document.getElementById('didYouKnowText');
const spaceFacts = [
  "A day on Venus is longer than a year on Venus — it rotates very slowly.",
  "Neutron stars can spin up to 700 times per second.",
  "There are more stars in the universe than grains of sand on all Earth's beaches.",
  "Olympus Mons on Mars is the tallest volcano in the solar system.",
  "Space is not completely empty — it contains tiny particles, radiation, and even atoms.",
  "Saturn could float in water because it's mostly made of gas and has low average density.",
  "A teaspoon of a neutron star would weigh about 6 billion tons on Earth."
];

// Pick a random fact and show it on page load
function showRandomFact() {
  if (!didYouKnowText) return;
  const idx = Math.floor(Math.random() * spaceFacts.length);
  didYouKnowText.textContent = spaceFacts[idx];
}
// Run immediately so the fact is visible on page load
showRandomFact();

// --- Modal DOM refs (added) ---
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');

// Helper: open modal and render an item
function openModal(item) {
  // Prevent background scroll
  document.body.style.overflow = 'hidden';
  modalBody.innerHTML = '';

  // Media: prefer hdurl for images
  if (item.media_type === 'image') {
    const imgSrc = item.hdurl || item.url || '';
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = item.title || 'NASA image';
    modalBody.appendChild(img);
  } else if (item.media_type === 'video') {
    const videoUrl = item.url || '';
    const isEmbeddable = videoUrl.includes('embed') || videoUrl.includes('youtube.com') || videoUrl.includes('player.vimeo.com');
    if (isEmbeddable) {
      const iframe = document.createElement('iframe');
      iframe.src = videoUrl;
      iframe.width = '100%';
      iframe.height = '480';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      modalBody.appendChild(iframe);
    } else {
      const thumb = item.thumbnail_url || '';
      if (thumb) {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        const img = document.createElement('img');
        img.src = thumb;
        img.alt = item.title || 'video thumbnail';
        a.appendChild(img);
        modalBody.appendChild(a);
      } else {
        const p = document.createElement('p');
        p.innerHTML = `<a href="${videoUrl}" target="_blank" rel="noopener">Open video in new tab</a>`;
        modalBody.appendChild(p);
      }
    }
  }

  // Title, date, explanation
  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = item.title || '';

  const dateEl = document.createElement('div');
  dateEl.className = 'modal-date';
  dateEl.textContent = item.date || '';

  const explainEl = document.createElement('div');
  explainEl.className = 'modal-explain';
  explainEl.textContent = item.explanation || '';

  modalBody.appendChild(titleEl);
  modalBody.appendChild(dateEl);
  modalBody.appendChild(explainEl);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

// Helper: close modal
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modalBody.innerHTML = '';
  document.body.style.overflow = '';
}

// Close handlers
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Add click handler to fetch and render data
getImageBtn.addEventListener('click', async () => {
  // Read date inputs (format: YYYY-MM-DD). Empty string means "no limit".
  const startVal = startDateInput.value; // e.g. "2025-01-01" or ""
  const endVal = endDateInput.value;

  // Basic validation: if both provided, ensure start <= end
  if (startVal && endVal && startVal > endVal) {
    gallery.innerHTML = `<div class="placeholder"><p>Error: Start date must be before or equal to end date.</p></div>`;
    return;
  }

  // Disable button while loading
  getImageBtn.disabled = true;
  getImageBtn.textContent = 'Loading...';

  try {
    // Fetch the JSON feed and parse it
    const response = await fetch(apodData);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
    const items = await response.json(); // items is an array of APOD-like objects

    // Clear placeholder / previous content
    gallery.innerHTML = '';

    // If no items, show a friendly message
    if (!items || items.length === 0) {
      gallery.innerHTML = `<div class="placeholder"><p>No items found.</p></div>`;
      return;
    }

    // Filter items by selected date range (inclusive). If a bound is not provided, ignore it.
    const filtered = items.filter((item) => {
      const d = item.date || '';
      if (!d) return false; // skip items without date
      if (startVal && d < startVal) return false;
      if (endVal && d > endVal) return false;
      return true;
    });

    // If no results after filtering, show message
    if (filtered.length === 0) {
      gallery.innerHTML = `<div class="placeholder"><p>No items match that date range.</p></div>`;
      return;
    }

    // Build gallery items (simple, beginner-friendly)
    filtered.forEach((item) => {
      // Use template literals to build the HTML for each card
      // Safe simple fields: date, title, explanation, media_type, url, hdurl, thumbnail_url
      let mediaHtml = '';

      if (item.media_type === 'image') {
        // Render the image directly (no <a>) so clicking the image opens the modal.
        // Provide a small "Open HD" link if hdurl exists.
        const imageUrl = item.url || '';
        const hdUrl = item.hdurl || '';
        mediaHtml = `
          <img src="${imageUrl}" alt="${item.title}" data-hd="${hdUrl}" />
          ${hdUrl ? `<p><a class="hd-link" href="${hdUrl}" target="_blank" rel="noopener">Open HD</a></p>` : ''}
        `;
      } else if (item.media_type === 'video') {
        // Render video thumbnail directly (no <a>) and provide a separate link to open the video.
        const thumb = item.thumbnail_url || '';
        const videoUrl = item.url || '';
        if (thumb) {
          mediaHtml = `
            <img src="${thumb}" alt="${item.title} (video)" data-video="${videoUrl}" />
            <p><a class="video-link" href="${videoUrl}" target="_blank" rel="noopener">Open video</a></p>
          `;
        } else {
          mediaHtml = `<p><a class="video-link" href="${videoUrl}" target="_blank" rel="noopener">Open video: ${item.title}</a></p>`;
        }
      } else {
        // Fallback for unknown media types
        mediaHtml = `<p>Media not supported.</p>`;
      }

      // Short explanation snippet (first 120 chars) to keep cards compact
      const snippet = item.explanation ? `${item.explanation.slice(0, 120)}${item.explanation.length > 120 ? '…' : ''}` : '';

      // Create a container element and append to the gallery
      const card = document.createElement('div');
      card.className = 'gallery-item';
      card.innerHTML = `
        ${mediaHtml}
        <p><strong>${item.title}</strong></p>
        <p>${item.date}</p>
        <p>${snippet}</p>
      `;
      gallery.appendChild(card);

      // Open modal on card click, but allow normal navigation when clicking links inside the card
      card.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('a')) {
          return; // allow link clicks to behave normally
        }
        openModal(item);
      });
    });
  } catch (err) {
    // Show error message
    gallery.innerHTML = `<div class="placeholder"><p>Error loading data: ${err.message}</p></div>`;
  } finally {
    // Re-enable button
    getImageBtn.disabled = false;
    getImageBtn.textContent = 'Fetch Space Images';
  }
});