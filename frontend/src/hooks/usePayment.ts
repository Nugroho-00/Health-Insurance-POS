import { adminService } from '@/services/admin.service';
import { paymentService } from '@/services/payment.service';
import type { CreateOrderResponse } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const queryKeys = {
  transactions: ['transactions'] as const,
  ledgerAudit: (id: string) => ['ledger-audit', id] as const,
  reconciliation: ['reconciliation'] as const,
};

interface CreateOrderVariables {
  wixOrderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<CreateOrderResponse, Error, CreateOrderVariables>({
    mutationFn: ({ wixOrderId, amount, currency, description, customerEmail }) =>
      paymentService.createOrder(wixOrderId, amount, currency, description, customerEmail),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: adminService.getTransactions,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useLedgerAudit(transactionId: string | null) {
  return useQuery({
    queryKey: queryKeys.ledgerAudit(transactionId ?? ''),
    queryFn: () => adminService.getLedgerAudit(transactionId!),
    enabled: !!transactionId,
  });
}

export function useReconciliation() {
  return useQuery({
    queryKey: queryKeys.reconciliation,
    queryFn: adminService.getReconciliation,
    enabled: false,
    staleTime: 0,
  });
}
