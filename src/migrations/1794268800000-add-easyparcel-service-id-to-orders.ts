import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEasyparcelServiceIdToOrders1794268800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `orders` ADD COLUMN `easyparcel_service_id` varchar(255) NULL AFTER `checkout_stripe_id`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `orders` DROP COLUMN `easyparcel_service_id`',
    );
  }
}
