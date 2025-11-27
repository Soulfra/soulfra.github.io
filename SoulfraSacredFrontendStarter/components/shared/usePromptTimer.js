import { useState, useEffect } from "react";
import { promptBank } from "@sacred-components/promptBank";

export function usePromptTimer() {
  const [prompt, setPrompt] = useState(() => {
    const stored = localStorage.getItem("currentPrompt");
    return stored || getRandomPrompt();
  });

  const [lastPromptTime, setLastPromptTime] = useState(() => {
    const stored = localStorage.getItem("lastPromptTime");
    return stored ? parseInt(stored) : Date.now();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastPromptTime >= 60 * 60 * 1000) {
        refreshPrompt();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastPromptTime]);

  const refreshPrompt = () => {
    const newPrompt = getRandomPrompt();
    localStorage.setItem("currentPrompt", newPrompt);
    localStorage.setItem("lastPromptTime", Date.now().toString());
    setPrompt(newPrompt);
    setLastPromptTime(Date.now());
  };

  return { prompt, refreshPrompt };
}

function getRandomPrompt() {
  return promptBank[Math.floor(Math.random() * promptBank.length)];
}
