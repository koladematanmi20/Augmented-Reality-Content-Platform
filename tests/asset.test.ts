import { describe, it, beforeEach, expect } from "vitest"

describe("Asset Contract", () => {
  let mockStorage: Map<string, any>
  let assetIdNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    assetIdNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-asset":
        const [contentHash, metadata] = args
        assetIdNonce++
        mockStorage.set(`asset-${assetIdNonce}`, {
          owner: sender,
          "content-hash": contentHash,
          metadata: metadata,
        })
        return { success: true, value: assetIdNonce }
      
      case "transfer":
        const [assetId, recipient] = args
        const asset = mockStorage.get(`asset-${assetId}`)
        if (!asset) {
          return { success: false, error: 404 }
        }
        if (asset.owner !== sender) {
          return { success: false, error: 403 }
        }
        asset.owner = recipient
        mockStorage.set(`asset-${assetId}`, asset)
        return { success: true }
      
      case "get-asset-data":
        return { success: true, value: mockStorage.get(`asset-${args[0]}`) }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should create an asset", () => {
    const result = mockContractCall("create-asset", ["0x1234567890", "https://example.com/metadata"], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should transfer an asset", () => {
    mockContractCall("create-asset", ["0x1234567890", "https://example.com/metadata"], "user1")
    const result = mockContractCall("transfer", [1, "user2"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should not transfer an asset if not the owner", () => {
    mockContractCall("create-asset", ["0x1234567890", "https://example.com/metadata"], "user1")
    const result = mockContractCall("transfer", [1, "user3"], "user2")
    expect(result.success).toBe(false)
    expect(result.error).toBe(403)
  })
  
  it("should get asset data", () => {
    mockContractCall("create-asset", ["0x1234567890", "https://example.com/metadata"], "user1")
    const result = mockContractCall("get-asset-data", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      owner: "user1",
      "content-hash": "0x1234567890",
      metadata: "https://example.com/metadata",
    })
  })
})

