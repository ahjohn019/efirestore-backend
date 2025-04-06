import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderItemsWithForeignKeyColumn1743945660891
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE order_items
            ADD CONSTRAINT fk_order
            FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE order_items
      DROP CONSTRAINT fk_order;
    `);
  }
}
