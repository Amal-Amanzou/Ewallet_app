import { useEffect, useState } from "react";
import {
  getbeneficiaries,
  finduserbyaccount,
  findbeneficiarieByid,
  findcardbynum
} from "../Model/database";
import "../dashboard.css";

function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [amount, setAmount] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("User not authenticated");
      window.location.href = "/";
    } else {
      setUser(currentUser);
      setBeneficiaries(getbeneficiaries(currentUser.id));
    }
  }, []);

  if (!user) return null;

  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  const handleTransfer = (e) => {
    e.preventDefault();
    try {
      if (!selectedBeneficiary) throw "Veuillez choisir un bénéficiaire";
      const amountNum = Number(amount);
      if (!amountNum || amountNum <= 0) throw "Montant invalide";

      const beneficiaryData = findbeneficiarieByid(user.id, selectedBeneficiary);
      if (!beneficiaryData) throw "Bénéficiaire introuvable";

      const destinataire = finduserbyaccount(beneficiaryData.account);
      if (!destinataire) throw "Compte destinataire introuvable";

      if (user.wallet.balance < amountNum) throw "Solde insuffisant";

      const updatedUser = JSON.parse(JSON.stringify(user));
      updatedUser.wallet.balance -= amountNum;
      updatedUser.wallet.transactions.push({
        id: String(Date.now()),
        type: "debit",
        amount: amountNum,
        date: new Date().toLocaleString(),
        from: updatedUser.account,
        to: destinataire.account
      });

      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAmount("");
      setSelectedBeneficiary("");
      setShowTransfer(false);
    } catch (err) {
      alert(err);
    }
  };

  const handleRecharge = (e) => {
    e.preventDefault();
    try {
      if (!selectedCard) throw "Veuillez choisir une carte";
      const amountNum = Number(amount);
      if (!amountNum || amountNum <= 0) throw "Montant invalide";

      const card = findcardbynum(user.id, selectedCard);
      if (!card) throw "Carte invalide";

      const updatedUser = JSON.parse(JSON.stringify(user));
      updatedUser.wallet.balance += amountNum;
      updatedUser.wallet.transactions.push({
        id: String(Date.now()),
        type: "recharge",
        amount: amountNum,
        date: new Date().toLocaleString(),
        from: selectedCard,
        to: updatedUser.account
      });

      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAmount("");
      setSelectedCard("");
      setShowRecharge(false);
    } catch (err) {
      alert(err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="dashboard-nav">
        <span style={{ fontWeight: 700, fontSize: "1.3rem", color: "#3b66f6" }}>
          💳 E-Wallet
        </span>
        <div className="user-menu">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-balance">{user.wallet.balance} {user.wallet.currency}</span>
          </div>
          <div className="user-avatar">
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "#3b66f6",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "1.1rem"
            }}>
              {user.name[0]}
            </div>
          </div>
          <button className="dropdown-toggle" onClick={() => setShowDropdown(!showDropdown)}>▾</button>
          <div className={`dropdown-menu ${showDropdown ? "show" : ""}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowDropdown(false); }}>👤 Profil</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>🚪 Déconnexion</a>
          </div>
        </div>
      </nav>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="dashboard-main">
        <div className="dashboard-container">

          {/* ===== SIDEBAR ===== */}
          <aside className="dashboard-sidebar">
            <nav className="sidebar-nav">
              <ul>
                {[
                  { id: "overview", icon: "🏠", label: "Aperçu" },
                  { id: "transactions", icon: "🔄", label: "Transactions" },
                  { id: "cards", icon: "💳", label: "Mes Cartes" },
                  { id: "transfer", icon: "📤", label: "Transfert" },
                ].map(item => (
                  <li key={item.id} className={activeSection === item.id ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveSection(item.id); }}>
                      <i>{item.icon}</i> {item.label}
                    </a>
                  </li>
                ))}
                <li><div className="separator" /></li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <i>🚪</i> Déconnexion
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* ===== CONTENT ===== */}
          <main className="dashboard-content">

            {/* ===== OVERVIEW ===== */}
            <div className={`dashboard-section ${activeSection === "overview" ? "active" : ""}`}>
              <div className="section-header">
                <h2>Bonjour, {user.name} 👋</h2>
                <span className="date-display">
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon blue">💰</div>
                  <div className="card-details">
                    <span className="card-label">Solde total</span>
                    <span className="card-value">{user.wallet.balance} <small style={{ fontSize: "0.85rem" }}>MAD</small></span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon green">📈</div>
                  <div className="card-details">
                    <span className="card-label">Revenus</span>
                    <span className="card-value">{monthlyIncome} <small style={{ fontSize: "0.85rem" }}>MAD</small></span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon red">📉</div>
                  <div className="card-details">
                    <span className="card-label">Dépenses</span>
                    <span className="card-value">{monthlyExpenses} <small style={{ fontSize: "0.85rem" }}>MAD</small></span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon purple">💳</div>
                  <div className="card-details">
                    <span className="card-label">Cartes</span>
                    <span className="card-value">{user.wallet.cards.length}</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Actions rapides</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => { setShowTransfer(true); setShowRecharge(false); }}>
                    <i>📤</i><span>Transférer</span>
                  </button>
                  <button className="action-btn" onClick={() => { setShowRecharge(true); setShowTransfer(false); }}>
                    <i>🔋</i><span>Recharger</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection("cards")}>
                    <i>💳</i><span>Mes Cartes</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection("transactions")}>
                    <i>📋</i><span>Historique</span>
                  </button>
                </div>
              </div>

              <div className="recent-transactions">
                <div className="section-header">
                  <h3>Transactions récentes</h3>
                  <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveSection("transactions"); }}>
                    Voir tout →
                  </a>
                </div>
                <div className="transactions-list">
                  {user.wallet.transactions.slice(0, 3).map(t => (
                    <div key={t.id} className="transaction-item">
                      <div className={`transaction-icon ${t.type === "credit" ? "credit" : "debit"}`}>
                        {t.type === "credit" ? "⬇️" : "⬆️"}
                      </div>
                      <div className="transaction-details">
                        <span className="transaction-name">
                          {t.type === "credit" ? `De : ${t.from}` : `Vers : ${t.to}`}
                        </span>
                        <span className="transaction-date">{t.date}</span>
                      </div>
                      <span className={`transaction-amount ${t.type === "credit" ? "credit" : "debit"}`}>
                        {t.type === "credit" ? "+" : "-"}{t.amount} MAD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== TRANSACTIONS ===== */}
            <div className={`dashboard-section ${activeSection === "transactions" ? "active" : ""}`}>
              <div className="section-header">
                <h2>Historique des transactions</h2>
              </div>
              <div className="recent-transactions">
                <div className="transactions-list">
                  {user.wallet.transactions.map(t => (
                    <div key={t.id} className="transaction-item">
                      <div className={`transaction-icon ${t.type === "credit" ? "credit" : "debit"}`}>
                        {t.type === "credit" ? "⬇️" : "⬆️"}
                      </div>
                      <div className="transaction-details">
                        <span className="transaction-name">
                          {t.type === "credit" ? `De : ${t.from}` : `Vers : ${t.to}`}
                        </span>
                        <span className="transaction-date">{t.date}</span>
                      </div>
                      <span className={`transaction-amount ${t.type === "credit" ? "credit" : "debit"}`}>
                        {t.type === "credit" ? "+" : "-"}{t.amount} MAD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== CARDS ===== */}
            <div className={`dashboard-section ${activeSection === "cards" ? "active" : ""}`}>
              <div className="section-header">
                <h2>Mes Cartes</h2>
              </div>
              <div className="cards-grid">
                {user.wallet.cards.map(c => (
                  <div key={c.numcards} className="card-item">
                    <div className={`card-preview ${c.type}`}>
                      <div className="card-chip" />
                      <span className="card-type">{c.type.toUpperCase()}</span>
                      <div className="card-number">**** **** **** {c.numcards.slice(-4)}</div>
                      <div className="card-holder">{user.name}</div>
                      <div className="card-expiry">{c.expiry}</div>
                    </div>
                    <div className="card-details" style={{ marginBottom: "0.75rem" }}>
                      <span className="card-label">Solde</span>
                      <span className="card-value">{c.balance} MAD</span>
                    </div>
                    <div className="card-actions">
                      <button className="card-action" title="Voir">👁️</button>
                      <button className="card-action" title="Bloquer">🔒</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== TRANSFER SECTION ===== */}
            <div className={`dashboard-section ${activeSection === "transfer" ? "active" : ""}`}>
              <div className="section-header">
                <h2>Transfert d'argent</h2>
              </div>
              <div className="transfer-container">
                <form className="transfer-form" onSubmit={handleTransfer}>
                  <div className="form-group">
                    <label>👤 Bénéficiaire</label>
                    <select value={selectedBeneficiary} onChange={(e) => setSelectedBeneficiary(e.target.value)}>
                      <option value="">Choisir un bénéficiaire</option>
                      {beneficiaries.map(b => (
                        <option key={b.id} value={b.id}>{b.name} — {b.account}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>💰 Montant</label>
                    <div className="amount-input">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <span className="currency">MAD</span>
                    </div>
                  </div>

                  <div className="transfer-summary">
                    <h4>Récapitulatif</h4>
                    <div className="summary-row"><span>Montant</span><span>{amount || 0} MAD</span></div>
                    <div className="summary-row"><span>Frais</span><span>0 MAD</span></div>
                    <div className="summary-row total"><span>Total</span><span>{amount || 0} MAD</span></div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => { setAmount(""); setSelectedBeneficiary(""); }}>
                      Réinitialiser
                    </button>
                    <button type="submit" className="btn btn-primary">Envoyer 📤</button>
                  </div>

                  <div className="recent-beneficiaries">
                    <h4>Bénéficiaires récents</h4>
                    <div className="beneficiaries-list">
                      {beneficiaries.map(b => (
                        <div key={b.id} className="beneficiary-chip" onClick={() => setSelectedBeneficiary(b.id)}>
                          <div className="beneficiary-avatar">{b.name[0]}</div>
                          <span>{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>

                <div className="transfer-info">
                  <div className="info-card">
                    <h4>ℹ️ Informations</h4>
                    <p>Les transferts sont instantanés et sans frais.</p>
                    <p>Solde disponible : <strong>{user.wallet.balance} MAD</strong></p>
                    <p>Bénéficiaires : <strong>{beneficiaries.length}</strong></p>
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ===== TRANSFER POPUP ===== */}
      <div className={`popup-overlay ${showTransfer ? "active" : ""}`}>
        <div className="popup-content">
          <div className="popup-header">
            <h2>Transférer de l'argent</h2>
            <button className="btn-close" type="button" onClick={() => setShowTransfer(false)}>✕</button>
          </div>
          <div className="popup-body">
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>Bénéficiaire</label>
                <select value={selectedBeneficiary} onChange={(e) => setSelectedBeneficiary(e.target.value)}>
                  <option value="">Choisir un bénéficiaire</option>
                  {beneficiaries.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Montant</label>
                <div className="amount-input">
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <span className="currency">MAD</span>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== RECHARGE POPUP ===== */}
      <div className={`popup-overlay ${showRecharge ? "active" : ""}`}>
        <div className="popup-content">
          <div className="popup-header">
            <h2>Recharger le solde</h2>
            <button className="btn-close" type="button" onClick={() => setShowRecharge(false)}>✕</button>
          </div>
          <div className="popup-body">
            <form onSubmit={handleRecharge}>
              <div className="form-group">
                <label>Carte bancaire</label>
                <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)}>
                  <option value="">Choisir une carte</option>
                  {user.wallet.cards.map(c => (
                    <option key={c.numcards} value={c.numcards}>
                      {c.type.toUpperCase()} **** {c.numcards.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Montant</label>
                <div className="amount-input">
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <span className="currency">MAD</span>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecharge(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Recharger</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
