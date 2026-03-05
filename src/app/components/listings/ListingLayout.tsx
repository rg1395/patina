"use client";
import { useEffect, useState } from "react";

export default function ListingLayout({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: mobile ? "1rem" : "2.5rem",
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "1fr 360px",
      gap: mobile ? "1.5rem" : "3rem",
      alignItems: "start",
    }}>
      <div>{left}</div>
      <div style={{ position: mobile ? "static" : "sticky", top: "5rem" }}>{right}</div>
    </div>
  );
}
