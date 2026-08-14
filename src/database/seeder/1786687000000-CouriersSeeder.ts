import type { DataSource } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Couriers } from '../../modules/couriers/entities/couriers.entity';
import { CourierServices } from '../../modules/couriers/entities/courier-services.entity';

export class CouriersSeeder1786687000000 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const courierRepository = dataSource.getRepository(Couriers);
    const serviceRepository = dataSource.getRepository(CourierServices);

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE courier_services');
    await dataSource.query('TRUNCATE TABLE couriers');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    const currentDate = new Date();

    const [poslaju, jnt] = await courierRepository.save([
      courierRepository.create({
        code: 'poslaju',
        name: 'PosLaju',
        is_active: 1,
        created_at: currentDate,
        updated_at: currentDate,
      }),
      courierRepository.create({
        code: 'jnt',
        name: 'J&T Express',
        is_active: 1,
        created_at: currentDate,
        updated_at: currentDate,
      }),
    ]);

    await serviceRepository.insert([
      {
        courier_id: poslaju.id,
        code: 'poslaju_standard',
        name: 'PosLaju Standard',
        amount: 800,
        currency: 'myr',
        delivery_minimum: 2,
        delivery_minimum_unit: 'business_day',
        delivery_maximum: 4,
        delivery_maximum_unit: 'business_day',
        created_at: currentDate,
        updated_at: currentDate,
      },
      {
        courier_id: jnt.id,
        code: 'jnt_express',
        name: 'J&T Express',
        amount: 1000,
        currency: 'myr',
        delivery_minimum: 1,
        delivery_minimum_unit: 'business_day',
        delivery_maximum: 3,
        delivery_maximum_unit: 'business_day',
        created_at: currentDate,
        updated_at: currentDate,
      },
    ]);
  }
}
