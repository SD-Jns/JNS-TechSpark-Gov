const STORAGE_KEY = 'jns-ai-government-project-tracker-v1';
const today = new Date();

const defaultState = {
  departmentFilter: 'All departments',
  projects: [
    {
      id: 1,
      name: 'Clinic Connectivity Rollout',
      department: 'Health',
      owner: 'Thabo K.',
      progress: 76,
      dueDate: '2026-09-15',
      status: 'At risk',
      tasks: [
        { id: 11, title: 'Regional site surveys', dueDate: '2026-09-11', completed: false, owner: 'Thabo K.' },
        { id: 12, title: 'Clinical vendor coordination', dueDate: '2026-09-18', completed: true, owner: 'Amina S.' }
      ]
    },
    {
      id: 2,
      name: 'School Admissions Modernisation',
      department: 'Education',
      owner: 'Palesa M.',
      progress: 88,
      dueDate: '2026-09-09',
      status: 'On track',
      tasks: [
        { id: 21, title: 'UAT sign-off', dueDate: '2026-09-09', completed: false, owner: 'Palesa M.' },
        { id: 22, title: 'Parent portal readiness', dueDate: '2026-09-14', completed: false, owner: 'Mark D.' }
      ]
    },
    {
      id: 3,
      name: 'Housing Allocation Digitisation',
      department: 'Human Settlements',
      owner: 'Naledi M.',
      progress: 54,
      dueDate: '2026-09-16',
      status: 'Delayed',
      tasks: [
        { id: 31, title: 'Document verification integration', dueDate: '2026-09-02', completed: false, owner: 'Naledi M.' },
        { id: 32, title: 'Data migration complete', dueDate: '2026-09-16', completed: false, owner: 'Lerato N.' }
      ]
    }
  ],
  issues: [
    { id: 1, title: 'Housing integration blocked', project: 'Housing Allocation Digitisation', owner: 'Naledi M.', priority: 'High', dueDate: '2026-09-03' },
    { id: 2, title: 'Two site surveys outstanding', project: 'Clinic Connectivity Rollout', owner: 'Thabo K.', priority: 'Medium', dueDate: '2026-09-10' }
  ]
};

const state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...saved, projects: saved.projects || structuredClone(defaultState.projects), issues: saved.issues || structuredClone(defaultState.issues) };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProjectStatus(progress) {
  if (progress >= 85) return 'On track';
  if (progress < 60) return 'Delayed';
  return 'At risk';
}

function getLetterBadge(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
    .slice(0, 2);
}

function getDueLabel(dateString) {
  const dueDate = new Date(dateString + 'T00:00:00');
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

function getFilteredProjects() {
  if (state.departmentFilter === 'All departments') return state.projects;
  return state.projects.filter((project) => project.department === state.departmentFilter);
}

function getProjectTaskList(projectName) {
  const project = state.projects.find((entry) => entry.name === projectName);
  return project ? project.tasks : [];
}

function renderReminderList() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;

  if (!document.getElementById('reminderList')) {
    panel.innerHTML = `
      <div class="panel-header compact">
        <h3>Automated reminders</h3>
        <button class="text-button" id="closeNotifications">Close</button>
      </div>
      <ul id="reminderList"></ul>
    `;
  }

  const list = document.getElementById('reminderList');

  const reminders = state.projects.flatMap((project) =>
    project.tasks
      .filter((task) => !task.completed)
      .map((task) => ({ ...task, projectName: project.name }))
  ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

  if (!reminders.length) {
    list.innerHTML = '<li>No outstanding reminders. Portfolio is on track.</li>';
    return;
  }

  list.innerHTML = reminders.map((task) => `<li><strong>${task.projectName}</strong>: ${task.title} — ${getDueLabel(task.dueDate)}.</li>`).join('');
}

function populateIssueProjectSelect() {
  const projectSelectEl = document.getElementById('issueProjectSelect');
  if (!projectSelectEl) return;

  projectSelectEl.innerHTML = state.projects
    .map((project) => `<option value="${project.name}">${project.name}</option>`)
    .join('');
}

function bindPageActions() {
  const path = window.location.pathname.split('/').pop();
  const notificationPanel = document.getElementById('notificationPanel');

  renderReminderList();

  document.querySelectorAll('[id$="ReminderOpen"], #openNotifications').forEach((button) => {
    button.onclick = () => notificationPanel?.classList.toggle('hidden');
  });

  const closeNotifications = document.getElementById('closeNotifications');
  if (closeNotifications) closeNotifications.onclick = () => notificationPanel?.classList.add('hidden');

  const formByPage = {
    projects: 'projectForm',
    issues: 'issueForm',
    tasks: 'taskForm'
  };
  const formId = Object.entries(formByPage).find(([page]) => path === `${page}.html`)?.[1];
  const quickAdd = document.querySelector('[id$="QuickAdd"]');
  const targetForm = formId ? document.getElementById(formId) : null;

  if (quickAdd && targetForm) {
    quickAdd.onclick = () => {
      targetForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetForm.querySelector('input, select')?.focus({ preventScroll: true });
    };
  }
}

function bindPageTransitions() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

    event.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 180);
  });
}

