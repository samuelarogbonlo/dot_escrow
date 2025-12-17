# Threat Model

## Scope & Context
- **In scope:** Escrow ink! contract (milestones, fees, pause), PSP22 token interactions, multisig governance (proposals/approvals/execute), deposit tracking, dispute/notification flows.
- **Surrounding components:** Frontend (React), RPC endpoints, user wallets (signers), deployed PSP22 token.
- **Out of scope:** Wallet key custody, RPC infrastructure availability, PSP22 token code correctness beyond standard assumptions, frontend hosting integrity.

## Assets & Security Goals
- Funds held by the escrow contract (USDT via PSP22).
- Fee payouts to `fee_account`.
- Escrow state integrity (milestones, status, disputes, transaction hashes).
- Admin signer set and proposal integrity (threshold, add/remove signer).
- Availability of core entry points; bounded storage/compute to resist DoS.
- User metadata (titles/descriptions/evidence URLs) not bloated to exhaust storage.

## Trust Assumptions
- PSP22 token is standards-compliant, non-malicious, and not reentrant in practice.
- Admin signer keys are securely managed off-chain.
- Users connect to the authentic contract addresses via trusted RPC/frontends.
- No hostile runtime changes on the target network that break ink!/PolkaVM guarantees.

## Actors
- Honest users (creator/counterparty).
- Malicious user/counterparty (tries to steal funds or corrupt state).
- External attacker without keys.
- Compromised admin signer (or colluding signers ≥ threshold).
- Frontend/RPC MITM (address spoofing, response tampering).

## Attack Surfaces & Controls
- **Fund release (`release_milestone`)**: unauthorized release, fee manipulation, underflow/overflow, insufficient deposits, PSP22 call failures.  
  *Controls:* caller checks (creator/counterparty), fee cap (<=10_000 bps), checked math, deposit ledger vs contract balance checks, CEI ordering, PSP22 errors mapped to `EscrowError`.
- **Deposits (`notify_deposit`)**: faking deposits to inflate ledger, front-running deposits to desync ledger vs balance (SECURITY_REVIEW #3).  
  *Controls:* reads on-chain PSP22 balance before updating deposit mapping; recommend matching deposit events/receipts to block height in operational runbooks.
- **Milestones (`complete_milestone_task`, `complete_milestone`, `update_escrow_milestone_status`, `dispute_milestone`)**: unauthorized status flips, skipping states, over-storage.  
  *Controls:* caller checks, status validation, timestamps set internally, storage caps (MAX_MILESTONES, MAX_STRING_LENGTH, MAX_EVIDENCE_FILES).
- **Escrow status (`update_escrow_status`, `check_and_update_escrow_completion`)**: unauthorized state changes.  
  *Controls:* caller checks, status parsing validation.
- **Admin multisig (`submit/approve/execute_proposal`)**: rogue signer, threshold bypass, duplicate approvals, signer removal breaking quorum.  
  *Controls:* signer membership checks, threshold bounds, duplicate-approval rejection, executed flag, guard against threshold < 1 or > signer count.
- **Pause/unpause & config changes**: halting or unpausing without quorum, fee/token/decimals changes.  
  *Controls:* all gated by multisig flow.
- **Storage/DoS**: overlong titles/descriptions/evidence, too many milestones.  
  *Controls:* explicit max limits; arithmetic checks to prevent overflow.
- **Cross-contract PSP22**: reentrancy or malicious token responses.  
  *Controls:* CEI ordering in `release_milestone` (reentrancy fixed), limited interaction surface, pre-transfer balance/deposit checks.
- **Off-chain (frontend/RPC)**: address spoofing, stale ABI, tampered responses.  
  *Controls:* publish addresses/ABI in docs; recommend users verify addresses and use trusted RPC endpoints.

## Data Flow (ASCII)
```
[User Wallets] --sign/tx--> [Frontend (React)] --RPC--> [Escrow Contract]
                                                    \--> [PSP22 Token]
[Admin Signers] --propose/approve--> [Escrow Contract] --fee--> [Fee Account]
[Escrow Contract] --events/state--> [Frontend/Indexers]
```
See component/sequence details in `ARCHITECTURE.md`.

## Residual Risks & Assumptions
- PSP22 implementation trust: CEI applied, but a deliberately malicious token could still attempt abuse; consider adding a reentrancy guard in future versions for defense-in-depth.
- Admin signer compromise beyond threshold can execute proposals (expected for multisig).
- RPC/frontend tampering can mislead users to wrong addresses; mitigated only by user verification.
- Economic DoS via transaction fees/weights remains possible at the chain level (no on-chain rate limiting).

## Verification Summary
- **Static analysis:** `cargo clippy --all-targets -- -D warnings`, `cargo audit`, `cargo contract check`.
- **Testing:** 43 ink! unit tests covering validation, storage limits, arithmetic, milestone flows, multisig guards; 83.13% line coverage (unit-test scope).
- **Manual testnet:** PSP22 transfer paths and multisig execution validated on Paseo deployment.
- **Data flow:** ASCII sketch above; full sequence/component flows in `ARCHITECTURE.md`.
