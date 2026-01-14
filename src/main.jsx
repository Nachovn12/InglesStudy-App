import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
// 🧹 CLEANUP: Force Unregister Service Workers in Dev to fix network errors
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log("🧹 Service Worker Unregistered (Fixing Dev Mode)");
    }
  });
}
