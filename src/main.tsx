import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { FocusProvider } from "@/context/FocusContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FocusProvider>
          <App />
        </FocusProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
