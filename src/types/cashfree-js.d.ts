declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeInstance {
    checkout(options: {
      paymentSessionId: string
      redirectTarget?: '_self' | '_blank' | '_top' | '_parent'
      returnUrl?: string
    }): Promise<{ error?: { message: string }, paymentDetails?: Record<string, unknown> }>
  }

  export function load(options: {
    mode: 'sandbox' | 'production'
  }): Promise<CashfreeInstance | null>
}
