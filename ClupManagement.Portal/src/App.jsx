import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import SystemMessagePage from "./pages/SystemMessagePage";

function App() {
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

    return (
        <div>
            {loggedIn ? (
                <SystemMessagePage />
            ) : (
                <LoginPage onLogin={() => setLoggedIn(true)} />
            )}
        </div>
    );
}

export default App;
