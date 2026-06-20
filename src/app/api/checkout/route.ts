import { NextResponse } from 'next/server';

// Custom error classes following error-handling skill patterns
class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function POST(req: Request) {
  try {
    // Validate request body
    let body: { amount?: number };
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const { amount } = body;

    // Input validation — fail fast
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('Amount must be a positive number', { received: amount });
    }

    // Check for Razorpay credentials
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // Graceful degradation: return a mock order in dev mode
      console.warn('[Checkout] Razorpay credentials not configured. Returning mock order for development.');
      return NextResponse.json({
        id: `mock_order_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
        status: 'created',
        _mock: true,
      });
    }

    // Dynamic import to avoid crashes when razorpay package has issues
    const Razorpay = (await import('razorpay')).default;

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    return NextResponse.json(order);

  } catch (error: unknown) {
    // Handle known errors with meaningful messages
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 }
      );
    }

    // Log unexpected errors with context
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Checkout] Unexpected error:', message);

    return NextResponse.json(
      { error: 'Order creation failed. Please try again later.' },
      { status: 500 }
    );
  }
}
