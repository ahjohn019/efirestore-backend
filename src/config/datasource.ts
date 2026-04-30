import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import * as path from 'path';

const rootDir = process.cwd();

dotenv.config();

function globPath(...segments: string[]): string {
  return path.resolve(...segments).replace(/\\/g, '/');
}

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: (process.env.DATABASE_TYPE as any) ?? 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) ?? 3306,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  bigNumberStrings: true,
  multipleStatements: true,
  logging: true,
  entities: [globPath(rootDir, 'src/modules/**/entities/*.entity.{js,ts}')],
  migrations: [globPath(rootDir, 'src/migrations/*{.ts,.js}')],
  migrationsRun: false,
  seeds: [globPath(rootDir, 'src/database/seeder/**/*{.ts,.js}')],
  factories: [globPath(rootDir, 'src/database/factories/**/*{.ts,.js}')],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
