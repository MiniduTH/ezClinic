import { DataSource } from 'typeorm';

type ExistsResult = { exists: boolean };
type ColumnInfo = { column_name: string; data_type: string };

async function ensurePasswordHashColumn(
  queryRunner: ReturnType<DataSource['createQueryRunner']>,
  tableName: 'admins' | 'patients',
): Promise<void> {
  const columns = (await queryRunner.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${tableName}'
      AND column_name IN ('password_hash', 'passwordHash');
  `)) as Array<{ column_name: string }>;

  const hasPasswordHash = columns.some(
    (c) => c.column_name === 'password_hash',
  );
  const hasLegacyPasswordHash = columns.some(
    (c) => c.column_name === 'passwordHash',
  );

  if (!hasPasswordHash) {
    await queryRunner.query(
      `ALTER TABLE public.${tableName} ADD COLUMN password_hash character varying;`,
    );
  }

  if (hasLegacyPasswordHash) {
    await queryRunner.query(`
      UPDATE public.${tableName}
      SET password_hash = "passwordHash"::text
      WHERE password_hash IS NULL AND "passwordHash" IS NOT NULL;
    `);
  }
}

/**
 * One-time compatibility migration for legacy patients rows that were created
 * before the `id` column became mandatory in the entity model.
 */
export async function ensurePatientIdSchema(
  dataSource: DataSource,
): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    const tableExistsRows = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patients'
      ) AS exists;
    `)) as ExistsResult[];

    if (tableExistsRows[0]?.exists !== true) {
      await queryRunner.commitTransaction();
      return;
    }

    const columns = (await queryRunner.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'patients'
        AND column_name IN ('id', 'auth0_id', 'auth0_sub');
    `)) as ColumnInfo[];

    let idColumn = columns.find((c) => c.column_name === 'id');
    const auth0IdColumn = columns.find((c) => c.column_name === 'auth0_id');
    const auth0SubColumn = columns.find((c) => c.column_name === 'auth0_sub');

    if (!idColumn) {
      await queryRunner.query(
        'ALTER TABLE public.patients ADD COLUMN id character varying;',
      );
      idColumn = { column_name: 'id', data_type: 'character varying' };
    }

    const idIsUuid = idColumn.data_type === 'uuid';
    const emptyIdPredicate = idIsUuid
      ? 'id IS NULL'
      : "id IS NULL OR btrim(id::text) = ''";

    if (auth0SubColumn && !idIsUuid) {
      await queryRunner.query(`
        UPDATE public.patients
        SET id = auth0_sub::text
        WHERE (${emptyIdPredicate})
          AND auth0_sub IS NOT NULL
          AND btrim(auth0_sub::text) <> '';
      `);
    }

    if (auth0IdColumn && !idIsUuid) {
      await queryRunner.query(`
        UPDATE public.patients
        SET id = auth0_id::text
        WHERE (${emptyIdPredicate})
          AND auth0_id IS NOT NULL
          AND btrim(auth0_id::text) <> '';
      `);
    }

    await queryRunner.query(`
      UPDATE public.patients
      SET id = ${idIsUuid ? 'gen_random_uuid()' : 'gen_random_uuid()::text'}
      WHERE ${emptyIdPredicate};
    `);

    await queryRunner.query(
      'ALTER TABLE public.patients ALTER COLUMN id SET NOT NULL;',
    );

    await ensurePasswordHashColumn(queryRunner, 'admins');
    await ensurePasswordHashColumn(queryRunner, 'patients');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
