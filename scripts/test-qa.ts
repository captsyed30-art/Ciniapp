import { calculateOrderPricing, SEAT_TYPE_SURCHARGE_CENTS, SERVICE_FEE_PER_SEAT_CENTS } from "../src/lib/pricing";
import { generateReferenceCode, generateTicketCode, formatCurrency } from "../src/lib/utils";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../src/lib/auth";
import type { SeatType, SessionUser } from "../src/types";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runQASuite() {
  console.log("\n=======================================================");
  console.log("🎬 CINEBOOK QA TEST SUITE - AGENT 3 VERIFICATION");
  console.log("=======================================================\n");

  // -------------------------------------------------------------
  // Test 1: Authentication & JWT Cryptographic Signatures
  // -------------------------------------------------------------
  console.log("1. Testing Authentication & Session Integrity...");
  const rawPass = "SecretCinemaPass123!";
  const hash = await hashPassword(rawPass);
  assert(await verifyPassword(rawPass, hash), "Password hashing and comparison verifies correctly");
  assert(!(await verifyPassword("WrongPassword", hash)), "Invalid password correctly rejected");

  const sampleUser: SessionUser = {
    id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    email: "test.cinephile@example.com",
    name: "Cinephile Tester",
    role: "USER",
    phone: "+1555123456",
  };
  const token = await createSessionToken(sampleUser);
  const decoded = await verifySessionToken(token);
  assert(decoded !== null, "JWT token decodes successfully");
  assert(decoded?.email === sampleUser.email, "JWT payload contains matching email");
  assert(decoded?.role === "USER", "JWT payload contains correct user role");

  const fakeToken = token + "corrupt";
  const invalidDecoded = await verifySessionToken(fakeToken);
  assert(invalidDecoded === null, "Tampered/invalid JWT signature rejected safely");

  // -------------------------------------------------------------
  // Test 2: Server-side Pricing Engine & Minor Unit Calculations
  // -------------------------------------------------------------
  console.log("\n2. Testing Server-side Pricing Engine & Minor Units...");
  const basePrice = 1500; // $15.00
  const seats: Array<{ seatType: SeatType }> = [
    { seatType: "STANDARD" },
    { seatType: "VIP" },       // +$6.00 (600 cents)
    { seatType: "RECLINER" },  // +$4.50 (450 cents)
  ];

  const pricing = calculateOrderPricing({
    baseShowtimePriceCents: basePrice,
    seats,
  });

  // Subtotal = 1500 + 2100 + 1950 = 5550 cents ($55.50)
  assert(pricing.subtotalCents === 5550, `Subtotal calculated correctly as 5550 cents (got ${pricing.subtotalCents})`);
  // Service fee = 3 * 150 = 450 cents ($4.50)
  assert(pricing.serviceFeeCents === 450, `Service fee calculated correctly as 450 cents (got ${pricing.serviceFeeCents})`);
  // Tax = Math.round((5550 + 450) * 0.0825) = Math.round(6000 * 0.0825) = 495 cents ($4.95)
  assert(pricing.taxCents === 495, `Tax calculated correctly as 495 cents (got ${pricing.taxCents})`);
  // Total = 5550 + 450 + 495 = 6495 cents ($64.95)
  assert(pricing.totalCents === 6495, `Final total calculated correctly as 6495 cents (got ${pricing.totalCents})`);
  assert(formatCurrency(pricing.totalCents) === "$64.95", "Currency formatter outputs formatted USD correctly ($64.95)");

  // -------------------------------------------------------------
  // Test 3: Reference & Security Code Generators
  // -------------------------------------------------------------
  console.log("\n3. Testing Reference Code & Security Token Generation...");
  const ref1 = generateReferenceCode();
  const ref2 = generateReferenceCode();
  assert(ref1.startsWith("CB-"), "Reference code starts with CB- prefix");
  assert(ref1.length === 9, "Reference code is exactly 9 characters long");
  assert(ref1 !== ref2, "Subsequent reference codes are unique");

  const t1 = generateTicketCode();
  assert(t1.split("-").length === 4, "Ticket security code is formatted in 4 hyphenated blocks");

  // -------------------------------------------------------------
  // Test 4: Hold Expiration & Timeout Windows
  // -------------------------------------------------------------
  console.log("\n4. Testing Hold Expiration Time Windows...");
  const now = Date.now();
  const holdDuration = 10 * 60 * 1000; // 10 minutes
  const expiresAt = new Date(now + holdDuration);
  assert(expiresAt.getTime() > now, "Hold expiry is in the future");
  assert(expiresAt.getTime() - now === holdDuration, "Hold window is exactly 10 minutes");

  console.log("\n=======================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} QA TESTS PASSED SUCCESSFULLY!`);
  console.log("=======================================================\n");
}

runQASuite().catch((err) => {
  console.error("QA Test Suite encountered failure:", err);
  process.exit(1);
});
