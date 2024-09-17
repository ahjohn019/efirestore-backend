import { Repository, FindOptionsWhere } from 'typeorm';

export class Helper {
  static async calculatePagination<T>(
    payload: { total: number; page: number },
    repository: Repository<T>,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ) {
    const take = payload.total;
    const page = payload.page;
    const skip = take * (page - 1);
    const [data, total] = await repository.findAndCount({
      take,
      skip: skip,
      where,
    });

    let total_page = Math.max(Math.ceil(total / take), 1);
    let current_page = Math.max(page, 1);
    let next_page = current_page + 1;
    let previous_page = Math.max(current_page - 1, 1);
    let total_data = total;

    // If no data, reset to page 1
    if (data.length === 0) {
      current_page = next_page = previous_page = 1;
    }

    // If all data is retrieved, there's no next page
    if (data.length === total) {
      next_page = 1;
    }

    return {
      data,
      total_page,
      current_page,
      next_page,
      previous_page,
      total_data,
    };
  }
  static convertUpperCase(name: string) {
    return name.replace(/\s+/g, ' ').trim().replace(/ /g, '_').toLowerCase();
  }
}
