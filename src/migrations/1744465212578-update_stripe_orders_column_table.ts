import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStripeOrdersColumnTable1744465212578
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE orders
            ADD COLUMN checkout_stripe_id VARCHAR(255),
            ADD COLUMN stripe_sync TINYINT(1) DEFAULT 0;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE orders
            DROP COLUMN checkout_stripe_id,
            DROP COLUMN stripe_sync;
        `);
  }
}
