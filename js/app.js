/**
 * ตัวจัดการหลักของเว็บ: สลับหน้า (SPA แบบ hash-routing), ไฮไลต์เมนู, และเปิด/ปิด sidebar บนมือถือ
 */
(function () {
  const PAGE_IDS = [
    'home',
    'wire-table',
    'conduit-fill',
    'breaker-table',
    'ac-load-table',
    'ground-wire-table',
    'calc-lighting',
    'calc-outlet',
    'calc-heater',
    'calc-ac',
    'calc-feeder',
    'calc-main',
  ];
  const DEFAULT_PAGE = 'home';

  const sections = {};
  PAGE_IDS.forEach((id) => {
    sections[id] = document.getElementById(`page-${id}`);
  });

  const navLinks = document.querySelectorAll('[data-nav]');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle = document.getElementById('sidebarToggle');

  function currentPageId() {
    const hash = window.location.hash.replace('#', '');
    return PAGE_IDS.includes(hash) ? hash : DEFAULT_PAGE;
  }

  function showPage(pageId) {
    PAGE_IDS.forEach((id) => {
      sections[id]?.classList.toggle('hidden', id !== pageId);
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${pageId}`;
      link.classList.toggle('active', isActive);
    });

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    closeSidebar();
  }

  function openSidebar() {
    sidebar?.classList.add('open');
    sidebarOverlay?.classList.remove('hidden');
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.add('hidden');
  }

  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay?.addEventListener('click', closeSidebar);

  window.addEventListener('hashchange', () => showPage(currentPageId()));

  showPage(currentPageId());
})();
