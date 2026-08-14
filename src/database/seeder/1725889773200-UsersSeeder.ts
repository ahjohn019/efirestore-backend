import type { DataSource } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Users } from '../../modules/users/entities/users.entity';
import { StripeUsers } from '../../modules/payments/stripe/entities/stripe.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

export class UsersSeeder1725889773200 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const demoPassword = process.env.DEMO_PASSWORD;

    if (!demoPassword) {
      throw new Error('DEMO_PASSWORD is not set');
    }

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE users');
    await dataSource.query('TRUNCATE TABLE order_items');
    await dataSource.query('TRUNCATE TABLE orders');
    await dataSource.query('TRUNCATE TABLE stripe_users');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const repository = dataSource.getRepository(Users);
    const stripeUsersRepository = dataSource.getRepository(StripeUsers);
    const currentDate = new Date();

    await repository.insert([
      {
        name: 'Admin One',
        email: 'admin_one@email.com',
        password: await bcrypt.hash(demoPassword, 10),
        role: 'admin',
        remember_token: null,
        created_at: currentDate,
        updated_at: currentDate,
      },
      {
        name: 'User One',
        email: 'user_one@email.com',
        password: await bcrypt.hash(demoPassword, 10),
        role: 'user',
        remember_token: null,
        created_at: currentDate,
        updated_at: currentDate,
      },
    ]);

    await stripeUsersRepository.insert({
      user_id: 2,
      stripe_account_id: 'cus_V4KON832Z4JTRC',
      created_at: currentDate,
      updated_at: currentDate,
    });
  }
}