function renderDashboard() {
  const summaryTextEl = document.getElementById('summaryText');
  const projectListEl = document.getElementById('projectList');
  const alertListEl = document.getElementById('alertList');
  const milestoneListEl = document.getElementById('milestoneList');
  const projectTableBodyEl = document.getElementById('projectTableBody');
  const taskListEl = document.getElementById('taskList');
  const departmentFilterEl = document.getElementById('departmentFilter');
  const generateBtn = document.getElementById('generateSummary');

  populateIssueProjectSelect();

  if (departmentFilterEl) {
    departmentFilterEl.value = state.departmentFilter;
    departmentFilterEl.addEventListener('change', (event) => {
      state.departmentFilter = event.target.value;
      saveState();
      renderDashboard();
    });
  }

  const filteredProjects = getFilteredProjects();
  const onTrack = filteredProjects.filter((project) => project.status === 'On track').length;
  const atRisk = filteredProjects.filter((project) => project.status === 'At risk').length;
  const delayed = filteredProjects.filter((project) => project.status === 'Delayed').length;
  const total = filteredProjects.length || 1;
  const onTrackPct = Math.round((onTrack / total) * 100);
  const atRiskPct = Math.round((atRisk / total) * 100);
  const delayedPct = Math.max(0, 100 - onTrackPct - atRiskPct);

  const trackerHealth = Math.round(filteredProjects.reduce((sum, project) => sum + project.progress, 0) / total);

  if (document.getElementById('activeProjectsStat')) {
    document.getElementById('activeProjectsStat').textContent = String(filteredProjects.length);
    document.getElementById('activeProjectsMeta').textContent = `${onTrack} on track`;
    document.getElementById('openIssuesStat').textContent = String(state.issues.length);
    document.getElementById('openIssuesMeta').textContent = `${Math.max(state.issues.length - 1, 0)} require escalation`;
    document.getElementById('milestonesDueStat').textContent = String(filteredProjects.filter((project) => {
      const diffDays = Math.ceil((new Date(project.dueDate + 'T00:00:00') - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length);
    document.getElementById('milestonesDueMeta').textContent = `${filteredProjects.filter((project) => {
      const diffDays = Math.ceil((new Date(project.dueDate + 'T00:00:00') - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length} due this week`;
    document.getElementById('deliveryHealthStat').textContent = `${trackerHealth}%`;
    document.getElementById('deliveryHealthMeta').textContent = `${trackerHealth >= 70 ? '+4%' : '+1%'} since last review`;
  }

  const barOnTrack = document.getElementById('portfolioOnTrack');
  const barAtRisk = document.getElementById('portfolioAtRisk');
  const barDelayed = document.getElementById('portfolioDelayed');
  if (barOnTrack && barAtRisk && barDelayed) {
    barOnTrack.style.width = `${onTrackPct}%`;
    barAtRisk.style.width = `${atRiskPct}%`;
    barDelayed.style.width = `${delayedPct}%`;
  }

  const onTrackLabel = document.getElementById('legendOnTrack');
  const atRiskLabel = document.getElementById('legendAtRisk');
  const delayedLabel = document.getElementById('legendDelayed');
  if (onTrackLabel) onTrackLabel.textContent = `On track ${onTrackPct}%`;
  if (atRiskLabel) atRiskLabel.textContent = `At risk ${atRiskPct}%`;
  if (delayedLabel) delayedLabel.textContent = `Delayed ${delayedPct}%`;

  if (projectListEl) {
    projectListEl.innerHTML = filteredProjects.map((project) => {
      const badgeClass = project.status === 'On track' ? 'green' : project.status === 'Delayed' ? 'red' : 'amber';
      return `
        <div class="project-row">
          <div class="project-icon">${getLetterBadge(project.name)}</div>
          <div class="project-copy">
            <strong>${project.name}</strong>
            <span>${project.department} • ${project.progress}% complete</span>
          </div>
          <span class="status-chip ${badgeClass}">${project.status}</span>
        </div>
      `;
    }).join('');
  }

  if (summaryTextEl) {
    const overdueTasks = state.projects.flatMap((project) => project.tasks).filter((task) => !task.completed && new Date(task.dueDate) < today).length;
    const overdueIssues = state.issues.filter((issue) => new Date(issue.dueDate) < today).length;

    const summaryOptions = [
      `${atRisk + delayed} priority initiatives need action, with ${overdueTasks} overdue tasks and ${overdueIssues} delayed issues. Escalate housing and regional connectivity risks immediately.`,
      `Delivery health is ${trackerHealth}% with ${atRisk} projects at risk. Focus on verification, compliance and survey completion before the next review cycle.`,
      `Portfolio performance is improving but overdue work remains concentrated in housing and health. The AI recommendation is to strengthen owner accountability and accelerate pending approvals.`,
      `${filteredProjects.length} active initiatives are under review. ${overdueTasks} tasks are late and the most critical risk remains document verification and survey completion.`
    ];

    summaryTextEl.textContent = summaryOptions[Math.floor(Math.random() * summaryOptions.length)];
  }

  if (alertListEl) {
    alertListEl.innerHTML = state.issues.map((issue) => `
      <div class="alert-item">
        <div>
          <strong>${issue.title}</strong>
          <span>Owner: ${issue.owner} • ${getDueLabel(issue.dueDate)}</span>
        </div>
        <span class="severity ${issue.priority === 'High' ? 'high' : 'medium'}">${issue.priority}</span>
      </div>
    `).join('');
  }

  if (milestoneListEl) {
    const upcoming = state.projects.flatMap((project) => project.tasks.filter((task) => !task.completed).map((task) => ({ ...task, projectName: project.name })))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);

    milestoneListEl.innerHTML = upcoming.map((task) => {
      const dateObj = new Date(task.dueDate + 'T00:00:00');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const status = new Date(task.dueDate) < today ? 'At risk' : 'Watch';
      const statusClass = status === 'At risk' ? 'red' : 'amber';
      return `
        <div class="milestone-item">
          <div class="date-box">${day}</div>
          <div class="milestone-copy">
            <strong>${task.title}</strong>
            <span>${task.projectName} • ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateObj)}</span>
          </div>
          <span class="status-chip ${statusClass} small">${status}</span>
        </div>
      `;
    }).join('');
  }

  if (projectTableBodyEl) {
    projectTableBodyEl.innerHTML = filteredProjects.map((project) => `
      <tr>
        <td>${project.name}</td>
        <td>${project.department}</td>
        <td>${project.owner}</td>
        <td>
          <div class="progress-cell">
            <span>${project.progress}%</span>
            <div class="progress-bar"><span style="width:${project.progress}%"></span></div>
          </div>
        </td>
        <td><span class="status-chip ${project.status === 'On track' ? 'green' : project.status === 'Delayed' ? 'red' : 'amber'} small">${project.status}</span></td>
      </tr>
    `).join('');
  }

  if (taskListEl) {
    const tasks = state.projects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectName: project.name, projectDepartment: project.department })));
    taskListEl.innerHTML = tasks.map((task) => `
      <div class="task-item">
        <div class="task-item-main">
          <input type="checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''} />
          <div>
            <strong>${task.title}</strong>
            <small>${task.projectName} • ${task.projectDepartment} • ${task.owner}</small>
          </div>
        </div>
        <span class="status-chip ${task.completed ? 'green' : new Date(task.dueDate) < today ? 'red' : 'amber'} small">${task.completed ? 'Complete' : getDueLabel(task.dueDate)}</span>
      </div>
    `).join('');

    taskListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const taskId = Number(event.target.dataset.taskId);
        state.projects.forEach((project) => {
          project.tasks.forEach((task) => {
            if (task.id === taskId) task.completed = event.target.checked;
          });
        });
        saveState();
        renderDashboard();
      });
    });
  }

  if (generateBtn) generateBtn.onclick = generateSummary;
}

