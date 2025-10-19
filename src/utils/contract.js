// Smart Contract ABI and utilities for TrustiChain Escrow Platform
import { ethers } from 'ethers';

// Escrow Contract ABI (simplified version)
export const ESCROW_CONTRACT_ABI = [
  "function createEscrow(address buyer, address seller, address arbitrator, uint256 deadline) external payable returns (uint256)",
  "function releaseFunds(uint256 escrowId) external",
  "function initiateDispute(uint256 escrowId, string memory reason) external",
  "function arbitrate(uint256 escrowId, bool releaseToSeller) external",
  "function refund(uint256 escrowId) external",
  "function getEscrow(uint256 escrowId) external view returns (address buyer, address seller, address arbitrator, uint256 amount, uint256 deadline, uint8 status, string memory terms)",
  "function getUserEscrows(address user) external view returns (uint256[] memory)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)",
  "event FundsReleased(uint256 indexed escrowId, address indexed recipient)",
  "event DisputeInitiated(uint256 indexed escrowId, address indexed initiator, string reason)",
  "event DisputeResolved(uint256 indexed escrowId, bool releaseToSeller)"
];

// Contract address (this would be the deployed contract address)
export const ESCROW_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

// Escrow status enum
export const ESCROW_STATUS = {
  ACTIVE: 0,
  COMPLETED: 1,
  DISPUTED: 2,
  EXPIRED: 3,
  REFUNDED: 4
};

// Smart contract interaction utilities
export class EscrowContract {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      ESCROW_CONTRACT_ADDRESS,
      ESCROW_CONTRACT_ABI,
      signer
    );
  }

  // Create a new escrow
  async createEscrow(buyerAddress, sellerAddress, arbitratorAddress, deadline, terms) {
    try {
      const tx = await this.contract.createEscrow(
        buyerAddress,
        sellerAddress,
        arbitratorAddress,
        deadline,
        { value: ethers.utils.parseEther("0") } // Amount will be sent separately
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      return {
        success: true,
        escrowId: event.args.escrowId.toString(),
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fund an escrow
  async fundEscrow(escrowId, amount) {
    try {
      const tx = await this.contract.fundEscrow(escrowId, {
        value: ethers.utils.parseEther(amount.toString())
      });
      
      await tx.wait();
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error funding escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Release funds to seller
  async releaseFunds(escrowId) {
    try {
      const tx = await this.contract.releaseFunds(escrowId);
      await tx.wait();
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error releasing funds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Initiate dispute
  async initiateDispute(escrowId, reason) {
    try {
      const tx = await this.contract.initiateDispute(escrowId, reason);
      await tx.wait();
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error initiating dispute:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Arbitrate dispute
  async arbitrate(escrowId, releaseToSeller) {
    try {
      const tx = await this.contract.arbitrate(escrowId, releaseToSeller);
      await tx.wait();
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error arbitrating:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund to buyer
  async refund(escrowId) {
    try {
      const tx = await this.contract.refund(escrowId);
      await tx.wait();
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error refunding:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get escrow details
  async getEscrow(escrowId) {
    try {
      const escrow = await this.contract.getEscrow(escrowId);
      return {
        success: true,
        data: {
          buyer: escrow.buyer,
          seller: escrow.seller,
          arbitrator: escrow.arbitrator,
          amount: ethers.utils.formatEther(escrow.amount),
          deadline: new Date(escrow.deadline.toNumber() * 1000),
          status: escrow.status,
          terms: escrow.terms
        }
      };
    } catch (error) {
      console.error('Error getting escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's escrows
  async getUserEscrows(userAddress) {
    try {
      const escrowIds = await this.contract.getUserEscrows(userAddress);
      return {
        success: true,
        data: escrowIds.map(id => id.toString())
      };
    } catch (error) {
      console.error('Error getting user escrows:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Utility functions
export const formatEther = (wei) => {
  return ethers.utils.formatEther(wei);
};

export const parseEther = (ether) => {
  return ethers.utils.parseEther(ether);
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address) => {
  return ethers.utils.isAddress(address);
};

export const getStatusText = (status) => {
  switch (status) {
    case ESCROW_STATUS.ACTIVE:
      return 'Active';
    case ESCROW_STATUS.COMPLETED:
      return 'Completed';
    case ESCROW_STATUS.DISPUTED:
      return 'Disputed';
    case ESCROW_STATUS.EXPIRED:
      return 'Expired';
    case ESCROW_STATUS.REFUNDED:
      return 'Refunded';
    default:
      return 'Unknown';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case ESCROW_STATUS.ACTIVE:
      return '#60a5fa';
    case ESCROW_STATUS.COMPLETED:
      return '#4ade80';
    case ESCROW_STATUS.DISPUTED:
      return '#fbbf24';
    case ESCROW_STATUS.EXPIRED:
      return '#f87171';
    case ESCROW_STATUS.REFUNDED:
      return '#a78bfa';
    default:
      return '#6b7280';
  }
};

// Network configuration
export const NETWORKS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  bsc: {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com'
  }
};

export default EscrowContract;
