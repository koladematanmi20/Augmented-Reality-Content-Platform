;; Revenue Contract

(define-fungible-token revenue)

(define-map revenue-shares
  { asset-id: uint }
  {
    creator: principal,
    creator-share: uint,
    host-share: uint
  }
)

(define-map balances
  { user: principal }
  { balance: uint }
)

(define-constant CONTRACT_OWNER tx-sender)

(define-public (set-revenue-share (asset-id uint) (creator principal) (creator-share uint) (host-share uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u403))
    (asserts! (is-eq (+ creator-share host-share) u100) (err u400))
    (ok (map-set revenue-shares
      { asset-id: asset-id }
      {
        creator: creator,
        creator-share: creator-share,
        host-share: host-share
      }
    ))
  )
)

(define-public (distribute-revenue (asset-id uint) (amount uint))
  (let
    ((shares (unwrap! (map-get? revenue-shares { asset-id: asset-id }) (err u404)))
     (creator-amount (/ (* amount (get creator-share shares)) u100))
     (host-amount (- amount creator-amount)))
    (try! (ft-mint? revenue amount tx-sender))
    (try! (ft-transfer? revenue creator-amount tx-sender (get creator shares)))
    (try! (ft-transfer? revenue host-amount tx-sender tx-sender))
    (ok true)
  )
)

(define-read-only (get-balance (user principal))
  (default-to u0 (get balance (map-get? balances { user: user })))
)

