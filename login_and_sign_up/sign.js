function startSimonRegistration() {
  const token = window.getGoogleToken?.();

  if (!token) {
    alert("Please sign in with Google first.");
    return;
  }

  return fetch("/api/account", {
    headers: {
      Authorization: "Bearer " + token
    }
  }).then(async response => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Account verification failed");
    }

    return data;
  });
}

window.startSimonRegistration = startSimonRegistration;
