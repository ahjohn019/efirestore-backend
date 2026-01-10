import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateUserAddressTypeTable1767502868861
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_addresses',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'address_line_one',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address_line_two',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address_type',
            type: 'varchar',
          },
          {
            name: 'postal_code',
            type: 'int',
          },
          {
            name: 'status',
            type: 'boolean',
          },
          {
            name: 'user_id',
            type: 'int',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_addresses',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    const table = await queryRunner.getTable('user_details');

    const columnToDrop = [
      'address_one',
      'address_two',
      'address_type',
      'is_default',
      'postal_code',
    ];

    columnToDrop.forEach(async (value) => {
      if (table?.findColumnByName(value)) {
        await queryRunner.dropColumn('user_details', value);
      }
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_addresses');
  }
}
