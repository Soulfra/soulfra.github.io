// /utils/arweaveWalletUtils.js
import fetch from 'node-fetch';

const walletAddress = 'w0ScD-uFWQUbantTIyZrKCiOlRkhRfoIhjd6TdMf9Pk'; // replace with your actual wallet address

export async function getArweaveWalletBalance() {
  try {
    const response = await fetch(`https://arweave.net/wallet/${walletAddress}/balance`);
    const balanceWinston = await response.text();
    const balanceAR = parseFloat(balanceWinston) / 1e12;
    return balanceAR;
  } catch (error) {
    console.error('❌ Failed to fetch Arweave wallet balance:', error);
    return null;
  }
}