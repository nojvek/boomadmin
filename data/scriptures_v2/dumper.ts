import mysql from 'mysql2';
import {Scripture, Chapter, Verse, Stanza, Person, Obj, RootNav} from './schema.d';

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
  root: {} as RootNav,
  scriptures: {} as Obj<Scripture>,
  chapters: {} as Obj<Chapter>,
  stanzas: {} as Obj<Stanza>,
  persons: {} as Obj<Person>,
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

  for (const row of personRows) {
    const person: Person = {
      kind: `Person`,
      id: row.id,
      slug: row.slug,
      name: {
        eng: row.nameEng,
        guj: row.nameGuj,
        gujLipi: row.nameGujLipi,
        gujPhonetic: row.nameGujPhonetic,
      },
      body: {
        guj: row.bodyGuj,
        gujLipi: row.bodyGujLipi,
        gujPhonetic: row.bodyGujPhonetic,
      },
    };
    persons[person.id] = person;
  }

  return {persons};
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
      kind: `Scripture`,
      id: scriptureRow.id,
      slug: scriptureRow.slug,
      title: {
        eng: scriptureRow.titleEng || ``,
        guj: scriptureRow.titleGuj || ``,
        gujLipi: scriptureRow.titleGujLipi || ``,
        gujPhonetic: scriptureRow.titleGujPhonetic || ``,
      },
      chapters: [],
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
        kind: `Chapter`,
        id: chapterRow.id,
        slug: chapterRow.slug,
        title: {
          eng: chapterRow.titleEng || ``,
          guj: chapterRow.titleGuj || ``,
          gujLipi: chapterRow.titleGujLipi || ``,
          gujPhonetic: chapterRow.titleGujPhonetic || ``,
        },
        description: {
          eng: chapterRow.descEng || ``,
          guj: chapterRow.descGuj || ``,
          gujLipi: chapterRow.descGujLipi || ``,
          gujPhonetic: chapterRow.descGujPhonetic || ``,
        },
        items: [],
      };

      chapters[chapter.id] = chapter;
      scripture.chapters.push({id: chapter.id, kind: chapter.kind});
    }
  }

  return {scriptures, chapters, verses, stanzas};
}

async function main() {
  const persons = await getPersons();
  const scriptures = await getScriptures();
  Object.assign(objects, persons);
  Object.assign(objects, scriptures);
  objects.root.persons = Object.keys(objects.persons).map((key) => ({id: key, kind: `Person`}));
  objects.root.scriptures = Object.keys(objects.scriptures).map((key) => ({
    id: key,
    kind: `Scripture`,
  }));
  console.log(objects);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
