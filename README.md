# 🟩 NovoDestino – Protótipo funcional para a Fase 2 | MoviTalent

O **NovoDestino** é um protótipo funcional desenvolvido como solução para o desafio da Fase 2 do programa MoviTalent.  
O sistema conecta pessoas e empresas que desejam se desfazer de itens — como materiais de construção, móveis, eletrônicos ou sucata — com usuários que podem reutilizar, reciclar ou dar destino adequado aos materiais.

O objetivo é evitar desperdício, reduzir custos e promover reutilização inteligente de recursos.

---

## 🚀 Funcionalidades principais

### 👤 Perfis de usuário
- **Anunciante**  
  Pode cadastrar itens, acompanhar ofertas recebidas e encerrar negociações.
- **Interessado**  
  Pode pesquisar itens e enviar lances nas três modalidades previstas no desafio.

### 📦 Cadastro e listagem de itens
- Cadastro de itens com:
  - título  
  - descrição  
  - categoria  
  - quantidade / volume  
  - local  
  - duração da oferta (24h, 1 semana, 15 dias ou 1 mês)  
- Listagem completa com filtros por:
  - texto  
  - categoria  
  - status  

### 💬 Lances (ofertas)
Os interessados podem registrar três tipos de oferta:
1. **Paga pelo item** e retira no local  
2. **Retira gratuitamente**  
3. **Cobra para retirar** e fazer o descarte adequado  

O backend calcula automaticamente o **melhor lance**, seguindo exatamente as regras do enunciado.

### 🔒 Encerramento da oferta
Apenas usuários com perfil **Anunciante** podem encerrar uma oferta ativa.  
Ao encerrar:
- o sistema escolhe automaticamente o lance vencedor  
- atualiza o status para *Negociado* ou *Cancelado / Sem acordo*

---

## 🧩 Arquitetura e Tecnologias

Este protótipo respeita totalmente as tecnologias permitidas no desafio:

### 🌐 Frontend
- **HTML5**
- **CSS3 + Bootstrap**
- **JavaScript puro (sem frameworks)**  
  Utilizado para:  
  - manipulação da DOM  
  - renderização dinâmica  
  - formulários  
  - filtros  
  - modal com detalhes do item  
  - controle de permissões de acordo com o perfil  

### 🖥 Backend
- **Node.js + Express**  
  Utilizado para simular uma API REST com:
  - rotas de autenticação
  - listagem de itens
  - registro de lances
  - cálculo de lance vencedor
  - encerramento de ofertas  

Todos os dados são armazenados **em memória**, conforme permitido pelo desafio.

---

## ▶ Como executar localmente

1. Clone o repositório:

```bash
git clone https://github.com/paulaPelizer/novodestino.git
