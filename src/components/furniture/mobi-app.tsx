"use client";

import { useMobiStore } from "@/store/mobi-store";
import InputPhase from "./input-phase";
import GeneratingPhase from "./generating-phase";
import ReviewPhase from "./review-phase";
import EditingPhase from "./editing-phase";
import ExportPhase from "./export-phase";
import { AnimatePresence, motion } from "framer-motion";

export default function MobiApp() {
  const phase = useMobiStore((s) => s.phase);

  const phaseComponent = (() => {
    switch (phase) {
      case "input":
        return <InputPhase />;
      case "generating":
        return <GeneratingPhase />;
      case "review":
        return <ReviewPhase />;
      case "editing":
        return <EditingPhase />;
      case "export":
        return <ExportPhase />;
      default:
        return <InputPhase />;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen bg-background"
      >
        {phaseComponent}
      </motion.div>
    </AnimatePresence>
  );
}
