import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCartItemsUserIdColumn1765603966446
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE cart_items
            ADD COLUMN user_id INT NULL AFTER cart_id;

            ALTER TABLE cart_items
            ADD CONSTRAINT fk_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE cart_items
            DROP COLUMN user_id;
        `);
  }
}
