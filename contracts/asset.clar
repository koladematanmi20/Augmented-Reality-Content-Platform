;; Asset Contract

(define-non-fungible-token asset uint)

(define-data-var asset-id-nonce uint u0)

(define-map asset-data
  { id: uint }
  {
    owner: principal,
    content-hash: (buff 32),
    metadata: (string-utf8 256)
  }
)

(define-public (create-asset (content-hash (buff 32)) (metadata (string-utf8 256)))
  (let
    ((asset-id (+ (var-get asset-id-nonce) u1)))
    (try! (nft-mint? asset asset-id tx-sender))
    (map-set asset-data
      { id: asset-id }
      {
        owner: tx-sender,
        content-hash: content-hash,
        metadata: metadata
      }
    )
    (var-set asset-id-nonce asset-id)
    (ok asset-id)
  )
)

(define-public (transfer (id uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (unwrap! (nft-get-owner? asset id) (err u404))) (err u403))
    (try! (nft-transfer? asset id tx-sender recipient))
    (ok true)
  )
)

(define-read-only (get-asset-data (id uint))
  (map-get? asset-data { id: id })
)

