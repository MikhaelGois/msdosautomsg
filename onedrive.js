// Minimal MSAL + Graph file upload helper (optional)
// Usage: include MSAL script and `onedrive-config.js` (copy example), then call OneDrive.uploadCsv(csvText, 'file.csv')

const OneDrive = (function(){
  let msalInstance = null;
  function init(){
    if(window.Msal && window.oneDriveConfig && !msalInstance){
      const msalConfig = { auth: { clientId: window.oneDriveConfig.clientId, redirectUri: window.oneDriveConfig.redirectUri } };
      msalInstance = new Msal.UserAgentApplication(msalConfig);
    }
    return !!msalInstance;
  }
  async function login(){
    if(!init()) throw new Error('MSAL not configured');
    const scopes = ['Files.ReadWrite','offline_access','openid','profile','User.Read'];
    try{ const res = await msalInstance.loginPopup({scopes}); return res; }catch(e){ throw e; }
  }
  async function getToken(){
    if(!msalInstance) throw new Error('MSAL not initialized');
    const acc = msalInstance.getAccount();
    if(!acc) await login();
    try{ const resp = await msalInstance.acquireTokenSilent({scopes:['Files.ReadWrite']}); return resp.accessToken; }
    catch(e){ const resp = await msalInstance.acquireTokenPopup({scopes:['Files.ReadWrite']}); return resp.accessToken; }
  }
  // upload file to root path
  async function uploadCsv(csvText, filename='export.csv'){
    const token = await getToken();
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(filename)}:/content`;
    const res = await fetch(url, { method:'PUT', headers:{ Authorization: 'Bearer '+token, 'Content-Type':'text/csv' }, body: csvText });
    if(!res.ok) throw new Error('Upload failed: '+res.status);
    return res.json();
  }
  return { init, login, getToken, uploadCsv };
})();
