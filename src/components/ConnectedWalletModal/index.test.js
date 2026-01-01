import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectedWalletModal from './index';

jest.mock('../../context/Web3Context', () => ({
  useWeb3: () => ({
    account: '0x1234567890abcdef1234567890abcdef12345678',
    isConnected: true,
    disconnectWallet: jest.fn(),
  }),
}));

describe('ConnectedWalletModal', () => {
  test('renders connected wallet and can disconnect', () => {
    const onClose = jest.fn();
    render(<ConnectedWalletModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/0x1234...5678/i)).toBeInTheDocument();

    const disconnectBtn = screen.getByText(/Disconnect/i);
    fireEvent.click(disconnectBtn);

    // confirm prompt appears
    expect(screen.getByText(/Disconnect wallet\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getAllByText(/Disconnect/i).pop();
    fireEvent.click(confirmBtn);

    // onClose should have been called after disconnect
    expect(onClose).toHaveBeenCalled();
  });
});