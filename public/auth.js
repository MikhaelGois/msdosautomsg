// CloudAuth + CloudDB helper for optional Firebase integration
// Place a copy of firebase-config.example.js as firebase-config.js with your
// project's config to enable cloud mode. If firebase-config.js is absent the
// code falls back to local server mode.

window.cloudEnabled = false;

async function initCloudAuth() {
	// Prefer modular initializer if present
	if (typeof window.initCloudAuthModule === 'function') {
		try {
			const ok = await window.initCloudAuthModule();
			window.cloudEnabled = !!ok;
			return ok;
		} catch (e) {
			console.warn('initCloudAuth: module init failed', e);
			window.cloudEnabled = false;
			return false;
		}
	}

	// Fallback: if legacy globals are present, enable cloud
	if (window._auth && window._db) {
		window.cloudEnabled = true;
		return true;
	}

	return false;
}

const CloudDB = {
	async getAll(collectionName) {
		if (window.cloudEnabled && window.CloudDBModule && typeof window.CloudDBModule.getAll === 'function') {
			return window.CloudDBModule.getAll(collectionName);
		}
		return [];
	},
	async save(collectionName, payload) {
		if (window.cloudEnabled && window.CloudDBModule && typeof window.CloudDBModule.save === 'function') {
			return window.CloudDBModule.save(collectionName, payload);
		}
		// Firebase helpers removed for public; provide no-op replacements to avoid runtime errors.
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
CloudDB.fetchRecords = async function(q){
