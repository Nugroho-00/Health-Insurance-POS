// =============================================================================
// Shared TypeScript types for the Health Insurance POS
// =============================================================================

export type IdempotencyStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface Transaction {
  id: string;
  wixOrderId: string;
  status: IdempotencyStatus;
  amount: string | null;
  currency: string | null;
  description: string | null;
  customerEmail: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  accountType: "REVENUE" | "GATEWAY_RECEIVABLE";
  amount: string;
  createdAt: string;
}

export interface LedgerAuditResponse {
  transaction: Transaction;
  ledgerEntries: LedgerEntry[];
  balance: string;
  isBalanced: boolean;
}

export type ReconciliationStatus = "MATCH" | "DISCREPANCY";

export interface ReconciliationItem {
  orderId: string;
  ledgerAmount: string;
  gatewayAmount: string;
  status: ReconciliationStatus;
  discrepancyReason?: string;
}

export type InsurancePlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  badge?: string;
};

// Wix SPI Payload types
export interface WixPayload {
  merchantId: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  };
  customer: {
    email: string;
  };
}

export interface CreateOrderRequest {
  payload: WixPayload;
  signature: string;
}

export interface CreateOrderResponse {
  message: string;
  orderId: string;
  status: IdempotencyStatus;
}
