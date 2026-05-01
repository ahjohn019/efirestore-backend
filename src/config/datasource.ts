import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import * as path from 'path';

const rootDir = process.cwd();

dotenv.config();

const typeormRuntime = process.env.TYPEORM_RUNTIME ?? 'src';
const runtimeRoot = typeormRuntime === 'dist' ? 'dist' : 'src';

function globPath(...segments: string[]): string {
  return path.resolve(...segments).replace(/\\/g, '/');
}

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: (process.env.DATABASE_TYPE as any) ?? 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number.parseInt(process.env.DATABASE_PORT ?? '', 10) || 3306,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  bigNumberStrings: true,
  multipleStatements: true,
  logging: true,
  entities: [
    globPath(
      rootDir,
      runtimeRoot,
      'modules/**/entities/*.entity.' + (runtimeRoot === 'dist' ? 'js' : 'ts'),
    ),
  ],
  migrations: [
    globPath(
      rootDir,
      runtimeRoot,
      'migrations/*.' + (runtimeRoot === 'dist' ? 'js' : 'ts'),
    ),
  ],
  migrationsRun: false,
  seeds: [
    globPath(
      rootDir,
      runtimeRoot,
      'database/seeder/**/*.' + (runtimeRoot === 'dist' ? 'js' : 'ts'),
    ),
  ],
  factories: [
    globPath(
      rootDir,
      runtimeRoot,
      'database/factories/**/*.' + (runtimeRoot === 'dist' ? 'js' : 'ts'),
    ),
  ],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
