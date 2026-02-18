import type { FormPage } from '../types';

interface LogicRule {
  targetPageIndex: number;
  matchType: 'AND' | 'OR';
  conditions: Array<{
    triggerId: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: string;
  }>;
}

export function generateFormHTML(formName: string, pages: FormPage[]): string {
  // 1. Serialize logic into a format the JS runtime can read
  // Map page INDEX (0, 1, 2) to its logic rules
  // We use indexes because navigation in the public form is index-based (step 0, step 1)
  const logicMap: Record<number, LogicRule[]> = {};
  
  pages.forEach((page, index) => {
      if (page.logicRules && page.logicRules.length > 0) {
          logicMap[index] = page.logicRules.map(rule => {
              const targetIndex = pages.findIndex(p => p.id === rule.targetPageId);
              return {
                  targetPageIndex: targetIndex,
                  matchType: rule.matchType,
                  conditions: rule.conditions.map(cond => ({
                      triggerId: cond.triggerElementId,
                      operator: cond.operator,
                      value: cond.value
                  }))
              };
          });
      }
  });

  const pageStartIndices: number[] = [];
  let currentIndex = 0;
  pages.forEach(page => {
      pageStartIndices.push(currentIndex);
      currentIndex += (page.elements.length > 0 ? page.elements.length : 1);
  });

  const logicScript = `
    const pageLogic = ${JSON.stringify(logicMap)};
    const pageStartIndices = ${JSON.stringify(pageStartIndices)};
    const totalPages = ${pages.length};
  `;

  // Use the same CSS as the backend template
  const css = `
    /* Mobile-First CSS */
    body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
        background: #f3f4f6; 
        margin: 0; 
        padding: 16px; 
    }
    .container { 
        max-width: 640px; 
        margin: 0 auto; 
        background: white; 
        padding: 24px; 
        border-radius: 12px; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    }
    h1 { 
        margin-top: 0; 
        color: #1f2937; 
        border-bottom: 1px solid #e5e7eb; 
        padding-bottom: 16px; 
        margin-bottom: 24px; 
        font-size: 24px; 
    }
    .form-group { margin-bottom: 24px; }
    label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 16px; }
    .required { color: #dc2626; margin-left: 4px; }
    
    /* Inputs */
    input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea, select {
        width: 100%; 
        padding: 12px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        font-size: 16px; 
        box-sizing: border-box; 
        transition: border-color 0.2s;
        -webkit-appearance: none;
        appearance: none;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    
    /* Video Recorder */
    .video-container { 
        border: 2px dashed #d1d5db; 
        border-radius: 8px; 
        padding: 12px; 
        text-align: center; 
        background: #f9fafb; 
    }
    video { 
        width: 100%; 
        max-height: 400px; 
        border-radius: 6px; 
        background: black; 
        display: none; 
        margin-bottom: 12px; 
        object-fit: cover; 
    }
    .video-btn { 
        background: #dc2626; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 30px; 
        cursor: pointer; 
        display: inline-flex; 
        align-items: center; 
        gap: 8px; 
        font-size: 14px; 
        font-weight: 500;
    }
    .video-btn.stop { background: #374151; }

    /* Star Rating */
    .stars { display: flex; gap: 8px; flex-wrap: wrap; }
    .star { 
        font-size: 32px; 
        cursor: pointer; 
        color: #d1d5db; 
        background: none; 
        border: none; 
        padding: 0; 
        line-height: 1;
    }
    .star.active { color: #facc15; }

    /* Progress Bar */
    .progress-wrapper {
        display: none;
        margin-top: 20px;
        width: 100%;
        background-color: #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
    }
    .progress-bar {
        width: 0%;
        height: 10px;
        background-color: #2563eb;
        transition: width 0.2s;
    }
    .progress-text {
        text-align: center;
        font-size: 14px;
        color: #374151;
        margin-top: 5px;
    }

    /* Multi-Page Navigation */
    .form-step { display: none; animation: fadeIn 0.3s; }
    .form-step.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .btn-group { display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    .btn-primary { 
        background-color: #2563eb; 
        color: white; 
        font-weight: 600; 
        padding: 12px 24px; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 16px; 
        transition: background 0.2s; 
    }
    .btn-primary:hover { background-color: #1d4ed8; }
    .btn-secondary { 
        background-color: #9ca3af; 
        color: white; 
        padding: 12px 24px; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 16px; 
        transition: background 0.2s; 
    }
    .btn-secondary:hover { background-color: #6b7280; }
  `;

  // Render Each Page and its elements
  const pagesHtml = pages.map((page, index) => {
    const elementsHtml = page.elements.map(el => {
      const requiredSpan = el.required ? '<span class="required">*</span>' : '';
      const requiredAttr = el.required ? 'required' : '';
      
      let inputHtml = '';
      
      // Note: We use unique IDs for inputs to match the backend template behavior
      switch (el.type) {
        case 'text':
        case 'email':
        case 'phone': {
          const type = el.type === 'phone' ? 'tel' : el.type;
          inputHtml = `<input type="${type}" name="${el.id}" id="input-${el.id}" placeholder="${el.placeholder || ''}" ${requiredAttr}>`;
          break;
        }
        case 'date':
          inputHtml = `<input type="date" name="${el.id}" id="input-${el.id}" ${requiredAttr}>`;
          break;
        case 'textarea':
          inputHtml = `<textarea name="${el.id}" id="input-${el.id}" rows="4" placeholder="${el.placeholder || ''}" ${requiredAttr}></textarea>`;
          break;
        case 'select': {
          const options = el.options && el.options.length > 0 ? el.options : ["Option 1", "Option 2"];
          inputHtml = `
            <select name="${el.id}" id="input-${el.id}" ${requiredAttr}>
              <option value="" disabled selected>Select an option</option>
              ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>`;
          break;
        }
        case 'stars':
          inputHtml = `
            <div class="stars" id="stars-${el.id}">
              <input type="hidden" name="${el.id}" id="input-${el.id}" ${requiredAttr}>
              <button type="button" class="star" onclick="setRating('${el.id}', 1)">★</button>
              <button type="button" class="star" onclick="setRating('${el.id}', 2)">★</button>
              <button type="button" class="star" onclick="setRating('${el.id}', 3)">★</button>
              <button type="button" class="star" onclick="setRating('${el.id}', 4)">★</button>
              <button type="button" class="star" onclick="setRating('${el.id}', 5)">★</button>
            </div>`;
          break;
        case 'video':
          inputHtml = `
            <div class="video-container" id="video-wrapper-${el.id}">
              <input type="hidden" name="${el.id}" id="input-${el.id}" ${requiredAttr}>
              
              <video id="preview-${el.id}" autoplay muted playsinline></video>
              <video id="playback-${el.id}" controls playsinline></video>
              
              <div style="margin-top: 10px;">
                  <button type="button" id="btn-start-${el.id}" class="video-btn" onclick="startRecording('${el.id}')">
                      <span style="font-size: 18px;">●</span> Start Recording
                  </button>
                  <button type="button" id="btn-stop-${el.id}" class="video-btn stop" onclick="stopRecording('${el.id}')" style="display:none;">
                      ■ Stop Recording
                  </button>
              </div>
              <p id="status-${el.id}" style="font-size: 12px; color: #6b7280; margin-top: 8px;">Ready to record</p>
            </div>`;
          break;
      }
  
      return `
        <div class="form-group">
          <label>${el.label} ${requiredSpan}</label>
          ${inputHtml}
        </div>
      `;
    }).join('');

    return `
      <div class="form-step ${index === 0 ? 'active' : ''}" id="step-${index}">
         <h3 style="margin-bottom: 20px; color: #4b5563; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${page.title} <span style="font-size: 12px; float: right; font-weight: normal;">Step ${index + 1} of ${pages.length}</span>
         </h3>
         ${elementsHtml}
      </div>
    `;
  }).join('');

  const script = `
    let currentStep = 0;
    const steps = document.querySelectorAll('.form-step');
    const totalSteps = ${pages.length};
    
    // Injected Logic Map
    ${logicScript}

    function showStep(n) {
        // If no steps (empty form), do nothing to prevent errors
        if (totalSteps === 0) return;

        steps.forEach((step, index) => {
            step.classList.toggle('active', index === n);
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) prevBtn.style.display = n === 0 ? 'none' : 'inline-block';
        
        if (n === totalSteps - 1) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        } else {
            if (nextBtn) {
                nextBtn.style.display = 'inline-block';
                nextBtn.innerHTML = "Next";
            }
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    function changeStep(n) {
        // Validation (only if moving forward)
        if (n === 1 && !validateStep(currentStep)) return;

        // --- LOGIC EVALUATION (AND/OR) ---
        if (n === 1 && pageLogic[currentStep]) {
            const rules = pageLogic[currentStep];
            let jumpTargetPage = -1;

            for (const rule of rules) {
                // Rule contains conditions[] and matchType (AND/OR)
                let conditionsMet = 0;
                let conditionsTotal = rule.conditions.length;

                for (const cond of rule.conditions) {
                    const input = document.getElementById('input-' + cond.triggerId);
                    if (!input) continue; // Should not happen
                    
                    const val = input.value;
                    const compareVal = cond.value;
                    let match = false;

                    if (cond.operator === 'equals') match = val == compareVal;
                    else if (cond.operator === 'not_equals') match = val != compareVal;
                    else if (cond.operator === 'greater_than') match = parseFloat(val) > parseFloat(compareVal);
                    else if (cond.operator === 'less_than') match = parseFloat(val) < parseFloat(compareVal);

                    if (match) conditionsMet++;
                }

                let ruleMatched = false;
                if (rule.matchType === 'AND') {
                    ruleMatched = conditionsMet === conditionsTotal;
                } else { // OR
                    ruleMatched = conditionsMet > 0;
                }

                if (ruleMatched && rule.targetPageIndex !== -1) {
                    jumpTargetPage = rule.targetPageIndex;
                    break; // First rule wins
                }
            }

            if (jumpTargetPage !== -1) {
                currentStep = jumpTargetPage;
                showStep(currentStep);
                return;
            }
        }

        currentStep += n;
        showStep(currentStep);
    }

    function validateStep(n) {
        if (totalSteps === 0) return true;
        const activeStep = steps[n];
        if (!activeStep) return true;

        const inputs = activeStep.querySelectorAll('input, select, textarea');
        let valid = true;
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                input.style.borderColor = "red";
                // Shake effect could be added here
                valid = false;
            } else {
                input.style.borderColor = "#d1d5db";
            }
        });
        return valid;
    }

    function setRating(id, value) {
        document.getElementById('input-' + id).value = value;
        const container = document.getElementById('stars-' + id);
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < value);
        });
    }

    // --- VIDEO RECORDING LOGIC MOCK ---
    // Since this is a preview, we mock the recording functionality
    let recorders = {};
    let chunks = {};
    let finalBlobs = {}; 
    let recordedTypes = {}; 

    async function startRecording(id) {
        try {
            finalBlobs[id] = null;
            chunks[id] = [];

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, 
                audio: true 
            });
            
            const preview = document.getElementById('preview-' + id);
            preview.style.display = 'block';
            document.getElementById('playback-' + id).style.display = 'none';
            preview.srcObject = stream;

            // Mock implementation for preview
            alert("This is a preview. Recording functionality is simulated.");
            
            // In a real implementation, we would set up MediaRecorder here
            
        } catch (err) {
            alert("Could not access camera. Ensure you have granted permissions.");
            console.error(err);
        }
    }

    function stopRecording(id) {
       // Mock implementation
       const startBtn = document.getElementById('btn-start-' + id);
       startBtn.style.display = 'inline-flex';
       startBtn.innerHTML = '↺ Retake';
       document.getElementById('btn-stop-' + id).style.display = 'none';
       document.getElementById('status-' + id).innerText = "Video captured (Mock)!";
       document.getElementById('input-' + id).value = "[VIDEO_ATTACHED]";
    }

    document.getElementById('mainForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert("This is just a preview. Form submission is disabled.");
    });
    
    // Init
    showStep(0);
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formName}</title>
        <style>${css}</style>
    </head>
    <body>
    <div class="container">
        <h1>${formName || 'Untitled Form'}</h1>
        <form id="mainForm">
            ${pagesHtml}
            
            <!-- Progress Bar -->
            <div class="progress-wrapper" id="uploadProgress">
                <div class="progress-bar" id="progressBar"></div>
                <p class="progress-text" id="progressText">Uploading: 0%</p>
            </div>

            <div class="btn-group">
                <button type="button" id="prevBtn" class="btn-secondary" onclick="changeStep(-1)">Back</button>
                <button type="button" id="nextBtn" class="btn-primary" onclick="changeStep(1)">Next</button>
                <button type="submit" id="submitBtn" class="btn-primary" style="display:none;">Submit Form</button>
            </div>
        </form>
    </div>
    <script>${script}</script>
    </body>
    </html>
  `;
}