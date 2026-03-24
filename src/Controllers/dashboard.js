import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";

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

function transfer(expediteur, numcompte, amount) {

  checkUser(numcompte)
    .then(destinataire => {
      console.log("Étape 1:", destinataire.name);
      return checkSolde(expediteur, amount)
        .then(() => destinataire);
    })
    .then(destinataire => {
      console.log("Étape 2: solde ok");
      return updateSolde(expediteur, destinataire, amount)
        .then(() => destinataire);
    })
    .then(destinataire => {
      console.log("Étape 3: balance updated");
      return addtransactions(expediteur, destinataire, amount);
    })
    .then(msg => {
      console.log("Étape 4:", msg);
      renderDashboard();
    })
    .catch(err => {
      console.error("Erreur:", err);
    });
}

// ================= HANDLE =================

function handleTransfer(e) {
  e.preventDefault();

  const beneficiaryId = beneficiarySelect.value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const amount = Number(document.getElementById("amount").value);

  transfer(user, beneficiaryAccount, amount);
}