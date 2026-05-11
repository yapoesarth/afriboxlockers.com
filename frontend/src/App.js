import React from "react";
import "@/App.css";
import { Toaster } from "./components/ui/sonner";
import Scene from "./components/Scene";
import {
  LockerMap,
  BookingForm,
  Newsletter,
  Footer,
} from "./components/CityFeatures";

function App() {
  return (
    <div className="App relative">
      {/* Cinematic locker scene with all 6 portals */}
      <Scene />

      {/* Post-cinematic content sections */}
      <div className="relative" data-testid="post-cinematic" style={{ background: "linear-gradient(180deg, #0B2014 0%, #0E2A1A 100%)" }}>
        <LockerMap />
        <BookingForm />
        <Newsletter />
        <Footer />
      </div>

      {/* Subtle grain over everything */}
      <div className="noise" />

      <Toaster
        position="bottom-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(12, 14, 13, 0.85)",
            border: "1px solid rgba(74, 222, 128, 0.25)",
            color: "#FAFAFA",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </div>
  );
}

export default App;
