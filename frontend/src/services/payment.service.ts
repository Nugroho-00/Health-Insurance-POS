import apiClient from "@/lib/axios";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  WixPayload,
} from "@/types";
import Hex from "crypto-js/enc-hex";
import HmacSHA256 from "crypto-js/hmac-sha256";

function generateHmacSignature(payload: WixPayload): string {
  const secret = import.meta.env.VITE_HMAC_SECRET;
  if (!secret) {
    throw new Error('HMAC secret is not configured. Please set VITE_HMAC_SECRET in your environment variables.');
  }
  return HmacSHA256(JSON.stringify(payload), secret).toString(Hex);
}

export const paymentService = {
  async createOrder(
    wixOrderId: string,
    amount: number,
    currency: string,
    description: string,
    customerEmail: string,
  ): Promise<CreateOrderResponse> {
    const payload: WixPayload = {
      merchantId: "health-assurance-001",
      order: {
        id: wixOrderId,
        amount,
        currency,
        description,
      },
      customer: {
        email: customerEmail,
      },
    };

    const signature = generateHmacSignature(payload);

    const body: CreateOrderRequest = { payload, signature };

    const response = await apiClient.post<CreateOrderResponse>(
      "/v1/create-order",
      body,
    );
    return response.data;
  },
};
