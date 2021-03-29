import fs from 'fs';
import mysql from 'mysql2';
import {
  Scripture,
  Chapter,
  Verse,
  Stanza,
  Person,
  Obj,
  RootNav,
  Phrase,
  ReadingPlan,
  ReadingPlanItem,
  ReadingPlanDay,
} from './schema.d';

import {Firestore} from '@google-cloud/firestore';

const db = mysql
  .createPool({
    host: `localhost`,
    user: `root`,
    password: `123letmein`,
    database: `scriptures_v2`,
  })
  .promise();

// const objectsDir = `${__dirname}/objects`;
const objects = {
  $Root: {} as RootNav,
  Scripture: {} as Obj<Scripture>,
  Chapter: {} as Obj<Chapter>,
  Stanza: {} as Obj<Stanza>,
  Person: {} as Obj<Person>,
  Phrase: {} as Obj<Phrase>,
  ReadingPlan: {} as Obj<ReadingPlan>,
  ReadingPlanDay: {} as Obj<ReadingPlanDay>,
  ReadingPlanItem: {} as Obj<ReadingPlanItem>,
};

async function getPersons(): Promise<{persons: Obj<Person>}> {
  const persons: Obj<Person> = {};

  const personsSql = `
  SELECT
    persons.PersonID as id,
    Slug as slug,
    EnglishName as nameEng,
    Name as nameGuj,
    NameLipi as nameGujLipi,
    NamePhonetic as nameGujPhonetic,
    Body as bodyGuj,
    BodyLipi as bodyGujLipi,
    BodyPhonetic as bodyGujPhonetic
  FROM persons
  LEFT JOIN persontranslations
  ON persontranslations.PersonId = persons.PersonId
  `;
  const [personRows] = await db.execute(personsSql);

  for (const personRow of personRows) {
    const person: Person = {
      type: `Person`,
      id: personRow.id,
      slug: personRow.slug,
      name: {
        type: `Translations`,
        eng: personRow.nameEng || ``,
        guj: personRow.nameGuj || ``,
        gujLipi: personRow.nameGujLipi || ``,
        gujPhonetic: personRow.nameGujPhonetic || ``,
      },
      body: {
        type: `Translations`,
        guj: personRow.bodyGuj || ``,
        gujLipi: personRow.bodyGujLipi || ``,
        gujPhonetic: personRow.bodyGujPhonetic || ``,
      },
    };
    persons[person.id] = person;
  }

  return {persons};
}

async function getPhrases(): Promise<{phrases: Obj<Phrase>}> {
  const phrases: Obj<Phrase> = {};

  const phrasesSql = `
  SELECT
    p.PhraseId as id,
    p.LanguageId as langId,
    Phrase as phrase,
    PhraseLipi as phraseGujLipi,
    PhrasePhonetic as phraseGujPhonetic,
    Explanation as expl,
    ExplanationLipi as explGujLipi,
    ExplanationPhonetic as explGujPhonetic
  FROM phrases p
  LEFT JOIN phrasetranslations pt
  ON p.PhraseId = pt.PhraseId
  `;
  const [phraseRows] = await db.execute(phrasesSql);

  for (const phraseRow of phraseRows) {
    const phrase: Phrase = {
      type: `Phrase`,
      id: phraseRow.id,
      phrase:
        phraseRow.langId === 2
          ? {
              type: `Translations`,
              guj: phraseRow.phrase || ``,
              gujLipi: phraseRow.phraseGujLipi || ``,
              gujPhonetic: phraseRow.phraseGujPhonetic || ``,
            }
          : {
              type: `Translations`,
              eng: phraseRow.phrase || ``,
            },
      explanation:
        phraseRow.langId === 2
          ? {
              type: `Translations`,
              guj: phraseRow.expl || ``,
              gujLipi: phraseRow.explLipi || ``,
              gujPhonetic: phraseRow.explPhonetic || ``,
            }
          : {
              type: `Translations`,
              eng: phraseRow.expl || ``,
            },
    };
    phrases[phrase.id] = phrase;
  }

  return {phrases};
}

