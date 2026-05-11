import React from "react";

/**
 * Locker — a single compartment in the wall.
 * Renders the closed door (with screen, LED, handle) and an interior layer
 * that becomes visible when the door swings open.
 *
 * The "open" prop is driven by the scroll-driven scene; we keep this purely
 * presentational so all layout/scroll logic lives in <Scene/>.
 */
const Locker = React.memo(function Locker({
  col,
  row,
  size = "M",
  status = "ready",
  open = false,
  highlighted = false,
  ledTone = "emerald",
  code = "",
  index = 0,
  children,
}) {
  const ledClass =
    ledTone === "amber" ? "amber" : ledTone === "cyan" ? "cyan" : "";

  // Slight visual variations based on grid position for realism
  const variant = (col + row * 3) % 4;
  const screenLabel =
    code ||
    [
      `${String(col + 1).padStart(2, "0")}-${String(row + 1).padStart(2, "0")}`,
      "READY",
      `#${String(index + 101)}`,
      "ONLINE",
    ][variant];

  return (
    <div
      className="relative w-full h-full preserve-3d"
      data-testid={`locker-${col}-${row}`}
      style={{
        transition: "filter 0.8s cubic-bezier(0.22,1,0.36,1)",
        filter: highlighted
          ? "brightness(1.15) saturate(1.15)"
          : open
          ? "brightness(1)"
          : "brightness(0.9)",
      }}
    >
      {/* Interior (revealed when door opens) */}
      <div className="locker-interior absolute inset-0 overflow-hidden">
        <div className="scan-line" />
        {/* Children = the section content shown inside the open locker */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          {children}
        </div>
      </div>

      {/* The swinging door */}
      <div className={`locker-door ${open ? "open" : ""}`}>
        <div className="locker-cell w-full h-full rounded-[3px]">
          <div className="locker-screen">
            <span style={{ animation: "data-flicker 4s infinite" }}>
              {screenLabel}
            </span>
          </div>
          <div className={`locker-led ${ledClass}`} />
          <div className="locker-handle" />

          {/* Subtle vent / detail */}
          <div
            className="absolute"
            style={{
              left: "12%",
              right: "32%",
              bottom: "10%",
              height: "1px",
              background: "rgba(70, 55, 25, 0.18)",
            }}
          />
          <div
            className="absolute"
            style={{
              left: "12%",
              right: "32%",
              bottom: "8%",
              height: "1px",
              background: "rgba(255, 255, 255, 0.7)",
            }}
          />

          {/* Size badge */}
          <span
            className="absolute mono"
            style={{
              right: "8%",
              top: "8%",
              fontSize: "8px",
              letterSpacing: "0.18em",
              color: "rgba(70, 55, 25, 0.55)",
            }}
          >
            {size}
          </span>
        </div>
      </div>
    </div>
  );
});

export default Locker;
