window.addEventListener('DOMContentLoaded', () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('installBtn');
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', () => {
      installBtn.style.display = 'none';
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then(choice => {
        console.log(choice.outcome);
        deferredPrompt = null;
      });
    });
  });

  const welcomeBanner = document.getElementById('welcomeBanner');
  welcomeBanner.textContent = "Install the app for faster, offline access!";
  welcomeBanner.style.display = 'block';
});
