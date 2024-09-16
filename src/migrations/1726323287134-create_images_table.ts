import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateImagesTable1726323287134 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'images',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'path',
            type: 'text',
          },
          {
            name: 'size',
            type: 'double',
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'file_type',
            type: 'varchar',
          },
          {
            name: 'entity_id',
            type: 'int',
          },
          {
            name: 'entity_type',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'datetime',
          },
          {
            name: 'updated_at',
            type: 'datetime',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('images');
  }
}
