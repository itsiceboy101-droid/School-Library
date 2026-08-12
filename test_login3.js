async function test() {
  const res = await fetch('http://127.0.0.1:3000/api/auth/login-librarian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher1', password: 'password123' })
  });
  console.log(await res.json());
}
test();
