import { setSeederFactory } from 'typeorm-extension';
import { Categories } from '../../modules/categories/entities/categories.entity';
import * as dayjs from 'dayjs';

export default setSeederFactory(Categories, async (faker, data: any) => {
  const categories = new Categories();

  const fakeCategories = faker.commerce.department();

  categories.name = fakeCategories;
  categories.slug = faker.helpers.slugify(fakeCategories.toLowerCase());
  categories.created_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  categories.updated_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  return categories;
});
