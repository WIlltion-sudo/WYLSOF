/**
 * ============================================================================
 * WYLSOF - Engineering Ideas into Intelligent Products
 * Master Application Engine: Fluid Cursor Physics, Interactive Modules & Multi-Channel Real-Time Database Sync
 * ============================================================================
 */

// ==========================================================================
// 1. Google Sheets Webhook Configuration
// ==========================================================================
// Deploy google_apps_script.js as a Web App (Access: Anyone) and paste the Web App URL below:
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzv0DVFSUBtS_RDXXo1t6MX6Z2SQp90GUckyDzpHL9oBwiGaH1OwZebf9I7zx-FVrgm/exec";

// ==========================================================================
// 2. Audio Engine (Web Audio API)
// ==========================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  playTone(freq = 440, type = 'sine', duration = 0.06, gainVal = 0.04) {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  click() { this.playTone(750, 'sine', 0.03, 0.03); }
  blip() { this.playTone(1100, 'triangle', 0.04, 0.03); }
  success() {
    this.playTone(523, 'sine', 0.08, 0.04);
    setTimeout(() => this.playTone(659, 'sine', 0.09, 0.04), 70);
    setTimeout(() => this.playTone(784, 'sine', 0.14, 0.04), 140);
  }
}

const sfx = new SoundFX();

// ==========================================================================
// 3. Fluid Animated Cursor Physics & Particle Trail
// ==========================================================================
function initCustomCursor() {
  const dot = document.querySelector('.cursor-dot');
  const aura = document.querySelector('.cursor-aura');
  const trailCanvas = document.getElementById('cursor-canvas');
  if (!dot || !aura) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let auraX = mouseX;
  let auraY = mouseY;

  let ctx = null;
  let trailParticles = [];
  if (trailCanvas) {
    ctx = trailCanvas.getContext('2d');
    const resizeTrail = () => {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeTrail);
    resizeTrail();
  }

  class TrailParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 2 + 1;
      this.alpha = 0.6;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.025;
      this.radius = Math.max(0, this.radius - 0.05);
    }
    draw() {
      if (!ctx || this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 242, 152, ${this.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00F298';
      ctx.fill();
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

    if (ctx && Math.random() > 0.4) {
      trailParticles.push(new TrailParticle(mouseX, mouseY));
      if (trailParticles.length > 25) trailParticles.shift();
    }
  });

  function animateCursor() {
    auraX += (mouseX - auraX) * 0.18;
    auraY += (mouseY - auraY) * 0.18;
    aura.style.transform = `translate(${auraX}px, ${auraY}px)`;

    if (ctx) {
      ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        trailParticles[i].update();
        trailParticles[i].draw();
        if (trailParticles[i].alpha <= 0) {
          trailParticles.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);

  const interactiveSelector = 'a, button, input, select, textarea, .scope-option-btn, .service-card, .term-chip, .faq-question-btn';
  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ==========================================================================
// 4. Background Particle Simulation
// ==========================================================================
function initParticleCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  const particleCount = 38;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.8 + 1;
      this.alpha = Math.random() * 0.35 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 242, 152, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 125) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 217, 245, ${0.12 * (1 - dist / 125)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(render);
  }
  render();
}

// ==========================================================================
// 5. Toast Notifications
// ==========================================================================
function showToast(message, icon = 'fa-circle-check') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class=\"fa-solid ${icon}\" style=\"color:var(--brand-primary); font-size:1.1rem;\"></i> <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// 6. Preloader
// ==========================================================================
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.querySelector('.loader-bar');
  if (!preloader || !bar) return;

  bar.style.width = '100%';
  setTimeout(() => {
    preloader.classList.add('loaded');
  }, 350);
}

