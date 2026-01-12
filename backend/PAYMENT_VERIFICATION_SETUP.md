# Payment Verification System Documentation

## Overview

The payment verification system provides secure transaction verification for GPay and PhonePe payments before auto-approval. This prevents fraudulent transactions by validating transaction details before activating user accounts.

## Features

1. **Transaction ID Format Validation**: Validates UPI transaction ID format (12-30 alphanumeric characters)
2. **Amount Matching**: Verifies that the payment amount matches the expected package amount
3. **Timestamp Validation**: Prevents old/future transactions (configurable age limits)
4. **Payment Gateway API Integration**: Supports Razorpay API verification (optional)
5. **Webhook Support**: Endpoint for receiving payment status updates from payment gateways

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Optional: Razorpay Integration (for API verification)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional: Require API verification for auto-approval
# If set to 'true', transactions will only auto-approve if verified via Razorpay API
REQUIRE_PAYMENT_API_VERIFICATION=false

# Optional: Webhook secret for verifying webhook signatures
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

### Payment Gateway Settings

Payment gateway settings can be configured via the admin panel at `/api/admin/payment-gateway` or stored in the `payment_gateway_settings` table.

## How It Works

### 1. Payment Submission Flow

When a user submits a GPay/PhonePe payment:

1. **Transaction ID Validation**: Checks format (12-30 alphanumeric characters)
2. **Amount Verification**: Compares submitted amount with expected package amount
3. **Timestamp Check**: Validates transaction isn't too old (>30 minutes) or in the future
4. **API Verification** (if configured): Attempts to verify with Razorpay API
5. **Auto-Approval Decision**: Only auto-approves if all validations pass

### 2. Verification Levels

#### Basic Validation (Always Performed)
- Transaction ID format
- Amount matching
- Timestamp validation

#### API Verification (Optional)
- Requires Razorpay credentials (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`)
- Verifies transaction exists in Razorpay system
- Checks payment status, amount, and method
- Only required if `REQUIRE_PAYMENT_API_VERIFICATION=true`

### 3. Auto-Approval Criteria

A payment is auto-approved only if:
- ✅ Transaction ID format is valid
- ✅ Amount matches expected amount (within ₹0.01 tolerance)
- ✅ Transaction timestamp is recent (<30 minutes old)
- ✅ If API verification is required: Razorpay confirms transaction

### 4. Manual Review Triggers

Payments require manual admin review if:
- ❌ Transaction ID format is invalid
- ❌ Amount mismatch detected
- ❌ Transaction is too old or in the future
- ❌ API verification fails (when required)
- ❌ Any validation error occurs

## API Endpoints

### Submit Payment (Updated)

**Endpoint**: `POST /api/payment/submit`

**Request Body**:
```json
{
  "transaction_id": "TXN123456789012",
  "amount": 5000,
  "payment_method": "GPay",
  "saleid": 123,
  "packageid": 1,
  "upi_reference": "OPTIONAL"
}
```

**Response (Auto-Approved)**:
```json
{
  "success": true,
  "message": "Payment verified successfully! Your account has been activated.",
  "autoApproved": true,
  "verified": true,
  "requiresManualVerification": false,
  "data": {
    "upipaymentid": 456,
    "transaction_id": "TXN123456789012",
    "status": "Verified",
    "autoApproved": true,
    "verificationWarnings": []
  }
}
```

**Response (Requires Manual Review)**:
```json
{
  "success": false,
  "message": "Amount mismatch. Expected: ₹5000, Received: ₹4000",
  "error": "Payment verification failed",
  "requiresManualVerification": true
}
```

### Payment Webhook

**Endpoint**: `POST /api/payment/webhook`

This endpoint receives payment status updates from payment gateways (Razorpay, PhonePe, etc.).

**Supported Headers**:
- `x-razorpay-signature`: Razorpay webhook signature
- `x-phonepe-signature`: PhonePe webhook signature

**Webhook Payload Examples**:

**Razorpay**:
```json
{
  "entity": "event",
  "account_id": "acc_xxxxx",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxx",
        "amount": 500000,
        "status": "captured",
        "method": "upi"
      }
    }
  }
}
```

**PhonePe** (example structure):
```json
{
  "transaction_id": "TXN123456789012",
  "status": "SUCCESS",
  "amount": 5000
}
```

## Setting Up Razorpay Integration

1. **Create Razorpay Account**: Sign up at https://razorpay.com
2. **Get API Credentials**: 
   - Go to Settings → API Keys
   - Generate Key ID and Key Secret
3. **Add to Environment**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_secret_key
   ```
4. **Enable API Verification** (optional):
   ```env
   REQUIRE_PAYMENT_API_VERIFICATION=true
   ```
