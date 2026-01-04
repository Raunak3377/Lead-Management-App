
/**
 * PRODUCTION-GRADE LEAD MANAGEMENT SYSTEM BACKEND
 * Apps Script REST-API Implementation
 */

const DB_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  USERS: 'Users',
  LEADS: 'Leads',
  DIMENSIONS: 'Dimensions',
  LOGS: 'Logs'
};

// --- CORE UTILS ---

function toMidnight(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function generateToken(user) {
  return Utilities.base64Encode(JSON.stringify({
    id: user.id,
    email: user.email,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  }));
}

function getAuthUser(token) {
  try {
    if (!token) return null;
    const data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    if (data.exp < Date.now()) return null;
    
    const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.USERS);
    const rows = sheet.getDataRange().getValues();
    rows.shift();
    const userRow = rows.find(r => r[0] == data.id);
    
    if (!userRow) return null;
    return {
      id: userRow[0],
      email: userRow[1],
      name: userRow[2],
      role: userRow[4],
      status: userRow[5]
    };
  } catch (e) {
    return null;
  }
}

function logAction(user, action, details) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LOGS);
  sheet.appendRow([
    Utilities.getUuid(),
    new Date(),
    user ? user.email : 'System',
    action,
    details,
    user ? user.name : 'System'
  ]);
}

// --- API ENTRY POINTS ---

function doGet(e) {
  const route = e.parameter.route;
  const token = e.parameter.token;
  const authUser = getAuthUser(token);

  try {
    if (route === '/auth/me') return response(true, authUser);
    if (!authUser) return response(false, null, 'Unauthorized', 401);

    switch(route) {
      case '/dashboard': return getDashboard(authUser, e.parameter);
      case '/leads': return getLeads(authUser, e.parameter);
      case '/followups': return getFollowups(authUser);
      case '/users': return getUsers(authUser);
      case '/reports': return getReports(authUser, e.parameter);
      default: return response(false, null, 'Route not found: ' + route);
    }
  } catch (err) {
    return response(false, null, err.toString());
  }
}

function doPost(e) {
  const route = e.parameter.route;
  const body = JSON.parse(e.postData.contents);
  const token = e.parameter.token;
  const authUser = getAuthUser(token);

  try {
    if (route === '/auth/login') return login(body);
    if (!authUser) return response(false, null, 'Unauthorized', 401);

    const method = body._method || 'POST';

    switch(route) {
      case '/leads': 
        return method === 'PUT' ? updateLead(authUser, body) : addLead(authUser, body);
      case '/followups':
        return updateLead(authUser, { ...body, leadId: body.id }); 
      case '/users':
        return addOrUpdateUser(authUser, body);
      default: return response(false, null, 'Route not found: ' + route);
    }
  } catch (err) {
    return response(false, null, err.toString());
  }
}

function response(success, data, error = '', status = 200) {
  const output = { success, data, error };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- MODULE: AUTH ---

function login(body) {
  const { email, password } = body;
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  rows.shift(); 
  
  const userRow = rows.find(r => r[1] === email && r[3] === password);
  if (!userRow) return response(false, null, 'Invalid credentials');
  if (userRow[5] !== 'Active') return response(false, null, 'Account inactive');

  const user = { id: userRow[0], email: userRow[1], name: userRow[2], role: userRow[4] };
  const token = generateToken(user);
  logAction(user, 'LOGIN', 'Successful login');
  return response(true, { user, token });
}

// --- MODULE: DASHBOARD ---

function getDashboard(user, params) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  if (!sheet) return response(true, { totalLeads: 0, newLeads: 0, followupsDue: 0, converted: 0, dead: 0, conversionRate: '0%' });
  
  const rows = sheet.getDataRange().getValues();
  rows.shift();

  const start = params.startDate ? toMidnight(params.startDate) : null;
  const end = params.endDate ? toMidnight(params.endDate) : null;
  const today = toMidnight(new Date());

  const filteredRows = rows.filter(r => {
    // Role filter
    if (user.role !== 'Admin' && r[8] !== user.email && r[8] !== user.name) return false;
    
    // Date filter on Lead Timestamp
    const ts = toMidnight(r[1]);
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    return true;
  });

  const stats = {
    totalLeads: filteredRows.length,
    newLeads: filteredRows.filter(r => r[9] === 'New').length,
    followupsDue: filteredRows.filter(r => {
      if (r[9] === 'Converted' || r[9] === 'Dead') return false;
      const fDate = toMidnight(r[11]);
      return fDate && fDate.getTime() <= today.getTime();
    }).length,
    converted: filteredRows.filter(r => r[9] === 'Converted').length,
    dead: filteredRows.filter(r => r[9] === 'Dead').length,
    conversionRate: filteredRows.length > 0 ? ((filteredRows.filter(r => r[9] === 'Converted').length / filteredRows.length) * 100).toFixed(1) + '%' : '0%'
  };

  if (user.role === 'Admin') {
    const counselorMap = {};
    filteredRows.forEach(r => {
      const counselor = r[8];
      if (!counselorMap[counselor]) counselorMap[counselor] = { total: 0, converted: 0 };
      counselorMap[counselor].total++;
      if (r[9] === 'Converted') counselorMap[counselor].converted++;
    });
    stats.counselors = Object.entries(counselorMap).map(([name, data]) => ({
      name, ...data, rate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) + '%' : '0%'
    }));
  }

  return response(true, stats);
}

