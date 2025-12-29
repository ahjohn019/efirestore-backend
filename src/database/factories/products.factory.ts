import { setSeederFactory } from 'typeorm-extension';
import { Products } from '../../modules/products/entities/products.entity';
import * as dayjs from 'dayjs';

export default setSeederFactory(Products, async (faker, data: any) => {
  const products = new Products();
  const productFakerName = faker.commerce.product();

  const categoryRepository = await data.category.findOne({
    where: {
      id: faker.number.int({ min: 1, max: 3 }),
    },
  });

  products.title = productFakerName;
  products.sku = productFakerName.toUpperCase();
  products.description = faker.commerce.productDescription();
  products.price = parseFloat(faker.commerce.price());
  products.categories = categoryRepository.id;
  products.created_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  products.updated_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  return products;
});
