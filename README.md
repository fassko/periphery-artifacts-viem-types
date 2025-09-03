# Flare Network Periphery Artifacts - Viem Types Generator

This repository demonstrates how to generate **ABIType definitions for viem** from Flare Network periphery contract artifacts using the `@flarenetwork/flare-periphery-contract-artifacts` package.

## 🎯 Purpose

Generate type-safe viem ABIType definitions for all Flare Network periphery contracts, enabling:
- **Type-safe contract interactions** with viem
- **Auto-generated React hooks** with wagmi
- **Full TypeScript support** for all contract functions and events
- **130+ contracts** from Flare's periphery ecosystem

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Types

Using Wagmi CLI
```bash
npm run wagmi:generate
```
Generates comprehensive React hooks and types in `generated.ts`

### 3. Use Generated Types

```typescript
// Import generated types
import { 
  ftsoV2InterfaceAbi,
  useReadFtsoV2Interface,
  useWriteIAssetManager 
} from './generated';

// Use in your React components
function MyComponent() {
  const { data } = useReadFtsoV2Interface({
    address: '0x...',
    functionName: 'getSupportedFeedIds',
  });
  
  return <div>{/* Your UI */}</div>;
}
```

## 📁 Project Structure

```
├── wagmi.config.ts              # Wagmi CLI configuration
├── generated.ts                 # Generated TypeScript ABIType types
└── node_modules/
    └── @flarenetwork/
        └── flare-periphery-contract-artifacts/
            └── coston2/artifacts/  # Source contract artifacts
```

## 🔗 Dependencies

- `@wagmi/cli` - Type generation CLI
- `wagmi` - React hooks for Ethereum
- `viem` - TypeScript interface for Ethereum
- `@flarenetwork/flare-periphery-contract-artifacts` - Flare contract artifacts

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Flare Network Documentation](https://docs.flare.network/)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Flare Periphery Artifacts](https://www.npmjs.com/package/@flarenetwork/flare-periphery-contract-artifacts)