function renderProjectPage() {
  const projectTableBodyEl = document.getElementById('projectTableBody');
  const filterEl = document.getElementById('projectDepartmentFilter');
  const projectForm = document.getElementById('projectForm');

  if (filterEl) {
    filterEl.addEventListener('change', (event) => {
      state.departmentFilter = event.target.value;
      saveState();
      renderProjectPage();
    });
  }

  const filteredProjects = getFilteredProjects();
  if (projectTableBodyEl) {
    projectTableBodyEl.innerHTML = filteredProjects.map((project) => `
      <tr>
        <td>${project.name}</td>
        <td>${project.department}</td>
        <td>${project.owner}</td>
        <td>${new Date(project.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td>
          <div class="progress-cell">
            <span>${project.progress}%</span>
            <div class="progress-bar"><span style="width:${project.progress}%"></span></div>
          </div>
        </td>
        <td><span class="status-chip ${project.status === 'On track' ? 'green' : project.status === 'Delayed' ? 'red' : 'amber'} small">${project.status}</span></td>
      </tr>
    `).join('');
  }

  if (projectForm) {
    projectForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const project = {
        id: Date.now(),
        name: formData.get('name'),
        department: formData.get('department'),
        owner: formData.get('owner'),
        progress: Number(formData.get('progress')),
        dueDate: formData.get('dueDate'),
        status: getProjectStatus(Number(formData.get('progress'))),
        tasks: []
      };
      state.projects.push(project);
      saveState();
      event.target.reset();
      renderProjectPage();
    });
  }

  renderReminderList();
}

