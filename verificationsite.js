const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJdFwqabVDpYkzwC2o37Ut_VNq19xLzdQt13Kw9yWW3JLLqf5mgVLtx-2JS7hPKW1Q5Q/exec";

// JSONP callback function
function handleData(data) {
  const container = document.getElementById("dataContainer");
  
  if (data.error) {
    container.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    return;
  }

  // Build HTML from the returned object
  let html = "";
  for (const [key, value] of Object.entries(data)) {
    html += `<div class="data-item"><strong>${key}:</strong> ${value}</div>`;
  }
  container.innerHTML = html;
}

// Dynamically create a <script> tag to load JSONP
function loadRandomRow() {
  const script = document.createElement("script");
  script.src = `${APPSCRIPT_URL}?callback=handleData`;
  document.body.appendChild(script);
}

// Load data on page load
document.addEventListener("DOMContentLoaded", loadRandomRow);