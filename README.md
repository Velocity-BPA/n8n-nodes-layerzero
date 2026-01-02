# n8n-nodes-layerzero

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **LayerZero**, the omnichain interoperability protocol that enables secure cross-chain messaging across 80+ blockchains. This node provides full access to LayerZero's messaging infrastructure, OFT/ONFT token operations, DVN configuration, and protocol analytics.

![n8n](https://img.shields.io/badge/n8n-community--node-brightgreen)
![LayerZero](https://img.shields.io/badge/LayerZero-V2-black)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

## Features

- **Cross-Chain Message Tracking**: Monitor messages via LayerZero Scan API with real-time status updates
- **OFT Transfers**: Full Omnichain Fungible Token operations including quotes, transfers, and validation
- **ONFT Operations**: Cross-chain NFT transfers and metadata management
- **DVN Configuration**: Manage Decentralized Verifier Networks for message security
- **Executor Management**: Configure executors and native gas drops
- **Fee Estimation**: Accurate cross-chain messaging fee calculations
- **Protocol Analytics**: Comprehensive statistics and volume tracking
- **80+ Chain Support**: EVM and non-EVM chains including Solana, Aptos, and more
- **Trigger Node**: Poll-based triggers for message events, large transfers, and more

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-layerzero`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-layerzero

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-layerzero.git
cd n8n-nodes-layerzero

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-layerzero

# Restart n8n
```

## Credentials Setup

Create **LayerZero API** credentials in n8n with the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| Environment | Yes | `mainnet` or `testnet` |
| Scan API Key | No | API key for LayerZero Scan (rate limiting) |
| OFT API Key | No | API key for OFT operations |
| Private Key | No* | Wallet private key for on-chain operations |
| Mnemonic | No* | Wallet mnemonic (alternative to private key) |
| RPC Endpoints | No | Custom RPC URLs per chain |

*Required for on-chain operations (transfers, transactions)

### Obtaining API Keys

1. **Scan API Key**: Register at [LayerZero Scan](https://scan.layerzero.network)
2. **OFT API Key**: Contact LayerZero for OFT API access
3. **RPC Endpoints**: Use public RPCs or services like Alchemy, Infura, QuickNode

## Resources & Operations

### 1. Message Tracking
Track cross-chain messages via the Scan API.

| Operation | Description |
|-----------|-------------|
| Get Message by Hash | Lookup message by source transaction hash |
| Get Message by GUID | Lookup by global unique identifier |
| Get Messages by OApp | Messages for specific application |
| Get Messages by Wallet | Messages from wallet address |
| Get Latest Messages | Recent cross-chain messages |
| Get Message Status | Delivery status check |
| Search Messages | Advanced message search |

### 2. OFT Transfers
Omnichain Fungible Token operations.

| Operation | Description |
|-----------|-------------|
| Get OFT Routes | Available transfer routes |
| Get OFT Info | Token details and configuration |
| Get Transfer Quote | Fee estimation for transfer |
| Execute OFT Transfer | Send tokens cross-chain |
| Validate Transfer | Pre-flight validation |

### 3. ONFT Operations
Cross-chain NFT operations.

| Operation | Description |
|-----------|-------------|
| Get ONFT Routes | Available NFT transfer routes |
| Get Transfer Quote | Fee estimation |
| Execute ONFT Transfer | Send NFT cross-chain |
| Get ONFT Metadata | NFT metadata retrieval |

### 4. Endpoint Operations
LayerZero endpoint management.

| Operation | Description |
|-----------|-------------|
| Get Endpoints | List all endpoints |
| Get Endpoint ID (EID) | Chain's endpoint identifier |
| Check Pathway Support | Verify chain-to-chain support |
| Get Default Config | Default DVN/Executor config |

### 5. DVN (Decentralized Verifier Networks)
Security stack configuration.

| Operation | Description |
|-----------|-------------|
| Get DVN Providers | List available DVNs |
| Get DVN Info | DVN details and fees |
| Check DVN Support | Pathway availability |
| Get Security Stack | OApp's configured DVNs |

### 6. Executor
Message execution configuration.

| Operation | Description |
|-----------|-------------|
| Get Executors | List available executors |
| Get Executor Fees | Fee structure |
| Get Native Drop Config | Gas airdrop settings |

### 7. Fee Estimation
Cross-chain fee calculations.

| Operation | Description |
|-----------|-------------|
| Quote Send Fee | Estimate lzSend cost |
| Quote OFT Fee | Estimate OFT transfer cost |
| Get Fee Breakdown | Detailed fee components |

### 8. OApp Configuration
Omnichain Application settings.

| Operation | Description |
|-----------|-------------|
| Get OApp Config | Application configuration |
| Get Send/Receive Library | Message library settings |
| Get DVN Config | Required/optional DVNs |
| Get Peers | Connected OApp addresses |

### 9. Message Options
Build message options for lzSend.

| Operation | Description |
|-----------|-------------|
| Build Options | Generate message options |
| Add Executor Option | Execution parameters |
| Add Native Drop | Gas airdrop configuration |

### 10. ZRO Token
LayerZero governance token operations.

| Operation | Description |
|-----------|-------------|
| Get ZRO Balance | Token balance |
| Get ZRO Price | Current price |
| Transfer ZRO | Send tokens |

### 11. Protocol Analytics
Statistics and metrics.

| Operation | Description |
|-----------|-------------|
| Get Protocol Stats | Overall metrics |
| Get Message Volume | Transaction volume |
| Get Top OApps | Most active applications |

### 12. Endpoint Metadata
Chain and contract information.

| Operation | Description |
|-----------|-------------|
| Get All Chains | Supported chains list |
| Get Chain Info | Chain configuration |
| Get Contract Addresses | Deployed contracts |

### 13. Compose Messages
Multi-step message operations.

| Operation | Description |
|-----------|-------------|
| Create Compose Message | Multi-step message |
| Get Compose Status | Execution status |

### 14. Pathway Configuration
Chain pathway settings.

| Operation | Description |
|-----------|-------------|
| Get Pathway Config | Chain-to-chain settings |
| Get Block Confirmations | Required confirmations |

### 15. Transaction Building
Build and simulate transactions.

| Operation | Description |
|-----------|-------------|
| Build lzSend Transaction | Generic message send |
| Build OFT Send Transaction | Token transfer tx |
| Estimate Transaction Gas | Gas estimation |
| Simulate Transaction | Dry-run |

### 16. Utility
Helper functions and status.

| Operation | Description |
|-----------|-------------|
| Get API Status | Health check |
| Convert EID/Chain | ID conversions |
| Validate Address | Format validation |

## Trigger Node

The **LayerZero Trigger** polls for cross-chain events:

| Event | Description |
|-------|-------------|
| Message Delivered | Trigger on successful delivery |
| Message Sent | Trigger when message sent |
| Message Failed | Trigger on failure |
| Message Inflight | Trigger on pending messages |
| Large Transfer Detected | High-value transfer alerts |
| New OApp Message | Messages from specific OApp |
| Wallet Activity | Activity from specific wallet |

## Usage Examples

### Track a Cross-Chain Message

```javascript
// Using Message Tracking resource
{
  "resource": "messageTracking",
  "operation": "getMessageByHash",
  "txHash": "0x..."
}
```

### Execute OFT Transfer

```javascript
// Using OFT Transfers resource
{
  "resource": "oftTransfers",
  "operation": "executeTransfer",
  "oftAddress": "0x...",
  "srcChain": "ethereum",
  "dstChain": "arbitrum",
  "amount": "100",
  "recipient": "0x..."
}
```

### Monitor Large Transfers

```javascript
// Using LayerZero Trigger
{
  "event": "largeTransfer",
  "transferThreshold": 100000,
  "srcChain": "",  // Any chain
  "dstChain": ""   // Any chain
}
```

## LayerZero Concepts

| Concept | Description |
|---------|-------------|
| **Endpoint** | Immutable contract - entry/exit for cross-chain messages |
| **EID** | Endpoint ID - unique identifier for each chain's endpoint |
| **OApp** | Omnichain Application using LayerZero messaging |
| **OFT** | Omnichain Fungible Token - cross-chain ERC-20 |
| **ONFT** | Omnichain NFT - cross-chain ERC-721 |
| **DVN** | Decentralized Verifier Network - validates messages |
| **Executor** | Service that executes messages on destination |
| **Security Stack** | OApp's configured DVNs for verification |
| **GUID** | Global Unique Identifier for each message |
| **lzSend** | Function to send cross-chain message |
| **lzReceive** | Function to receive cross-chain message |
| **Native Drop** | Airdrop native gas on destination |

## Supported Networks

### EVM Chains
Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BNB Chain, Fantom, Linea, Scroll, zkSync Era, Polygon zkEVM, Mantle, Blast, and 60+ more.

### Non-EVM Chains
Solana, Aptos, Sei, Tron

## Message Status Flow

```
Source Chain                    Destination Chain
     │                               │
     ▼                               │
[PacketSent]                         │
     │                               │
     ▼                               │
[DVN Verification]                   │
     │                               │
     ▼                               │
[PayloadVerified] ─────────────────► │
                                     ▼
                              [lzReceive]
                                     │
                                     ▼
                              [DELIVERED]
```

## Error Handling

The node includes comprehensive error handling:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Errors**: Graceful fallback and clear error messages
- **Invalid Parameters**: Validation before API calls
- **Transaction Failures**: Detailed error information

Enable "Continue on Fail" to handle errors gracefully in your workflows.

## Security Best Practices

1. **API Keys**: Store in n8n credentials, never in workflows
2. **Private Keys**: Use environment variables or secret management
3. **RPC Endpoints**: Use authenticated endpoints for production
4. **DVN Selection**: Choose multiple DVNs for critical messages
5. **Amount Validation**: Always validate token amounts before transfers

## Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-layerzero/issues)
- [LayerZero Documentation](https://docs.layerzero.network/)
- [n8n Community](https://community.n8n.io/)

## Acknowledgments

- [LayerZero Labs](https://layerzero.network/) for the omnichain protocol
- [n8n](https://n8n.io/) for the workflow automation platform
- [Velocity BPA](https://velobpa.com/) for development and maintenance