function renderIssuePage() {
  const issueListEl = document.getElementById('issueList');
  const issueForm = document.getElementById('issueForm');
  const projectSelectEl = document.getElementById('issueProjectSelect');

  if (projectSelectEl) {
    projectSelectEl.innerHTML = state.projects.map((project) => `<option value="${project.name}">${project.name}</option>`).join('');
  }

  if (issueListEl) {
    issueListEl.innerHTML = state.issues.map((issue) => `
      <div class="issue-card">
        <div class="issue-head">
          <strong>${issue.title}</strong>
          <span class="severity ${issue.priority === 'High' ? 'high' : 'medium'}">${issue.priority}</span>
        </div>
        <div class="issue-meta">
          <span>Project: ${issue.project}</span>
          <span>Owner: ${issue.owner}</span>
          <span>${getDueLabel(issue.dueDate)}</span>
        </div>
      </div>
    `).join('');
  }

  if (issueForm) {
    issueForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      state.issues.push({
        id: Date.now(),
        title: formData.get('title'),
        project: formData.get('project'),
        owner: formData.get('owner'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate')
      });
      saveState();
      event.target.reset();
      renderIssuePage();
    });
  }

  renderReminderList();
}

function renderTaskPage() {
  const taskListEl = document.getElementById('taskList');
  const taskForm = document.getElementById('taskForm');
  const taskProjectSelect = document.getElementById('taskProjectSelect');

  if (taskProjectSelect) {
    taskProjectSelect.innerHTML = state.projects.map((project) => `<option value="${project.name}">${project.name}</option>`).join('');
  }

  if (taskListEl) {
    const tasks = state.projects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectName: project.name, projectDepartment: project.department })));
    taskListEl.innerHTML = tasks.map((task) => `
      <div class="task-item">
        <div class="task-item-main">
          <input type="checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''} />
          <div>
            <strong>${task.title}</strong>
            <small>${task.projectName} • ${task.projectDepartment} • ${task.owner}</small>
          </div>
        </div>
        <span class="status-chip ${task.completed ? 'green' : new Date(task.dueDate) < today ? 'red' : 'amber'} small">${task.completed ? 'Complete' : getDueLabel(task.dueDate)}</span>
      </div>
    `).join('');

    taskListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const taskId = Number(event.target.dataset.taskId);
        state.projects.forEach((project) => {
          project.tasks.forEach((task) => {
            if (task.id === taskId) task.completed = event.target.checked;
          });
        });
        saveState();
        renderTaskPage();
      });
    });
  }

  if (taskForm) {
    taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const projectName = formData.get('project');
      const project = state.projects.find((entry) => entry.name === projectName);
      if (!project) return;

      project.tasks.push({
        id: Date.now(),
        title: formData.get('title'),
        owner: formData.get('owner'),
        dueDate: formData.get('dueDate'),
        completed: false,
        status: formData.get('status')
      });
      saveState();
      event.target.reset();
      renderTaskPage();
    });
  }

  renderReminderList();
}

