export type ScenarioCategory =
  | 'BALANCE_APPEARANCE'
  | 'TRANSACTION_NOTIFICATION'
  | 'PENDING_BEHAVIOR'
  | 'SUCCESS_BEHAVIOR'
  | 'FAILURE_BEHAVIOR'
  | 'EXPIRY_BEHAVIOR'
  | 'HISTORY_UPDATE'
  | 'SYNC_BEHAVIOR'
  | 'DELAYED_UPDATE'
  | 'SUSPICIOUS_RECORD'

export interface ScenarioDefinition {
  id: string
  name: string
  category: ScenarioCategory
  description: string
  expectedBehavior: string
  securityChecks: SecurityCheck[]
}

export interface SecurityCheck {
  id: string
  name: string
  description: string
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'balance-appear',
    name: 'Sudden Balance Appearance',
    category: 'BALANCE_APPEARANCE',
    description: 'A virtual balance is credited instantly without a prior pending state.',
    expectedBehavior: 'Balance updates in UI with INTERNAL ENVIRONMENT label. No blockchain confirmation claimed.',
    securityChecks: [
      { id: 'sc-1', name: 'Environment label visible', description: 'INTERNAL ENVIRONMENT badge must be displayed' },
      { id: 'sc-2', name: 'No blockchain hash claimed', description: 'Transaction must not show a tx hash or block confirmation' },
      { id: 'sc-3', name: 'Balance marked as virtual', description: 'Balance display must include BlockCoin label' },
    ],
  },
  {
    id: 'incoming-notification',
    name: 'Incoming Transaction Notification',
    category: 'TRANSACTION_NOTIFICATION',
    description: 'Simulates an incoming CREDIT notification appearing in the wallet.',
    expectedBehavior: 'Transaction appears as PENDING then transitions to COMPLETED. Labeled INTERNAL.',
    securityChecks: [
      { id: 'sc-4', name: 'Status starts as PENDING', description: 'Transaction must not start as COMPLETED' },
      { id: 'sc-5', name: 'Environment is INTERNAL', description: 'Must not be labeled as TESTNET or real blockchain' },
      { id: 'sc-6', name: 'No fabricated hash', description: 'No transaction hash resembling a real blockchain hash' },
    ],
  },
  {
    id: 'pending-behavior',
    name: 'Pending Transaction Behavior',
    category: 'PENDING_BEHAVIOR',
    description: 'Transaction stays in PENDING state for a configured delay before resolving.',
    expectedBehavior: 'UI shows PENDING badge. Balance does not change until COMPLETED. No premature confirmation.',
    securityChecks: [
      { id: 'sc-7', name: 'Balance unchanged while PENDING', description: 'Ledger must not be updated until COMPLETED' },
      { id: 'sc-8', name: 'PENDING badge visible', description: 'Status badge must show PENDING' },
      { id: 'sc-9', name: 'No early completion claim', description: 'Must not claim confirmed before worker completes' },
    ],
  },
  {
    id: 'success-behavior',
    name: 'Simulated Success',
    category: 'SUCCESS_BEHAVIOR',
    description: 'Transaction completes successfully and ledger is updated atomically.',
    expectedBehavior: 'Status transitions to COMPLETED. Balance updated. Ledger entry created with idempotency key.',
    securityChecks: [
      { id: 'sc-10', name: 'Ledger entry exists', description: 'A ledger entry must be created on completion' },
      { id: 'sc-11', name: 'Idempotency enforced', description: 'Duplicate completion must not create duplicate entry' },
      { id: 'sc-12', name: 'Balance correct', description: 'Balance after must equal balance before plus amount' },
    ],
  },
  {
    id: 'failure-behavior',
    name: 'Simulated Failure',
    category: 'FAILURE_BEHAVIOR',
    description: 'Transaction is forced to FAILED state. Ledger must not be modified.',
    expectedBehavior: 'Status shows FAILED. Balance unchanged. No ledger entry created.',
    securityChecks: [
      { id: 'sc-13', name: 'Balance unchanged on failure', description: 'Ledger must not be modified when simulation fails' },
      { id: 'sc-14', name: 'FAILED badge visible', description: 'Status must clearly show FAILED' },
      { id: 'sc-15', name: 'No success claim', description: 'Failed transaction must not be presented as successful' },
    ],
  },
  {
    id: 'expiry-behavior',
    name: 'Expiring Virtual Balance',
    category: 'EXPIRY_BEHAVIOR',
    description: 'Simulation expires before completing. Balance must not be credited.',
    expectedBehavior: 'Status transitions to EXPIRED. Balance unchanged. Expiry event recorded.',
    securityChecks: [
      { id: 'sc-16', name: 'Balance unchanged on expiry', description: 'Expired simulation must not modify ledger' },
      { id: 'sc-17', name: 'EXPIRED status shown', description: 'UI must show EXPIRED badge' },
      { id: 'sc-18', name: 'Expiry event in timeline', description: 'SimulationEvent with toStatus=EXPIRED must exist' },
    ],
  },
  {
    id: 'history-update',
    name: 'Transaction History Update',
    category: 'HISTORY_UPDATE',
    description: 'Verifies transaction history reflects only completed ledger entries.',
    expectedBehavior: 'Only COMPLETED simulations appear in ledger history. FAILED/EXPIRED do not add entries.',
    securityChecks: [
      { id: 'sc-19', name: 'No phantom entries', description: 'Failed/expired simulations must not appear in ledger' },
      { id: 'sc-20', name: 'History ordered correctly', description: 'Entries ordered by createdAt descending' },
      { id: 'sc-21', name: 'Amount matches simulation', description: 'Ledger entry amount must match simulation amount' },
    ],
  },
  {
    id: 'duplicate-detection',
    name: 'Duplicate Transaction Detection',
    category: 'SUSPICIOUS_RECORD',
    description: 'Attempts to process the same simulation twice. Idempotency must prevent double-credit.',
    expectedBehavior: 'Second attempt returns existing entry. Balance credited exactly once.',
    securityChecks: [
      { id: 'sc-22', name: 'Idempotency key unique', description: 'Duplicate idempotency key must be rejected at DB level' },
      { id: 'sc-23', name: 'Balance credited once', description: 'Balance must not be doubled on retry' },
      { id: 'sc-24', name: 'Duplicate event logged', description: 'Duplicate attempt must be detectable in audit' },
    ],
  },
  {
    id: 'amount-mismatch',
    name: 'Mismatched Transaction Amount',
    category: 'SUSPICIOUS_RECORD',
    description: 'Detects if a transaction record shows a different amount than the simulation.',
    expectedBehavior: 'Transaction amount must exactly match simulation amountUnits. Any mismatch is flagged.',
    securityChecks: [
      { id: 'sc-25', name: 'Amount integrity', description: 'Transaction.amountUnits must equal Simulation.amountUnits' },
      { id: 'sc-26', name: 'No rounding errors', description: 'BigInt arithmetic must produce exact results' },
    ],
  },
  {
    id: 'unverified-confirmation',
    name: 'Unverified Confirmation Claim',
    category: 'SUSPICIOUS_RECORD',
    description: 'Checks that no internal transaction claims blockchain confirmation.',
    expectedBehavior: 'INTERNAL transactions must never display block numbers, tx hashes, or confirmation counts.',
    securityChecks: [
      { id: 'sc-27', name: 'No block number on INTERNAL', description: 'INTERNAL transactions must not have blockNumber' },
      { id: 'sc-28', name: 'No tx hash on INTERNAL', description: 'INTERNAL transactions must not have a blockchain hash' },
      { id: 'sc-29', name: 'Environment label enforced', description: 'INTERNAL label must be present on all virtual transactions' },
    ],
  },
]
