// practices/qa-e2e.md §6 — release gate for critical endpoints (run against sandbox).
// k6 run -e BASE_URL=https://sandbox.example.com -e TOKEN=... k6-smoke.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    steady: { executor: "constant-arrival-rate", rate: 20, timeUnit: "1s", duration: "2m", preAllocatedVUs: 20, maxVUs: 50 },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:getPayment}": ["p(95)<400"],
    "http_req_duration{endpoint:createPayment}": ["p(95)<800"],
  },
};

const BASE = __ENV.BASE_URL;
const headers = { Authorization: `Bearer ${__ENV.TOKEN}`, "Content-Type": "application/json" };

export default function () {
  const created = http.post(
    `${BASE}/v1/payments`,
    JSON.stringify({ amount: 1990, currency: "BRL", paymentMethod: "PIX" }),
    { headers: { ...headers, "Idempotency-Key": crypto.randomUUID() }, tags: { endpoint: "createPayment" } },
  );
  check(created, { "created 201": (r) => r.status === 201 });

  const id = created.json("id");
  if (id) {
    const fetched = http.get(`${BASE}/v1/payments/${id}`, { headers, tags: { endpoint: "getPayment" } });
    check(fetched, { "fetched 200": (r) => r.status === 200 });
  }
  sleep(1);
}
