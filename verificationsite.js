const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJdFwqabVDpYkzwC2o37Ut_VNq19xLzdQt13Kw9yWW3JLLqf5mgVLtx-2JS7hPKW1Q5Q/exec";

let currentRowIndex = null; // to know which row we're editing

const replacements = {
  desc: "description of pain",
  excfemale: "exclusively affects females",
  // add more mappings here
};

function replaceKeys(obj) {
  const newObj = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = replacements[key.toLowerCase()] || key;
    newObj[newKey] = val;
  }
  return newObj;
}

function handleData(data) {
  const form = document.getElementById("dataForm");

  if (data.error) {
    form.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    return;
  }

  currentRowIndex = data._rowIndex || null; // row number to send back on submit

  // Apply replacements to keys for friendlier labels
  const displayData = replaceKeys(data);

  // Build inputs from data keys and values
  let html = "";
  for (const [key, value] of Object.entries(displayData)) {
    if (key === "_rowIndex") continue; // skip special key if any
    html += `
      <label style="display:block; margin-top: 8px;">
        <strong>${key}:</strong><br>
        <input type="text" name="${key}" value="${value || ''}" style="width: 100%; padding: 6px; box-sizing: border-box;">
      </label>
    `;
  }

  form.innerHTML = html + `<button type="submit" style="margin-top: 15px; padding: 8px 16px;">Save Changes</button>`;
}

function loadRandomRow() {
  // Clear old script tag if any (to avoid duplicates)
  const oldScript = document.getElementById('jsonpScript');
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = 'jsonpScript';
  script.src = `${APPSCRIPT_URL}?callback=handleData`;
  document.body.appendChild(script);
}

// Handle form submission
document.getElementById("dataForm").addEventListener("submit", function(e) {
  e.preventDefault();

  if (currentRowIndex === null) {
    alert("Row information missing; cannot save.");
    return;
  }

  const formData = new FormData(this);
  const dataObj = { rowIndex: currentRowIndex };

  // Reverse replacements: convert friendly keys back to original keys for sending
  // We'll build a reverse mapping here:
  const reverseReplacements = {};
  for (const [k, v] of Object.entries(replacements)) {
    reverseReplacements[v.toLowerCase()] = k;
  }

  for (const [key, val] of formData.entries()) {
    const originalKey = reverseReplacements[key.toLowerCase()] || key;
    dataObj[originalKey] = val;
  }

  // Send POST request to Apps Script
  fetch(APPSCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataObj)
  })
  .then(res => res.json())
  .then(resp => {
    if (resp.success) {
      alert("Data saved successfully!");
      loadRandomRow(); // reload new random data
    } else {
      alert("Error saving data: " + (resp.error || "Unknown error"));
    }
  })
  .catch(err => {
    alert("Network or server error: " + err.message);
  });
});

document.addEventListener("DOMContentLoaded", loadRandomRow);