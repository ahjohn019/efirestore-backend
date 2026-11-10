import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropUnusedEasyparcelOrderColumns1794009600001
  implements MigrationInterface
{
  private readonly columns = [
    'easyparcel_parcel',
    'easyparcel_sender',
    'easyparcel_subdivisions',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of this.columns) {
      if (await queryRunner.hasColumn('orders', name)) {
        await queryRunner.dropColumn('orders', name);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the schema only; removed JSON values cannot be recovered.
    for (const name of this.columns) {
      if (!(await queryRunner.hasColumn('orders', name))) {
        await queryRunner.addColumn(
          'orders',
          new TableColumn({ name, type: 'json', isNullable: true }),
        );
      }
    }
  }
}
