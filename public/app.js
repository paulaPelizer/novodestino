

let currentUser = null;
let itemsData = [];
let itemModalInstance = null;



document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("itemModal");
  if (modalEl) {
    itemModalInstance = new bootstrap.Modal(modalEl);
  }

  setupAuthForms();
  setupItemForm();
  setupBidForm();

  showSection("landing");
  loadItems();
});



function showSection(section) {
  const sections = ["landing", "login", "register", "dashboard"];
  sections.forEach((s) => {
    const el = document.getElementById(`section-${s}`);
    if (!el) return;
    el.classList.toggle("d-none", s !== section);
  });

  setGlobalMessage("");

  if (section === "dashboard") {
    updateDashboardByProfile();
    loadItems();
  }
}

function scrollToHow() {
  const el = document.getElementById("como-funciona");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

// ===============================
// Mensagens globais
// ===============================

function setGlobalMessage(message, type = "info") {
  const container = document.getElementById("global-messages");
  if (!container) return;

  if (!message) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
}



function setupAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const welcomeSpan = document.getElementById("welcome-user-name");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          setGlobalMessage("E-mail ou senha inválidos.", "danger");
          return;
        }

        const data = await res.json();
        currentUser = data.user;

        if (welcomeSpan) {
          welcomeSpan.textContent = currentUser.name;
        }

        updateDashboardByProfile();
        setGlobalMessage("Login realizado com sucesso!", "success");
        showSection("dashboard");
      } catch (err) {
        console.error(err);
        setGlobalMessage(
          "Erro ao tentar fazer login. Tente novamente.",
          "danger"
        );
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();
      const type = document.getElementById("reg-type").value;

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, type }),
        });

        if (!res.ok) {
          const errData = await res.json();
          setGlobalMessage(errData.message || "Erro no cadastro.", "warning");
          return;
        }

        registerForm.reset();
        setGlobalMessage("Cadastro realizado! Agora faça login.", "success");
        showSection("login");
      } catch (err) {
        console.error(err);
        setGlobalMessage(
          "Erro ao tentar cadastrar. Tente novamente.",
          "danger"
        );
      }
    });
  }
}

function logout() {
  currentUser = null;
  updateDashboardByProfile();
  setGlobalMessage("Você saiu do sistema.", "secondary");
  showSection("landing");
}

// ===============================
// Ajuste da UI por perfil
// ===============================

function updateDashboardByProfile() {
  const card = document.getElementById("item-form-card");
  const profileSpan = document.getElementById("welcome-user-profile");

  if (!card) return;

  if (!currentUser) {
    card.classList.add("d-none");
    if (profileSpan) profileSpan.textContent = "";
    return;
  }

  if (currentUser.type === "anunciante") {
    card.classList.remove("d-none");
    if (profileSpan) profileSpan.textContent = "(Perfil: Anunciante)";
  } else {
    card.classList.add("d-none");
    if (profileSpan) profileSpan.textContent = "(Perfil: Interessado)";
  }
}

// ===============================
// Carregar itens do backend
// ===============================

async function loadItems() {
  try {
    const res = await fetch("/api/items");
    if (!res.ok) {
      setGlobalMessage("Não foi possível carregar os itens.", "danger");
      return;
    }
    itemsData = await res.json();
    populateCategoryFilter();
    applyFilters();
  } catch (err) {
    console.error(err);
    setGlobalMessage("Erro ao carregar itens.", "danger");
  }
}

// ===============================
// Itens - renderização e filtros
// ===============================

function renderItems(list) {
  const tbody = document.getElementById("items-table-body");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          Nenhum item encontrado para os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((item) => {
      const canFinalize =
        currentUser &&
        currentUser.type === "anunciante" &&
        item.status === "Ativo";


      return `
    <tr>
      <td>
        <strong>${item.title}</strong><br />
        <small class="text-muted">${(item.description || "").substring(0, 60)}...</small>
      </td>
      <td>${item.category}</td>
      <td>${item.location}</td>
      <td>${item.duration}</td>
      <td>${renderStatusBadge(item.status)}</td>
      <td class="text-end">
        <button
          class="btn btn-sm btn-outline-primary me-2"
          onclick="openItemModal(${item.id})"
        >
          Ver detalhes
        </button>
        ${
          canFinalize
            ? `<button
                class="btn btn-sm btn-outline-success"
                onclick="finalizeItem(${item.id})"
              >
                Encerrar oferta
              </button>`
            : ""
        }
      </td>
    </tr>
  `;
    })
    .join("");
}

