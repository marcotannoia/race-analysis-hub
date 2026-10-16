const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

const collegaDatabase = require("../config/database");
const { Gara } = require("../repositories/modelli");
const { invalidate } = require("../repositories/postgresCompat");

const FORMATO_SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

async function impostaGaraAttuale() {
  const slug = process.argv[2];

  if (!slug || slug.length > 80 || !FORMATO_SLUG.test(slug)) {
    throw new Error(
      "Indicare uno slug valido: npm run set-current -- olanda-zandvoort",
    );
  }

  await collegaDatabase();

  const gara = await Gara.findOne({ slug }).select("slug stato").lean();

  if (!gara) {
    throw new Error(`La gara ${slug} non esiste`);
  }

  if (gara.stato === "conclusa") {
    throw new Error("Una gara conclusa non puo essere ripubblicata come attuale");
  }

  if (collegaDatabase.usaPostgres()) {
    const client = await collegaDatabase.getPool().connect();
    try {
      await client.query('begin');
      await client.query(`update catalog.grand_prix set state='futura',updated_at=now()
        where state='attuale' and slug<>$1`, [slug]);
      const changed = await client.query(`update catalog.grand_prix set state='attuale',
        concluded_at=null,updated_at=now() where slug=$1 and state<>'conclusa' returning id`, [slug]);
      if (changed.rowCount !== 1) throw new Error('Gara non aggiornabile');
      await client.query(`update editorial.source_document set payload=jsonb_set(payload,'{stato}','"futura"'::jsonb)
        where collection_name='gare' and payload->>'stato' in ('attuale','prossima') and payload->>'slug'<>$1`, [slug]);
      await client.query(`update editorial.source_document set payload=jsonb_set(jsonb_set(payload,'{stato}',
        '"attuale"'::jsonb),'{conclusaIl}','null'::jsonb)
        where collection_name='gare' and payload->>'slug'=$1`, [slug]);
      await client.query(process.argv.includes('--dry-run') ? 'rollback' : 'commit');
      invalidate('Gara');
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  } else await Gara.bulkWrite([
    {
      updateMany: {
        filter: {
          _id: { $ne: gara._id },
          $or: [
            { stato: { $in: ["attuale", "prossima"] } },
            { stato: null },
            { stato: { $exists: false } },
          ],
        },
        update: { $set: { stato: "futura" } },
      },
    },
    {
      updateOne: {
        filter: { _id: gara._id },
        update: { $set: { stato: "attuale", conclusaIl: null } },
      },
    },
  ]);

  console.log(`${process.argv.includes('--dry-run') ? 'Verificato' : 'Gran Premio attuale impostato'}: ${slug}`);
}

impostaGaraAttuale()
  .catch((errore) => {
    console.error(`Aggiornamento fallito: ${errore.message}`);
    process.exitCode = 1;
  })
  .finally(() => collegaDatabase.chiudiDatabase());
