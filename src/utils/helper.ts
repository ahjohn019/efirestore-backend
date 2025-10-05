import { Repository, FindOptionsWhere } from 'typeorm';
import { unlink } from 'node:fs';

export class Helper {
  static async calculatePagination<T>(
    payload: { take: number; page: number },
    repository: Repository<T>,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    relationItems?: (keyof T & string)[],
  ) {
    const { take, page } = payload;

    const skip = take * (page - 1);
    const [data, totalRecord] = await repository.findAndCount({
      take,
      skip: skip,
      where,
      relations: relationItems,
    });

    let total_page = Math.max(Math.ceil(totalRecord / take), 1);
    let current_page = Math.max(page, 1);
    let next_page = current_page + 1;
    let previous_page = Math.max(current_page - 1, 1);
    let total_data = totalRecord;

    // If no data, reset to page 1
    if (data.length === 0) {
      current_page = next_page = previous_page = 1;
    }

    // If all data is retrieved, there's no next page
    if (data.length === totalRecord) {
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

  static unlinkFile(path: string) {
    unlink(path, (err) => {
      if (err) throw err;
    });
  }

  static checkDuplicateIdsExists(idList: number[]) {
    const idLists = idList.filter(
      (item, index) => idList.indexOf(item) !== index,
    );

    const uniqueDuplicateIds = [...new Set(idLists)];

    return uniqueDuplicateIds;
  }

  static async searchHelpers<T>(
    repository: Repository<T>,
    searchParams: any,
    tableName: string,
  ) {
    try {
      const query = repository.createQueryBuilder(tableName);

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
          const condition = `${tableName}.${key} LIKE :${key}`;
          const param = { [key]: `%${value}%` };

          query.where(condition, param);
        }
      });

      return await query.getMany();
    } catch (error) {
      return error;
    }
  }
}
