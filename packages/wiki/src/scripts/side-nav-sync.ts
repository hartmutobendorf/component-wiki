/**
 * Synchronises the side-navigation web component with Astro page transitions.
 *
 * Responsibilities:
 * - Updates `current-slug` and `nav-data` attributes after each page load
 * - Persists and restores the sidebar scroll position across navigations
 */

// Update the side navigation on page navigation
document.addEventListener("astro:page-load", () => {
  const sidebar = document.querySelector("side-navigation");
  if (sidebar) {
    // Get the current slug from the URL, removing leading slash
    const currentSlug = window.location.pathname.substring(1) || "";
    sidebar.setAttribute("current-slug", currentSlug);

    // Update nav-data from the embedded data for the current tier
    const navDataEl = document.getElementById("nav-data");
    if (navDataEl) {
      sidebar.setAttribute("nav-data", navDataEl.textContent || "{}");
    }

    // Restore scroll position
    if (sidebar.shadowRoot) {
      const drawerWrapper = sidebar.shadowRoot.getElementById("drawer");
      const drawerNav = sidebar.shadowRoot.querySelector(
        ".p-side-navigation__drawer",
      );

      const savedPosition = sessionStorage.getItem("sideNavScrollPosition");
      if (savedPosition) {
        const scrollTop = parseInt(savedPosition, 10);
        // Try restoring to wrapper first (desktop), then nav (mobile)
        if (
          drawerWrapper &&
          drawerWrapper.scrollHeight > drawerWrapper.clientHeight
        ) {
          drawerWrapper.scrollTop = scrollTop;
        } else if (drawerNav) {
          drawerNav.scrollTop = scrollTop;
        }
      }
    }
  }
});

// Save scroll position before navigation
document.addEventListener("astro:before-swap", () => {
  const sidebar = document.querySelector("side-navigation");
  if (sidebar && sidebar.shadowRoot) {
    const drawerWrapper = sidebar.shadowRoot.getElementById("drawer");
    const drawerNav = sidebar.shadowRoot.querySelector(
      ".p-side-navigation__drawer",
    );

    let scrollTop = 0;
    if (drawerWrapper && drawerWrapper.scrollTop > 0) {
      scrollTop = drawerWrapper.scrollTop;
    } else if (drawerNav && drawerNav.scrollTop > 0) {
      scrollTop = drawerNav.scrollTop;
    }

    if (scrollTop > 0) {
      sessionStorage.setItem("sideNavScrollPosition", scrollTop.toString());
    } else {
      sessionStorage.removeItem("sideNavScrollPosition");
    }
  }
});
