import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Categories } from '../../modules/categories/entities/categories.entity';
import * as dayjs from 'dayjs';

export class CategoriesSeeder1725636366518 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE categories');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const repository = dataSource.getRepository(Categories);
    await repository.insert([
      {
        name: 'Category One',
        slug: 'category_one',
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        name: 'Category Two',
        slug: 'category_two',
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    ]);
  }
}
