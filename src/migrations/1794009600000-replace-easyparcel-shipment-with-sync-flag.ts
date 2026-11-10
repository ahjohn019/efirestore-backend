import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ReplaceEasyparcelShipmentWithSyncFlag1794009600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('orders', 'sync_easyparcel'))) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'sync_easyparcel',
          type: 'tinyint',
          width: 1,
          isNullable: false,
          default: 0,
        }),
      );
    }

    // Stored request JSON does not prove submission succeeded. Use shipments.
    await queryRunner.query(
      'UPDATE `orders` o SET o.`sync_easyparcel` = EXISTS (SELECT 1 FROM `shipments` s WHERE s.`order_id` = o.`id`)',
    );
    if (await queryRunner.hasColumn('orders', 'easyparcel_shipment')) {
      await queryRunner.dropColumn('orders', 'easyparcel_shipment');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Previously stored shipment JSON cannot be recovered after removal.
    if (!(await queryRunner.hasColumn('orders', 'easyparcel_shipment'))) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'easyparcel_shipment',
          type: 'json',
          isNullable: true,
        }),
      );
    }
    if (await queryRunner.hasColumn('orders', 'sync_easyparcel')) {
      await queryRunner.dropColumn('orders', 'sync_easyparcel');
    }
  }
}
