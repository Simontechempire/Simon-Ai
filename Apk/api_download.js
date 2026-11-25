
async function downloadSimonFile(filename, content) {
  const token = window.getGoogleToken();

  const response = await fetch("/api/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      filename,
      content
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

window.downloadSimonFile = downloadSimonFile;
    
