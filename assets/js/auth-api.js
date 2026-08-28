function cacheClientInfo(user) {
  try {
    localStorage.setItem('ebClientInfo', JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      phoneCountry: user.phoneCountry,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      height: user.height,
      weight: user.weight,
    }));
  } catch (err) {
    /* localStorage unavailable */
  }
}

async function request(path, options) {
  const opts = options || {};
  const headers = Object.assign({}, opts.headers || {});
  const init = {
    method: opts.method || 'GET',
    credentials: 'same-origin',
    headers,
  };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getCurrentUser() {
  try {
    const data = await request('/api/me');
    if (data.user) cacheClientInfo(data.user);
    return data.user;
  } catch (err) {
    return null;
  }
}

export async function register(payload) {
  const data = await request('/api/register', { method: 'POST', body: payload });
  if (data.user) cacheClientInfo(data.user);
  return data.user;
}

export async function login(payload) {
  const data = await request('/api/login', { method: 'POST', body: payload });
  if (data.user) cacheClientInfo(data.user);
  return data.user;
}

export async function logout() {
  try {
    localStorage.removeItem('ebClientInfo');
  } catch (err) {
    /* ignore */
  }
  await request('/api/logout', { method: 'POST', body: {} });
}