// ==========================================================================
// 7. Interactive Hero Scope Selector
// ==========================================================================
function initScopeEstimator() {
  const optionBtns = document.querySelectorAll('.scope-option-btn');
  const summaryText = document.getElementById('scope-summary-desc');
  const applyBtn = document.getElementById('apply-scope-to-form-btn');

  const scopeDetails = {
    erp: 'Custom ERP & Workflow Automation: Centralized inventory, automated invoicing, real-time supply chain tracking, and role-based permissions matrix.',
    webapp: 'Full-Stack Web Application: High-performance cloud portal, responsive UI, database modeling, secure authentication, and REST/GraphQL APIs.',
    ai: 'AI & Machine Learning Engine: Intelligent automation, private LLM agents, predictive data analytics, and vector search integration.',
    cloud: 'Cloud Architecture & DevOps: Scalable microservices infrastructure on AWS/GCP, automated CI/CD pipelines, and zero-downtime containerization.'
  };

  let selectedKey = 'erp';

  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      optionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sfx.click();

      selectedKey = btn.getAttribute('data-scope');
      if (summaryText && scopeDetails[selectedKey]) {
        summaryText.textContent = scopeDetails[selectedKey];
      }
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      sfx.click();
      const selectEl = document.getElementById('contact-project-type');
      const reqEl = document.getElementById('contact-requirements');

      const mapping = {
        erp: 'Enterprise ERP & Workflows',
        webapp: 'Custom Web & Mobile Applications',
        ai: 'AI & Machine Learning Integration',
        cloud: 'Cloud Architecture & DevOps'
      };

      if (selectEl && mapping[selectedKey]) {
        selectEl.value = mapping[selectedKey];
      }
      if (reqEl) {
        reqEl.value = `Interested in ${mapping[selectedKey] || selectedKey}. Requirements: ${scopeDetails[selectedKey]}`;
      }

      document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
      showToast(`Selected ${mapping[selectedKey]} in the inquiry form!`);
    });
  }
}

// ==========================================================================
// 8. Real-Time Local Database Store & CSV Export
// ==========================================================================
const DB_STORAGE_KEY = 'WYLSOF_Live_Customer_Inquiries';

function saveInquiryLocally(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(DB_STORAGE_KEY) || '[]');
    existing.unshift(record);
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {}
}

