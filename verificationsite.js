const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJdFwqabVDpYkzwC2o37Ut_VNq19xLzdQt13Kw9yWW3JLLqf5mgVLtx-2JS7hPKW1Q5Q/exec";

let currentRowIndex = null; // to know which row we're editing

const readOnlyFields = new Set([
  'diagnosis',
  'author'
]);

const replacements = {
  desc: "Description of Pain",
  sweldisc: "Swelling, Discolouration, or Bruising"
  // add more mappings here
};

const fieldHints = {
  age: "Options: Babies/Toddlers/Children , Adolescents/Young Adults , 25-45 year olds , Middle Aged , Seniors , All of the Above",
  sex: "Options: Exclusively Females , Mostly Females , Exclusively Males , Mostly Males , Both",
  "Swelling, Discolouration, or Bruising": "Options: Swelling , Discolouration , Bruising , None of the Above , All of the Above",
  "Description of Pain": "Options: Radiating , Tingling , Throbbing , Burning , Stinging , Crushing , Aching/Dull , Sharp/Shooting , Stiff/Tight , None of the Above , All of the Above",
  severity: "Options: Severe (>7/10) , Moderate (4-6/10) , Mild (1-3/10) , None",
  onset: "Options: From Injury , Hereditary , Congenital , Spontaneously , Longitudinal (over a period of time) , None of the Above",
  frequency: "Options: Constant , Intermittent , Conditional , None of the Above, All of the Above",
};

// normalized lookup (all lowercase + trim) — use this when rendering hints
const hintLookup = Object.fromEntries(
  Object.entries(fieldHints).map(([k, v]) => [k.toLowerCase().trim(), v])
);

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
    
    const isReadOnly = readOnlyFields.has(key.toLowerCase());

    html += `
        <label style="display:block; margin-top: 8px;">
            <strong>${key}:</strong><br>
            <textarea 
            name="${key}" 
            style="width: 100%; padding: 6px; box-sizing: border-box; ${isReadOnly ? 'background:#eee; color:#555;' : ''}" 
            rows="3"
            ${isReadOnly ? 'readonly' : ''}
            >${value || ''}</textarea>
            ${hintLookup[key.toLowerCase().trim()] 
        ? `<div style="font-size: 0.85em; font-style: italic; color: #666; margin-top:6px;">
            ${hintLookup[key.toLowerCase().trim()]}
            </div>`
        : ''}
        </label>
        `;
  }

  // Add physician name input AFTER the loop, just once
  html += `
    <label style="display:block; margin-top: 16px;">
      <strong>Physician Name:</strong><br>
      <textarea name="physicianName" rows="1" style="width: 100%; padding: 6px; box-sizing: border-box;" required></textarea>
    </label>
    <button type="submit" style="margin-top: 15px; padding: 8px 16px;">Save Changes</button>
  `;

  form.innerHTML = html;
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

  // Reverse replacements map for keys
  const reverseReplacements = {};
  for (const [k, v] of Object.entries(replacements)) {
    reverseReplacements[v.toLowerCase()] = k;
  }

  // Get physician name first
  const physicianName = formData.get("physicianName") || "";

  // Put physician name in column 1 key — assuming that key is "diagnosis" in your sheet
  // (Adjust if your sheet uses another column header for col 1)
  dataObj["physician"] = physicianName;

  // Now add other form entries except physicianName itself
  for (const [key, val] of formData.entries()) {
    if (key === "physicianName") continue; // skip because we already handled it

    // Convert friendly key back to original key
    const originalKey = reverseReplacements[key.toLowerCase()] || key;

    dataObj[originalKey] = val;
  }

  saveDataJSONP(dataObj);
});

document.addEventListener("DOMContentLoaded", loadRandomRow);


function saveDataJSONP(dataObj) {
  const callbackName = 'saveCallback_' + Math.random().toString(36).substring(2, 15);

  window[callbackName] = function(response) {
    if (response.success) {
      alert("Data saved successfully!");
      loadRandomRow();
    } else {
      alert("Error saving data: " + (response.error || "Unknown error"));
    }
    // cleanup
    delete window[callbackName];
    document.getElementById(callbackName)?.remove();
  };

  const params = new URLSearchParams();
  params.set('action', 'save');
  params.set('callback', callbackName);
  for (const [k, v] of Object.entries(dataObj)) {
    params.set(k, v);
  }

  const script = document.createElement('script');
  script.src = APPSCRIPT_URL + '?' + params.toString();
  script.id = callbackName;
  document.body.appendChild(script);
}