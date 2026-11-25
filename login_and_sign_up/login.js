
const SIMON_LOGIN = {
  clientId: window.SIMON_GOOGLE_CLIENT_ID || "",
  token: null,
  user: null
};

function initializeGoogleLogin(callback) {
  if (!SIMON_LOGIN.clientId) {
    console.error("Google Client ID is missing.");
    return;
  }

  const start = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(start, 300);
      return;
    }

    google.accounts.id.initialize({
      client_id: SIMON_LOGIN.clientId,
      callback: response => {
        SIMON_LOGIN.token = response.credential;
        sessionStorage.setItem(
          "simon_google_token",
          response.credential
        );

        if (callback) callback(response.credential);
      }
    });

    google.accounts.id.renderButton(
      document.getElementById("googleButton"),
      {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with"
      }
    );
  };

  start();
}

function getGoogleToken() {
  return SIMON_LOGIN.token ||
    sessionStorage.getItem("simon_google_token");
}

function logoutGoogle() {
  sessionStorage.removeItem("simon_google_token");
  SIMON_LOGIN.token = null;
  SIMON_LOGIN.user = null;

  if (window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }

  location.reload();
}

window.SIMON_LOGIN = SIMON_LOGIN;
window.initializeGoogleLogin = initializeGoogleLogin;
window.getGoogleToken = getGoogleToken;
window.logoutGoogle = logoutGoogle;
    
