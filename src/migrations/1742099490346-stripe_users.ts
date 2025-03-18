import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class StripeUsers1742099490346 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stripe_users',
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
            name: 'stripe_account_id',
            type: 'varchar',
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
    await queryRunner.dropTable('stripe_users');
  }
}
