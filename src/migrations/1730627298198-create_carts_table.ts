import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCartsTable1730627298198 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'carts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 0,
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
            name: 'cart_session_id',
            type: 'varchar',
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
    await queryRunner.dropTable('carts');
  }
}