// --- MODULE: LEADS ---

function getLeads(user, params) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();

  let filtered = rows;
  if (user.role !== 'Admin') {
    filtered = rows.filter(r => r[8] === user.email || r[8] === user.name);
  }

  const leads = filtered.map(r => {
    let lead = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      lead[key] = r[i];
    });
    return lead;
  });

  return response(true, leads);
}

function addLead(user, body) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  const leadId = 'L' + Math.floor(Math.random() * 900000 + 100000);
  
  const newRow = [
    leadId, 
    new Date(), 
    body.studentName, 
    body.phone, 
    '', // Email removed
    body.source, 
    body.course, 
    body.city, 
    body.assignedCounselor || user.name, 
    body.status || 'New', 
    body.remark || 'Initial Entry', 
    body.nextFollowupDate ? new Date(body.nextFollowupDate) : null, 
    body.status === 'Converted' ? new Date() : null, 
    user.email
  ];
  
  sheet.appendRow(newRow);
  logAction(user, 'LEAD_ADD', `Added lead ${leadId} (${body.studentName})`);
  return response(true, { id: leadId }, 'Lead created successfully');
}

function updateLead(user, body) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const rowIndex = rows.findIndex(r => r[0] == body.leadId);

  if (rowIndex === -1) return response(false, null, 'Lead not found');
  
  const existing = rows[rowIndex];
  if (user.role !== 'Admin' && existing[8] !== user.email && existing[8] !== user.name) {
    return response(false, null, 'Access denied');
  }

  const mapping = {
    studentName: 2, phone: 3, source: 5, course: 6, city: 7, 
    assignedCounselor: 8, status: 9, remark: 10, nextFollowupDate: 11
  };

  let updateLog = [];
  Object.entries(mapping).forEach(([key, colIdx]) => {
    if (body[key] !== undefined) {
      let val = body[key];
      if (key === 'nextFollowupDate') val = val ? new Date(val) : null;
      if (String(val) !== String(existing[colIdx])) {
        sheet.getRange(rowIndex + 1, colIdx + 1).setValue(val);
        updateLog.push(`${key}: ${existing[colIdx]} -> ${val}`);
      }
    }
  });

  if (body.status === 'Converted' && !existing[12]) {
    sheet.getRange(rowIndex + 1, 13).setValue(new Date());
  } else if (body.status && body.status !== 'Converted') {
    sheet.getRange(rowIndex + 1, 13).setValue(null);
  }

  logAction(user, 'LEAD_UPDATE', `Updated lead ${body.leadId}. Changes: ${updateLog.join(', ')}`);
  return response(true, null, 'Lead updated');
}

// --- MODULE: FOLLOW-UPS ---

function getFollowups(user) {
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();

  const filtered = rows.filter(r => {
    if (user.role !== 'Admin' && r[8] !== user.email && r[8] !== user.name) return false;
    if (r[9] === 'Converted' || r[9] === 'Dead') return false;
    return true;
  });

  const leads = filtered.map(r => {
    let lead = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      lead[key] = r[i];
    });
    return lead;
  });

  return response(true, leads);
}

