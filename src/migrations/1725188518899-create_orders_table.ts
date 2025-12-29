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
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'subtotal',
            type: 'double',
            default: 0,
          },
          {
            name: 'grand_total',
            type: 'double',
            default: 0,
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
            name: 'total_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'admin_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'now()',
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
