import type { DataSource } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Products } from '../../modules/products/entities/products.entity';
import { Categories } from '../../modules/categories/entities/categories.entity';
import { Images } from '../../modules/images/entities/images.entity';
import { PRODUCT_CATALOG } from '../seed-data/products.catalog';

export class ProductsSeeder1725618100032 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE images');
    await dataSource.query('TRUNCATE TABLE products');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const productRepository = dataSource.getRepository(Products);
    const categoryRepository = dataSource.getRepository(Categories);
    const imageRepository = dataSource.getRepository(Images);

    const categories = await categoryRepository.find({
      order: { id: 'ASC' },
    });

    const currentDate = new Date();
    const productRows = PRODUCT_CATALOG.map((item, index) => {
      const category =
        categories.length > 0 ? categories[index % categories.length] : null;
      const sku = item.title
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      return productRepository.create({
        title: item.title,
        sku,
        description: item.description,
        price: Number((25 + index * 2.5).toFixed(2)),
        categories: category,
        created_at: currentDate,
        updated_at: currentDate,
      });
    });

    const savedProducts = await productRepository.save(productRows);

    const imageRows = savedProducts.map((product, index) => {
      const catalogItem = PRODUCT_CATALOG[index];
      const fileName = catalogItem.imageFileName;

      return {
        name: fileName,
        path: `/uploads/products/${fileName}`,
        size: Number((25 + index * 0.5).toFixed(2)),
        category: 'product',
        mime_type: 'image/jpeg',
        destination: 'public/uploads/products',
        entity_id: product.id,
        entity_type: 'product',
        created_at: currentDate,
        updated_at: currentDate,
      };
    });

    await imageRepository.save(imageRows);
  }
}
