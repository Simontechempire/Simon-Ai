
const dashboard = {
  async loadMemory() {
    const data = await SIMON.api("/api/memory");
    const list = document.getElementById("memoryList");
    list.replaceChildren();

    (data.memories || []).forEach((memory, index) => {
      const item = document.createElement("div");
      item.className = "memory-item";

      const text = document.createElement("p");
      text.textContent = memory;

      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.onclick = async () => {
        await SIMON.api("/api/memory/" + index, {
          method: "DELETE"
        });
        dashboard.loadMemory();
      };

      item.append(text, remove);
      list.appendChild(item);
    });
  },

  async saveMemory() {
    const input = document.getElementById("memoryInput");
    const memory = input.value.trim();

    if (!memory) return;

    await SIMON.api("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory })
    });

    input.value = "";
    await dashboard.loadMemory();
    alert("Memory saved.");
  },

  showView(name) {
    const views = {
      chats: "chatView",
      memory: "memoryView",
      files: "filesView",
      api: "apiView"
    };

    Object.values(views).forEach(id => {
      document.getElementById(id).classList.add("hidden");
    });

    document.getElementById(views[name] || "chatView")
      .classList.remove("hidden");

    document.getElementById("pageTitle").textContent =
      "SIMON AI — " + name.toUpperCase();

    if (name === "memory") dashboard.loadMemory();
  },

  async testAPI() {
    const response = await fetch("/api/health");
    const data = await response.json();

    document.getElementById("apiResult").textContent =
      JSON.stringify(data, null, 2);
  }
};

document.getElementById("saveMemory").onclick =
  dashboard.saveMemory;

document.getElementById("apiTest").onclick =
  dashboard.testAPI;

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    dashboard.showView(button.dataset.view);
    document.getElementById("sidebar").classList.remove("open");
  });
});

window.SIMON_DASHBOARD = dashboard;
  
