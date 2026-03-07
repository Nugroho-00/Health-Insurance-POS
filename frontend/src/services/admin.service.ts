import apiClient from "@/lib/axios";
import type {
    LedgerAuditResponse,
    ReconciliationItem,
    Transaction,
} from "@/types";

export const adminService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await apiClient.get<Transaction[]>("/admin/transactions");
    return response.data;
  },

  async getLedgerAudit(transactionId: string): Promise<LedgerAuditResponse> {
    const response = await apiClient.get<LedgerAuditResponse>(
      `/admin/transactions/${transactionId}/ledger`,
    );
    return response.data;
  },

  async getReconciliation(): Promise<ReconciliationItem[]> {
    const response = await apiClient.get<ReconciliationItem[]>(
      "/admin/reconciliation",
    );
    return response.data;
  },
};
