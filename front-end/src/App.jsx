import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [isLogged, setIsLogged] = useState(false);

  const handleLogout = () => {
    setIsLogged(false);
  };

  return (
    <div>
      {isLogged ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={setIsLogged} />
      )}
    </div>
  );
}

export default App;
