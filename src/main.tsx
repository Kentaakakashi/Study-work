import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FocusProvider } from "./context/FocusContext";

<FocusProvider>
  <App />
</FocusProvider>


createRoot(document.getElementById("root")!).render(<App />);