function generateSummary() {
  const filteredProjects = getFilteredProjects();
  const overdueTasks = state.projects.flatMap((project) => project.tasks).filter((task) => !task.completed && new Date(task.dueDate) < today).length;
  const atRiskProjects = filteredProjects.filter((project) => project.status !== 'On track').length;
  const overdueIssues = state.issues.filter((issue) => new Date(issue.dueDate) < today).length;

  const target = document.getElementById('summaryText');
  if (!target) return;

  const summaries = [
    `${atRiskProjects} priority programmes require intervention, with ${overdueTasks} overdue tasks and ${overdueIssues} issues already past due. Escalation is recommended for housing and regional rollout work.`,
    `Delivery health remains stable but ${atRiskProjects} projects need action. Focus on document verification, site surveys and milestone readiness before the next review cycle.`,
    `Portfolio performance is improving, though overdue tasks are concentrated in housing and health. Immediate attention should be given to document integration and survey completion.`,
    `${filteredProjects.length} active initiatives are under review. ${overdueTasks} tasks are overdue, and the AI recommendation is to reinforce owner accountability and accelerate pending verification steps.`
  ];

  target.textContent = summaries[Math.floor(Math.random() * summaries.length)];
}

function bindDashboardActions() {
  const openProjectModal = document.getElementById('openProjectModal');
  const openIssueModal = document.getElementById('openIssueModal');
  const projectModal = document.getElementById('projectModal');
  const issueModal = document.getElementById('issueModal');
  const notificationPanel = document.getElementById('notificationPanel');
  const openNotifications = document.getElementById('openNotifications');

  if (openProjectModal && projectModal) openProjectModal.onclick = () => projectModal.classList.remove('hidden');
  if (openIssueModal && issueModal) openIssueModal.onclick = () => issueModal.classList.remove('hidden');
  if (openNotifications && notificationPanel) openNotifications.onclick = () => notificationPanel.classList.toggle('hidden');
  if (document.getElementById('closeNotifications')) document.getElementById('closeNotifications').onclick = () => notificationPanel.classList.add('hidden');
  if (document.getElementById('registerAddProject')) document.getElementById('registerAddProject').onclick = () => projectModal.classList.remove('hidden');
  if (document.getElementById('taskAddIssue')) document.getElementById('taskAddIssue').onclick = () => issueModal.classList.remove('hidden');
  if (document.getElementById('viewAllIssues')) document.getElementById('viewAllIssues').onclick = () => document.getElementById('alertList')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  document.querySelectorAll('.close-button').forEach((button) => {
    button.onclick = () => {
      const modalId = button.dataset.close;
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('hidden');
    };
  });

  const projectForm = document.getElementById('projectForm');
  if (projectForm) {
    projectForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const project = {
        id: Date.now(),
        name: formData.get('name'),
        department: formData.get('department'),
        owner: formData.get('owner'),
        progress: Number(formData.get('progress')),
        dueDate: formData.get('dueDate'),
        status: getProjectStatus(Number(formData.get('progress'))),
        tasks: []
      };
      state.projects.push(project);
      saveState();
      event.target.reset();
      projectModal.classList.add('hidden');
      renderDashboard();
      renderProjectPage();
      renderTaskPage();
    });
  }

  const issueForm = document.getElementById('issueForm');
  if (issueForm) {
    issueForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      state.issues.push({
        id: Date.now(),
        title: formData.get('title'),
        project: formData.get('project'),
        owner: formData.get('owner'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate')
      });
      saveState();
      event.target.reset();
      issueModal.classList.add('hidden');
      renderDashboard();
      renderIssuePage();
    });
  }
}

function initPage() {
  bindPageTransitions();
  const path = window.location.pathname.split('/').pop();
  if (path === 'projects.html') {
    renderProjectPage();
    bindPageActions();
    return;
  }
  if (path === 'issues.html') {
    renderIssuePage();
    bindPageActions();
    return;
  }
  if (path === 'tasks.html') {
    renderTaskPage();
    bindPageActions();
    return;
  }
  bindDashboardActions();
  renderDashboard();
  bindPageActions();
}

initPage();