async function getScriptures(): Promise<{
  scriptures: Obj<Scripture>;
  chapters: Obj<Chapter>;
  verses: Obj<Verse>;
  stanzas: Obj<Stanza>;
}> {
  const scriptures: Obj<Scripture> = {};
  const chapters: Obj<Chapter> = {};
  const verses: Obj<Verse> = {};
  const stanzas: Obj<Stanza> = {};

  const scripturesSql = `
  SELECT
    DocumentId as id,
    Slug as slug,
    EnglishTitle as titleEng,
    (SELECT Title FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGuj,
    (SELECT TitleLipi FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGujLipi,
    (SELECT TitlePhonetic FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGujPhonetic
  FROM documents d
  WHERE DocumentTypeId = 2
  `;
  const [scriptureRows] = await db.execute(scripturesSql);

  for (const scriptureRow of scriptureRows) {
    const scripture: Scripture = {
      type: `Scripture`,
      id: scriptureRow.id,
      slug: scriptureRow.slug,
      title: {
        type: `Translations`,
        eng: scriptureRow.titleEng || ``,
        guj: scriptureRow.titleGuj || ``,
        gujLipi: scriptureRow.titleGujLipi || ``,
        gujPhonetic: scriptureRow.titleGujPhonetic || ``,
      },
      items: [],
    };

    scriptures[scripture.id] = scripture;

    const chaptersSql = `
    SELECT
      DocumentItemId as id,
      Slug as slug,
      EnglishTitle as titleEng,
      (SELECT Title FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGuj,
      (SELECT TitleLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujLipi,
      (SELECT TitlePhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujPhonetic,
      (SELECT Description FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 1) as descEng,
      (SELECT Description FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGuj,
      (SELECT DescriptionLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGujLipi,
      (SELECT DescriptionPhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGujPhonetic
    FROM documentitems di
    WHERE di.DocumentID = ${scripture.id} AND di.DocumentItemTypeId = 2
    ORDER BY Number
    `;
    const [chapterRows] = await db.execute(chaptersSql);
    for (const chapterRow of chapterRows) {
      const chapter: Chapter = {
        type: `Chapter`,
        id: chapterRow.id,
        slug: chapterRow.slug,
        title: {
          type: `Translations`,
          eng: chapterRow.titleEng || ``,
          guj: chapterRow.titleGuj || ``,
          gujLipi: chapterRow.titleGujLipi || ``,
          gujPhonetic: chapterRow.titleGujPhonetic || ``,
        },
        description: {
          type: `Translations`,
          eng: chapterRow.descEng || ``,
          guj: chapterRow.descGuj || ``,
          gujLipi: chapterRow.descGujLipi || ``,
          gujPhonetic: chapterRow.descGujPhonetic || ``,
        },
        items: [],
      };

      chapters[chapter.id] = chapter;
      scripture.items.push({type: `Ref`, ref: `${chapter.type}/${chapter.id}`});

      const versesSql = `
      SELECT
        DocumentItemId as id,
        Slug as slug,
        EnglishTitle as titleEng,
        (SELECT Title FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGuj,
        (SELECT TitleLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujLipi,
        (SELECT TitlePhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujPhonetic,
        (SELECT Description FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 1) as descEng,
        (SELECT Description FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGuj,
        (SELECT DescriptionLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGujLipi,
        (SELECT DescriptionPhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as descGujPhonetic
      FROM documentitems di
      WHERE di.ParentDocumentItemId = ${chapter.id} AND di.DocumentItemTypeId = 1
      ORDER BY Number
      `;
      const [verseRows] = await db.execute(versesSql);
      for (const verseRow of verseRows) {
        const verse: Verse = {
          type: `Verse`,
          id: verseRow.id,
          slug: verseRow.slug,
          title: {
            type: `Translations`,
            eng: verseRow.titleEng || ``,
            guj: verseRow.titleGuj || ``,
            gujLipi: verseRow.titleGujLipi || ``,
            gujPhonetic: verseRow.titleGujPhonetic || ``,
          },
          description: {
            type: `Translations`,
            eng: verseRow.descEng || ``,
            guj: verseRow.descGuj || ``,
            gujLipi: verseRow.descGujLipi || ``,
            gujPhonetic: verseRow.descGujPhonetic || ``,
          },
          items: [],
        };

        verses[verse.id] = verse;
        chapter.items.push({type: `Ref`, ref: `${verse.type}/${verse.id}`});

        const stanzasSql = `
        SELECT
          DocumentItemId as id,
          Slug as slug,
          (SELECT Body FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 1) as bodyEng,
          (SELECT Body FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGuj,
          (SELECT BodyLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGujLipi,
          (SELECT BodyPhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGujPhonetic
        FROM documentitems di
        WHERE di.ParentDocumentItemId = ${verse.id} AND di.DocumentItemTypeId = 6
        ORDER BY Number
        `;
        const [stanzaRows] = await db.execute(stanzasSql);
        for (const stanzaRow of stanzaRows) {
          const stanza: Stanza = {
            type: `Stanza`,
            id: stanzaRow.id,
            slug: stanzaRow.slug,
            body: {
              type: `Translations`,
              eng: stanzaRow.bodyEng || ``,
              guj: stanzaRow.bodyGuj || ``,
              gujLipi: stanzaRow.bodyGujLipi || ``,
              gujPhonetic: stanzaRow.bodyGujPhonetic || ``,
            },
          };

          stanzas[stanza.id] = stanza;
          verse.items.push({type: `Ref`, ref: `${stanza.type}/${stanza.id}`});
        }
      }
    }
  }

  return {scriptures, chapters, verses, stanzas};
}

