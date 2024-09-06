import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Products } from '../../modules/products/entities/products.entity';
import { Categories } from '../../modules/categories/entities/categories.entity';

export class ProductsSeeder1725618100032 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    await dataSource.query('TRUNCATE TABLE products');

    const productFactory = await factoryManager.get(Products);
    const categoryRepository = dataSource.getRepository(Categories);

    productFactory.setMeta({ category: categoryRepository });
    await productFactory.saveMany(5);
  }
}
