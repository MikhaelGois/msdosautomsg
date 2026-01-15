// email_generator.js
// Template-based email generator with mutavel token support

// =============================
// 1) Definição dos templates
// =============================
// Use "mutavel" como placeholder
const templates = [
  {
    id: "extend-expired",
    name: "Request to Extend Expired Account Access",
    subject: "Request to Extend Expired Account Access",
    body:
`Dear Team,
Please extend the account access for the user below. The account has already expired:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Expiration Date: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Employee ID or External Reference","Expiration Date","Ticket BR"]
  },
  {
    id: "mfa-reset",
    name: "Request for MFA Reset",
    subject: "Request for MFA Reset",
    body:
`Dear Team,
Please reset the Multi-Factor Authentication (MFA) for the following user:
Name: mutavel
Username: mutavel
Email: mutavel
The user is unable to complete the login process due to MFA issues. Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Name","Username","Email"]
  },
  {
    id: "third-party-lux-create",
    name: "Request for Third-Party Luxottica Account",
    subject: "Request for Third-Party Luxottica Account",
    body:
`Dear Team,
Please create a new Luxottica account for the third-party user below:
• Full Name: mutavel
• SMTP: mutavel
• Mail Group: mutavel
• Logon Script: mutavel
• License: mutavel
• External Reference or Employee ID: mutavel
• Copy Settings From: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Full Name","SMTP","Mail Group","Logon Script","License","External Reference or Employee ID","Copy Settings From","Ticket BR"]
  },
  {
    id: "new-lux-create",
    name: "Request for New Luxottica Account",
    subject: "Request for New Luxottica Account",
    body:
`Dear Team,
Please create a new Luxottica account for the user below:
• Full Name: mutavel
• SMTP: mutavel
• Mail Group: mutavel
• Logon Script: mutavel
• License: mutavel
• Employee ID: mutavel
• Copy Settings From: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Full Name","SMTP","Mail Group","Logon Script","License","Employee ID","Copy Settings From","Ticket BR"]
  },
  {
    id: "add-to-dl",
    name: "Request to Add Email to Distribution Group(s)",
    subject: "Request to Add Email to Distribution Group(s)",
    body:
`Dear Team,
Please add the email address below to the specified group(s):
• Email Address: mutavel
• Group(s): mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Group(s)","Ticket BR"]
  },
  {
    id: "remove-from-dl",
    name: "Request to Remove Email from Distribution Group(s)",
    subject: "Request to Remove Email from Distribution Group(s)",
    body:
`Dear Team,
Please remove the email address below from the specified group(s):
• Email Address: mutavel
• Group(s): mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Group(s)","Ticket BR"]
  },
  {
    id: "delete-email",
    name: "Request to Delete Email Account",
    subject: "Request to Delete Email Account",
    body:
`Dear Team,
Please delete the email account below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Employee ID or External Reference","Ticket BR"]
  },
  {
    id: "modify-lux",
    name: "Request to Modify Existing Luxottica Account",
    subject: "Request to Modify Existing Luxottica Account",
    body:
`Dear Team,
Please update the Luxottica account with the details below:
• Email Address: mutavel
• Changes Required: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Changes Required","Employee ID or External Reference","Ticket BR"]
  },
  {
    id: "mirror-lux",
    name: "Request to Modify Account by Mirroring Existing User",
    subject: "Request to Modify Account by Mirroring Existing User",
    body:
`Dear Team,
Please update the Luxottica account below to mirror the settings of another user:
• Email Address to Modify: mutavel
• Mirror Settings From: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address to Modify","Mirror Settings From","Employee ID or External Reference","Ticket BR"]
  },
  {
    id: "reactivate-email",
    name: "Request to Reactivate Email Account",
    subject: "Request to Reactivate Email Account",
    body:
`Dear Team,
Please reactivate the email account below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Reason for Reactivation: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Employee ID or External Reference","Reason for Reactivation","Ticket BR"]
  },
  {
    id: "3rd-party-not-receiving",
    name: "User Not Receiving Third-Party Emails",
    subject: "User Not Receiving Third-Party Emails",
    body:
`Dear Team,
Please check and resolve the issue below:
• Email Address: mutavel
• Description of Issue: mutavel
• Steps Already Taken: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Description of Issue","Steps Already Taken","Ticket BR"]
  },
  {
    id: "upgrade-license",
    name: "Request to Upgrade Office License from E1 to E3",
    subject: "Request to Upgrade Office License from E1 to E3",
    body:
`Dear Team,
Please upgrade the Office license for the user below:
• Email Address: mutavel
• Current License: mutavel
• New License: mutavel
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Current License","New License","Employee ID or External Reference","Ticket BR"]
  },
  {
    id: "renew-e3",
    name: "Request to Renew Expired Office License (E3)",
    subject: "Request to Renew Expired Office License (E3)",
    body:
`Dear Team,
The Office license for the user below has expired. Please proceed with the renewal or reactivation:
• Email Address: mutavel
• Previous License: mutavel
• Status: Expired
• Employee ID or External Reference: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Previous License","Employee ID or External Reference","Ticket BR"]
  },
  {
    id: "unlock-account",
    name: "Request to Unlock User Account",
    subject: "Request to Unlock User Account",
    body:
`Dear Team,
Please unlock the account for the user below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Domain Group: mutavel
• Reason for Unlock: mutavel
• Ticket BR: mutavel
Let me know if you need any additional details to process this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Employee ID or External Reference","Domain Group","Reason for Unlock","Ticket BR"]
  },
  {
    id: "block-deactivate",
    name: "Request to Block and Deactivate User Access",
    subject: "Request to Block and Deactivate User Access",
    body:
`Dear Team,
Please proceed with blocking and deactivating all access for the user below:
• Email Address: mutavel
• Employee ID or External Reference: mutavel
• Domain Group(s): mutavel
• Reason: mutavel
• Ticket BR: mutavel
Ensure that all related accounts, permissions, and access to corporate resources are disabled.
Let me know if you need any additional details to complete this request.
Thank you for your assistance.`,
    fieldLabels: ["Email Address","Employee ID or External Reference","Domain Group(s)","Reason","Ticket BR"]
  }
];

