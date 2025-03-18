import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class UserDetails1742276679209 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_details',
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
            name: 'first_name',
            type: 'varchar',
          },
          {
            name: 'last_name',
            type: 'varchar',
          },
          {
            name: 'address_one',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address_two',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address_type',
            type: 'enum',
            enum: ['shipping', 'billing'],
          },
          {
            name: 'is_default',
            type: 'int',
            default: 0,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'identity_card_number',
            type: 'varchar',
          },
          {
            name: 'gender',
            type: 'enum',
            enum: ['male', 'female'],
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
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_details');
  }
}
