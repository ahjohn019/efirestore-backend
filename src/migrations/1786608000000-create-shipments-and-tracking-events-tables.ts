import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateShipmentsAndTrackingEventsTables1786608000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shipments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'order_id',
            type: 'int',
          },
          {
            name: 'courier',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'service_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tracking_number',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'shipment_status',
            type: 'varchar',
            length: '100',
            default: "'pending'",
          },
          {
            name: 'courier_reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'label_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'shipped_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_tracking_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'shipments',
      new TableForeignKey({
        name: 'FK_shipments_order_id',
        columnNames: ['order_id'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'shipments',
      new TableIndex({
        name: 'IDX_shipments_order_id',
        columnNames: ['order_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'shipment_tracking_events',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'shipment_id',
            type: 'int',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'courier_status',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'event_time',
            type: 'timestamp',
          },
          {
            name: 'raw_data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'shipment_tracking_events',
      new TableForeignKey({
        name: 'FK_shipment_tracking_events_shipment_id',
        columnNames: ['shipment_id'],
        referencedTableName: 'shipments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'shipment_tracking_events',
      new TableIndex({
        name: 'IDX_shipment_tracking_events_shipment_id_event_time',
        columnNames: ['shipment_id', 'event_time'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shipment_tracking_events', true);
    await queryRunner.dropTable('shipments', true);
  }
}
