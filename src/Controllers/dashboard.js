import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid, findcardbynum } from "../../front-end/src/Model/database.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");

// Recharge DOM elements
const topupBtn = document.getElementById("quickTopup");
const topupSection = document.getElementById("rechargePopup");
const closeTopupBtn = document.getElementById("closeRechargeBtn");
const cancelTopupBtn = document.getElementById("cancelRechargeBtn");
const rechargeCardSelect = document.getElementById("rechargeCard");
const submitTopupBtn = document.getElementById("submitRechargeBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);

topupBtn.addEventListener("click", openRecharge);
closeTopupBtn.addEventListener("click", closeRecharge);
cancelTopupBtn.addEventListener("click", closeRecharge);
submitTopupBtn.addEventListener("click", handleRecharge);

// ================= Dashboard =================

const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const data = getDashboardData();

  greetingName.textContent = data.userName;
  currentDate.textContent = data.currentDate;
  solde.textContent = data.availableBalance;
  incomeElement.textContent = data.monthlyIncome;
  expensesElement.textContent = data.monthlyExpenses;
  activecards.textContent = data.activeCards;

  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach(t => {
    const div = document.createElement("div");
    div.className = "transaction-item";
    div.innerHTML = `
      <div>${t.date}</div>
      <div>${t.amount} MAD</div>
      <div>${t.type}</div>
    `;
    transactionsList.appendChild(div);
  });
}

renderDashboard();

// ================= Popup =================

function closeTransfer() {
  transferSection.classList.remove("active");
}

function handleTransfersection() {
  transferSection.classList.add("active");
}

// ================= Beneficiaries =================

const beneficiaries = getbeneficiaries(user.id);

beneficiaries.forEach(b => {
  const option = document.createElement("option");
  option.value = b.id;
  option.textContent = b.name;
  beneficiarySelect.appendChild(option);
});

user.wallet.cards.forEach(card => {
  const option = document.createElement("option");
  option.value = card.numcards;
  option.textContent = card.type + "****" + card.numcards;
  sourceCard.appendChild(option);
});

user.wallet.cards.forEach(card => {
  const option = document.createElement("option");
  option.value = card.numcards;
  option.textContent = card.type + " ****" + card.numcards.slice(-4);
  rechargeCardSelect.appendChild(option);
});

// ================= PROMISE FUNCTIONS =================

// 1
function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      if (beneficiary) {
        resolve(beneficiary);
      } else {
        reject("Beneficiary not found");
      }
    }, 500);
  });
}

// 2
function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance >= amount) {
        resolve("Sufficient balance");
      } else {
        reject("Insufficient balance");
      }
    }, 500);
  });
}

// 3
function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("Balance updated");
    }, 500);
  });
}

// 4
function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {

      const credit = {
        id: Date.now(),
        type: "credit",
        amount,
        date: new Date().toLocaleString(),
        from: expediteur.name
      };

      const debit = {
        id: Date.now() + 1,
        type: "debit",
        amount,
        date: new Date().toLocaleString(),
        to: destinataire.name
      };

      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);

      resolve("Transaction added");
    }, 500);
  });
}

// ================= TRANSFER =================

async function transfer(expediteur, numcompte, amount) {
  try {
    // Étape 1 : vérifier utilisateur
    const destinataire = await checkUser(numcompte);
    console.log("Étape 1:", destinataire.name);

    // Étape 2 : vérifier solde
    await checkSolde(expediteur, amount);
    console.log("Étape 2: solde ok");

    // Étape 3 : update solde
    await updateSolde(expediteur, destinataire, amount);
    console.log("Étape 3: balance updated");

    // Étape 4 : ajouter transaction
    const msg = await addtransactions(expediteur, destinataire, amount);
    console.log("Étape 4:", msg);

    renderDashboard();

  } catch (err) {
    console.error("Erreur:", err);
  }
}

// ================= HANDLE =================

async function handleTransfer(e) {
  e.preventDefault();

  try {
    const beneficiaryId = beneficiarySelect.value;
    const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
    const amount = Number(document.getElementById("amount").value);

    await transfer(user, beneficiaryAccount, amount);

  } catch (err) {
    console.error(err);
  }
}

// ================= RECHARGE POPUP =================

function openRecharge() {
  topupSection.classList.add("active");
}

function closeRecharge() {
  topupSection.classList.remove("active");
}

// ================= RECHARGE PROMISES =================

// 1. Validate amount
function validateRechargeAmount(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (amount > 0) {
        resolve(amount);
      } else {
        reject("Le montant doit être supérieur à 0");
      }
    }, 300);
  });
}

// 2. Validate card ownership and expiry
function validateRechargeCard(userId, numcard) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = findcardbynum(userId, numcard);
      if (!card) {
        reject("Carte introuvable ou n'appartient pas à l'utilisateur");
        return;
      }
      const today = new Date();
      const expiry = new Date(card.expiry);
      if (expiry < today) {
        reject("Carte expirée");
        return;
      }
      resolve(card);
    }, 400);
  });
}

// 3. Apply recharge to wallet
function applyRecharge(user, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      user.wallet.balance += amount;
      resolve("Solde mis à jour");
    }, 500);
  });
}

// 4. Record recharge transaction
function recordRechargeTransaction(user, amount, cardNum, status) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction = {
        id: Date.now(),
        type: status === "success" ? "recharge" : "recharge-failed",
        amount,
        date: new Date().toLocaleString(),
        from: "Carte ****" + cardNum.slice(-4),
        status
      };
      user.wallet.transactions.push(transaction);
      resolve(transaction);
    }, 300);
  });
}

// ================= RECHARGE FLOW =================

async function recharge(user, numcard, amount) {
  try {
    // Étape 1
    await validateRechargeAmount(amount);
    console.log("Étape 1: montant valide");

    // Étape 2
    await validateRechargeCard(user.id, numcard);
    console.log("Étape 2: carte valide");

    // Étape 3
    await applyRecharge(user, amount);
    console.log("Étape 3: solde rechargé");

    // Étape 4
    await recordRechargeTransaction(user, amount, numcard, "success");
    console.log("Étape 4: transaction enregistrée");

    renderDashboard();
    closeRecharge();
    alert("Recharge effectuée avec succès ! +" + amount + " MAD");

  } catch (err) {
    console.error("Erreur recharge:", err);

    await recordRechargeTransaction(user, amount, numcard, "failed");
    renderDashboard();

    alert("Echec de la recharge : " + err);
  }
}

// ================= HANDLE RECHARGE =================

async function handleRecharge(e) {
  e.preventDefault();

  try {
    const numcard = rechargeCardSelect.value;
    const amount = Number(document.getElementById("rechargeAmount").value);

    await recharge(user, numcard, amount);

  } catch (err) {
    console.error(err);
  }
}