// --- MODULE: USERS ---

function getUsers(user) {
  if (user.role !== 'Admin') return response(false, null, 'Forbidden', 403);
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();

  const users = rows.map(r => ({
    id: r[0], email: r[1], name: r[2], role: r[4], status: r[5]
  }));

  return response(true, users);
}

function addOrUpdateUser(admin, body) {
  if (admin.role !== 'Admin') return response(false, null, 'Forbidden');
  const sheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  
  if (body._method === 'PUT') {
    const idx = rows.findIndex(r => r[0] == body.id);
    if (idx === -1) return response(false, null, 'User not found');
    sheet.getRange(idx + 1, 2, 1, 5).setValues([[body.email, body.name, body.password, body.role, body.status]]);
    logAction(admin, 'USER_UPDATE', `Updated user ${body.email}`);
  } else {
    sheet.appendRow([Utilities.getUuid(), body.email, body.name, body.password, body.role, 'Active', new Date()]);
    logAction(admin, 'USER_ADD', `Added user ${body.email}`);
  }
  return response(true, null, 'Success');
}

// --- MODULE: REPORTS ---

function getReports(user, params) {
  const leadSheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LEADS);
  const logSheet = SpreadsheetApp.openById(DB_ID).getSheetByName(SHEETS.LOGS);
  
  const leadRows = leadSheet.getDataRange().getValues();
  leadRows.shift();
  
  const logRows = logSheet.getDataRange().getValues();
  logRows.shift();

  let start = params.startDate ? toMidnight(params.startDate) : null;
  let end = params.endDate ? toMidnight(params.endDate) : null;

  // Filter logs for actual productivity tracking
  const filteredLogs = logRows.filter(r => {
    const ts = toMidnight(r[1]);
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    if (user.role !== 'Admin' && r[2] !== user.email) return false;
    return true;
  });

  // Productivity tracked via logs: Added or Updated leads
  const dailyProductivity = {};

  filteredLogs.forEach(r => {
    const dateKey = Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const cname = r[5] || r[2]; // Use name if available, else email
    const action = r[3];

    if (!dailyProductivity[dateKey]) dailyProductivity[dateKey] = {};
    if (!dailyProductivity[dateKey][cname]) {
      dailyProductivity[dateKey][cname] = { added: 0, updated: 0, converted: 0, dead: 0 };
    }
    
    if (action === 'LEAD_ADD') dailyProductivity[dateKey][cname].added++;
    if (action === 'LEAD_UPDATE') {
      dailyProductivity[dateKey][cname].updated++;
      // Check details for status changes
      const details = String(r[4]);
      if (details.includes('status: ') && details.includes('-> Converted')) {
        dailyProductivity[dateKey][cname].converted++;
      }
      if (details.includes('status: ') && details.includes('-> Dead')) {
        dailyProductivity[dateKey][cname].dead++;
      }
    }
  });

  // Filter leads for summary counts
  const filteredLeads = leadRows.filter(r => {
    if (user.role !== 'Admin' && r[8] !== user.email && r[8] !== user.name) return false;
    const ts = toMidnight(r[1]);
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    return true;
  });

  // Flatten for frontend
  const reportsList = [];
  Object.entries(dailyProductivity).forEach(([date, counselors]) => {
    Object.entries(counselors).forEach(([cname, stats]) => {
      reportsList.push({ date, counselor: cname, ...stats });
    });
  });

  return response(true, { 
    byStatus: filteredLeads.reduce((acc, r) => { acc[r[9]] = (acc[r[9]] || 0) + 1; return acc; }, {}),
    bySource: filteredLeads.reduce((acc, r) => { acc[r[5]] = (acc[r[5]] || 0) + 1; return acc; }, {}),
    byCourse: filteredLeads.reduce((acc, r) => { acc[r[6]] = (acc[r[6]] || 0) + 1; return acc; }, {}),
    dailyProductivity: reportsList.sort((a,b) => b.date.localeCompare(a.date))
  });
}
