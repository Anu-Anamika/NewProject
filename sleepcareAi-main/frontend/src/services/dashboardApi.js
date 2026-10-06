const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Fetch authenticated user dashboard data from Django backend.
 */
export async function getDashboardData() {
  const res = await fetch(`${API_BASE}/api/dashboard/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) {
    const err = new Error('Authentication required.');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Failed to load dashboard data (Status ${res.status})`);
  }

  return res.json();
}
