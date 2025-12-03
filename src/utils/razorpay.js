import Razorpay from "razorpay";
import crypto from "crypto";

// Lazy initialization function
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file"
    );
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Create Razorpay order
 * @param {Number} amount - Amount in INR
 * @param {String} receipt - Receipt ID
 * @returns {Promise<Object>} Order details
 */
export const createOrder = async (amount, receipt) => {
  const razorpay = getRazorpayInstance();

  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt,
      notes: {
        organization: "AYDF",
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error("Failed to create Razorpay order: " + error.message);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} Verification result
 */
export const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    return false;
  }
};

/**
 * Fetch payment details
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  const razorpay = getRazorpayInstance();

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error("Failed to fetch payment details");
  }
};

export default { createOrder, verifyPayment, getPaymentDetails };
