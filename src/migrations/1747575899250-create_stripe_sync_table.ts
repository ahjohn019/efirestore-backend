import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateStripeSyncTable1747575899250 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stripe_sync_settings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'model_id',
            type: 'int',
          },
          {
            name: 'model_type',
            type: 'varchar',
          },
          {
            name: 'stripe_sync',
            type: 'int',
            default: 0,
          },
        ],
      }),
    );

    const ordersTable = await queryRunner.getTable('orders');
    if (ordersTable?.findColumnByName('stripe_sync')) {
      await queryRunner.dropColumn('orders', 'stripe_sync');
    }

    const refundsTable = await queryRunner.getTable('order_refunds');
    if (refundsTable?.findColumnByName('stripe_sync')) {
      await queryRunner.dropColumn('order_refunds', 'stripe_sync');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stripe_sync_settings');
  }
}
