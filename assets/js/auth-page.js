import { login, register } from './auth-api.js';

const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');

function getPillValue(group) {
  const active = group.querySelector('.pill.active');
  return active ? active.dataset.value : '';
}

function showThanks(title, message) {
  document.getElementById('thanksTitle').textContent = title;
  document.getElementById('thanksMsg').textContent = message;
  document.getElementById('thanksOverlay').classList.add('active');
}

function showError(el, btn, message) {
  el.textContent = message;
  el.classList.add('show');
  btn.classList.add('shake');
  setTimeout(() => btn.classList.remove('shake'), 400);
}

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = (fd.get('email') || '').trim();
  const password = (fd.get('password') || '').trim();
  const remember = document.getElementById('rememberLine').classList.contains('checked');
  const err = document.getElementById('signinErr');
  const btn = document.getElementById('signinSubmit');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailOk || password.length < 1) {
    showError(err, btn, 'Please enter a valid email and password.');
    document.getElementById(emailOk ? 'signinPw' : 'signinEmail').focus();
    return;
  }

  err.classList.remove('show');
  btn.disabled = true;
  try {
    const user = await login({ email, password, remember });
    const first = (user.fullName || '').split(' ')[0] || 'there';
    showThanks('Welcome Back', `You're in, ${first}. Taking you to your program.`);
    setTimeout(() => { window.location.href = 'nutrition-assessment-updated.html'; }, 1400);
  } catch (ex) {
    showError(err, btn, ex.message || 'Could not sign in.');
    btn.disabled = false;
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const fullName = (fd.get('fullName') || '').trim();
  const email = (fd.get('email') || '').trim();
  const phoneCountry = (fd.get('phoneCountry') || '').trim();
  const phone = (fd.get('phone') || '').trim();
  const dob = (fd.get('dob') || '').trim();
  const gender = getPillValue(document.getElementById('signupGender'));
  const address = (fd.get('address') || '').trim();
  const height = (fd.get('height') || '').trim();
  const weight = (fd.get('weight') || '').trim();
  const password = (fd.get('password') || '').trim();
  const confirmPassword = (fd.get('confirmPassword') || '').trim();
  const termsChecked = document.getElementById('termsLine').classList.contains('checked');
  const err = document.getElementById('signupErr');
  const btn = document.getElementById('signupSubmit');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  let message = 'Please complete all fields correctly.';
  let valid = true;

  if (!fullName || !emailOk || !phone || !dob || !gender || !address || !height || !weight || password.length < 8) valid = false;
  if (password !== confirmPassword) { valid = false; message = 'Passwords do not match.'; }
  if (!termsChecked) { valid = false; message = 'Please agree to the Terms & Privacy Policy.'; }

  if (!valid) {
    showError(err, btn, message);
    const firstInvalid = [
      ['signupName', fullName], ['signupEmail', emailOk], ['signupPhone', phone],
      ['signupDob', dob], ['signupAddress', address], ['signupHeight', height],
      ['signupWeight', weight], ['signupPw', password.length >= 8], ['confirmPw', password === confirmPassword]
    ].find((pair) => !pair[1]);
    if (firstInvalid) document.getElementById(firstInvalid[0]).focus();
    return;
  }

  err.classList.remove('show');
  btn.disabled = true;
  try {
    const user = await register({
      fullName, email, phoneCountry, phone, dob, gender, address, height, weight, password,
    });
    const first = (user.fullName || fullName).split(' ')[0];
    showThanks('Account Created', `Welcome, ${first}. Taking you to your nutrition assessment now.`);
    setTimeout(() => { window.location.href = 'nutrition-assessment-updated.html'; }, 1800);
  } catch (ex) {
    showError(err, btn, ex.message || 'Could not create the account.');
    btn.disabled = false;
  }
});
