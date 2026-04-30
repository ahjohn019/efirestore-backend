import { setSeederFactory } from 'typeorm-extension';
import { Products } from '../../modules/products/entities/products.entity';
import * as dayjs from 'dayjs';
import { PRODUCT_CATALOG } from '../seed-data/products.catalog';

export default setSeederFactory(Products, async (faker, data: any) => {
  const products = new Products();
  const product = faker.helpers.arrayElement(PRODUCT_CATALOG);

  const categoryRepository = await data.category.findOne({
    where: {
      id: faker.number.int({ min: 1, max: 3 }),
    },
  });

  products.title = product.title;
  products.sku = faker.helpers.slugify(product.title).toUpperCase();
  products.description = product.description;
  products.price = faker.number.float({
    min: 1,
    max: 99.99,
    fractionDigits: 2,
  });
  products.categories = categoryRepository.id;
  products.created_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  products.updated_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  return products;
});
