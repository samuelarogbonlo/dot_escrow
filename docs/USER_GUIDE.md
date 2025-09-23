# .escrow Platform User Guide

**Complete Guide for Freelancers and Clients**

Welcome to `.escrow` - the decentralized platform revolutionizing freelance payments with secure, milestone-based escrow on Polkadot. This guide covers everything you need to start using the platform safely and effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Wallet Setup](#wallet-setup)
3. [Creating Your First Escrow](#creating-your-first-escrow)
4. [Funding Escrows](#funding-escrows)
5. [Managing Milestones](#managing-milestones)
6. [Handling Disputes](#handling-disputes)
7. [Advanced Features](#advanced-features)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQs](#faqs)

---

## Getting Started

### What is .escrow?

`.escrow` is a decentralized platform that enables secure freelance payments using smart contracts on the Polkadot blockchain. Key benefits:

- **Trust-minimized**: Smart contracts eliminate the need to trust intermediaries
- **Low fees**: 1% platform fee (with plans for volume-based reductions)
- **Fast settlements**: 6-second finality on Polkadot
- **USDT payments**: No crypto volatility anxiety
- **Global access**: No geographic restrictions

### Platform Overview

**For Clients:**
- Create escrow agreements with freelancers
- Fund projects with USDT stablecoins
- Release payments upon milestone completion
- Dispute resolution if needed

**For Freelancers:**
- Accept secure payment agreements
- Complete work in stages (milestones)
- Receive payments instantly upon approval
- Evidence submission for quality assurance

**Platform Governance:**
- Multi-signature administrative control for enhanced security
- Transparent proposal-based system for platform changes
- Community-governed fee adjustments and operational decisions
- Decentralized governance model protecting user interests

### System Requirements

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Extensions:**
- Polkadot.js Extension
- OR SubWallet
- OR Talisman Wallet

**Supported Networks:**
- Westend Testnet (for testing)
- Polkadot Mainnet (coming soon)

---

## Wallet Setup

### Step 1: Install Wallet Extension

**Option A: Polkadot.js Extension (Recommended)**
1. Visit [polkadot.js.org/extension](https://polkadot.js.org/extension/)
2. Click "Download for Chrome" (or your browser)
3. Click "Add to Chrome" in the extension store
4. Pin the extension to your browser toolbar

**Option B: SubWallet**
1. Visit [subwallet.app](https://subwallet.app)
2. Download the browser extension
3. Follow installation instructions

**Option C: Talisman**
1. Visit [talisman.xyz](https://talisman.xyz)
2. Download the browser extension
3. Complete setup process

### Step 2: Create or Import Account

**Creating New Account:**
1. Click the Polkadot.js extension icon
2. Click "+" then "Create new account"
3. **IMPORTANT**: Save your 12-word seed phrase securely
4. Set a strong password
5. Name your account (e.g., "Freelance Work")

**Importing Existing Account:**
1. Click "+" then "Import account from pre-existing seed"
2. Enter your 12-word seed phrase
3. Set password and account name

### Step 3: Get Testnet Tokens (For Testing)

**Westend Testnet Faucet:**
1. Copy your wallet address from the extension
2. Visit the [Westend Faucet](https://wiki.polkadot.network/docs/learn-DOT#getting-tokens-on-the-westend-testnet)
3. Paste your address and request tokens
4. Wait 1-2 minutes for tokens to arrive

**Get Test USDT:**
1. Join our Discord server
2. Request test USDT in the #faucet channel
3. Provide your wallet address

### Step 4: Connect to .escrow Platform

1. Visit the .escrow platform
2. Click "Connect Wallet" in the top right
3. Select your wallet extension
4. Choose your account
5. Authorize the connection
6. ✅ You're ready to use the platform!

---

## Creating Your First Escrow

### For Clients: Creating an Escrow

**Step 1: Navigate to Create Escrow**
1. From the dashboard, click "Create New Escrow"
2. You'll see the escrow creation form

**Step 2: Project Details**
```
Project Title: "Logo Design for Tech Startup"
Description: "Modern, minimalist logo design with 3 concepts,
             unlimited revisions, and final files in vector format"
```

**Step 3: Choose Counterparty**
- **Counterparty Type**: Select "Freelancer"
- **Freelancer Address**: Enter the freelancer's Polkadot wallet address
  - Example: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
  - ⚠️ **Important**: Double-check this address - it cannot be changed later

**Step 4: Set Up Milestones**
Create milestones to break the project into stages:

**Milestone 1: Concept Development**
- Description: "3 initial logo concepts"
- Amount: $500 USDT
- Deadline: 3 days from start

**Milestone 2: Revisions & Finalization**
- Description: "Unlimited revisions + final files"
- Amount: $500 USDT
- Deadline: 7 days from start

**Total Project Value**: $1,000 USDT

**Step 5: Review and Create**
1. Review all details carefully
2. Click "Create Escrow"
3. Confirm the transaction in your wallet
4. Wait for blockchain confirmation (~6 seconds)
5. ✅ Escrow created! Note the Escrow ID (e.g., "escrow_1")

### For Freelancers: Accepting an Escrow

**Step 1: Receive Escrow Details**
The client will share:
- Escrow ID
- Project description
- Milestone breakdown
- Payment terms

**Step 2: View Escrow Details**
1. Go to "Browse Escrows" or enter the Escrow ID
2. Review project scope and milestones
3. Check payment amounts and deadlines
4. Verify your address is correct as the provider

**Step 3: Accept the Project**
- The escrow is automatically available once created
- No additional acceptance step required
- Start working once the client funds the escrow

---

## Funding Escrows

### Client Funding Process

**Step 1: Prepare USDT**
Ensure you have sufficient USDT in your wallet:
- Required: Total escrow amount + gas fees
- Example: $1,000 USDT + ~$5 for gas fees

**Step 2: Fund the Escrow**
1. Open the escrow details page
2. Click "Fund Escrow"
3. Confirm the USDT transfer transaction
4. Wait for confirmation

**Step 3: Notify Deposit**
1. After USDT transfer completes
2. Click "Notify Deposit" button
3. Enter the exact amount you deposited
4. Confirm the notification transaction
5. ✅ Escrow is now funded and active!

**Alternative Funding Methods:**
- **Direct Transfer**: Send USDT directly to the contract address
- **Batch Funding**: Fund multiple escrows in one transaction (advanced)

### Funding Verification

**Check Funding Status:**
- ✅ **Funded**: Green indicator, milestones can be released
- ⏳ **Partially Funded**: Yellow indicator, partial amount received
- ❌ **Unfunded**: Red indicator, no funds detected

**Troubleshooting Funding Issues:**
- Verify you sent to the correct contract address
- Check the transaction was confirmed on-chain
- Ensure you clicked "Notify Deposit" after transfer
- Contact support if funds don't appear after 10 minutes

---

## Managing Milestones

### Milestone Lifecycle

```
Pending → In Progress → Task Complete → Released → Completed
    ↓                        ↓
  Disputed              Evidence Review
```

### For Freelancers: Completing Milestones

**Step 1: Start Working**
1. Once escrow is funded, begin work on Milestone 1
2. Milestone status shows as "In Progress"
3. Work toward the defined deliverable

**Step 2: Submit Completed Work**
1. Click "Mark Task Complete" for the milestone
2. **Add Completion Note**:
   ```
   "Completed 3 logo concepts as requested:
   - Concept A: Modern geometric approach
   - Concept B: Minimalist text-based design
   - Concept C: Symbol + wordmark combination

   All concepts delivered in PDF format with color variations."
   ```

3. **Upload Evidence** (optional but recommended):
   - Upload work samples, screenshots, or files
   - Provide links to deliverables
   - Include any relevant documentation

4. **Submit Completion**
   - Click "Submit Task Completion"
   - Confirm blockchain transaction
   - Milestone status changes to "Task Complete"

**Step 3: Await Client Review**
- Client has time to review your work
- Client can release payment or request revisions
- You'll be notified of any actions taken

### For Clients: Reviewing and Releasing Payments

**Step 1: Review Completed Work**
1. Receive notification of milestone completion
2. Review the freelancer's deliverables
3. Check completion notes and evidence
4. Evaluate against original requirements

**Step 2: Release Payment (if satisfied)**
1. Click "Release Payment" for the milestone
2. Confirm you're satisfied with the work
3. Authorize the blockchain transaction
4. Funds transfer to the freelancer instantly
5. ✅ Milestone marked as "Completed"

**Step 3: Request Revisions (if needed)**
1. If work needs changes, contact the freelancer
2. Don't release payment until satisfied
3. Freelancer can submit updates
4. Review again when ready

### Advanced Milestone Management

**When Deadlines Are Passed:**
- **No Automatic Actions**: Funds remain locked in escrow when deadlines pass
- **Client Can Still Release**: Clients may choose to release payment despite missed deadlines
- **Work Can Continue**: Parties can negotiate extensions and continue collaboration
- **Manual Dispute Required**: If resolution is needed, either party must file a dispute

**Milestone Extensions:**
- If more time is needed, both parties can agree to extend deadlines
- Cancel current escrow and create new one with longer timeline
- Continue working past deadline with mutual agreement

**Milestone Splitting:**
- Break large milestones into smaller ones for better cash flow
- Create multiple escrows instead of one large one
- Manage risk by releasing payments incrementally

**Evidence Best Practices:**
- **For Design Work**: Upload preview images, style guides
- **For Development**: Provide demo links, code repositories
- **For Writing**: Submit drafts, outlines, final documents
- **For Consulting**: Include reports, meeting notes, deliverables

---

## Handling Disputes

### When to Use Disputes

**Valid Dispute Reasons:**
- Work doesn't match agreed specifications
- Quality is significantly below expectations
- Freelancer has become unresponsive
- Delivery deadline missed without communication (requires manual dispute filing)
- Client won't release payment for completed work
- **Deadline expired and resolution needed** (no automatic refunds occur)

**Invalid Dispute Reasons:**
- Minor revisions needed (use communication instead)
- Change in project requirements after start
- Personal disagreements unrelated to work

### Dispute Process

**Step 1: Try Direct Communication First**
- Message the other party directly
- Clearly explain your concerns
- Attempt to resolve amicably
- Document all communication

**Step 2: File a Dispute**
1. Go to the milestone in question
2. Click "Dispute Milestone"
3. **Select Dispute Reason**:
   - Quality doesn't match requirements
   - Work not delivered as specified
   - Unresponsive counterparty
   - Payment not released for completed work
   - Other (specify)

4. **Provide Detailed Explanation**:
   ```
   Example dispute reason:
   "The logo designs delivered do not match the agreed specifications:

   1. Requested modern, minimalist style but received ornate, complex designs
   2. Asked for vector format but received low-resolution JPEG files
   3. Color scheme doesn't match brand guidelines provided

   I've communicated these issues but freelancer has not responded
   for 48 hours. Requesting review and appropriate resolution."
   ```

5. **Upload Supporting Evidence**:
   - Screenshots of original requirements
   - Examples of delivered work
   - Communication history
   - Any relevant documentation

6. **Submit Dispute**
   - Confirm blockchain transaction
   - Dispute status: "Under Review"

**Step 3: Manual Dispute Resolution**
- Both parties can provide additional evidence
- Platform mediators review all information
- **Manual review process** - no automatic fund distribution
- Resolution typically within 3-5 business days
- Possible outcomes decided by mediators:
  - Payment released to freelancer
  - Partial payment to both parties
  - Full refund to client
  - Requirement for additional work
- **Note**: Deadlines do not trigger automatic refunds - human review determines all outcomes

### Dispute Prevention Tips

**For Clients:**
- Write clear, detailed project requirements
- Provide examples and references
- Communicate regularly during work
- Give specific feedback on deliverables
- Set realistic deadlines

**For Freelancers:**
- Ask clarifying questions upfront
- Provide regular progress updates
- Submit work that matches specifications exactly
- Respond to client communication promptly
- Deliver on time or communicate delays early

**For Both Parties:**
- Document all agreements and changes
- Use professional, respectful communication
- Be reasonable and flexible when possible
- Focus on the work, not personal issues

---

## Advanced Features

### Multi-Milestone Projects

**Complex Project Example: E-commerce Website**

**Phase 1: Planning & Design (Week 1-2)**
- Milestone 1: Wireframes and site architecture ($500)
- Milestone 2: UI/UX design mockups ($1,000)

**Phase 2: Development (Week 3-6)**
- Milestone 3: Frontend development ($1,500)
- Milestone 4: Backend and database setup ($1,000)

**Phase 3: Launch (Week 7-8)**
- Milestone 5: Testing and bug fixes ($500)
- Milestone 6: Deployment and training ($500)

**Total: $5,000 across 6 milestones**

### Team Projects

**Multiple Freelancers:**
- Create separate escrows for each team member
- Coordinate milestone dependencies
- Manage payments independently

**Example: Marketing Campaign**
- Designer: Logo and brand assets ($800)
- Copywriter: Website content ($600)
- Developer: Landing page ($1,200)

### Recurring Projects

**Monthly Retainer Example:**
- Create new escrow each month
- Standard deliverables and timeline
- Build long-term working relationships
- Track performance over time

### Fee Structure

Current platform fee structure:
- **All transactions**: 1.0% fee
- **Future plans**: Volume-based fee reductions as platform grows
- **Transparent**: No hidden fees or surprise charges

Fair and predictable pricing for all users!

---

## Security Best Practices

### Wallet Security

**Seed Phrase Protection:**
- ✅ Write down your 12-word seed phrase
- ✅ Store in a secure, offline location
- ✅ Never share with anyone
- ❌ Don't store in cloud storage or email
- ❌ Don't take photos of seed phrases
- ❌ Don't enter seed phrases on suspicious websites

**Account Security:**
- Use strong, unique passwords
- Enable 2FA where available
- Lock your browser when not in use
- Log out of shared computers
- Keep your wallet extension updated

### Transaction Safety

**Before Sending Any Transaction:**
- Verify the contract address matches official documentation
- Double-check recipient addresses
- Confirm transaction amounts
- Review gas fees (should be reasonable)
- Never rush important transactions

**Suspicious Activity Warning Signs:**
- Unexpected transaction requests
- Unusually high gas fees
- Unfamiliar website URLs
- Pressure to act quickly
- Requests for seed phrases or private keys

### Platform Security

**Official Channels Only:**
- Website: [official-domain.com]
- Discord: [Official Discord link]
- Twitter: [@official-handle]
- GitHub: [github.com/official-repo]

**Phishing Protection:**
- Always check the URL in your browser
- Look for HTTPS and the correct domain
- Don't click links in suspicious emails
- Bookmark the official website
- Verify contract addresses independently

### Smart Contract Security

**Our Security Measures:**
- Comprehensive test suite with 34 passing tests covering all functionality
- Multi-signature governance preventing single points of failure (10 dedicated tests)
- Proposal-based administrative control with k-of-n approval requirements
- Manual code reviews and open-source transparency
- Emergency pause functionality requiring multi-signature approval
- Planned third-party security audit (in progress on roadmap)
- Community bug reporting channels

**Additional Safety:**
- Start with small test transactions
- Verify all escrow details before funding
- Use test networks for learning
- Report any suspicious activity immediately

---

## Troubleshooting

### Common Issues and Solutions

#### Wallet Connection Problems

**Issue: "Wallet not detected"**
- Solution: Install Polkadot.js extension and refresh page
- Check browser compatibility
- Clear browser cache and cookies

**Issue: "Connection failed"**
- Solution: Check internet connection
- Try different browser or incognito mode
- Restart browser and try again

**Issue: "Wrong network"**
- Solution: Switch to correct network in wallet
- Refresh page after network change
- Verify RPC endpoint is correct

#### Transaction Failures

**Issue: "Insufficient balance"**
- Solution: Check you have enough tokens for transaction + gas
- Get more tokens from faucet (testnet) or exchange (mainnet)
- Reduce transaction amount if possible

**Issue: "Transaction timeout"**
- Solution: Increase gas limit slightly
- Check network congestion and try later
- Verify RPC endpoint is responsive

**Issue: "Invalid signature"**
- Solution: Unlock your wallet
- Try disconnecting and reconnecting wallet
- Clear wallet cache and reconnect

#### Escrow Issues

**Issue: "Escrow not found"**
- Solution: Verify escrow ID is correct
- Check you're on the right network
- Ensure escrow was successfully created

**Issue: "Cannot release milestone"**
- Solution: Verify you're authorized (client or provider)
- Check milestone is in "Task Complete" status
- Ensure escrow is properly funded

**Issue: "Deposit not detected"**
- Solution: Click "Notify Deposit" after transferring USDT
- Verify transaction was confirmed on blockchain
- Check you sent to correct contract address

### Getting Support

**Self-Help Resources:**
1. Check this user guide
2. Review FAQ section below
3. Search Discord for similar issues
4. Check transaction status on blockchain explorer

**Contact Support:**
- Discord: #support channel
- Email: support@escrow-platform.com
- Response time: 24-48 hours
- Emergency issues: Mark as urgent

**When Contacting Support, Include:**
- Your wallet address
- Escrow ID (if applicable)
- Transaction hash (if applicable)
- Browser and extension version
- Screenshot of error message
- Steps to reproduce the issue

---

## FAQs

### General Questions

**Q: What is the minimum escrow amount?**
A: There's no platform minimum, but consider gas fees. For small amounts under $50, fees may be proportionally high.

**Q: How long do transactions take?**
A: Polkadot transactions finalize in ~6 seconds. USDT transfers may take a few minutes depending on network congestion.

**Q: Can I cancel an escrow?**
A: Unfunded escrows can be canceled by the creator. Funded escrows require mutual agreement or dispute resolution.

**Q: What happens if someone loses access to their wallet?**
A: Blockchain transactions are irreversible. Always secure your seed phrase. Lost access means funds cannot be recovered.

### Payment Questions

**Q: What tokens are accepted?**
A: Currently only USDT (PSP22-compliant stablecoin). More tokens may be added in the future.

**Q: How are fees calculated?**
A: Platform fees are currently 1.0% of escrow value, with plans for volume-based reductions as the platform grows.

**Q: When are fees charged?**
A: Fees are automatically deducted when payments are released to freelancers.

**Q: Can I get a refund?**
A: Refunds are only available through dispute resolution or mutual agreement to cancel.

**Q: What happens when deadlines are missed?**
A: **No automatic actions occur.** Funds remain locked in escrow when deadlines pass. Either party may choose to:
- Continue working with mutual agreement
- Client can still release payment despite missed deadline
- File a dispute for manual resolution if needed

**Q: Are there automatic refunds for expired escrows?**
A: **No.** The platform does not automatically refund expired escrows. All fund distribution requires either manual release by the client or dispute resolution by platform mediators.

### Technical Questions

**Q: Which wallets are supported?**
A: Polkadot.js Extension, SubWallet, and Talisman. More wallets may be added.

**Q: Is the smart contract audited?**
A: The contract has extensive testing coverage. Professional security audit is planned as part of our security roadmap.

**Q: Is the platform open source?**
A: Yes, all code is available on GitHub for transparency and community review.

**Q: What happens if the platform goes down?**
A: The smart contract operates independently on the blockchain. Even if our website is down, your funds remain secure and accessible through the blockchain.

### Business Questions

**Q: Can I use this for my business?**
A: Yes, .escrow supports both individual and business use cases.

**Q: Are there volume discounts?**
A: Volume-based fee reductions are planned for future implementation as the platform scales.

**Q: Can I integrate this into my platform?**
A: Yes, we provide APIs and documentation for third-party integrations.

**Q: Is there customer support?**
A: Yes, we provide support through Discord and email for all platform users.

### Legal Questions

**Q: Is this platform legal in my country?**
A: The platform operates on decentralized blockchain technology. Check your local regulations regarding cryptocurrency use.

**Q: How are taxes handled?**
A: Users are responsible for their own tax obligations. The platform provides transaction history for tax reporting.

**Q: What happens in disputes?**
A: We provide mediation services, but ultimate resolution depends on evidence and platform terms of service.

**Q: Are funds insured?**
A: Funds are secured by smart contract technology, not traditional insurance. The contract includes safety mechanisms but users should understand blockchain risks.

---

## Getting Started Checklist

**Before Your First Escrow:**
- [ ] Wallet extension installed and set up
- [ ] Account created with secure seed phrase backup
- [ ] Test tokens obtained (for testnet use)
- [ ] Platform connection tested
- [ ] This user guide reviewed

**For Your First Project:**
- [ ] Project scope clearly defined
- [ ] Milestones planned with specific deliverables
- [ ] Counterparty wallet address verified
- [ ] Payment amounts and timeline agreed
- [ ] Communication channels established

**Safety Checklist:**
- [ ] Seed phrase stored securely offline
- [ ] Contract address verified from official sources
- [ ] Transaction details double-checked
- [ ] Start with small test amounts
- [ ] Know how to contact support if needed

---

## Next Steps

**After Reading This Guide:**
1. Set up your wallet following the instructions
2. Get test tokens and try creating a small escrow
3. Practice the full workflow on testnet
4. Join our community Discord for support
5. Start with small real projects to build confidence

**Community Resources:**
- Discord: Real-time support and community
- Twitter: Platform updates and announcements
- GitHub: Technical documentation and code
- Blog: Tutorials and platform insights

**Welcome to the future of freelance payments! 🚀**

---

*This user guide is regularly updated. Check the documentation section for the latest version and feature updates.*
