import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableExtensions1706603000000 implements MigrationInterface {
  name = 'EnableExtensions1706603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgcrypto for gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Enable uuid-ossp for uuid_generate_v4() if preferred
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We generally don't disable extensions in down migrations as other schemas might depend on them
    // But for completeness:
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
  }
}
