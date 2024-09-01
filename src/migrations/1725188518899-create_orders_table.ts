import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrdersTable1725188518899 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'subtotal',
            type: 'double',
          },
          {
            name: 'grand_total',
            type: 'double',
          },
          {
            name: 'shipping_address',
            type: 'text',
          },
          {
            name: 'billing_address',
            type: 'text',
          },
          {
            name: 'tracking_number',
            type: 'varchar',
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'payment_id',
            type: 'integer',
          },
          {
            name: 'created_at',
            type: 'datetime',
          },
          {
            name: 'updated_at',
            type: 'datetime',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders');
  }
}
