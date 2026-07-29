import { useEffect, useRef } from "react";

/**
 * Voice-guided turn-by-turn navigation using the browser SpeechSynthesis API.
 *
 * Speaks the active (first) maneuver instruction when it changes, and a "now"
 * prompt once the driver is within APPROACH_M of that maneuver. Re-routes from
 * the map refresh `routeInfo` as the driver moves, so the active step advances
 * automatically.
 */
const APPROACH_M = 120;

function speak(synth, text) {
  try {
    synth.cancel();
    synth.resume();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function useVoiceNav({ routeInfo, enabled }) {
  const lastInstructionRef = useRef("");
  const spokenNowRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const step = routeInfo?.steps?.[0];
    const instruction = step?.maneuver?.instruction;
    if (!instruction) return;

    if (instruction !== lastInstructionRef.current) {
      lastInstructionRef.current = instruction;
      spokenNowRef.current = false;
      const dist = step.distance;
      const prefix = dist != null && dist <= APPROACH_M ? "Now " : "";
      speak(synth, prefix + instruction);
    } else if (!spokenNowRef.current && step.distance != null && step.distance <= APPROACH_M) {
      spokenNowRef.current = true;
      speak(synth, "Now " + instruction);
    }
  }, [routeInfo, enabled]);

  // Stop any in-flight speech when disabled / unmounted
  useEffect(() => {
    if (enabled) return;
    const synth = window.speechSynthesis;
    if (synth) synth.cancel();
  }, [enabled]);
}