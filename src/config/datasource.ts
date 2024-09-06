import { DataSourceOptions, DataSource } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: (process.env.DATABASE_TYPE as any) ?? 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) ?? 3306,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true,
  bigNumberStrings: true,
  multipleStatements: true,
  logging: true,
  entities: [path.join(__dirname, '/../modules/**/entities/*.entity.{js,ts}')],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: true,
  seeds: ['src/database/seeder/**/*{.ts,.js}'],
  factories: ['src/database/factories/**/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

async () => {
  await dataSource.initialize();

  await runSeeders(dataSource, {
    seeds: ['src/database/seeder/**/*{.ts,.js}'],
    factories: ['src/database/factories/**/*{.ts,.js}'],
  });
};

export default dataSource;
