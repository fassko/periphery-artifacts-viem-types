import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// Function to get all contract artifacts (same as in wagmi.config.ts)
interface ContractWithNetwork {
  name: string
  abi: any[]
  network: string
}

function getContractArtifacts(): ContractWithNetwork[] {
  const networks = ['flare', 'songbird', 'coston', 'coston2']
  const contracts: ContractWithNetwork[] = []
  
  function scanDirectory(dirPath: string, network: string, relativePath: string = '') {
    const items = require('fs').readdirSync(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = join(dirPath, item.name)
      const itemRelativePath = join(relativePath, item.name)
      
      if (item.isDirectory()) {
        scanDirectory(fullPath, network, itemRelativePath)
      } else if (item.isFile() && item.name.endsWith('.json')) {
        try {
          const content = readFileSync(fullPath, 'utf-8')
          const artifact = JSON.parse(content)
          
          let abi: any[]
          if (Array.isArray(artifact)) {
            abi = artifact
          } else if (artifact.abi && Array.isArray(artifact.abi)) {
            abi = artifact.abi
          } else {
            continue
          }
          
          const contractName = item.name.replace('.json', '')
          
          contracts.push({
            name: contractName,
            abi,
            network
          })
          
          console.log(`✅ Found contract: ${contractName} (${network})`)
        } catch (error) {
          console.warn(`⚠️  Failed to parse ${fullPath}:`, error)
        }
      }
    }
  }
  
  for (const network of networks) {
    const artifactsPath = join(process.cwd(), `node_modules/@flarenetwork/flare-periphery-contract-artifacts/${network}/artifacts`)
    if (existsSync(artifactsPath)) {
      scanDirectory(artifactsPath, network)
    } else {
      console.warn(`⚠️  Network artifacts not found: ${network}`)
    }
  }
  
  return contracts
}

function generatePerContract() {
  console.log('🔄 Getting contract artifacts...')
  const contracts = getContractArtifacts()
  
  // Group contracts by network
  const contractsByNetwork = contracts.reduce((acc, contract) => {
    if (!acc[contract.network]) {
      acc[contract.network] = []
    }
    acc[contract.network].push(contract)
    return acc
  }, {} as Record<string, ContractWithNetwork[]>)
  
  console.log(`📦 Found ${contracts.length} contracts across ${Object.keys(contractsByNetwork).length} networks`)
  
  // Generate files for each network
  for (const [network, networkContracts] of Object.entries(contractsByNetwork)) {
    console.log(`\n🌐 Generating contracts for ${network} (${networkContracts.length} contracts)`)
    
    const networkDir = `contracts/${network}`
    
    // Create network directory
    if (!existsSync(networkDir)) {
      mkdirSync(networkDir, { recursive: true })
    }
    
    // Generate individual files for each contract in this network
    networkContracts.forEach((contract, index) => {
      console.log(`📝 Generating ${contract.name} (${index + 1}/${networkContracts.length})`)
      
      // Create temporary wagmi config for this contract
      const contractFileName = contract.name
      
      const tempConfig = `import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'

export default defineConfig({
  out: '${networkDir}/${contractFileName}.ts',
  contracts: [{
    name: '${contract.name}',
    abi: ${JSON.stringify(contract.abi, null, 2)},
  }],
  plugins: [react()],
})
`
      
      // Write temporary config
      writeFileSync('temp-wagmi.config.ts', tempConfig)
      
      try {
        // Run wagmi generate with the temporary config
        execSync(`npx wagmi generate --config temp-wagmi.config.ts`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        })
      } catch (error) {
        console.error(`❌ Failed to generate ${contract.name}:`, error)
      }
    })
    
    // Generate index file for this network
    generateNetworkIndex(network, networkDir)
  }
  
  // Clean up temporary config
  try {
    require('fs').unlinkSync('temp-wagmi.config.ts')
  } catch (error) {
    // Ignore cleanup errors
  }
  
  // Generate main index file
  console.log('\n📝 Generating main index file...')
  generateMainIndex(contractsByNetwork)
  
  console.log('\n✅ Generation complete!')
  console.log(`📁 Generated files: contracts/`)
}

function generateNetworkIndex(network: string, networkDir: string) {
  const contractFiles = require('fs').readdirSync(networkDir)
    .filter((file: string) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file: string) => file.replace('.ts', ''))
  
  const networkIndex = `// Auto-generated index file for ${network} network
// Export all contract ABIs and hooks
${contractFiles.map((fileName: string) => {
    return `export * from './${fileName}'`
  }).join('\n')}
`
  writeFileSync(`${networkDir}/index.ts`, networkIndex)
}

function generateMainIndex(contractsByNetwork: Record<string, ContractWithNetwork[]>) {
  const mainIndex = `// Auto-generated main index file
// Export all networks as namespaced exports

${Object.keys(contractsByNetwork).map(network => {
    return `export * as ${network} from './${network}'`
  }).join('\n')}
`
  writeFileSync('contracts/index.ts', mainIndex)
}

// Run the generation process
if (require.main === module) {
  generatePerContract()
}

export { generatePerContract }
