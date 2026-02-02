//Writing the variables first. Go look at your HTML, find the IDs, and write the const lines in JS to match them.

const API_KEY = 'at_PhngiljB4pYzKrs4w0Dl2fdkpesRL'; // Replace with your actual API key

// Grabs the form so we can listen to submits.
const form = document.getElementById('my-app__form');

// Grabs the input to read user
const ipInput = document.getElementById('my-app__input');

// Grabs the results area to write results
const ipAddressElement = document.getElementById("my-app__ip-address"); // Where IP address will show.
const locationElement = document.getElementById("my-app__location"); // Where location text will show.
const timezoneElement = document.getElementById("my-app__timezone"); // Where timezone text will show.
const ispElement = document.getElementById("my-app__isp"); // Where ISP name will show.
const messageElement = document.getElementById("form-message"); // Shows validation or status messages.
const recentList = document.getElementById("recent-list"); // Container for recent searches.
const searchButton = document.getElementById("my-app__button"); // Submit button for loading state.
const themeToggle = document.getElementById("theme-toggle"); // Dark mode toggle button.

//Get the map and the markerIcon on screen. Write the L.map and L.tileLayer lines. Refresh your browser. If you see a map, you win step 2.
/*
const map = L.map("map"): This tells the Leaflet library (L) to look for the HTML element with id="map" and turn it into an interactive map.
L.tileLayer(...): A map is actually just hundreds of tiny square images (tiles) stitched together. This command tells Leaflet where to download those images (from OpenStreetMap) and adds them to your map.
*/
const map = L.map("my-app__map"); // Creates a Leaflet map inside the #map element.
const markerIcon = L.icon({ // Creates a custom marker icon.
  iconUrl: "./images/google-maps-marker-icon.png", //icon-location.svg Points to the marker image.
  iconSize: [46, 56], // Width x height in pixels (46px wide, 56px tall); change if your SVG size differs.
  iconAnchor: [23, 56] // The exact pixel point that touches the map: 23px from left (center), 56px from top (bottom).
}); // Ends marker icon configuration.
let marker = null; // Will store the marker so we can move it later.

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { // Adds map tiles from OpenStreetMap.
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' // Required attribution.
}).addTo(map); // Actually adds the tiles to the map.

function setMap(lat, lng) { // Updates the map position and marker.
  map.setView([lat, lng], 13); // Centers the map at the given coordinates.
  if (marker) { // If marker exists, move it.
    marker.setLatLng([lat, lng]); // Updates marker position.
  } else { // Otherwise create it.
    marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map); // Creates the marker on the map.
    marker.bindPopup("Location found!"); // Adds a popup message; customize text or add HTML.
    marker.openPopup(); // Opens the popup immediately; remove if you only want it on click.

  } // Ends if/else block.
  animateMarker(); // Adds a small bounce animation on each update.
} // Ends setMap function.

function animateMarker() {
  if (!marker || !marker._icon) {
    return;
  }
  marker._icon.classList.remove("marker-bounce");
  void marker._icon.offsetWidth;
  marker._icon.classList.add("marker-bounce");
}


//Format the API response data. Write the setResults function that takes in data and updates the HTML elements with the relevant info.
function setResults(data) {
  ipAddressElement.textContent = data.ip; // Sets the IP address.
  const locationParts = [data.location.city, data.location.region, data.location.postalCode, data.location.country] // Combines location pieces (now includes postal code).
    .filter(Boolean) // Removes empty values so you never see "undefined".
    .join(", "); // Joins with commas for a clean display.
  locationElement.textContent = locationParts || "--"; // Displays location.
  timezoneElement.textContent = data.location.timezone ? `UTC ${data.location.timezone}` : "--"; // Shows timezone.
  ispElement.textContent = data.isp || "--"; // Shows ISP.
} // Ends setResults function.

function setMessage(text, isError = false) {
  if (!messageElement) {
    return;
  }
  messageElement.textContent = text;
  messageElement.classList.toggle("is-error", isError);
}

function setLoading(isLoading) {
  if (!searchButton) {
    return;
  }
  searchButton.disabled = isLoading;
  searchButton.classList.toggle("is-loading", isLoading);
}

