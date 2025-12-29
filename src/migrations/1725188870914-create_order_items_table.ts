import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrderItemsTable1725188870914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'quantity',
            type: 'integer',
          },
          {
            name: 'unit_price',
            type: 'double',
          },
          {
            name: 'total_price',
            type: 'double',
            default: 0,
          },
          {
            name: 'product_id',
            type: 'integer',
            default: 0,
          },
          {
            name: 'order_id',
            type: 'integer',
            default: 0,
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
    await queryRunner.dropTable('order_items');
  }
}
