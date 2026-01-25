import type { FormPage } from '../types';

export function generateFormHTML(formName: string, pages: FormPage[]): string {
  const css = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 640px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    h1 { margin-top: 0; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; font-size: 24px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 14px; }
    .required { color: #dc2626; margin-left: 4px; }
    input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea, select {
        width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
    button {
        background-color: #2563eb; color: white; font-weight: 600; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: background 0.2s;
    }
    button:hover { background-color: #1d4ed8; }
    button.secondary { background-color: #9ca3af; }
    button.secondary:hover { background-color: #6b7280; }
    
    .form-step { display: none; animation: fadeIn 0.3s; }
    .form-step.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .btn-group { display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    
    .stars { display: flex; gap: 5px; }
    .star { font-size: 24px; cursor: pointer; color: #d1d5db; transition: color 0.2s; background: none; border: none; padding: 0; }
    .star.active { color: #facc15; }

    .video-container { border: 2px dashed #d1d5db; border-radius: 8px; padding: 10px; text-align: center; background: #f9fafb; }
    .video-btn { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
  `;

  // Render Each Page and its elements
  const pagesHtml = pages.map((page, index) => {
    const elementsHtml = page.elements.map(el => {
      const requiredSpan = el.required ? '<span class="required">*</span>' : '';
      const requiredAttr = el.required ? 'required' : '';
      
      let inputHtml = '';
      
      switch (el.type) {
        case 'text':
        case 'email':
        case 'phone': {
          const type = el.type === 'phone' ? 'tel' : el.type;
          inputHtml = `<input type="${type}" name="${el.id}" placeholder="${el.placeholder || ''}" ${requiredAttr}>`;
          break;
        }
        case 'date':
          inputHtml = `<input type="date" name="${el.id}" ${requiredAttr}>`;
          break;
        case 'textarea':
          inputHtml = `<textarea name="${el.id}" rows="4" placeholder="${el.placeholder || ''}" ${requiredAttr}></textarea>`;
          break;
        case 'select':
          inputHtml = `
            <select name="${el.id}" ${requiredAttr}>
              <option value="" disabled selected>Select an option</option>
              <option value="Option 1">Option 1</option>
              <option value="Option 2">Option 2</option>
            </select>`;
          break;
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
            <div class="video-container">
              <input type="hidden" name="${el.id}" id="input-${el.id}" ${requiredAttr}>
              <p style="padding: 20px; color: #6b7280;">Video Recorder Preview</p>
              <button type="button" class="video-btn" onclick="alert('Disabled in preview')">Start Recording</button>
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

    function showStep(n) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === n);
        });
        
        document.getElementById('prevBtn').style.display = n === 0 ? 'none' : 'inline-block';
        
        if (n === totalSteps - 1) {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'inline-block';
        } else {
            document.getElementById('nextBtn').style.display = 'inline-block';
            document.getElementById('submitBtn').style.display = 'none';
        }
    }

    function changeStep(n) {
        currentStep += n;
        showStep(currentStep);
    }

    function setRating(id, value) {
        document.getElementById('input-' + id).value = value;
        const container = document.getElementById('stars-' + id);
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < value);
        });
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
            
            <div class="btn-group">
                <button type="button" id="prevBtn" class="secondary" onclick="changeStep(-1)">Back</button>
                <button type="button" id="nextBtn" onclick="changeStep(1)">Next</button>
                <button type="submit" id="submitBtn" style="display:none;">Submit Form</button>
            </div>
        </form>
    </div>
    <script>${script}</script>
    </body>
    </html>
  `;
}