async function getReadingPlans(): Promise<{
  readingPlans: Obj<ReadingPlan>;
  readingPlanDays: Obj<ReadingPlanDay>;
  readingPlanItems: Obj<ReadingPlanItem>;
}> {
  const readingPlans: Obj<ReadingPlan> = {};
  const readingPlanDays: Obj<ReadingPlanDay> = {};
  const readingPlanItems: Obj<ReadingPlanItem> = {};

  const readingPlansSql = `
  SELECT
    DocumentId as id,
    Slug as slug,
    EnglishTitle as titleEng,
    (SELECT Title FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGuj,
    (SELECT TitleLipi FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGujLipi,
    (SELECT TitlePhonetic FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as titleGujPhonetic,
    (SELECT Description FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 1) as descEng,
    (SELECT Description FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as descGuj,
    (SELECT DescriptionLipi FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as descGujLipi,
    (SELECT DescriptionPhonetic FROM documenttranslations dt WHERE dt.DocumentId = d.DocumentId AND LanguageID = 2) as descGujPhonetic
  FROM documents d
  WHERE DocumentTypeId = 3
  `;
  const [readingPlanRows] = await db.execute(readingPlansSql);

  for (const readingPlanRow of readingPlanRows) {
    const readingPlan: ReadingPlan = {
      type: `ReadingPlan`,
      id: readingPlanRow.id,
      slug: readingPlanRow.slug,
      title: {
        type: `Translations`,
        eng: readingPlanRow.titleEng || ``,
        guj: readingPlanRow.titleGuj || ``,
        gujLipi: readingPlanRow.titleGujLipi || ``,
        gujPhonetic: readingPlanRow.titleGujPhonetic || ``,
      },
      description: {
        type: `Translations`,
        eng: readingPlanRow.descEng || ``,
        guj: readingPlanRow.descGuj || ``,
        gujLipi: readingPlanRow.descGujLipi || ``,
        gujPhonetic: readingPlanRow.descGujPhonetic || ``,
      },
      items: [],
    };

    readingPlans[readingPlan.id] = readingPlan;

    const readingPlanDaysSql = `
    SELECT
      DocumentItemId as id,
      Slug as slug,
      EnglishTitle as titleEng,
      (SELECT Title FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGuj,
      (SELECT TitleLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujLipi,
      (SELECT TitlePhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujPhonetic
    FROM documentitems di
    WHERE di.DocumentID = ${readingPlan.id} AND di.DocumentItemTypeId = 8
    ORDER BY Number
    `;
    const [readingPlanDayRows] = await db.execute(readingPlanDaysSql);
    for (const readingPlanDayRow of readingPlanDayRows) {
      const readingPlanDay: ReadingPlanDay = {
        type: `ReadingPlanDay`,
        id: readingPlanDayRow.id,
        slug: readingPlanDayRow.slug,
        title: {
          type: `Translations`,
          eng: readingPlanDayRow.titleEng || ``,
          guj: readingPlanDayRow.titleGuj || ``,
          gujLipi: readingPlanDayRow.titleGujLipi || ``,
          gujPhonetic: readingPlanDayRow.titleGujPhonetic || ``,
        },
        items: [],
      };

      readingPlanDays[readingPlanDay.id] = readingPlanDay;
      readingPlan.items.push({type: `Ref`, ref: `${readingPlanDay.type}/${readingPlanDay.id}`});

      const readingPlanItemsSql = `
      SELECT
        DocumentItemId as id,
        Slug as slug,
        EnglishTitle as titleEng,
        (SELECT Title FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGuj,
        (SELECT TitleLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujLipi,
        (SELECT TitlePhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as titleGujPhonetic,
        (SELECT Body FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 1) as bodyEng,
        (SELECT Body FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGuj,
        (SELECT BodyLipi FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGujLipi,
        (SELECT BodyPhonetic FROM documentitemtranslations dit WHERE dit.DocumentItemId = di.DocumentItemId AND dit.LanguageID = 2) as bodyGujPhonetic
      FROM documentitems di
      WHERE di.ParentDocumentItemId = ${readingPlanDay.id} AND di.DocumentItemTypeId = 9
      ORDER BY Number
      `;
      const [readingPlanItemRows] = await db.execute(readingPlanItemsSql);
      for (const readingPlanItemRow of readingPlanItemRows) {
        const readingPlanItem: ReadingPlanItem = {
          type: `ReadingPlanItem`,
          id: readingPlanItemRow.id,
          slug: readingPlanItemRow.slug,
          title: {
            type: `Translations`,
            eng: readingPlanItemRow.titleEng || ``,
            guj: readingPlanItemRow.titleGuj || ``,
            gujLipi: readingPlanItemRow.titleGujLipi || ``,
            gujPhonetic: readingPlanItemRow.titleGujPhonetic || ``,
          },
          body: {
            type: `Translations`,
            eng: readingPlanItemRow.bodyEng || ``,
            guj: readingPlanItemRow.bodyGuj || ``,
            gujLipi: readingPlanItemRow.bodyGujLipi || ``,
            gujPhonetic: readingPlanItemRow.bodyGujPhonetic || ``,
          },
          refStanzas: [],
        };

        readingPlanItems[readingPlanItem.id] = readingPlanItem;
        readingPlanDay.items.push({type: `Ref`, ref: `${readingPlanItem.type}/${readingPlanItem.id}`});
      }
    }
  }

  return {readingPlans, readingPlanDays, readingPlanItems};
}