function renderStatusBadge(status) {
  if (status === "Ativo") {
    return `<span class="badge bg-success">Ativo</span>`;
  }
  if (status === "Negociado") {
    return `<span class="badge bg-primary">Negociado</span>`;
  }
  if (status === "Cancelado") {
    return `<span class="badge bg-secondary">Cancelado / Sem acordo</span>`;
  }
  return `<span class="badge bg-light text-dark">${status}</span>`;
}

function populateCategoryFilter() {
  const select = document.getElementById("filter-category");
  if (!select) return;

  select.innerHTML = '<option value="">Todas</option>';

  const categories = Array.from(new Set(itemsData.map((i) => i.category))).sort();

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const text = document.getElementById("filter-text").value.toLowerCase();
  const category = document.getElementById("filter-category").value;
  const status = document.getElementById("filter-status").value;

  const filtered = itemsData.filter((item) => {
    const matchesText =
      !text ||
      item.title.toLowerCase().includes(text) ||
      (item.description || "").toLowerCase().includes(text);
    const matchesCategory = !category || item.category === category;
    const matchesStatus = !status || item.status === status;

    return matchesText && matchesCategory && matchesStatus;
  });

  renderItems(filtered);
}

function resetFilters() {
  document.getElementById("filter-text").value = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-status").value = "";
  renderItems(itemsData);
}

// ===============================
// Cadastro rápido de item (apenas anunciante)
// ===============================

function setupItemForm() {
  const form = document.getElementById("item-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setGlobalMessage(
        "Você precisa estar logado para cadastrar um item.",
        "warning"
      );
      return;
    }

    if (currentUser.type !== "anunciante") {
      setGlobalMessage(
        "Apenas usuários com perfil Anunciante podem cadastrar itens.",
        "warning"
      );
      return;
    }

    const title = document.getElementById("item-title").value.trim();
    const category = document.getElementById("item-category").value.trim();
    const duration = document.getElementById("item-duration").value;
    const location = document.getElementById("item-location").value.trim();
    const quantity = document.getElementById("item-quantity").value.trim();
    const description = document
      .getElementById("item-description")
      .value.trim();

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          duration,
          location,
          quantity,
          description,
          ownerName: currentUser.name,
        }),
      });

      if (!res.ok) {
        setGlobalMessage(
          "Não foi possível cadastrar o item (simulação).",
          "danger"
        );
        return;
      }

      const newItem = await res.json();
      itemsData.push(newItem);
      populateCategoryFilter();
      applyFilters();
      form.reset();

      setGlobalMessage("Item cadastrado com sucesso (simulação)!", "success");
    } catch (err) {
      console.error(err);
      setGlobalMessage(
        "Erro ao tentar cadastrar o item.",
        "danger"
      );
    }
  });
}

// ===============================
// Modal de item e lances
// ===============================

async function openItemModal(itemId) {
  try {
    const res = await fetch(`/api/items/${itemId}`);
    if (!res.ok) {
      setGlobalMessage("Não foi possível carregar os detalhes do item.", "danger");
      return;
    }

    const data = await res.json();
    const item = data.item;

    document.getElementById("modal-item-title").textContent = item.title;
    document.getElementById("modal-item-category").textContent = item.category;
    document.getElementById("modal-item-duration").textContent = item.duration;
    document.getElementById("modal-item-location").textContent = item.location;
    document.getElementById("modal-item-quantity").textContent = item.quantity;
    document.getElementById("modal-item-owner").textContent = item.owner;
    document.getElementById("modal-item-description").textContent =
      item.description || "";
    document.getElementById("modal-item-image").src = item.image;
    document.getElementById("modal-item-image").alt = item.title;

    document.getElementById("bid-item-id").value = item.id;
    document.getElementById("bid-form").reset();
    setBidMessage("");

    renderBids(data);

    if (itemModalInstance) {
      itemModalInstance.show();
    }
  } catch (err) {
    console.error(err);
    setGlobalMessage("Erro ao carregar os detalhes do item.", "danger");
  }
}