// =============================
// 2) Estado e utilitários
// =============================
let state = {
  currentTemplate: null,
  values: []
};

const $ = (sel) => document.querySelector(sel);

function getTemplateById(id){
  return templates.find(t => t.id === id);
}

function countPlaceholders(subject, body){
  const rx = /mutavel/g;
  const inSubj = (subject.match(rx) || []).length;
  const inBody = (body.match(rx) || []).length;
  return [inSubj, inBody, inSubj + inBody];
}

function replaceNth(text, token, replacements){
  let i = 0;
  return text.replace(new RegExp(token, "g"), () => (replacements[i++] ?? token));
}

function loadTemplates(){
  const elTemplate = $("#templateSelect");
  if(!elTemplate) return;
  elTemplate.innerHTML = "";
  templates.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    elTemplate.appendChild(opt);
  });
  setTemplate(templates[0].id);
}

function renderFields(){
  const elFields = $("#templateFields");
  if(!elFields) return;

  const t = state.currentTemplate;
  const [subjCount, bodyCount, total] = countPlaceholders(t.subject, t.body);

  if (!Array.isArray(state.values) || state.values.length !== total){
    state.values = Array(total).fill("");
  }

  elFields.innerHTML = "";
  const labels = t.fieldLabels && t.fieldLabels.length === total
    ? t.fieldLabels
    : Array.from({length: total}, (_,i)=>`Campo ${i+1}`);

  labels.forEach((label, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "form-row";
    
    const lab = document.createElement("label");
    lab.textContent = label;
    lab.setAttribute("for", `f_${idx}`);

    const inp = document.createElement("input");
    inp.id = `f_${idx}`;
    inp.placeholder = label;
    inp.value = state.values[idx] || "";
    inp.addEventListener("input", e => {
      state.values[idx] = e.target.value;
      updatePreview();
    });

    wrap.appendChild(lab);
    wrap.appendChild(inp);
    elFields.appendChild(wrap);
  });

  updatePreview();
}

function updatePreview(){
  const elSubjectPreview = $("#emailSubject");
  const elBodyPreview = $("#emailBodyOutput");
  if(!elSubjectPreview || !elBodyPreview) return;

  const t = state.currentTemplate;
  const [subjCount, bodyCount] = countPlaceholders(t.subject, t.body);

  const subjVals = state.values.slice(0, subjCount);
  const bodyVals = state.values.slice(subjCount, subjCount + bodyCount);

  const finalSubject = replaceNth(t.subject, "mutavel", subjVals);
  const finalBody = replaceNth(t.body, "mutavel", bodyVals);

  elSubjectPreview.value = finalSubject;
  elBodyPreview.value = finalBody;
}

function setTemplate(id){
  const t = getTemplateById(id);
  state.currentTemplate = structuredClone(t);
  const [, , total] = countPlaceholders(t.subject, t.body);
  state.values = Array(total).fill("");
  renderFields();
}

// =============================
// 3) Eventos e ações
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const elTemplate = $("#templateSelect");
  const elFields = $("#templateFields");
  const elSubjectPreview = $("#emailSubject");
  const elBodyPreview = $("#emailBodyOutput");
  const btnCopy = $("#copyEmailBtn");
  const btnReset = $("#clearEmailBtn");
  const btnGenerate = $("#generateEmailBtn");

  loadTemplates();

  elTemplate?.addEventListener("change", (e)=>{
    setTemplate(e.target.value);
  });

  btnCopy?.addEventListener("click", async ()=>{
    const subject = elSubjectPreview?.value?.trim();
    const body = elBodyPreview?.value?.trim();
    if(!subject) return alert("Preencha o assunto primeiro");
    if(!body) return alert("Gere um e-mail primeiro");
    const content = `Subject: ${subject}\n\n${body}`;
    try{
      await navigator.clipboard.writeText(content);
      const oldText = btnCopy.textContent;
      btnCopy.textContent = "Copiado ✔";
      setTimeout(()=> btnCopy.textContent = oldText, 1200);
    }catch(e){
      console.error('Copy error:', e);
      alert("Copie manualmente:\n\n" + content);
    }
  });

  btnReset?.addEventListener("click", (e)=>{
    e.preventDefault();
    state.values = state.values.map(()=> "");
    elFields?.querySelectorAll("input").forEach((inp)=> inp.value = "");
    if(elSubjectPreview) elSubjectPreview.value = "";
    if(elBodyPreview) elBodyPreview.value = "";
    updatePreview();
  });

  btnGenerate?.addEventListener("click", ()=>{
    updatePreview();
  });
});