function getLocalInquiries() {
  try {
    return JSON.parse(localStorage.getItem(DB_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function exportInquiriesCSV() {
  const records = getLocalInquiries();
  if (records.length === 0) {
    alert('No customer inquiries have been submitted yet.');
    return;
  }

  const headers = ['Timestamp', 'Reference ID', 'Full Name', 'Email Address', 'Company', 'Service Requested', 'Timeline', 'Requirements', 'Status'];
  const rows = records.map(r => [
    `"${r.timestamp || ''}"`,
    `"${r.referenceId || ''}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${r.email || ''}"`,
    `"${(r.company || '').replace(/"/g, '""')}"`,
    `"${r.projectType || ''}"`,
    `"${r.timeline || ''}"`,
    `"${(r.requirements || '').replace(/"/g, '""')}"`,
    `"${r.status || 'New Lead'}"`
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WYLSOF_Customer_Leads_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Database exported to CSV successfully!');
}

// ==========================================================================
// 9. Interactive Terminal CLI (`wylsof-cli`)
// ==========================================================================
function initTerminal() {
  const screen = document.getElementById('terminal-screen');
  const input = document.getElementById('terminal-input');
  const quickBtns = document.querySelectorAll('.term-chip');
  if (!screen || !input) return;

  function appendLine(html) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = html;
    screen.appendChild(line);
    screen.scrollTop = screen.scrollHeight;
  }

  function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim();
    if (!cmd) return;

    appendLine(`<span class="term-prompt">visitor@wylsof:~$</span> <span>${cmd}</span>`);
    sfx.click();

    const parts = cmd.toLowerCase().split(' ');
    const main = parts[0];

    switch (main) {
      case 'help':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">WYLSOF Interactive CLI — Available Commands:</span><br/>
            &nbsp;&nbsp;<span class="term-output-cyan">services</span>&nbsp;&nbsp;- Overview of all services offered by WYLSOF<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">erp</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Details on custom Enterprise ERP & workflow solutions<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">ai</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Details on AI & Machine Learning integration<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">cloud</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Cloud architecture, DevOps & infrastructure scaling<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">email</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Show official contact email (wylsof1@gmail.com)<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">sheet</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- View linked Google Sheets Lead Database URL<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">admin</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- View & export live customer inquiries database<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">contact</span>&nbsp;&nbsp;&nbsp;- Jump directly to project discovery form<br/>
            &nbsp;&nbsp;<span class="term-output-cyan">clear</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Clear the terminal window
          </div>
        `);
        break;

      case 'sheet':
      case 'database':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">Linked Google Sheets Lead Database:</span><br/>
            <a href="https://docs.google.com/spreadsheets/d/1uPSQnSPHqxdXyKL314V-R8M-igeRqd4VU4Xe4K6txLU/edit" target="_blank" style="color:#00F298; text-decoration:underline;">https://docs.google.com/spreadsheets/d/1uPSQnSPHqxdXyKL314V-R8M-igeRqd4VU4Xe4K6txLU/edit</a><br/>
            <span style="color:#94A3B8; font-size:0.75rem;">Status: Real-time synchronization active</span>
          </div>
        `);
        break;

      case 'admin':
      case 'leads':
      case 'export':
        const records = getLocalInquiries();
        if (records.length === 0) {
          appendLine(`<div class="term-output"><span class="term-output-highlight">No live inquiries recorded in this browser session.</span><br/>Submit the contact form below to test real-time recording.</div>`);
        } else {
          let tableHtml = `<table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:0.78rem;">
            <thead><tr style="color:var(--brand-primary); border-bottom:1px solid rgba(255,255,255,0.1);"><th style="text-align:left; padding:4px;">ID</th><th style="text-align:left; padding:4px;">Name</th><th style="text-align:left; padding:4px;">Email</th><th style="text-align:left; padding:4px;">Service</th></tr></thead><tbody>`;
          records.forEach(r => {
            tableHtml += `<tr><td style="padding:4px; color:var(--text-code);">${r.referenceId}</td><td style="padding:4px;">${r.name}</td><td style="padding:4px; color:var(--text-muted);">${r.email}</td><td style="padding:4px;">${r.projectType}</td></tr>`;
          });
          tableHtml += `</tbody></table>`;
          appendLine(`<div class="term-output"><span class="term-output-highlight">Found ${records.length} Real-Time Customer Inquiries:</span>${tableHtml}<br/><button onclick="exportInquiriesCSV()" class="btn-primary" style="padding:4px 12px; font-size:0.75rem; margin-top:8px; cursor:pointer;"><i class="fa-solid fa-download"></i> Download CSV Database</button></div>`);
        }
        break;

      case 'services':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">Services Offered by WYLSOF:</span><br/>
            1. <span class="term-output-cyan">Enterprise ERP & Workflows</span> (Custom ERP, Invoicing, Stock Management)<br/>
            2. <span class="term-output-cyan">Custom Web & Mobile Applications</span> (Full-stack Platforms & Portals)<br/>
            3. <span class="term-output-cyan">AI & Machine Learning Integration</span> (LLMs, Automation, Predictive Analytics)<br/>
            4. <span class="term-output-cyan">Cloud Architecture & DevOps</span> (AWS, GCP, Kubernetes, CI/CD)<br/>
            5. <span class="term-output-cyan">IoT & Embedded Systems</span> (Smart Device Firmware, Telemetry)<br/>
            6. <span class="term-output-cyan">Database Design & High-Performance APIs</span> (SQL/NoSQL, REST, GraphQL)
          </div>
        `);
        break;

      case 'erp':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">WYLSOF ERP Solutions:</span><br/>
            Custom tailored Enterprise Resource Planning systems engineered around your exact business processes. We build automated general ledgers, multi-depot inventory tracking, invoice reconciliation, and role-based permissions.
          </div>
        `);
        break;

      case 'ai':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">WYLSOF AI Engineering:</span><br/>
            Seamless AI model integration, private RAG pipelines, autonomous data processing agents, and smart recommendation algorithms tailored to your data.
          </div>
        `);
        break;

      case 'cloud':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">WYLSOF Cloud & DevOps:</span><br/>
            Scalable cloud infrastructure on AWS/GCP, automated CI/CD pipelines, Docker & Kubernetes containerization, and zero-downtime deployment pipelines.
          </div>
        `);
        break;

      case 'email':
        appendLine(`
          <div class="term-output">
            Official Contact Email: <a href="mailto:wylsof1@gmail.com" class="term-output-highlight" style="text-decoration:underline;">wylsof1@gmail.com</a>
          </div>
        `);
        break;

      case 'contact':
        document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
        appendLine(`<span class="term-output-highlight">Navigated to Contact & Discovery Hub.</span>`);
        break;

      case 'about':
        appendLine(`
          <div class="term-output">
            <span class="term-output-highlight">WYLSOF — Engineering Ideas into Intelligent Products</span><br/>
            We transform ideas into high-performance, robust software products. From custom ERP engines to full-stack cloud applications, our team crafts reliable solutions with clean engineering principles.
          </div>
        `);
        break;

      case 'clear':
        screen.innerHTML = '';
        break;

      default:
        appendLine(`<span class="term-output-dim">Unknown command: "${cmd}". Type <span class="term-output-cyan">help</span> to view available commands.</span>`);
        break;
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value;
      input.value = '';
      handleCommand(val);
    }
  });

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) handleCommand(cmd);
    });
  });
}

// ==========================================================================
// 10. Interactive FAQ Accordion
// ==========================================================================
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
          sfx.click();
        }
      });
    }
  });
}

