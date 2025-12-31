// src/config/datasource.ts
import { DataSource, type DataSourceOptions } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const rootDir = process.cwd();

// TypeORM DataSource config
export const dataSourceOptions: DataSourceOptions = {
  type: (process.env.DATABASE_TYPE as any) ?? 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  bigNumberStrings: true,
  multipleStatements: true,
  logging: true,
  entities: [join(rootDir, 'src/modules/**/entities/*.entity.{js,ts}')],
  migrations: [join(rootDir, 'src/migrations/*{.ts,.js}')],
  migrationsRun: true,
};

const dataSource = new DataSource(dataSourceOptions);

// Function to run seeders
export const seedDatabase = async () => {
  await runSeeders(dataSource, {
    seeds: [join(rootDir, 'src/database/seeder/**/*{.ts,.js}')],
    factories: [join(rootDir, 'src/database/factories/**/*{.ts,.js}')],
  });
};

// Initialize DataSource and run seeders
(async () => {
  await dataSource.initialize();
  console.log('DataSource initialized.');

  await seedDatabase();
  console.log('Database seeded successfully.');
})();

export default dataSource;
