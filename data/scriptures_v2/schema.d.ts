export type Obj<T> = Record<string, T>;

export interface Ref<T> {
  value?: T;
  ref: string;
}

export interface Translations {
  eng?: string;
  guj?: string;
  gujLipi?: string;
  gujPhonetic?: string;
}

export interface Person {
  kind: 'Person';
  id: string;
  slug: string;
  name: Translations;
  body: Translations;
}

export interface Phrase {
  kind: 'Phrase';
  id: string;
  phrase: Translations;
  explanation: Translations;
}

export interface Scripture {
  kind: 'Scripture';
  id: string;
  slug: string;
  title: Translations;
  items: Array<Ref<Chapter>>;
}

export interface Chapter {
  kind: 'Chapter';
  id: string;
  slug: string;
  title: Translations;
  description?: Translations;
  items: Array<Ref<Chapter | Verse>>;
}

export interface Verse {
  kind: 'Verse';
  id: string;
  slug: string;
  title: Translations;
  description?: Translations;
  items: Array<Ref<Stanza>>;
}

export interface Stanza {
  kind: 'Stanza';
  id: string;
  slug: string;
  body: Translations;
}

export interface ReadingPlan {
  kind: 'ReadingPlan';
  id: string;
  slug: string;
  title: Translations;
  description: Translations;
  items: Array<Ref<ReadingPlanDay>>;
}

export interface ReadingPlanDay {
  kind: 'ReadingPlanDay';
  id: string;
  slug: string;
  title: Translations;
  items: Array<Ref<ReadingPlanItem>>;
}

export interface ReadingPlanItem {
  kind: 'ReadingPlanItem';
  id: string;
  slug: string;
  title: Translations;
  body: Translations;
  refStanzas: Array<Ref<Stanza>>;
  // image: Ref<ImageSrc>;
  // audio: Ref<AudioSrc>; // TODO: figure out connections
}

export interface RootNav {
  kind: 'RootNav';
  scriptures: Array<Ref<Scripture>>;
  readingPlans: Array<Ref<ReadingPlan>>;
}
