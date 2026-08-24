export interface PaymobConfig {
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  apiKey?: string;
  baseUrl?: string;
  isSandbox?: boolean;
}

export interface PaymobItem {
  name: string;
  amount: number; // in cents
  quantity: number;
  description?: string;
}

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country?: string;
  city?: string;
  street?: string;
  building?: string;
  apartment?: string;
  floor?: string;
  postal_code?: string;
}

export interface PaymobCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface PaymobIntentionRequest {
  amount: number; // in smallest currency unit (e.g. cents)
  currency: string;
  payment_methods?: Array<string | number>;
  items?: PaymobItem[];
  billing_data: PaymobBillingData;
  customer: PaymobCustomer;
  special_reference: string;
  notification_url?: string;
  redirection_url?: string;
  extras?: Record<string, any>;
}

export interface PaymobIntentionResponse {
  id: string | number;
  client_secret: string;
  payment_keys?: Array<{ key: string; gateway_type: string }>;
  amount: number;
  currency: string;
  special_reference?: string;
}

export interface PaymobTransactionObj {
  id: number | string;
  amount_cents: number;
  success: boolean;
  pending: boolean;
  currency: string;
  special_reference?: string;
  error_occured?: boolean;
  has_parent_transaction?: boolean;
  integration_id?: number | string;
  is_3d_secure?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_refunded?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  created_at?: string;
  order?: {
    id: number | string;
    merchant_order_id?: string;
  };
  owner?: number | string;
  source_data?: {
    pan?: string;
    sub_type?: string;
    type?: string;
  };
  data?: {
    message?: string;
    txn_response_code?: string;
  };
}

export interface PaymobWebhookPayload {
  type: string;
  obj: PaymobTransactionObj;
  hmac?: string;
}

export interface PaymobPaymentCreationResult {
  paymentId: string;
  merchantReference: string;
  clientSecret: string;
  unifiedCheckoutUrl: string;
  publicKey: string;
  amount: number;
  currency: string;
  planSlug: string;
  interval: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  calculatedHmac: string;
  receivedHmac?: string;
  errorReason?: string;
}

export interface ReconciliationResult {
  paymentId: string;
  merchantReference: string;
  paymobTransactionId?: string;
  previousStatus: string;
  currentStatus: string;
  isReconciled: boolean;
  subscriptionActivated: boolean;
  message: string;
}
