# Configure Privy: X Login + Solana Only

Follow these steps to ensure X (Twitter) login works and only Solana wallets are presented.

## 1) Privy Dashboard – Chains
1. Go to your app: https://dashboard.privy.io/apps
2. Settings → Chains
3. Enable: Solana Mainnet (Devnet optional)
4. Disable: Ethereum and all other EVM chains

Refs: [Wallets overview](https://docs.privy.io/wallets/overview), [Chain support](https://docs.privy.io/wallets/overview/chains)

## 2) Privy Dashboard – External Wallets
1. Settings → External Wallets
2. Enable: Phantom (Solana), Solflare
3. Disable: MetaMask, WalletConnect, Coinbase Wallet, etc.

## 3) Privy Dashboard – Embedded Wallets
1. Settings → Embedded Wallets
2. Solana → Create on login: All users
3. Show wallet UIs: Enabled
4. Ethereum: Create on login: Off

Refs: [Create a wallet](https://docs.privy.io/wallets/wallets/create/create-a-wallet), [Pregenerate wallets](https://docs.privy.io/wallets/wallets/create/pregenerate-wallets)

## 4) Privy Dashboard – Login Methods (Enable X)
1. Settings → Login methods
2. Enable: Email, Google, X (Twitter)
3. Ensure your X Developer App keys are added in the Privy dashboard
4. Callback URLs: Add your site origin and any auth callback routes used by Privy (check the dashboard’s suggested URLs)

If X fails, verify:
- X/Twitter app is in production (not restricted)
- Correct callback URL(s) match exactly
- App permissions include email if required

## 5) App Configuration (Already Applied)
In `lib/privy.tsx` we:
- Prioritize wallet login: `loginMethods: ['wallet', 'email', 'google', 'twitter']`
- Solana-only wallet UI: `walletList: ['detected_solana_wallets', 'phantom', 'solflare']`
- Embedded Solana wallet auto-creation: `embeddedWallets.solana.createOnLogin = 'all-users'`

## 6) Testing X Login
1. Restart dev server
2. Clear browser cache (hard reload)
3. Click “Continue with X” in the Privy modal
4. Complete OAuth and return to app

If you see errors:
- Check Privy dashboard logs
- Confirm X callback URLs
- Confirm keys/secrets are correct

## 7) Verifying Solana-only Wallets
- On onboarding, the Privy modal should show Phantom/Solflare and detected Solana wallets
- No MetaMask/EVM options should appear
- If Phantom redirects to download page, ensure the extension is installed, unlocked, and Solana network is selected

## Useful Docs
- [Wallets overview](https://docs.privy.io/wallets/overview)
- [Chain support](https://docs.privy.io/wallets/overview/chains)
- [Create a wallet](https://docs.privy.io/wallets/wallets/create/create-a-wallet)
- [Pregenerate wallets](https://docs.privy.io/wallets/wallets/create/pregenerate-wallets)
- [Get wallet(s)](https://docs.privy.io/wallets/wallets/get-a-wallet/get-all-wallets)
- [Export wallet](https://docs.privy.io/wallets/wallets/export)
- [Solana sign message](https://docs.privy.io/wallets/using-wallets/solana/sign-a-message)
- [Solana send tx](https://docs.privy.io/wallets/using-wallets/solana/send-a-transaction)
- [Funding overview](https://docs.privy.io/wallets/funding/overview)

---
This configuration ensures X login works and only Solana wallets are presented, with embedded Solana wallets created automatically for new users.
