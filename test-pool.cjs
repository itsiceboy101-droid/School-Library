async function run() {
    for(let i=0; i<20; i++) {
        fetch('http://localhost:3000/api/auth/login-librarian', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'Teacher Access', password: 'abc'})
        }).then(res => res.json()).then(console.log).catch(console.error);
    }
}
run();
