const StorageManager = {
  getProjects() {
    return JSON.parse(localStorage.getItem('elec_projects') || '{}');
  },

  saveProjects(projects) {
    localStorage.setItem('elec_projects', JSON.stringify(projects));
  },

  getBranding() {
    return {
      name: localStorage.getItem('elec_biz_name') || 'Lightning Electric Services',
      info: localStorage.getItem('elec_biz_info') || 'Lic #C10-984210 • (555) 392-0192 • Fully Insured'
    };
  },

  saveBranding(name, info) {
    localStorage.setItem('elec_biz_name', name);
    localStorage.setItem('elec_biz_info', info);
  }
};