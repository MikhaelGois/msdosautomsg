// Copy this file to `onedrive-config.js` and set `clientId` to your Azure AD application (single-tenant or multi-tenant)
// Register an app in Azure Portal (Azure Active Directory -> App registrations) and add the redirect URI (e.g. http://localhost:3000)
// Scopes we will need: Files.ReadWrite, offline_access, openid, profile, User.Read

window.oneDriveConfig = {
  clientId: "YOUR_AZURE_AD_CLIENT_ID",
  redirectUri: window.location.origin + '/' // e.g. http://localhost:3000/
};
