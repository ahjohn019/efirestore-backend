import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReorderProductDimensionsAfterPrice1794009600003
  implements MigrationInterface
{
  private readonly columns = ['width', 'height', 'length', 'weight'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let previous = 'price';
    for (const name of this.columns) {
      await queryRunner.query(
        `ALTER TABLE \`products\` ADD COLUMN \`${name}\` INT NOT NULL DEFAULT 0 AFTER \`${previous}\``,
      );
      previous = name;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [...this.columns].reverse()) {
      if (await queryRunner.hasColumn('products', name)) {
        await queryRunner.dropColumn('products', name);
      }
    }
  }
}
