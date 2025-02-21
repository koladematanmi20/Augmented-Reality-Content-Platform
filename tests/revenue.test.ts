import { describe, it, beforeEach, expect } from "vitest"

describe("Revenue Contract", () => {
  let mockStorage: Map<string, any>
  let mockBalances: Map<string, number>
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  
  beforeEach(() => {
    mockStorage = new Map()
    mockBalances = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "set-revenue-share":
        const [assetId, creator, creatorShare, hostShare] = args
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: 403 }
        }
        if (creatorShare + hostShare !== 100) {
          return { success: false, error: 400 }
        }
        mockStorage.set(`revenue-share-${assetId}`, {
          creator,
          "creator-share": creatorShare,
          "host-share": hostShare,
        })
        return { success: true }
      
      case "distribute-revenue":
        const [distributeAssetId, amount] = args
        const share = mockStorage.get(`revenue-share-${distributeAssetId}`)
        if (!share) {
          return { success: false, error: 404 }
        }
        const creatorAmount = Math.floor((amount * share["creator-share"]) / 100)
        const hostAmount = amount - creatorAmount
        mockBalances.set(share.creator, (mockBalances.get(share.creator) || 0) + creatorAmount)
        mockBalances.set(sender, (mockBalances.get(sender) || 0) + hostAmount)
        return { success: true }
      
      case "get-balance":
        return { success: true, value: mockBalances.get(args[0]) || 0 }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should set revenue share", () => {
    const result = mockContractCall("set-revenue-share", [1, "creator1", 70, 30], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not set revenue share if not contract owner", () => {
    const result = mockContractCall("set-revenue-share", [1, "creator1", 70, 30], "user1")
    expect(result.success).toBe(false)
    expect(result.error).toBe(403)
  })
  
  it("should not set revenue share if shares don't sum to 100", () => {
    const result = mockContractCall("set-revenue-share", [1, "creator1", 70, 40], CONTRACT_OWNER)
    expect(result.success).toBe(false)
    expect(result.error).toBe(400)
  })
  
  it("should distribute revenue", () => {
    mockContractCall("set-revenue-share", [1, "creator1", 70, 30], CONTRACT_OWNER)
    const result = mockContractCall("distribute-revenue", [1, 1000], "host1")
    expect(result.success).toBe(true)
    expect(mockBalances.get("creator1")).toBe(700)
    expect(mockBalances.get("host1")).toBe(300)
  })
  
  it("should get balance", () => {
    mockContractCall("set-revenue-share", [1, "creator1", 70, 30], CONTRACT_OWNER)
    mockContractCall("distribute-revenue", [1, 1000], "host1")
    const result = mockContractCall("get-balance", ["creator1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(700)
  })
})