async function syncToFirestore() {
  console.info(`dumping to firestore`);

  const fStore = new Firestore({keyFilename: `${__dirname}/blocka.sa-key.json`});
  const startTime = Date.now();
  const pathPrefix = `projects/sw-faith-vachnamrut`;

  for (const [key, objMap] of Object.entries(objects)) {
    const fCollection = fStore.collection(`${pathPrefix}/${key}`);
    const setPromises = [];
    for (const [objKey, obj] of Object.entries(objMap)) {
      setPromises.push(fCollection.doc(objKey).set(Array.isArray(obj) ? {items: obj} : obj));
    }
    console.log(`waiting for ${key} to sync ${setPromises.length} promises`);
    await Promise.all(setPromises);
  }

  console.info(`dump to firestore elapsedMs`, Date.now() - startTime);
  console.log(`done`);
}

async function main() {
  const startTime = Date.now();
  const {persons: Person} = await getPersons();
  const {phrases: Phrase} = await getPhrases();
  const {scriptures: Scripture, chapters: Chapter, verses: Verse, stanzas: Stanza} = await getScriptures();
  const {
    readingPlans: ReadingPlan,
    readingPlanDays: ReadingPlanDay,
    readingPlanItems: ReadingPlanItem,
  } = await getReadingPlans();

  Object.assign(objects, {Person, Scripture, Chapter, Verse, Stanza, Phrase});
  Object.assign(objects, {ReadingPlan, ReadingPlanDay, ReadingPlanItem});
  objects.$Root.scriptures = Object.values(objects.Scripture).map(({id, type: kind}) => ({
    type: `Ref`,
    ref: `${kind}/${id}`,
  }));
  objects.$Root.readingPlans = Object.values(objects.ReadingPlan).map(({id, type: kind}) => ({
    type: `Ref`,
    ref: `${kind}/${id}`,
  }));
  // fs.writeFileSync(`${__dirname}/objects.json`, JSON.stringify(objects), `utf8`);
  console.info(`get from mysql elapsedMs`, Date.now() - startTime);

  // delete objects.Stanza;

  await syncToFirestore();
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
