import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class ReplaceShipmentTrackingEventsWithTrackLogs1787468189604
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('shipment_tracking_events')) {
      await queryRunner.dropTable('shipment_tracking_events', true);
    }

    if (!(await queryRunner.hasTable('shipment_track_logs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'shipment_track_logs',
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
              name: 'tracking_status',
              type: 'varchar',
              length: '255',
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
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('shipment_track_logs')) {
      await queryRunner.dropTable('shipment_track_logs', true);
    }

    if (await queryRunner.hasTable('shipment_tracking_events')) {
      return;
    }

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
          { name: 'shipment_id', type: 'int' },
          { name: 'status', type: 'varchar', length: '100' },
          {
            name: 'courier_status',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'event_time', type: 'timestamp' },
          { name: 'raw_data', type: 'json', isNullable: true },
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
}
