import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ THIS LINE IS WHY YOUR SITE LOOKS DEAD
import "./index.css";

import { FocusProvider } from "./context/FocusContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FocusProvider>
      <App />
    </FocusProvider>
  </React.StrictMode>
);
