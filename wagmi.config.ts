import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// The path to the artifacts directory
const artifacts_path = 'node_modules/@flarenetwork/flare-periphery-contract-artifacts/coston2/artifacts'

// Function to get all contract artifacts
function getContractArtifacts() {
  // Get the full path to the artifacts directory
  const artifactsPath = join(process.cwd(), artifacts_path)
  const contracts: Array<{ name: string; abi: any[] }> = []
  
  // Function to scan the directory and get all contract artifacts
  function scanDirectory(dirPath: string, relativePath: string = '') {
    const items = readdirSync(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = join(dirPath, item.name)
      const itemRelativePath = join(relativePath, item.name)
      
      if (item.isDirectory()) {
        scanDirectory(fullPath, itemRelativePath)
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
          const fileName = itemRelativePath.replace('.json', '')
          
          contracts.push({
            name: contractName,
            abi
          })
          
          console.log(`✅ Found contract: ${contractName} (${fileName})`)
        } catch (error) {
          console.warn(`⚠️  Failed to parse ${fullPath}:`, error)
        }
      }
    }
  }
  
  scanDirectory(artifactsPath)
  return contracts
}

// Get all contracts
const contracts = getContractArtifacts()

export default defineConfig({
  out: 'generated.ts',
  contracts: contracts.map(contract => ({
    name: contract.name,
    abi: contract.abi,
  })),
  plugins: [react()],
})