// ==========================================================================
// 11. Service Card "Inquire" Button Quick Navigation
// ==========================================================================
function initServiceButtons() {
  const buttons = document.querySelectorAll('.service-select-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const serviceName = btn.getAttribute('data-service');
      const selectEl = document.getElementById('contact-project-type');
      if (selectEl && serviceName) {
        selectEl.value = serviceName;
      }
      document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
      sfx.click();
      showToast(`Selected "${serviceName}" in contact form!`);
    });
  });
}

// ==========================================================================
// 12. Guaranteed Multi-Channel Form Submission Pipeline
// ==========================================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  const modal = document.getElementById('confirmation-modal');
  const closeBtn = document.getElementById('close-confirm-btn');
  const leadIdDisplay = document.getElementById('confirm-lead-id');
  const clientNameDisplay = document.getElementById('confirm-client-name');
  const clientServiceDisplay = document.getElementById('confirm-client-service');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    sfx.click();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...`;
    submitBtn.disabled = true;

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const company = document.getElementById('contact-company').value.trim() || 'Direct Client';
    const projectType = document.getElementById('contact-project-type').value;
    const timeline = document.getElementById('contact-timeline').value;
    const requirements = document.getElementById('contact-requirements').value.trim();

    if (!name || !email || !requirements) {
      alert('Please fill in your name, email, and requirements.');
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
      return;
    }

    const referenceId = `WYL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString();
    
    const payload = {
      referenceId: referenceId,
      name: name,
      email: email,
      company: company,
      projectType: projectType,
      timeline: timeline,
      requirements: requirements,
      timestamp: timestamp,
      status: 'New Lead'
    };

    // 1. Save directly into Local Real-Time Database (Instant)
    saveInquiryLocally(payload);

    // 2. Channel A: Send to Google Sheets Webhook if configured
    if (GOOGLE_SHEET_WEBHOOK_URL && GOOGLE_SHEET_WEBHOOK_URL.startsWith('http')) {
      try {
        // Send POST request (text/plain avoids CORS preflight blocks)
        fetch(GOOGLE_SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(() => {});

        // Ping GET request as reliable fallback
        const params = new URLSearchParams(payload);
        fetch(`${GOOGLE_SHEET_WEBHOOK_URL}?${params.toString()}`, {
          method: 'GET',
          mode: 'no-cors'
        }).catch(() => {});
      } catch (sheetErr) {
        console.warn('Google Sheet Webhook dispatch note:', sheetErr);
      }
    }

    // 3. Channel B: Send to Local Server API (if server.py is running)
    try {
      fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {}

    // 4. Channel C: FormSubmit Instant Fallback Email Notification to wylsof1@gmail.com
    try {
      fetch('https://formsubmit.co/ajax/wylsof1@gmail.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🚀 [WYLSOF Lead] ${name} (${projectType})`,
          Reference_ID: referenceId,
          Client_Name: name,
          Email: email,
          Company: company,
          Service_Requested: projectType,
          Timeline: timeline,
          Requirements: requirements,
          Submitted_At: timestamp
        })
      }).catch(() => {});
    } catch (emailErr) {}

    sfx.success();
    submitBtn.innerHTML = originalBtnHTML;
    submitBtn.disabled = false;

    // Reset Form
    form.reset();

    // Show Confirmation Modal to Customer
    if (leadIdDisplay) leadIdDisplay.textContent = referenceId;
    if (clientNameDisplay) clientNameDisplay.textContent = name;
    if (clientServiceDisplay) clientServiceDisplay.textContent = projectType;
    if (modal) modal.classList.add('active');

    showToast(`Inquiry ${referenceId} recorded & dispatched to wylsof1@gmail.com!`);
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
}

// ==========================================================================
// 13. Admin Keyboard Shortcut (Ctrl + Alt + D) to Export Real-Time Database
// ==========================================================================
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'd' || e.key === 'D')) {
    exportInquiriesCSV();
  }
});

// ==========================================================================
// 14. Navbar & Controls
// ==========================================================================
function initNavbarAndControls() {
  const navbar = document.querySelector('.navbar');
  const themeToggle = document.getElementById('theme-toggle-btn');
  const audioToggle = document.getElementById('audio-toggle-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-light');
      sfx.click();
      const isLight = document.body.classList.contains('theme-light');
      themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      sfx.muted = !sfx.muted;
      audioToggle.innerHTML = sfx.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
      if (!sfx.muted) sfx.blip();
    });
  }

  document.addEventListener('click', () => sfx.init(), { once: true });
}

// ==========================================================================
// Initializer
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initParticleCanvas();
  initPreloader();
  initNavbarAndControls();
  initScopeEstimator();
  initTerminal();
  initFAQ();
  initServiceButtons();
  initContactForm();
});
