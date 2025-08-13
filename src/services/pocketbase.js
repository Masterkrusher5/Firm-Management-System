import PocketBase from 'pocketbase';
export const pb = new PocketBase('https://pocketbaseapi.pikapod.net/');
const collections = [
    'users', 'admins', 'firms', 'items', 'sales', 'customers', 
    'expenses', 'deposits', 'feedback', 'activity_logs', 'error_logs'
];
collections.forEach(collection => {
    pb.collection(collection).options = { fields: '*' };
});
pb.afterReceive = (response, data) => {
    if (response.status === 401 || response.status === 403) {
        console.warn(`Intercepted a ${response.status} error. Session is invalid. Forcing logout and page reload.`);
        pb.authStore.clear();
        window.location.href = '/login?sessionExpired=true';
    }
    return data;
};
export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export const getFileUrl = (record, fieldName) => {
  if (!record || !fieldName || !record[fieldName]) return null;
  const filename = Array.isArray(record[fieldName]) ? record[fieldName][0] : record[fieldName];
  if (!filename) return null;
  return pb.files.getUrl(record, filename);
};

export const getAllFileUrls = (record, fieldName) => {
    if (!record || !fieldName || !record[fieldName] || record[fieldName].length === 0) {
        return [];
    }
    if (Array.isArray(record[fieldName])) {
        return record[fieldName].map(fileName => pb.files.getUrl(record, fileName));
    }
    return [pb.files.getUrl(record, record[fieldName])];
};

export const toLocalISOString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.valueOf() - tzoffset).toISOString().slice(0, 10);
    return localISOTime;
};

export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return 'Date not set';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export async function logErrorToPocketBase(errorDetails) {
  try {
    const logData = {
      date: new Date().toISOString(),
      log_date: new Date().toISOString(),
      message: errorDetails.message,
      stack: errorDetails.stack || 'N/A',
      source: errorDetails.source || 'Unknown',
      user_email: pb.authStore.model ? pb.authStore.model.email : 'anonymous',
      user_agent: navigator.userAgent,
    };
    await pb.collection('error_logs').create(logData);
  } catch (logError) {
    console.error("CRITICAL: Failed to log error to PocketBase:", logError);
    console.error("Original Error:", errorDetails);
  }
}

export const createActivityLog = async (description) => {
  try {
    const logData = {
      description: description,
      actor_email: pb.authStore.model?.email || 'System',
      log_date: new Date().toISOString(),
    };
    await pb.collection('activity_logs').create(logData);
  } catch (error) {
    console.error("Failed to create activity log:", error);
    logErrorToPocketBase({
        message: `Failed to create activity log for action: "${description}"`,
        stack: error.stack,
        source: 'createActivityLog',
    });
  }
};