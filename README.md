# TrustiChain - Blockchain Escrow Platform

TrustiChain is a secure, decentralized escrow platform built on blockchain technology. It provides a trustless environment for secure transactions between parties using smart contracts.

## Features

- 🔒 **Secure Escrow**: Funds are locked in smart contracts until conditions are met
- 🌐 **Decentralized**: No central authority, powered by blockchain technology
- 👥 **Multi-party Support**: Support for buyers, sellers, and arbitrators
- ⚡ **Fast Settlement**: Automated settlement when conditions are met
- 🛡️ **Dispute Resolution**: Built-in arbitration system for conflict resolution
- 💼 **Wallet Integration**: Seamless MetaMask and Web3 wallet integration

## Technology Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: CSS3 with modern glassmorphism design
- **Blockchain**: Ethereum, Ethers.js
- **Web3**: Web3-react for wallet connectivity
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trustichain
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.js      # Navigation component
├── context/           # React context providers
│   └── Web3Context.js # Web3 wallet context
├── pages/             # Main application pages
│   ├── Home.js        # Landing page
│   ├── CreateEscrow.js # Create new escrow
│   ├── MyEscrows.js   # User's escrow list
│   └── EscrowDetails.js # Individual escrow details
├── utils/              # Utility functions
│   └── contract.js    # Smart contract utilities
├── App.js             # Main application component
└── index.js           # Application entry point
```

## Usage

### Connecting Your Wallet

1. Click "Connect Wallet" in the navigation bar
2. Select your preferred wallet (MetaMask recommended)
3. Approve the connection request

### Creating an Escrow

1. Navigate to "Create Escrow" from the main menu
2. Fill in the transaction details:
   - Transaction title and description
   - Amount in ETH
   - Buyer and seller addresses
   - Optional arbitrator address
   - Terms and conditions
3. Click "Create Escrow" to deploy the smart contract

### Managing Escrows

- View all your escrows in "My Escrows"
- Filter by status (Active, Completed, Disputed, Expired)
- Click "View Details" to see full transaction information
- Perform actions based on your role (buyer, seller, arbitrator)

### Escrow Actions

- **Release Funds**: Seller can release funds to buyer when conditions are met
- **Initiate Dispute**: Either party can dispute if terms aren't fulfilled
- **Arbitrate**: Arbitrator can resolve disputes by releasing funds or refunding
- **Refund**: Automatic refund if deadline passes without resolution

## Smart Contract Integration

The platform integrates with Ethereum smart contracts for:

- Escrow creation and funding
- Multi-signature fund release
- Dispute initiation and resolution
- Automatic refunds on deadline expiration

### Contract Functions

- `createEscrow()`: Create new escrow transaction
- `fundEscrow()`: Add funds to escrow
- `releaseFunds()`: Release funds to seller
- `initiateDispute()`: Start dispute process
- `arbitrate()`: Resolve dispute
- `refund()`: Refund funds to buyer

## Security Features

- **Smart Contract Security**: All funds locked in audited smart contracts
- **Multi-signature**: Requires multiple parties to release funds
- **Time Locks**: Automatic refunds after deadline
- **Dispute Resolution**: Neutral arbitrator system
- **Transparent**: All transactions visible on blockchain

## Network Support

Currently supports:
- Ethereum Mainnet
- Polygon
- Binance Smart Chain

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Mobile app development
- [ ] Additional blockchain support
- [ ] Advanced dispute resolution
- [ ] Integration with DeFi protocols
- [ ] Multi-token support
- [ ] API for third-party integrations

---

Built with ❤️ for secure blockchain transactions