//Fetch the API data. Write the fetchIpData function that takes an IP (or nothing) and fetches data from the API.
async function fetchIpData({ ip = "", domain = "" } = {}) { // Fetches IP data using IPify.
  const params = new URLSearchParams({ // Build query string safely.
    apiKey: API_KEY, // API key from IPify.
    ipAddress: ip, // Optional IP address.
    domain // Optional domain.
  }); // Ends query string builder.

  const response = await fetch(`https://geo.ipify.org/api/v2/country,city?${params.toString()}`); // Send request.
  if (!response.ok) { // Check for errors.
    throw new Error("Failed to fetch IP data."); // Throw error for catch block.
  } // Ends response check.

  return response.json(); // Return JSON data.
} // Ends fetchIpData function.

function isIpAddress(value) { // Checks if input is a valid IPv4 address.
  /*
    IPv4 regex interpretation:
    - ^ and $ lock the match to the start/end (no extra text allowed).
    - One octet is matched by: (25[0-5] | 2[0-4]\d | 1\d{2} | [1-9]?\d)
      * 25[0-5]  => 250–255
      * 2[0-4]\d => 200–249
      * 1\d{2}   => 100–199
      * [1-9]?\d => 0–99 (optional leading 1–9, then one digit)
    - (\.octet){3} requires exactly three more ".octet" groups, giving 4 total parts.
    - Result: accepts valid IPv4 like 192.168.0.1 and rejects 256.1.1.1 or 1.1.1.
  */
  const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/; // IPv4 regex: strict 0–255 per octet, four octets total.
  return ipRegex.test(value); // True if valid.
} // Ends isIpAddress function.

function isDomain(value) {
  const domainRegex = /^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;
  return domainRegex.test(value);
}

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem("recentSearches")) || [];
  } catch (error) {
    return [];
  }
}

function saveRecentSearch(value) {
  const recent = getRecentSearches();
  const next = [value, ...recent.filter((item) => item !== value)].slice(0, 5);
  localStorage.setItem("recentSearches", JSON.stringify(next));
  renderRecentSearches(next);
}

function renderRecentSearches(items = getRecentSearches()) {
  if (!recentList) {
    return;
  }
  recentList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-searches__item";
    button.textContent = item;
    button.addEventListener("click", () => {
      ipInput.value = item;
      handleSearch(item);
    });
    li.appendChild(button);
    recentList.appendChild(li);
  });
}

async function handleSearch(value) {
  if (!value) {
    return;
  }
  const isIp = isIpAddress(value);
  const isValidDomain = isDomain(value);
  if (!isIp && !isValidDomain) {
    setMessage("Enter a valid IPv4 address or domain (e.g., 8.8.8.8 or example.com).", true);
    return;
  }

  setMessage("Searching...", false);
  setLoading(true);
  try {
    const data = await fetchIpData(isIp ? { ip: value } : { domain: value });
    setResults(data);
    setMap(data.location.lat, data.location.lng);
    setMessage("Done.", false);
    saveRecentSearch(value);
  } catch (error) {
    console.error(error);
    setMessage("Could not find that IP address or domain.", true);
  } finally {
    setLoading(false);
  }
}

//Listen for form submits. Write the event listener for the form submit that prevents default, reads the input value, calls fetchIpData, and updates the results and map.
form.addEventListener("submit", async (event) => { // Runs when user submits the form.
  event.preventDefault(); // Prevents page refresh.
  const value = ipInput.value.trim(); // Reads input text.
  if (!value) { // If empty, do nothing.
    return; // Exits early if input is blank.
  } // Ends empty input check.
  handleSearch(value);
}); // Ends submit event listener.

//Connect them. Now write the logic that takes that data and plugs it into the HTML (setResults).
async function init() { // Runs once when page loads.
  try { // Try to fetch the user's IP data.
    const data = await fetchIpData(); // Fetches data for the user's current IP.
    setResults(data); // Show results.
    setMap(data.location.lat, data.location.lng); // Center map.
    renderRecentSearches();
    setMessage("Type an IP or domain to search.", false);
  } catch (error) { // Catch any errors on load.
    console.error(error); // Log any error.
  } // Ends try/catch for init.
} // Ends init function.

if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark", savedTheme === "dark");
  themeToggle.textContent = savedTheme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  });
}

init(); // Start the app.



