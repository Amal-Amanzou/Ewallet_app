import "../Login.css";
import Header from "./header";
import Footer from "./footer";
import { useState } from "react";
import { finduserbymail } from "../Model/database";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const user = finduserbymail(email, password);

    if (user) {
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      onLogin(true);
    } else {
      alert("Email ou mot de passe incorrect");
    }
  };

  return (
    <>
      <Header />

      <div className="login-wrapper">
        <div className="login-container">
          <h2>Login</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Se connecter</button>
          </form>
        </div>

        <div className="hero-image">
          <img src="/src/assets/e-Wallet6.gif" alt="E-Wallet Illustration" />
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Login;
