const fs = require('fs');
let code = fs.readFileSync('src/routes/librarians.ts', 'utf8');

code = code.replace(
  `    const allLibrarians = await db.query.librarians.findMany({
        orderBy: (librarians, { asc }) => [asc(librarians.id)]
    });
    res.json(allLibrarians);`,
  `    const allLibrarians = await db.query.librarians.findMany({
        orderBy: (librarians, { asc }) => [asc(librarians.id)]
    });
    const mapped = allLibrarians.map(lib => ({ ...lib, password: lib.password_hash }));
    res.json(mapped);`
);

fs.writeFileSync('src/routes/librarians.ts', code);
console.log('Fixed librarians api');
