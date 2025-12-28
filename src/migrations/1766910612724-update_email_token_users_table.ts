import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmailTokenUsersTable1766910612724
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN reset_password_token TEXT NULL AFTER remember_token,
            ADD COLUMN reset_password_expired_at TIMESTAMP NULL AFTER reset_password_token;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN reset_password_token,
            DROP COLUMN reset_password_expired_at;
        `);
  }
}
