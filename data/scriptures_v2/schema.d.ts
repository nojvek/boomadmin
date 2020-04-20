export type Obj<T> = Record<string, T>;

export interface Ref<T> {
  type: 'Ref',
  value?: T;
  ref: string;
}

export interface Translations {
  type: 'Translations',
  eng?: string;
  guj?: string;
  gujLipi?: string;
  gujPhonetic?: string;
}

export interface Person {
  type: 'Person',
  id: string;
  slug: string;
  name: Translations;
  body: Translations;
}

export interface Phrase {
  type: 'Phrase';
  id: string;
  phrase: Translations;
  explanation: Translations;
}

export interface Scripture {
  type: 'Scripture';
  id: string;
  slug: string;
  title: Translations;
  items: Array<Ref<Chapter>>;
}

export interface Chapter {
  type: 'Chapter';
  id: string;
  slug: string;
  title: Translations;
  description?: Translations;
  items: Array<Ref<Chapter | Verse>>;
}

export interface Verse {
  type: 'Verse';
  id: string;
  slug: string;
  title: Translations;
  description?: Translations;
  items: Array<Ref<Stanza>>;
}

export interface Stanza {
  type: 'Stanza';
  id: string;
  slug: string;
  body: Translations;
}

export interface ReadingPlan {
  type: 'ReadingPlan';
  id: string;
  slug: string;
  title: Translations;
  description: Translations;
  items: Array<Ref<ReadingPlanDay>>;
}

export interface ReadingPlanDay {
  type: 'ReadingPlanDay';
  id: string;
  slug: string;
  title: Translations;
  items: Array<Ref<ReadingPlanItem>>;
}

export interface ReadingPlanItem {
  type: 'ReadingPlanItem';
  id: string;
  slug: string;
  title: Translations;
  body: Translations;
  refStanzas: Array<Ref<Stanza>>;
  // image: Ref<ImageSrc>;
  // audio: Ref<AudioSrc>; // TODO: figure out connections
}

export interface RootNav {
  type: 'RootNav';
  scriptures: Array<Ref<Scripture>>;
  readingPlans: Array<Ref<ReadingPlan>>;
}
