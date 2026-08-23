import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropLabelUrlAndLastTrackingAtFromShipments1787453646993
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('shipments', 'label_url')) {
      await queryRunner.dropColumn('shipments', 'label_url');
    }

    if (await queryRunner.hasColumn('shipments', 'last_tracking_at')) {
      await queryRunner.dropColumn('shipments', 'last_tracking_at');
    }

    await queryRunner.addColumn(
      'shipments',
      new TableColumn({
        name: 'label_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('shipments', 'label_url'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'label_url',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('shipments', 'last_tracking_at'))) {
      await queryRunner.addColumn(
        'shipments',
        new TableColumn({
          name: 'last_tracking_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }
}
