// Firebase helpers removed — no-op to avoid runtime errors if referenced.
window.cloudEnabled = false;
window.initCloudAuth = async function(){ return false; };
window.CloudDB = {
  getAll: async ()=>[],
  save: async ()=>{ throw new Error('Cloud not enabled'); },
  saveRecord: async ()=>{ throw new Error('Cloud not enabled'); },
  getRecords: async ()=>[],
  fetchRecords: async ()=>[],
  updateRecord: async ()=>{ throw new Error('Cloud not enabled'); },
  deleteRecord: async ()=>{ throw new Error('Cloud not enabled'); },
  fetchUsers: async ()=>[],
  setUserAdmin: async ()=>{ throw new Error('Cloud not enabled'); },
  deleteUserDoc: async ()=>{ throw new Error('Cloud not enabled'); }
};
