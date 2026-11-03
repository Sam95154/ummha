/* MOMIN public account deletion flow.
   Email verification proves account control. The final delete still uses the
   existing JWT-protected momin-delete-account Edge Function. */
(function () {
  "use strict";
  var SUPABASE_URL = "https://qzwqpiquvhpjwqgaxorp.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SAHjdts8xtuQSXE_lPa1cw_V6J3PjQt";
  var requestForm = document.getElementById("request-form");
  var confirmForm = document.getElementById("confirm-form");
  var emailInput = document.getElementById("account-email");
  var sendButton = document.getElementById("send-link");
  var deleteButton = document.getElementById("delete-button");
  var requestStatus = document.getElementById("request-status");
  var resultStatus = document.getElementById("result-status");
  var confirmPanel = document.getElementById("confirm-panel");
  var verifiedEmail = document.getElementById("verified-email");
  var activeClient = null;
  var callbackInUrl = new URLSearchParams(window.location.search).has("code") || window.location.hash.indexOf("access_token=") >= 0;
  var pendingEmailKey = "momin.delete.pendingEmail.v1";

  function showStatus(element, message, isError) {
    element.textContent = message;
    element.classList.remove("hidden", "error");
    if (isError) element.classList.add("error");
  }
  function clearStatus(element) {
    element.textContent = "";
    element.classList.add("hidden");
    element.classList.remove("error");
  }
  function showVerifiedAccount(user) {
    if (!user || !user.email) {
      showStatus(resultStatus, "The verification session did not include an account email. Request a new link or contact MOMIN Support.", true);
      return;
    }
    verifiedEmail.textContent = user.email;
    requestForm.classList.add("hidden");
    requestStatus.classList.add("hidden");
    confirmPanel.classList.remove("hidden");
    clearStatus(resultStatus);
    try { window.history.replaceState(null, document.title, window.location.pathname); } catch (_) {}
  }
  async function initialise() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showStatus(requestStatus, "The secure account service could not be loaded. Refresh the page or contact MOMIN Support.", true);
      return;
    }
    activeClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
    });
    var result = await activeClient.auth.getSession();
    if (result.error) {
      showStatus(requestStatus, "The verification link could not be checked. Request a new link and open it in the same browser.", true);
      return;
    }
    if (result.data && result.data.session && result.data.session.user && callbackInUrl) {
      var pendingEmail = "";
      try { pendingEmail = String(window.sessionStorage.getItem(pendingEmailKey) || "").trim().toLowerCase(); } catch (_) {}
      var verifiedAddress = String(result.data.session.user.email || "").trim().toLowerCase();
      if (pendingEmail && pendingEmail !== verifiedAddress) {
        showStatus(requestStatus, "The verified email does not match the address used for this deletion request. Sign out of the other account and request a new link for the correct MOMIN email.", true);
        return;
      }
      try { window.sessionStorage.removeItem(pendingEmailKey); } catch (_) {}
      showVerifiedAccount(result.data.session.user);
      return;
    }
    if (result.data && result.data.session && result.data.session.user && !callbackInUrl) {
      showStatus(requestStatus, "For your security, use a fresh email verification link from this page before requesting deletion.", false);
    } else if (callbackInUrl) {
      showStatus(requestStatus, "The verification link was not accepted. It may have expired or been opened in a different browser. Request a new link and open it in the browser where you started.", true);
    }
  }
  requestForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus(requestStatus);
    clearStatus(resultStatus);
    if (!activeClient) {
      showStatus(requestStatus, "The secure account service is unavailable. Refresh the page and try again.", true);
      return;
    }
    var email = String(emailInput.value || "").trim().toLowerCase();
    if (!email || !emailInput.validity.valid) {
      emailInput.focus();
      showStatus(requestStatus, "Enter a valid email address.", true);
      return;
    }
    sendButton.disabled = true;
    sendButton.textContent = "Sending…";
    try {
      var response = await activeClient.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin + "/delete-account.html"
        }
      });
      // Keep the response identical for known, unknown, and rate-limited addresses.
      if (!response.error) {
        try { window.sessionStorage.setItem(pendingEmailKey, email); } catch (_) {}
      }
      emailInput.value = "";
      showStatus(requestStatus, "If this email is linked to an eligible MOMIN account, a one-time verification link will be sent. Open it, then review the verified account and confirm the deletion. If it does not arrive, wait before retrying or contact MOMIN Support.", false);
    } catch (_) {
      // Network failures use the same response so the page does not disclose account existence.
      emailInput.value = "";
      showStatus(requestStatus, "If this email is linked to an eligible MOMIN account, a one-time verification link will be sent. Open it, then review the verified account and confirm the deletion. If it does not arrive, wait before retrying or contact MOMIN Support.", false);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send verification link";
    }
  });
  confirmForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus(resultStatus);
    var checkbox = document.getElementById("confirm-checkbox");
    if (!checkbox.checked) {
      showStatus(resultStatus, "Confirm that you understand the deletion is permanent before continuing.", true);
      checkbox.focus();
      return;
    }
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting account…";
    try {
      var response = await activeClient.functions.invoke("momin-delete-account", { body: {} });
      if (response.error || !response.data || response.data.success !== true) {
        throw new Error("The account deletion service did not confirm completion.");
      }
      await activeClient.auth.signOut({ scope: "local" });
      confirmPanel.classList.add("hidden");
      requestForm.classList.add("hidden");
      showStatus(resultStatus, "Your MOMIN account deletion was completed. Account-owned profile, complaint, device, push and notification data were removed. Limited contribution-ledger records may be retained without the account identifier as explained in the Privacy Policy.", false);
    } catch (_) {
      showStatus(resultStatus, "MOMIN could not confirm that deletion was completed. Your request has not been reported as successful. Please try again while the verified session is active or contact MOMIN Support.", true);
      deleteButton.disabled = false;
      deleteButton.textContent = "Permanently delete my account";
    }
  });
  initialise().catch(function () {
    showStatus(requestStatus, "The secure account service could not be reached. Refresh the page or contact MOMIN Support.", true);
  });
})();