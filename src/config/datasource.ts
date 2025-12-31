import { DataSource, type DataSourceOptions } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

// TypeORM DataSource config
export const dataSourceOptions: DataSourceOptions = {
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
  entities: [path.join(__dirname, '/../modules/**/entities/*.entity.{js,ts}')],
  migrations: [path.join(__dirname, '/../migrations/*{.ts,.js}')],
  migrationsRun: true,
};

const dataSource = new DataSource(dataSourceOptions);

// Function to run seeders
export const seedDatabase = async () => {
  await runSeeders(dataSource, {
    seeds: [path.join(__dirname, '/../database/seeder/**/*{.ts,.js}')],
    factories: [path.join(__dirname, '/../database/factories/**/*{.ts,.js}')],
  });
};

// Initialize DataSource and run seeders
(async () => {
  await dataSource.initialize();
  await seedDatabase();
})();

export default dataSource;
