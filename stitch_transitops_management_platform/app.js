const TransitOps = (() => {
  const API_BASE_KEY = "transitops_api_base";
  const SESSION_KEY = "transitops_session";
  const DEFAULT_API_BASE = "http://127.0.0.1:8000";
  const ROLE_HOME = {
    fleet_manager: "fleet_manager_dashboard.html",
    driver: "trip_management_dispatch_workflow.html",
    safety_officer: "whether.html",
    financial_analyst: "analytics%20hub%20report.html",
  };

  function getApiBase() {
    return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE;
  }

  function setApiBase(value) {
    localStorage.setItem(API_BASE_KEY, (value || DEFAULT_API_BASE).replace(/\/$/, ""));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getToken() {
    return getSession()?.access_token || null;
  }

  function getHomeForRole(role) {
    return ROLE_HOME[role] || "fleet_manager_dashboard.html";
  }

  function redirectToHome() {
    const session = getSession();
    if (!session) {
      window.location.href = "auth%20login.html";
      return;
    }
    window.location.href = getHomeForRole(session.role);
  }

  function signOut() {
    clearSession();
    window.location.href = "auth%20login.html";
  }

  async function request(path, options = {}) {
    const config = { ...options };
    const headers = new Headers(options.headers || {});
    const token = getToken();

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (config.body && !(config.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    config.headers = headers;
    const response = await fetch(`${getApiBase()}${path}`, config);
    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const detail = typeof data === "string" ? data : data?.detail || data?.message || `Request failed (${response.status})`;
      if (response.status === 401) {
        clearSession();
      }
      throw new Error(detail);
    }

    return data;
  }

  function requireAuth(allowedRoles = []) {
    const session = getSession();
    if (!session?.access_token) {
      window.location.href = "auth%20login.html";
      return null;
    }

    if (allowedRoles.length && !allowedRoles.includes(session.role)) {
      alert(`This page is only available for: ${allowedRoles.join(", ")}`);
      window.location.href = getHomeForRole(session.role);
      return null;
    }

    return session;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function formatCurrency(value) {
    const num = Number(value || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
  }

  function statusTone(status) {
    const value = String(status || "").toLowerCase();
    if (value.includes("available") || value.includes("completed") || (value.includes("open") === false && value.includes("active"))) return "success";
    if (value.includes("trip") || value.includes("draft") || value.includes("pending") || value.includes("dispatched") || value.includes("moderate")) return "info";
    if (value.includes("shop") || value.includes("maintenance") || value.includes("warning")) return "warning";
    if (value.includes("retired") || value.includes("cancel") || value.includes("suspend") || value.includes("error") || value.includes("high")) return "danger";
    return "info";
  }

  function badge(status) {
    return `<span class="badge ${statusTone(status)}">${escapeHtml(status)}</span>`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  function fillSessionUi() {
    const session = getSession();
    if (!session) return;
    document.querySelectorAll("[data-session-role]").forEach((el) => {
      el.textContent = session.role;
    });
    document.querySelectorAll("[data-session-user]").forEach((el) => {
      el.textContent = session.email || session.user_id || "Authenticated user";
    });
    document.querySelectorAll("[data-api-base]").forEach((el) => {
      if ("value" in el) {
        el.value = getApiBase();
      } else {
        el.textContent = getApiBase();
      }
    });
  }

  function wireGlobalActions() {
    document.querySelectorAll("[data-signout]").forEach((button) => {
      button.addEventListener("click", signOut);
    });

    document.querySelectorAll("[data-go-home]").forEach((button) => {
      button.addEventListener("click", redirectToHome);
    });
  }

  async function initProtectedPage(options = {}) {
    const session = requireAuth(options.allowedRoles || []);
    if (!session) return null;
    fillSessionUi();
    wireGlobalActions();

    if (options.loadProfile !== false) {
      try {
        const profile = await request("/auth/me");
        document.querySelectorAll("[data-profile-name]").forEach((el) => {
          el.textContent = profile.name;
        });
        document.querySelectorAll("[data-profile-email]").forEach((el) => {
          el.textContent = profile.email;
        });
        document.querySelectorAll("[data-profile-role]").forEach((el) => {
          el.textContent = profile.role;
        });
        saveSession({ ...session, email: profile.email, name: profile.name, role: profile.role });
      } catch (error) {
        console.error(error);
      }
    }

    return session;
  }

  return {
    badge,
    clearSession,
    escapeHtml,
    fillSessionUi,
    formatCurrency,
    formatDate,
    getApiBase,
    getHomeForRole,
    getSession,
    initProtectedPage,
    redirectToHome,
    request,
    requireAuth,
    saveSession,
    setApiBase,
    setHtml,
    setText,
    signOut,
    wireGlobalActions,
  };
})();

window.TransitOps = TransitOps;
