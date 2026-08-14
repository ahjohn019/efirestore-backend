import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCourierServicesTable1786685562264
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'courier_services',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'courier_id',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'amount',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'myr'",
          },
          {
            name: 'delivery_minimum',
            type: 'int',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'delivery_minimum_unit',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'delivery_maximum',
            type: 'int',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'delivery_maximum_unit',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'courier_services',
      new TableForeignKey({
        name: 'fk_courier_services_courier',
        columnNames: ['courier_id'],
        referencedTableName: 'couriers',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('courier_services', true);
  }
}
