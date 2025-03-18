import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Users, UserDetails } from '../../modules/users/entities/users.entity';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';

export class UsersSeeder1725889773200 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE users');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const repository = dataSource.getRepository(Users);

    await repository.insert([
      {
        name: 'Admin One',
        email: 'admin_one@email.com',
        password: await bcrypt.hash('1111aaaa', 10),
        role: 'admin',
        remember_token: null,
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        name: 'User One',
        email: 'user_one@email.com',
        password: await bcrypt.hash('1111aaaa', 10),
        role: 'user',
        remember_token: null,
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    ]);
  }
}
