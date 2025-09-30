(function(){
  "use strict";

  // Catch any uncaught errors early
  window.addEventListener("error", e => {
    console.error("[UNCAUGHT ERROR]", e.message, "at", e.filename+":"+e.lineno+":"+e.colno, e.error);
  });
  window.addEventListener("unhandledrejection", e => {
    console.error("[UNHANDLED PROMISE REJECTION]", e.reason);
  });
  console.log("[BOOT] script starting");

  // === CONFIG ===
  const TEST_MODE = false; // Set to false for production
  const ENDPOINT = "https://09yjxw3hyl.execute-api.us-east-1.amazonaws.com/prod/submit"; // <-- replace me
  const DONATION_URL = "https://www.paypal.com/donate/?hosted_button_id=C57QX2ZRZNE4S";
  const CAL_LINK = "https://calendly.com/inquiries-janssen/30min";

  // === ELEMENTS ===
  const elChat     = document.getElementById('ai4g-chat');
  const elBody     = document.getElementById('ai4g-body');
  const elClose    = document.getElementById('ai4g-close');
  const elLauncher = document.getElementById('ai4g-chat-launcher');

  // === STATE ===
  const state = { branch: null, selections: { roles: [], partnerTypes: [] } };

  // === HELPERS ===
  const html = (s)=>{ const d=document.createElement('div'); d.innerHTML=s; return d; };
  const clear= ()=> elBody.innerHTML='';
  const add  = (node)=>{ elBody.append(node); elBody.scrollTop = elBody.scrollHeight; };
  const wait = (ms)=> new Promise(r=>setTimeout(r,ms));
  const typing = async(ms=500)=>{ const t=html(`<div class="ai4g-typing"><span></span><span></span><span></span></div>`); add(t); await wait(ms); t.remove(); };
  const setProgress=(pct)=>{ let bar=document.getElementById('ai4g-progress-bar');
    if(!bar){ const wrap=html(`<div class="ai4g-progress"><div id="ai4g-progress-bar"></div></div>`); elBody.prepend(wrap); bar=wrap.querySelector('div'); }
    bar.style.width = Math.max(0,Math.min(100,pct))+'%';
  };

  async function savePayload(payload){
    const merged = {
      ts: new Date().toISOString(),
      segment: state.branch,
      ...state.selections,
      ...payload
    };

    if (TEST_MODE){
      const key="ai4g_demo_submissions";
      const existing=JSON.parse(localStorage.getItem(key)||"[]");
      existing.push(merged);
      localStorage.setItem(key, JSON.stringify(existing));
      await wait(300);
      return true;
    } else {
      try{
        console.log('[API] Sending payload:', merged);
        const response = await fetch(ENDPOINT, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(merged)
        });
        console.log('[API] Status:', response.status);
        if (response.ok) {
          const result = await response.json().catch(()=> ({}));
          console.log('[API] Success:', result);
          return true;
        } else {
          console.error('[API] Error:', response.status, response.statusText);
          return false;
        }
      } catch(e) {
        console.error('[API] Network error:', e);
        return false;
      }
    }
  }

  // === OPTIONS ===
  const VOLUNTEER_ROLES = [
    "Brand Builders","Tech & Cloud Engineers","Fundraising Catalysts","Content Creators & Podcasters",
    "Social Media Amplifiers","Operations & Finance Stewards","Local Field Coordinators (Zambia)",
    "Partnership Scouts","Impact Analysts"
  ];
  const PARTNER_TYPES = [
    "Impact Funders & Social Investors","Cloud & AI Technology Partners","Microfinance & Economic Dev. Partners",
    "Training & Educational Institutions","Media & Influencer Networks","Faith-Based & Community Organizations",
    "Global & Regional NGOs","E-Commerce & Market Access Platforms"
  ];
  function renderCheckboxList(name, options, preselected=[]){
    const container=document.createElement('div'); container.className='ai4g-group';
    options.forEach((opt,i)=>{
      const id=`${name}-${i}`, checked=preselected.includes(opt)?'checked':'';
      container.append(html(`<label for="${id}"><input type="checkbox" id="${id}" value="${opt}" ${checked}/><span>${opt}</span></label>`));
    });
    return container;
  }
  const getCheckedValues = (box)=> Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(i=>i.value);

  // === SCREENS ===
  const screens = {
    async welcome(){
      clear(); setProgress(5);
      add(html(`
        <div class="ai4g-card">
          <p><strong>Inspired by C.K. Prahalad:</strong> we believe innovation focused on the “bottom of the pyramid” can transform lives at scale.</p>
          <p>AI4Good² aspires to bring cutting-edge technology to underserved communities, unlocking opportunity where it’s needed most.</p>
        </div>`));
      await typing(300);

      const meetBtn = html(`<button class="ai4g-btn primary" style="font-size:1rem; padding:.85rem; margin-bottom:.6rem;">
        📅 Book a 30-minute meeting with our founder, Terry Janssen
      </button>`);
      meetBtn.onclick = () => window.open(CAL_LINK, '_blank', 'noopener');
      add(meetBtn);

      add(html(`<p>Which of these opportunities that we offer interest you the most?</p>`));
      [
        ['Volunteer','volunteer'],
        ['Partner','partner'],
        ['Donate','donor'],
        ['Just want to know more','curious']
      ].forEach(([label,val])=>{
        const b=html(`<button class="ai4g-btn">${label}</button>`);
        b.onclick=()=>{ state.branch=val;
          if(val==='volunteer') screens.volunteerRoles();
          else if(val==='partner') screens.partnerTypes();
          else if(val==='donor') screens.donor();
          else screens.about();
        };
        add(b);
      });
    },

    // “Just browsing” section
    about(){
      clear(); setProgress(15);
      add(html(`
        <div class="ai4g-card">
          <h3 style="margin:.2rem 0 .4rem 0;">Our Mission</h3>
          <p>We work to lift villagers in low-income countries from the edge of desperation with practical AI—opening pathways to earn, learn, and thrive. 
          Our pilot in eastern Zambia partners with resilient women artisans and farmers to test what delivers the greatest real-world impact per dollar.</p>
          <h3 style="margin:.8rem 0 .4rem 0;">Objectives</h3>
          <ul style="padding-left:1.1rem;margin:.4rem 0;">
            <li>Deploy AI-driven income opportunities in regions of extreme poverty (starting with Zambia).</li>
            <li>Experiment with AI for livelihoods, tradecraft training, healthcare support, and climate-smart agriculture.</li>
            <li>Build solutions that scale—cloud and edge—so they’re affordable and usable offline when needed.</li>
            <li>Grow digital literacy and AI skills so communities can sustain and expand the impact.</li>
          </ul>
        </div>
        <p style="margin-top:.6rem;"><strong>Which of these contribution options interest you most?</strong></p>
      `));

      [
        ['Volunteer', ()=>{state.branch='volunteer';screens.volunteerRoles();}],
        ['Partner',   ()=>{state.branch='partner';screens.partnerTypes();}],
        ['Donate',    ()=>{state.branch='donor';screens.donor();}],
        ['Book a 30-minute meeting', ()=> window.open(CAL_LINK,'_blank','noopener')],
        ['Back', ()=> screens.welcome()]
      ].forEach(([label,fn])=>{
        const b = html(`<button class="ai4g-btn">${label}</button>`); b.onclick = fn; add(b);
      });
    },

    // VOLUNTEER
    volunteerRoles(){
      clear(); setProgress(30);
      add(html(`<p>🙌 Select your volunteer areas (choose all that apply):</p>`));
      const box=renderCheckboxList('vol', VOLUNTEER_ROLES, state.selections.roles); add(box);
      const row=html(`<div class="ai4g-row" style="justify-content:space-between;margin-top:.5rem;">
        <button class="ai4g-btn" id="v-back">Back</button>
        <button class="ai4g-btn primary" id="v-next">Continue</button>
      </div>`); add(row);
      document.getElementById('v-back').onclick = ()=> screens.welcome();
      document.getElementById('v-next').onclick = ()=>{
        state.selections.roles = getCheckedValues(box);
        if(!state.selections.roles.length){ alert('Please select at least one role'); return; }
        screens.volunteerForm();
      };
    },

    volunteerForm(){
      setProgress(50);
      add(html(`<div class="ai4g-card ai4g-muted">You chose: ${
        state.selections.roles.map(r=>`<span class="ai4g-chip">${r}</span>`).join(' ')
      }</div>`));
      add(html(`<p>📩 Share your details and we’ll match you:</p>
        <input class="ai4g-field" id="v-name" placeholder="Full name"/>
        <input class="ai4g-field" id="v-email" placeholder="Email" type="email"/>
        <input class="ai4g-field" id="v-location" placeholder="Location (city, country)"/>
        <input class="ai4g-field" id="v-phone" placeholder="Phone Number" type="tel"/>
        <textarea class="ai4g-field" id="v-notes" placeholder="Skills or availability (optional)"></textarea>
        <button class="ai4g-btn primary" id="v-submit">Submit</button>`));
      document.getElementById('v-submit').onclick = async()=>{
        const name=document.getElementById('v-name').value.trim();
        const email=document.getElementById('v-email').value.trim();
        if(!email){ alert('Email required'); return; }
        try{
          const ok = await savePayload({
            type:'volunteer',
            name,
            email,
            location:document.getElementById('v-location').value.trim(),
            phone:document.getElementById('v-phone').value.trim(),
            notes:document.getElementById('v-notes').value.trim()
          });
          add(html(
            ok
              ? `<div class="ai4g-card">✅ Thanks! We'll be in touch soon.</div>`
              : `<div class="ai4g-card">⚠️ Couldn't save info. Please try again.</div>`
          ));
          if(ok) screens.followup();
        }catch(e){
          add(html(`<div class="ai4g-card">⚠️ Error—please try again.</div>`));
        }
      };
    },

    // PARTNER
    partnerTypes(){
      clear(); setProgress(30);
      add(html(`<p>🤝 Which partnership categories apply? (select all that fit)</p>`));
      const box=renderCheckboxList('pt', PARTNER_TYPES, state.selections.partnerTypes); add(box);
      const row=html(`<div class="ai4g-row" style="justify-content:space-between;margin-top:.5rem;">
        <button class="ai4g-btn" id="p-back">Back</button>
        <button class="ai4g-btn primary" id="p-next">Continue</button>
      </div>`); add(row);
      document.getElementById('p-back').onclick = ()=> screens.welcome();
      document.getElementById('p-next').onclick = ()=>{
        state.selections.partnerTypes = getCheckedValues(box);
        if(!state.selections.partnerTypes.length){ alert('Please select at least one category'); return; }
        screens.partnerForm();
      };
    },

    partnerForm(){
      setProgress(50);
      add(html(
        `<div class="ai4g-card ai4g-muted">Selected: ${
          state.selections.partnerTypes.map(x=>`<span class="ai4g-chip">${x}</span>`).join(' ')
        }</div>`
      ));
      add(html(
        `<p>📩 Tell us about your organization:</p>
          <input class="ai4g-field" id="p-org"  placeholder="Organization name"/>
          <input class="ai4g-field" id="p-site" placeholder="Website (optional)"/>
          <input class="ai4g-field" id="p-name" placeholder="Your name"/>
          <input class="ai4g-field" id="p-email" placeholder="Work email" type="email"/>
          <input class="ai4g-field" id="p-phone" placeholder="Phone Number" type="tel"/>
          <textarea class="ai4g-field" id="p-notes" placeholder="Comments"></textarea>
          <button class="ai4g-btn primary" id="p-submit">Submit</button>`
      ));
      document.getElementById('p-submit').onclick = async()=>{
        const org=document.getElementById('p-org').value.trim();
        const email=document.getElementById('p-email').value.trim();
        if(!org || !email){ alert('Organization and email are required'); return; }
        const payload = {
          type:'partner',
          org,
          website:document.getElementById('p-site').value.trim(),
          contactName:document.getElementById('p-name').value.trim(),
          email,
          phone:document.getElementById('p-phone').value.trim(),
          categories: state.selections.partnerTypes,
          notes:document.getElementById('p-notes').value.trim()
        };
        try{
          const ok = await savePayload(payload);
          add(html(
            ok
              ? `<div class="ai4g-card">✅ Thanks! Our partnerships team will reach out.</div>`
              : `<div class="ai4g-card">⚠️ Couldn't save info. Please try again.</div>`
          ));
          if(ok) screens.followup();
        }catch(e){
          add(html(`<div class="ai4g-card">⚠️ Error—please try again.</div>`));
        }
      };
    },

    // DONOR (direct to PayPal — no form)
    donor(){
      clear(); setProgress(30);
      add(html(`<div class="ai4g-card">💚 Thank you for supporting the mission. We’re opening our secure PayPal page in a new tab.</div>`));
      try { window.open(DONATION_URL, '_blank', 'noopener'); } catch(e){}
      const row = html(`<div class="ai4g-row" style="margin-top:.5rem;">
        <button class="ai4g-btn primary" id="open-paypal">Open PayPal</button>
        <button class="ai4g-btn" id="back-home">Back</button>
      </div>`);
      add(row);
      document.getElementById('open-paypal').onclick = ()=> window.open(DONATION_URL, '_blank', 'noopener');
      document.getElementById('back-home').onclick  = ()=> screens.welcome();
    },

    followup(isDonor=false){
      setProgress(100);
      if(!isDonor){
        add(html(`<p>Would you also like quick updates?</p>`));
        ['Email only','WhatsApp too (faster + personal)'].forEach(label=>{
          const b=html(`<button class="ai4g-btn">${label}</button>`);
          b.onclick=()=>{
            if(label.startsWith('WhatsApp')){
              clear(); add(html(`<p>📱 Please confirm your number:</p>
                <input class="ai4g-field" id="wa-phone" placeholder="+1 555 123 4567"/>
                <button class="ai4g-btn primary" id="wa-submit">Submit</button>`));
              document.getElementById('wa-submit').onclick = async()=>{
                const phone=document.getElementById('wa-phone').value.trim();
                if(!phone){ alert('Phone required'); return; }
                await savePayload({ type:'whatsapp-optin', phone });
                add(html(`<div class="ai4g-card">🎉 Got it! We’ll send occasional updates.</div>`));
              };
            }else{
              add(html(`<div class="ai4g-card">Great—Email only selected.</div>`));
            }
          };
          add(b);
        });
      } else {
        add(html(`<div class="ai4g-card">💙 We appreciate you!</div>`));
      }
    }
  };

  // === PUBLIC API + EVENTS ===
  window.AI4G_CHAT = {
    open(){ elChat.style.display='block'; screens.welcome(); },
    close(){ elChat.style.display='none'; }
  };
  elClose.onclick = ()=> window.AI4G_CHAT.close();
  elLauncher.onclick = ()=> window.AI4G_CHAT.open();
  window.addEventListener('load', ()=> window.AI4G_CHAT.open());
})();