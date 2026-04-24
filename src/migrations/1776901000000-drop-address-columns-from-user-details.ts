import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropAddressColumnsFromUserDetails1776901000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_details');

    const columnsToDrop = [
      'is_default',
      'address_type',
      'postal_code',
      'address_two',
      'address_one',
    ];

    for (const columnName of columnsToDrop) {
      if (table?.findColumnByName(columnName)) {
        await queryRunner.dropColumn('user_details', columnName);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_details');
    const columnsToAdd: TableColumn[] = [];

    if (!table?.findColumnByName('address_one')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'address_one',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (!table?.findColumnByName('address_two')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'address_two',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (!table?.findColumnByName('postal_code')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'postal_code',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (!table?.findColumnByName('address_type')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'address_type',
          type: 'enum',
          enum: ['shipping', 'billing'],
          isNullable: true,
        }),
      );
    }

    if (!table?.findColumnByName('is_default')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'is_default',
          type: 'int',
          default: 0,
        }),
      );
    }

    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('user_details', columnsToAdd);
    }
  }
}
