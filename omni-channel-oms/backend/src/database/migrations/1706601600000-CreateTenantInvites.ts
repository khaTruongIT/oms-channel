import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantInvites1706601600000 implements MigrationInterface {
  name = 'CreateTenantInvites1706601600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."tenant_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "role" character varying(50) NOT NULL,
        "invited_by" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "accepted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_invites_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" 
      ADD CONSTRAINT "FK_tenant_invites_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" 
      ADD CONSTRAINT "FK_tenant_invites_invited_by" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" DROP CONSTRAINT "FK_tenant_invites_invited_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."tenant_invites" DROP CONSTRAINT "FK_tenant_invites_tenant_id"
    `);
    await queryRunner.query(`
      DROP TABLE "public"."tenant_invites"
    `);
  }
}
