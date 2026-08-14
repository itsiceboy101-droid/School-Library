import { db } from './src/db/db';
import { librarians } from './src/db/schema';
import { eq, or } from 'drizzle-orm';
async function test() {
    try {
        const user = await db.query.librarians.findFirst({
            where: (librarians, { eq, or }) => or(
                eq(librarians.email, 'Teacher Access'),
                eq(librarians.name, 'Teacher Access')
            ),
        });
        console.log(user);
    } catch (e: any) {
        console.error(e.message);
    }
    process.exit(0);
}
test();
