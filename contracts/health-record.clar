;; health-record.clar
;; MediShare Health Record Contract
;; Clarity v2
;; Manages storage and retrieval of encrypted patient health records with versioning and access controls

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PATIENT u101)
(define-constant ERR-RECORD-NOT-FOUND u102)
(define-constant ERR-PAUSED u103)
(define-constant ERR-INVALID-DATA u104)
(define-constant ERR-VERSION-MISMATCH u105)

;; Contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var last-updated-block uint u0)

;; Maps
;; Patient records: {patient, record-id} -> {encrypted-data, version, timestamp}
(define-map patient-records {patient: principal, record-id: uint} {encrypted-data: (buff 1024), version: uint, timestamp: uint})
;; Patient record counters: patient -> next-record-id
(define-map patient-record-counters principal uint)
;; Access audit log: {patient, record-id} -> list of access events
(define-map access-audit-log {patient: principal, record-id: uint} (list 100 {accessor: principal, timestamp: uint}))

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: is-patient-owner
(define-private (is-patient-owner (patient principal))
  (is-eq tx-sender patient)
)

;; Private helper: validate-principal
(define-private (validate-principal (user principal))
  (not (is-eq user 'SP000000000000000000002Q6VF78))
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (validate-principal new-admin) (err ERR-INVALID-PATIENT))
    (var-set admin new-admin)
    (print {event: "admin-transferred", new-admin: new-admin, timestamp: (unwrap-panic (get-block-info? time u0))})
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (var-set last-updated-block (unwrap-panic (get-block-info? time u0)))
    (print {event: "contract-paused", paused: pause, timestamp: (var-get last-updated-block)})
    (ok pause)
  )
)

;; Store new health record
(define-public (store-record (patient principal) (encrypted-data (buff 1024)))
  (begin
    (ensure-not-paused)
    (asserts! (is-patient-owner patient) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (len encrypted-data) u0) (err ERR-INVALID-DATA))
    (asserts! (validate-principal patient) (err ERR-INVALID-PATIENT))
    (let (
      (next-id (default-to u1 (map-get? patient-record-counters patient)))
      (current-block (unwrap-panic (get-block-info? time u0)))
    )
      (map-set patient-records {patient: patient, record-id: next-id} {encrypted-data: encrypted-data, version: u1, timestamp: current-block})
      (map-set patient-record-counters patient (+ next-id u1))
      (map-set access-audit-log {patient: patient, record-id: next-id} (list))
      (print {event: "record-stored", patient: patient, record-id: next-id, timestamp: current-block})
      (ok next-id)
    )
  )
)

;; Update existing health record
(define-public (update-record (patient principal) (record-id uint) (encrypted-data (buff 1024)))
  (begin
    (ensure-not-paused)
    (asserts! (is-patient-owner patient) (err ERR-NOT-AUTHORIZED))
    (asserts! (> (len encrypted-data) u0) (err ERR-INVALID-DATA))
    (asserts! (validate-principal patient) (err ERR-INVALID-PATIENT))
    (match (map-get? patient-records {patient: patient, record-id: record-id})
      record
      (let (
        (new-version (+ (get version record) u1))
        (current-block (unwrap-panic (get-block-info? time u0)))
      )
        (map-set patient-records {patient: patient, record-id: record-id} {encrypted-data: encrypted-data, version: new-version, timestamp: current-block})
        (print {event: "record-updated", patient: patient, record-id: record-id, version: new-version, timestamp: current-block})
        (ok new-version)
      )
      (err ERR-RECORD-NOT-FOUND)
    )
  )
)

;; Get health record (patient or authorized access)
(define-public (get-record (patient principal) (record-id uint))
  (begin
    (asserts! (is-patient-owner patient) (err ERR-NOT-AUTHORIZED)) ;; Extend with access-control check
    (match (map-get? patient-records {patient: patient, record-id: record-id})
      record
      (begin
        (map-set access-audit-log {patient: patient, record-id: record-id}
          (cons {accessor: tx-sender, timestamp: (unwrap-panic (get-block-info? time u0))}
            (default-to (list) (map-get? access-audit-log {patient: patient, record-id: record-id}))))
        (print {event: "record-accessed", patient: patient, record-id: record-id, accessor: tx-sender})
        (ok record)
      )
      (err ERR-RECORD-NOT-FOUND)
    )
  )
)

;; Read-only: get record version
(define-read-only (get-record-version (patient principal) (record-id uint))
  (match (map-get? patient-records {patient: patient, record-id: record-id})
    record (ok (get version record))
    (err ERR-RECORD-NOT-FOUND)
  )
)

;; Read-only: get access audit log
(define-read-only (get-access-audit-log (patient principal) (record-id uint))
  (ok (default-to (list) (map-get? access-audit-log {patient: patient, record-id: record-id})))
)

;; Read-only: get next record id
(define-read-only (get-next-record-id (patient principal))
  (ok (default-to u1 (map-get? patient-record-counters patient)))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: is paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: get last updated block
(define-read-only (get-last-updated)
  (ok (var-get last-updated-block))
)