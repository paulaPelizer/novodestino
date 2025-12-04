const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


let users = [
  {
    id: 1,
    name: "Marcos",
    email: "marcos@example.com",
    password: "123456",
    type: "anunciante",
  },
  {
    id: 2,
    name: "Maria",
    email: "maria@example.com",
    password: "123456",
    type: "interessado",
  },
];

let nextUserId = 3;

let items = [
  {
    id: 1,
    title: "Telhas romanas - 100 m²",
    description:
      "Telhas romanas usadas, em bom estado. Retiradas de um telhado antigo, sem trincas visíveis.",
    category: "Materiais de construção",
    location: "Belo Horizonte / MG",
    duration: "15 dias",
    quantity: "100 m²",
    owner: "Marcos",
    status: "Ativo",
    image: "/img/telhas.jpg",
  },
  {
    id: 2,
    title: "Livros de Engenharia e TI",
    description:
      "Caixa com livros técnicos de programação, bancos de dados e engenharia de software.",
    category: "Livros",
    location: "Contagem / MG",
    duration: "1 semana",
    quantity: "1 caixa (aprox. 20 livros)",
    owner: "Marcos",
    status: "Ativo",
    image: "/img/livros.jpg",
  },
  {
    id: 3,
    title: "Monitor 21'' usado",
    description: "Monitor antigo, mas funcionando. Ideal para segunda tela.",
    category: "Eletrônicos",
    location: "Betim / MG",
    duration: "24 horas",
    quantity: "1 unidade",
    owner: "Maria",
    status: "Ativo",
    image: "/img/monitor.jpg",
  },
];



let nextItemId = 4;

let bids = [];
let nextBidId = 1;

// ===============================
// Rotas de autenticação
// ===============================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  // Sem token, apenas devolve o usuário (simulação)
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
    },
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, type } = req.body || {};

  if (!name || !email || !password || !type) {
    return res
      .status(400)
      .json({ message: "Nome, e-mail, senha e perfil de uso são obrigatórios." });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res
      .status(409)
      .json({ message: "Já existe um usuário com este e-mail." });
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    password,
    type, // "anunciante" ou "interessado"
  };

  users.push(newUser);

  return res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
    },
  });
});



app.get("/api/items", (req, res) => {
  // aplicar filtros por query string futuramente
  res.json(items);
});

app.get("/api/items/:id", (req, res) => {
  const itemId = Number(req.params.id);
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ message: "Item não encontrado." });
  }

  const itemBids = bids.filter((b) => b.itemId === itemId);
  const bestBid = chooseWinningBid(itemBids);

  return res.json({
    item,
    bids: itemBids,
    bestBid: bestBid || null,
  });
});

app.post("/api/items", (req, res) => {
  const {
    title,
    description,
    category,
    location,
    duration,
    quantity,
    ownerName,
  } = req.body || {};

  if (!title || !category || !location || !duration || !quantity || !ownerName) {
    return res.status(400).json({
      message: "Título, categoria, localização, prazo, quantidade e dono são obrigatórios.",
    });
  }

  const newItem = {
    id: nextItemId++,
    title,
    description: description || "",
    category,
    location,
    duration,
    quantity,
    owner: ownerName,
    status: "Ativo",
    image: "/img/novo-item.jpg",
  };

  items.push(newItem);
  return res.status(201).json(newItem);
});



app.post("/api/bids", (req, res) => {
  const { itemId, type, amount, bidderName } = req.body || {};

  if (!itemId || !type || !bidderName) {
    return res.status(400).json({
      message: "Item, tipo de oferta e nome do interessado são obrigatórios.",
    });
  }

  // amount pode ser 0 em RETIRA_GRATIS
  if (type !== "RETIRA_GRATIS" && (amount === undefined || amount === null)) {
    return res.status(400).json({
      message: "Para este tipo de oferta, informe um valor.",
    });
  }

  const item = items.find((i) => i.id === Number(itemId));
  if (!item) {
    return res.status(404).json({ message: "Item não encontrado." });
  }

  const bid = {
    id: nextBidId++,
    itemId: item.id,
    type,
    amount: Number(amount) || 0,
    bidderName,
    createdAt: new Date().toISOString(),
  };

  bids.push(bid);

  return res.status(201).json(bid);
});


app.post("/api/items/:id/finalize", (req, res) => {
  const itemId = Number(req.params.id);
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ message: "Item não encontrado." });
  }

  const itemBids = bids.filter((b) => b.itemId === itemId);

  if (!itemBids.length) {
    item.status = "Cancelado";
    return res.json({
      item,
      message:
        `Nenhum lance foi encontrado para o item "${item.title}". ` +
        `Ele foi marcado como cancelado / sem acordo (simulação).`,
    });
  }

  const winningBid = chooseWinningBid(itemBids);

  if (!winningBid) {
    return res.status(500).json({
      message: "Não foi possível determinar um vencedor para este item.",
    });
  }

  item.status = "Negociado";

  const message =
    `Prazo encerrado para o item "${item.title}". ` +
    `Oferta vencedora: ${winningBid.bidderName}, formato ` +
    `"${formatBidType(winningBid.type)}"` +
    (winningBid.amount
      ? `, valor de R$ ${winningBid.amount.toFixed(2)}.`
      : ".") +
    ` Dono do item (${item.owner}) e vencedor seriam notificados para confirmar o acordo.`;

  return res.json({
    item,
    winningBid,
    message,
  });
});

function chooseWinningBid(bidsList) {
  if (!bidsList || !bidsList.length) return null;

  const payOwner = bidsList.filter((b) => b.type === "PAGA_PARA_DONO");
  if (payOwner.length) {
    return payOwner.reduce((prev, cur) =>
      cur.amount > prev.amount ? cur : prev
    );
  }

  const freePickup = bidsList.filter((b) => b.type === "RETIRA_GRATIS");
  if (freePickup.length) {
    return freePickup.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )[0];
  }

  const chargePickup = bidsList.filter((b) => b.type === "COBRA_PARA_RETIRAR");
  if (chargePickup.length) {
    return chargePickup.reduce((prev, cur) =>
      cur.amount < prev.amount ? cur : prev
    );
  }

  return null;
}

function formatBidType(type) {
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



const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Rota coringa para SPA (se recarregar em outras "telas")
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`NovoDestino rodando em http://localhost:${PORT}`);
});
