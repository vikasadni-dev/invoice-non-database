// --- DARK MODE TOGGLE ---
const themeToggle = document.getElementById('themeToggle');
const lightIcon = themeToggle.querySelector('.light-icon');
const darkIcon = themeToggle.querySelector('.dark-icon');

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    lightIcon.classList.add('hidden');
    darkIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
  }
  localStorage.setItem('darkMode', isDark);
}

// Listener toggle
themeToggle.addEventListener('click', () => {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
});

// Set awal sesuai localStorage
applyTheme(localStorage.getItem('darkMode') === 'true');
