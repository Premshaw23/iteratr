const apiUrl = 'https://ce.judge0.com';
const headers = { 'Content-Type': 'application/json' };
const body = JSON.stringify({
  source_code: 'print("hello")',
  language_id: 71,
  stdin: ''
});

console.log("Sending body:", body);

try {
  const res = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
} catch (e) {
  console.error("Fetch failed:", e);
}