5. **Configure Webhook** (optional):
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment.captured`, `payment.failed`
   - Set webhook secret in `.env`: `PAYMENT_WEBHOOK_SECRET=your_secret`

## Verification Utility Functions

The verification logic is in `backend/utils/paymentVerifier.js`:

### `verifyPayment(params)`

Main verification function that performs all checks.

**Parameters**:
- `transactionId` (string): UPI transaction ID
- `amount` (number): Payment amount
- `paymentMethod` (string): 'GPay' or 'PhonePe'
- `expectedAmount` (number): Expected package amount
- `transactionDate` (Date): Optional transaction timestamp
- `requireApiVerification` (boolean): Whether API verification is required

**Returns**:
```javascript
{
  valid: boolean,              // Basic validation passed
  verified: boolean,           // API verification passed
  errors: string[],           // Validation errors
  warnings: string[],         // Warnings (non-blocking)
  requiresManualVerification: boolean
}
```

### `validateTransactionIdFormat(transactionId, paymentMethod)`

Validates UPI transaction ID format.

### `validateAmount(transactionAmount, expectedAmount, tolerance)`

Validates amount matching with tolerance.

### `validateTransactionTimestamp(transactionDate, maxAgeMinutes, futureToleranceMinutes)`

Validates transaction timestamp.

## Testing

### Test Basic Validation

```bash
# Test with valid transaction ID
curl -X POST http://localhost:3000/api/payment/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TXN123456789012",
    "amount": 5000,
    "payment_method": "GPay",
    "packageid": 1
  }'
```

### Test Amount Mismatch

```bash
# Submit with incorrect amount
curl -X POST http://localhost:3000/api/payment/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TXN123456789012",
    "amount": 4000,
    "payment_method": "GPay",
    "packageid": 1
  }'
# Should return error: "Amount mismatch. Expected: ₹5000, Received: ₹4000"
```

### Test Webhook

```bash
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{
    "payment": {
      "id": "pay_xxxxx",
      "amount": 500000,
      "status": "captured",
      "method": "upi"
    }
  }'
```

## Security Considerations

1. **Transaction ID Format**: Validates format to prevent basic injection attempts
2. **Amount Verification**: Prevents partial payment attacks
3. **Timestamp Validation**: Prevents replay attacks with old transaction IDs
4. **Duplicate Prevention**: Checks database for duplicate transaction IDs
5. **API Verification**: When enabled, verifies with payment gateway's authoritative system
6. **Webhook Signature**: Webhook endpoint supports signature verification (implementation pending)

## Limitations

1. **UPI Direct Verification**: GPay/PhonePe don't provide public APIs for transaction verification. We rely on:
   - Basic validation (format, amount, timestamp)
   - Payment aggregator APIs (Razorpay) if integrated
   - Manual admin verification for edge cases

2. **NPCI Integration**: Full NPCI UPI verification requires merchant account registration with NPCI, which is complex and time-consuming.

3. **Webhook Reliability**: Payment gateways may not always send webhooks. The system still requires manual admin verification for unverified transactions.

## Recommendations

1. **For Production**: 
   - Enable Razorpay integration (`REQUIRE_PAYMENT_API_VERIFICATION=true`)
   - Configure webhook endpoints
   - Set up proper webhook signature verification
   - Monitor verification logs for patterns

2. **For Development**:
   - Use basic validation (no API verification required)
   - Test with various transaction ID formats
   - Test amount mismatches and edge cases

3. **Manual Review Process**:
   - Admins should verify pending GPay/PhonePe payments manually
   - Check transaction screenshot or bank statement
   - Verify transaction ID format matches expected pattern

## Troubleshooting

### Verification Fails But Payment is Valid

**Solution**: Check logs for specific error. Common issues:
- Amount mismatch: User may have paid different amount
- Old transaction: Transaction timestamp is >30 minutes old
- Invalid format: Transaction ID doesn't match expected pattern

**Action**: Admin can manually verify via admin panel.

### Razorpay API Verification Fails

**Possible Causes**:
- Incorrect API credentials
- Transaction ID not from Razorpay
- Transaction not found in Razorpay system
- Network/timeout issues

**Solution**: 
- Verify credentials in `.env`
- Check Razorpay dashboard for transaction
- Review logs for API error details
- Consider disabling `REQUIRE_PAYMENT_API_VERIFICATION` temporarily

### Webhook Not Received

**Possible Causes**:
- Webhook URL not configured in payment gateway
- Firewall blocking webhook requests
- Payment gateway not configured to send webhooks

**Solution**:
- Verify webhook URL in payment gateway settings
- Check server logs for incoming webhook requests
- Test webhook endpoint manually
- Use manual admin verification as fallback

## Future Enhancements

1. **Signature Verification**: Implement webhook signature verification for Razorpay/PhonePe
2. **Multiple Payment Gateways**: Support PayU, Cashfree, etc.
3. **NPCI Integration**: Direct UPI transaction status API integration
4. **Automated Retry**: Retry failed API verifications with exponential backoff
5. **Verification Analytics**: Dashboard showing verification success rates, common failures
6. **SMS/Email Notifications**: Notify admins when manual verification is required

## Support

For issues or questions:
1. Check logs: `backend/logs/combined.log`
2. Review verification results in API responses
3. Check admin payment panel for pending transactions
4. Consult this documentation
