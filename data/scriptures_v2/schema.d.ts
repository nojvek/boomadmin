export type Obj<T> = Record<string, T>;

export interface Ref<T> {
  value?: T;
  kind: string;
  id: string;
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

export interface Scripture {
  kind: 'Scripture';
  id: string;
  slug: string;
  title: Translations;
  chapters: Array<Ref<Chapter>>;
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
  kind: 'Chapter';
  id: string;
  slug: string;
  body: Translations;
}

export interface RootNav {
  kind: 'RootNav';
  persons: Array<Ref<Person>>;
  scriptures: Array<Ref<Scripture>>;
}