function renderBids(data) {
  const container = document.getElementById("bids-list-container");
  const summaryEl = document.getElementById("best-bid-summary");

  const bids = data.bids || [];
  const bestBid = data.bestBid || null;

  if (!bids.length) {
    container.innerHTML =
      '<p class="text-muted mb-0">Ainda não há lances para este item.</p>';
    summaryEl.innerHTML =
      '<div class="alert alert-light border mb-0 small">Sem lances registrados até o momento.</div>';
    return;
  }

  const listHtml =
    '<ul class="list-group mb-2">' +
    bids
      .map((b) => {
        const formattedAmount =
          b.amount && b.amount > 0 ? `R$ ${b.amount.toFixed(2)}` : "R$ 0,00";
        const typeLabel = formatBidTypeLabel(b.type);
        const dateStr = new Date(b.createdAt).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        });

        const isBest = bestBid && bestBid.id === b.id;
        const bestBadge = isBest
          ? '<span class="badge bg-success ms-2">Melhor oferta</span>'
          : "";

        return `
          <li class="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <strong>${b.bidderName}</strong> ${bestBadge}<br />
              <span class="text-muted">${typeLabel}</span>
            </div>
            <div class="text-end">
              <div>${formattedAmount}</div>
              <small class="text-muted">${dateStr}</small>
            </div>
          </li>
        `;
      })
      .join("") +
    "</ul>";

  container.innerHTML = listHtml;

  if (bestBid) {
    const formattedAmount =
      bestBid.amount && bestBid.amount > 0
        ? `R$ ${bestBid.amount.toFixed(2)}`
        : "R$ 0,00";

    summaryEl.innerHTML = `
      <div class="alert alert-success mb-0 small">
        <strong>Maior lance atual:</strong> ${bestBid.bidderName} —
        ${formattedAmount} (${formatBidTypeLabel(bestBid.type)})
      </div>
    `;
  } else {
    summaryEl.innerHTML =
      '<div class="alert alert-light border mb-0 small">Sem lances registrados até o momento.</div>';
  }
}

function formatBidTypeLabel(type) {
  switch (type) {
    case "PAGA_PARA_DONO":
      return "Paga pelo item e retira no local";
    case "RETIRA_GRATIS":
      return "Retira no local sem pagar pelo item";
    case "COBRA_PARA_RETIRAR":
      return "Cobra para retirar e dar destino adequado";
    default:
      return type;
  }
}


function setupBidForm() {
  const form = document.getElementById("bid-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const itemId = Number(document.getElementById("bid-item-id").value);
    const type = document.getElementById("bid-type").value;
    const amountRaw = document.getElementById("bid-amount").value;
    const bidderName = document
      .getElementById("bid-bidder-name")
      .value.trim();

    if (!type) {
      setBidMessage("Selecione um tipo de oferta.", "danger");
      return;
    }

    if (!bidderName) {
      setBidMessage("Informe seu nome ou nome da empresa.", "danger");
      return;
    }

    let amount = Number(amountRaw);
    if (type !== "RETIRA_GRATIS" && (!amount || amount <= 0)) {
      setBidMessage(
        "Para este tipo de oferta, informe um valor em reais.",
        "danger"
      );
      return;
    }

    if (type === "RETIRA_GRATIS") {
      amount = 0;
    }

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          type,
          amount,
          bidderName,
        }),
      });

      if (!res.ok) {
        setBidMessage(
          "Não foi possível registrar o lance (simulação).",
          "danger"
        );
        return;
      }

      await res.json();

      setBidMessage("Lance registrado com sucesso (simulação)!", "success");

      setTimeout(() => {
        refreshItemBids(itemId);
      }, 300);
    } catch (err) {
      console.error(err);
      setBidMessage(
        "Erro ao tentar registrar o lance.",
        "danger"
      );
    }
  });
}

async function refreshItemBids(itemId) {
  try {
    const res = await fetch(`/api/items/${itemId}`);
    if (!res.ok) return;
    const data = await res.json();
    renderBids(data);
  } catch (err) {
    console.error(err);
  }
}

function setBidMessage(message, type = "info") {
  const container = document.getElementById("bid-messages");
  if (!container) return;

  if (!message) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
}

// ===============================
// Encerramento de oferta (apenas anunciante dono do item)
// ===============================

async function finalizeItem(itemId) {
  if (!currentUser || currentUser.type !== "anunciante") {
    setGlobalMessage(
      "Apenas anunciantes podem encerrar ofertas (simulação de regra de permissão).",
      "warning"
    );
    return;
  }

  try {
    const res = await fetch(`/api/items/${itemId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      setGlobalMessage(
        "Não foi possível encerrar a oferta (simulação).",
        "danger"
      );
      return;
    }

    const data = await res.json();

    const idx = itemsData.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      itemsData[idx] = data.item;
    }
    applyFilters();

    setGlobalMessage(data.message, "success");
  } catch (err) {
    console.error(err);
    setGlobalMessage(
      "Erro ao tentar encerrar a oferta.",
      "danger"
    );
  }
}
