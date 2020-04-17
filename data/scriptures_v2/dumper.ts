import mysql from 'mysql2';
import {Scripture, Chapter, Verse, Stanza, Person, Obj, RootNav, Phrase} from './schema.d';

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
      kind: `Person`,
      id: personRow.id,
      slug: personRow.slug,
      name: {
        eng: personRow.nameEng,
        guj: personRow.nameGuj,
        gujLipi: personRow.nameGujLipi,
        gujPhonetic: personRow.nameGujPhonetic,
      },
      body: {
        guj: personRow.bodyGuj,
        gujLipi: personRow.bodyGujLipi,
        gujPhonetic: personRow.bodyGujPhonetic,
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
      kind: `Phrase`,
      id: phraseRow.id,
      phrase:
        phraseRow.langId === 2
          ? {
              guj: phraseRow.phrase,
              gujLipi: phraseRow.phraseGujLipi,
              gujPhonetic: phraseRow.phraseGujPhonetic,
            }
          : {
              eng: phraseRow.phrase,
            },
      explanation:
        phraseRow.langId === 2
          ? {
              guj: phraseRow.expl,
              gujLipi: phraseRow.explLipi,
              gujPhonetic: phraseRow.explPhonetic,
            }
          : {
              eng: phraseRow.expl,
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
      kind: `Scripture`,
      id: scriptureRow.id,
      slug: scriptureRow.slug,
      title: {
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
      scripture.items.push({id: chapter.id, kind: chapter.kind});

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
          kind: `Verse`,
          id: verseRow.id,
          slug: verseRow.slug,
          title: {
            eng: verseRow.titleEng || ``,
            guj: verseRow.titleGuj || ``,
            gujLipi: verseRow.titleGujLipi || ``,
            gujPhonetic: verseRow.titleGujPhonetic || ``,
          },
          description: {
            eng: verseRow.descEng || ``,
            guj: verseRow.descGuj || ``,
            gujLipi: verseRow.descGujLipi || ``,
            gujPhonetic: verseRow.descGujPhonetic || ``,
          },
          items: [],
        };

        verses[verse.id] = verse;
        chapter.items.push({id: verse.id, kind: verse.kind});

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
            kind: `Stanza`,
            id: stanzaRow.id,
            slug: stanzaRow.slug,
            body: {
              eng: stanzaRow.bodyEng || ``,
              guj: stanzaRow.bodyGuj || ``,
              gujLipi: stanzaRow.bodyGujLipi || ``,
              gujPhonetic: stanzaRow.bodyGujPhonetic || ``,
            },
          };

          stanzas[stanza.id] = stanza;
          verse.items.push({id: stanza.id, kind: stanza.kind});
        }
      }
    }
  }

  return {scriptures, chapters, verses, stanzas};
}

async function main() {
  const startTime = Date.now();
  const {persons: Person} = await getPersons();
  const {phrases: Phrase} = await getPhrases();
  const {scriptures: Scripture, chapters: Chapter, verses: Verse, stanzas: Stanza} = await getScriptures();
  Object.assign(objects, {Person, Scripture, Chapter, Verse, Stanza, Phrase});
  objects.$Root.persons = Object.values(objects.Person).map(({id, kind}) => ({id, kind}));
  objects.$Root.scriptures = Object.values(objects.Scripture).map(({id, kind}) => ({id, kind}));
  const elapsedMs = Date.now() - startTime;
  console.info(`elapsedMs`, elapsedMs);
  console.log(objects);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
