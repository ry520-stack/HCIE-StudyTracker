import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: hashed,
    },
  });
  console.log('Seeded user:', user.id, '(password: 123456)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
