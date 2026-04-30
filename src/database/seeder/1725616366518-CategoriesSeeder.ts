import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Categories } from '../../modules/categories/entities/categories.entity';
import * as dayjs from 'dayjs';
import { CATEGORY_CATALOG } from '../seed-data/categories.catalog';

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
    const currentDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const categoryRows = CATEGORY_CATALOG.map((item) =>
      repository.create({
        name: item.name,
        slug: item.slug,
        created_at: new Date(currentDate),
        updated_at: new Date(currentDate),
      }),
    );

    await repository.save(categoryRows);
  }
}
