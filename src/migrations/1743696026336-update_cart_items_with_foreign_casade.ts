import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCartItemsWithForeignCasade1743696026336
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cart_items
      ADD CONSTRAINT fk_cart
      FOREIGN KEY (cart_id)
      REFERENCES carts(id)
      ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cart_items
      DROP CONSTRAINT fk_cart;
    `);
  }
}
