// Storage Manager Module for Local Project and Branding Persistence
window.StorageManager = {
  getProjects: function() {
    try {
      const data = localStorage.getItem('assan_projects');
      return data ? JSON.parse(data) : {};
    } catch(e) {
      console.error('Error reading projects from storage:', e);
      return {};
    }
  },

  saveProjects: function(projects) {
    try {
      localStorage.setItem('assan_projects', JSON.stringify(projects || {}));
    } catch(e) {
      console.error('Error saving projects to storage:', e);
    }
  },

  getBranding: function() {
    try {
      const data = localStorage.getItem('assan_branding');
      return data ? JSON.parse(data) : {
        name: 'Assan Balkov Electrical Contractor',
        info: '(570) 236-6942 • Lic # XXXXXXXX'
      };
    } catch(e) {
      console.error('Error reading branding from storage:', e);
      return {
        name: 'Assan Balkov Electrical Contractor',
        info: '(570) 236-6942 • Lic # XXXXXXXX'
      };
    }
  },

  saveBranding: function(name, info) {
    try {
      localStorage.setItem('assan_branding', JSON.stringify({ name, info }));
    } catch(e) {
      console.error('Error saving branding to storage:', e);
    }
  }
};