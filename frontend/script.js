
import { pipeline } from
"https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

let generator = null;
let loadingModel = false;
let currentChat = crypto.randomUUID();
let messages = [];
let uploadedText = "";
let uploadedName = "";

const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const application = $("app");
const messageArea = $("messages");
const promptInput = $("prompt");
const sendButton = $("sendButton");

const MODEL = "onnx-community/SmolLM2-360M-Instruct";

function token() {
  return window.getGoogleToken?.();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: "Bearer " + token(),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function showApp(user) {
  loginScreen.classList.add("hidden");
  application.classList.remove("hidden");

  $("userName").textContent =
    user.name || "SIMON AI User";

  $("userEmail").textContent = user.email || "";

  $("avatar").textContent =
    (user.name || "S").charAt(0).toUpperCase();

  loadChatList();
}

async function verifyLogin() {
  if (!token()) return false;

  try {
    const user = await window.startSimonRegistration();
    showApp(user);
    return true;
  } catch (error) {
    sessionStorage.removeItem("simon_google_token");
    return false;
  }
}

async function initializeModel() {
  if (generator) return generator;
  if (loadingModel) {
    while (loadingModel) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return generator;
  }

  loadingModel = true;
  sendButton.disabled = true;
  sendButton.textContent = "…";

  try {
    generator = await pipeline(
      "text-generation",
      MODEL,
      {
        dtype: "q4",
        device: "wasm",
        progress_callback: data => {
          if (data.status === "progress") {
            sendButton.textContent =
              Math.round(data.progress || 0) + "%";
          }
        }
      }
    );

    return generator;
  } finally {
    loadingModel = false;
    sendButton.disabled = false;
    sendButton.textContent = "↑";
  }
}

function addMessage(role, content) {
  const welcome = $("welcome");
  if (welcome) welcome.remove();

  const div = document.createElement("div");
  div.className = "message " + role;

  const label = document.createElement("b");
  label.textContent = role === "user" ? "You" : "SIMON AI";

  const text = document.createElement("div");
  text.textContent = content;
  text.style.whiteSpace = "pre-wrap";

  div.append(label, text);
  messageArea.appendChild(div);
  messageArea.scrollTop = messageArea.scrollHeight;

  return div;
}

async function saveMessage(role, content) {
  return api("/api/chat/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: currentChat,
      role,
      message: content
    })
  });
}

async function generateAnswer(userText) {
  const model = await initializeModel();

  const memories = await api("/api/memory");

  const memoryText = (memories.memories || [])
    .map(item => "- " + item)
    .join("\n");

  const context = messages.slice(-8).map(m => ({
    role: m.role,
    content: m.content
  }));

  const system = {
    role: "system",
    content:
      "You are SIMON AI, a helpful AI assistant. " +
      "Answer clearly and accurately. " +
      "Help with programming, learning and creative tasks. " +
      "Use the following user memories when relevant:\n" +
      (memoryText || "No saved memories.")
  };

  if (uploadedText) {
    context.push({
      role: "user",
      content:
        "Uploaded file: " + uploadedName +
        "\nFile content:\n" + uploadedText
    });
  }

  context.push({
    role: "user",
    content: userText
  });

  const result = await model(
    [system, ...context],
    {
      max_new_tokens: 450,
      temperature: 0.7,
      do_sample: true
    }
  );

  const output = result[0]?.generated_text;

  if (Array.isArray(output)) {
    return output[output.length - 1]?.content ||
      "I could not generate a response.";
  }

  return String(output || "I could not generate a response.");
}

async function sendMessage() {
  const text = promptInput.value.trim();

  if (!text || sendButton.disabled) return;

  promptInput.value = "";
  promptInput.style.height = "auto";

  messages.push({ role: "user", content: text });
  addMessage("user", text);

  const placeholder = addMessage(
    "assistant",
    "SIMON AI is thinking..."
  );

  sendButton.disabled = true;

  try {
    await saveMessage("user", text);

    const answer = await generateAnswer(text);

    placeholder.lastChild.textContent = answer;

    messages.push({
      role: "assistant",
      content: answer
    });

    await saveMessage("assistant", answer);
    await loadChatList();

  } catch (error) {
    placeholder.lastChild.textContent =
      "Error: " + error.message;
  } finally {
    sendButton.disabled = false;
    messageArea.scrollTop = messageArea.scrollHeight;
  }
}

async function loadChatList() {
  try {
    const data = await api("/api/chats");
    const list = $("chatList");
    list.replaceChildren();

    Object.entries(data.chats || {})
      .reverse()
      .forEach(([id, history]) => {
        const button = document.createElement("button");
        button.className = "chat-item";
        button.textContent =
          history[0]?.content?.slice(0, 35) || "New chat";

        button.onclick = () => openChat(id);
        list.appendChild(button);
      });
  } catch (error) {
    console.error(error);
  }
}

async function openChat(id) {
  currentChat = id;
  messages = [];

  const data = await api(
    "/api/chat/history/" + encodeURIComponent(id)
  );

  messageArea.replaceChildren();

  for (const message of data.messages || []) {
    messages.push(message);
    addMessage(message.role, message.content);
  }
}

function newChat() {
  currentChat = crypto.randomUUID();
  messages = [];
  uploadedText = "";
  uploadedName = "";

  messageArea.replaceChildren();

  const welcome = document.createElement("div");
  welcome.id = "welcome";
  welcome.className = "welcome";
  welcome.innerHTML =
    '<div class="welcome-logo">S</div>' +
    '<h1>What can I help you with?</h1>' +
    '<p>Ask anything. Let’s create something amazing.</p>';

  messageArea.appendChild(welcome);
}

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token()
    },
    body: form
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  uploadedText = data.content;
  uploadedName = data.filename;

  $("attachmentPreview").textContent =
    "Attached: " + data.filename;
}

sendButton.addEventListener("click", sendMessage);

promptInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

promptInput.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height =
    Math.min(promptInput.scrollHeight, 160) + "px";
});

$("newChat").onclick = newChat;

$("uploadButton").onclick = () =>
  $("fileInput").click();

$("fileManagerUpload").onclick = () =>
  $("fileInput").click();

$("fileInput").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    await uploadFile(file);
    alert("File uploaded successfully.");
  } catch (error) {
    alert(error.message);
  }

  event.target.value = "";
};

$("logout").onclick = window.logoutGoogle;

$("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};

$("openSidebar").onclick = () =>
  $("sidebar").classList.add("open");

$("closeSidebar").onclick = () =>
  $("sidebar").classList.remove("open");

document.querySelectorAll(".suggestion").forEach(button => {
  button.onclick = () => {
    promptInput.value = button.textContent;
    sendMessage();
  };
});

window.addEventListener("DOMContentLoaded", async () => {
  initializeGoogleLogin(async () => {
    await verifyLogin();
  });

  if (token()) {
    await verifyLogin();
  }
});

window.SIMON = {
  api,
  addMessage,
  newChat,
  loadChatList
};
