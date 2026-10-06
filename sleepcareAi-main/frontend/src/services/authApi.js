const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Helper to retrieve cookie value by name from document.cookie.
 */
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

let cachedCsrfToken = null;

/**
 * Ensures CSRF cookie is present by requesting the backend CSRF endpoint.
 * Returns the CSRF token string.
 */
export async function getCsrfToken(forceRefresh = false) {
  if (!forceRefresh) {
    let token = getCookie('csrftoken');
    if (token) {
      cachedCsrfToken = token;
      return token;
    }
    if (cachedCsrfToken) {
      return cachedCsrfToken;
    }
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      const token = data.csrfToken || getCookie('csrftoken');
      cachedCsrfToken = token;
      return token;
    }
  } catch {
    // fall through to cookie/cache fallback
  }

  return getCookie('csrftoken') || cachedCsrfToken || '';
}

/**
 * GET current authenticated user from Django session
 */
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/api/auth/me/`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    return { authenticated: false };
  }
  return await res.json();
}

/**
 * POST login with username and password
 */
export async function loginApi(username, password) {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Invalid username or password.');
  }

  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  } else {
    cachedCsrfToken = getCookie('csrftoken');
  }

  return data;
}

/**
 * POST register new user account
 */
export async function registerApi({ username, email, password, password_confirm, privacy_consent }) {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_URL}/api/auth/register/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({
      username,
      email,
      password,
      password_confirm,
      privacy_consent: Boolean(privacy_consent),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed. Please check your information.');
  }

  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  } else {
    cachedCsrfToken = getCookie('csrftoken');
  }

  return data;
}


/**
 * POST logout and invalidate Django session
 */
export async function logoutApi() {
  const csrfToken = await getCsrfToken();
  cachedCsrfToken = null;

  try {
    await fetch(`${API_URL}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
    });
  } catch {
    // Logout network failure — session is cleared locally regardless
  }
}

/**
 * POST request password reset link
 */
export async function requestPasswordResetApi(email) {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_URL}/api/auth/password-reset/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request password reset.');
  }

  return data;
}
