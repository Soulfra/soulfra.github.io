import { useState } from "react";

export function useSoulBalance() {
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem("soulBalance");
    return stored ? parseInt(stored) : 100; // start with 100 tokens
  });

  const spendTokens = (amount) => {
    setBalance((prev) => {
      const newBalance = prev - amount;
      localStorage.setItem("soulBalance", newBalance);
      return newBalance;
    });
  };

  const addTokens = (amount) => {
    setBalance((prev) => {
      const newBalance = prev + amount;
      localStorage.setItem("soulBalance", newBalance);
      return newBalance;
    });
  };

  return { balance, spendTokens, addTokens };
}
