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
    const [list, totalRecord] = await repository.findAndCount({
      take,
      skip,
      where,
      relations: relationItems,
    });

    let total_page = Math.max(Math.ceil(totalRecord / take), 1);
    let current_page = Math.max(page, 1);
    let next_page = current_page + 1;
    let previous_page = Math.max(current_page - 1, 1);
    let total_data = totalRecord;

    // If no data, reset to page 1
    if (list.length === 0) {
      current_page = next_page = previous_page = 1;
    }

    // If all data is retrieved, there's no next page
    if (list.length === totalRecord) {
      next_page = 1;
    }

    return {
      list,
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
    relations?: string[],
  ) {
    try {
      const query = repository.createQueryBuilder(tableName);

      const { page, take, ...filters } = searchParams;
      const skip = take * (page - 1);

      if (relations && relations.length > 0) {
        relations.forEach((relation) => {
          query.leftJoinAndSelect(`${tableName}.${relation}`, relation);
        });
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;

        const condition = `${tableName}.${key} LIKE :${key}`;
        const param = { [key]: `%${value}%` };

        if (key.includes('.')) {
          const [relationAlias, column] = key.split('.');
          const paramName = `${relationAlias}_${column}`;

          query.andWhere(`${relationAlias}.${column} LIKE :${paramName}`, {
            [paramName]: `%${value}%`,
          });
        } else {
          query.andWhere(condition, {
            param,
          });
        }
      });

      query.skip(skip).take(take);

      const [data, total] = await query.getManyAndCount();
      const total_page = Math.ceil(total / take);
      const current_page = parseInt(page);
      const next_page = current_page + 1;
      const previous_page = Math.max(current_page - 1, 1);

      return {
        data,
        total,
        total_page,
        current_page,
        previous_page,
        next_page,
      };
    } catch (error) {
      console.log('e', error);
      return error;
    }
  }
}
