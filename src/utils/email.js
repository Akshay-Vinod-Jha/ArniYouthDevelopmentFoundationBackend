import emailjs from "@emailjs/nodejs";

/**
 * Send donation receipt email via EmailJS
 * @param {Object} donationData - Donation details
 */
export const sendDonationReceipt = async (donationData) => {
  try {
    const { donor, amount, paymentId, donationId, program } = donationData;

    const templateParams = {
      to_name: donor.name,
      to_email: donor.email,
      amount: `₹${amount}`,
      payment_id: paymentId,
      donation_id: donationId,
      program: program.replace(/-/g, " ").toUpperCase(),
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };

    console.log("📧 Sending donation receipt to:", donor.email);
    console.log("Template params:", templateParams);
    console.log("Service ID:", process.env.EMAILJS_SERVICE_ID);
    console.log("Template ID:", process.env.EMAILJS_TEMPLATE_ID);
    console.log("Public Key:", process.env.EMAILJS_PUBLIC_KEY);
    console.log("Private Key exists?", !!process.env.EMAILJS_PRIVATE_KEY);

    // Use EmailJS Node.js SDK (same as playground)
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log("✅ Donation receipt sent successfully!");
    console.log("EmailJS Response:", response);
    return { success: true, response: response };
  } catch (error) {
    console.error("❌ Failed to send donation receipt:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.text) {
      console.error("Error text:", error.text);
    }
    if (error.status) {
      console.error("Error status:", error.status);
    }
    console.error("Full error object:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message, fullError: error };
  }
};
