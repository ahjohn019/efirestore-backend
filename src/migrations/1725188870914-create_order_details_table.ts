import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrderDetailsTable1725188870914
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_details',
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
          },
          {
            name: 'product_id',
            type: 'integer',
          },
          {
            name: 'order_id',
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
    await queryRunner.dropTable('order_details');
  }
}
