import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRawDataAndDropShipmentColumns1787454370765
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('shipments', 'raw_data'))) {
      await queryRunner.query(
        'ALTER TABLE `shipments` ADD COLUMN `raw_data` JSON NULL AFTER `courier_reference`',
      );
    }

    for (const columnName of [
      'service_type',
      'shipped_at',
      'delivered_at',
      'courier_reference',
    ]) {
      if (await queryRunner.hasColumn('shipments', columnName)) {
        await queryRunner.dropColumn('shipments', columnName);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('shipments', 'service_type'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'service_type',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('shipments', 'shipped_at'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'shipped_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('shipments', 'delivered_at'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'delivered_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('shipments', 'courier_reference'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'courier_reference',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (await queryRunner.hasColumn('shipments', 'raw_data')) {
      await queryRunner.dropColumn('shipments', 'raw_data');
    }
  }
}
