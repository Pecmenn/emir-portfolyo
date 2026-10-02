// Sitedeki tüm içerik src/content/ altındaki JSON dosyalarında durur ve /admin panelinden düzenlenir.
// Bu dosya yalnızca türleri tanımlar ve içeriği bileşenlere dağıtır.
// Her metin { tr, en } çiftidir; dil seçicisi ikisi arasında geçiş yapar.

import homeData from './content/home.json';
import siteData from './content/site.json';
import uiData from './content/ui.json';

export type Lang = 'tr' | 'en';
export type Text = { tr: string; en: string };

export type GalleryBlock =
  // İki görsel: büyük solda, küçük sağda (aşağı kaydırılmış)
  | { type: 'pair'; image1: string; image2: string }
  // Bir metin ve bir görsel yan yana; side görselin hangi tarafta olduğunu belirler
  | { type: 'text-image'; text: Text; image: string; side: 'left' | 'right' }
  // Tam genişlikte görsel, üzerinde isteğe bağlı büyük bir alıntı
  | { type: 'full'; image: string; quote?: Text };

export type CaseStudy = {
  challenge: Text;
  process: Text;
  result: Text;
  metrics: { value: string; label: Text }[];
};

export type Project = {
  order: number;
  slug: string;
  title: string;
  discipline: Text;
  year: string;
  cover: string;
  summary: Text;
  client: string;
  role: Text;
  services: Text;
  intro: Text;
  // UI/UX ve pazarlama projelerinde vaka çalışması bölümü gösterilir; marka ve motion projelerinde boş bırakılır
  caseStudy?: CaseStudy;
  gallery: GalleryBlock[];
  featured?: boolean;
};

type Site = {
  name: string;
  monogram: string;
  role: Text;
  email: string;
  location: string;
  timeZone: string;
  cv: string;
  formEndpoint: string;
  socials: { label: string; href: string }[];
};

export const site = siteData as Site;
export const ui = uiData;
export const manifesto = homeData.manifesto;
export const expertise = homeData.expertise;
export const contact = homeData.contact;

// Panelde boş bırakılan vaka çalışması alanları sayfada bölüm olarak görünmesin
function hasCaseStudy(cs: CaseStudy | undefined): cs is CaseStudy {
  return !!cs && !!(cs.challenge?.tr || cs.process?.tr || cs.result?.tr || cs.metrics?.length);
}

const projectFiles = import.meta.glob<Project>('./content/projects/*.json', { eager: true, import: 'default' });

export const projects: Project[] = Object.values(projectFiles)
  .map((p) => ({ ...p, caseStudy: hasCaseStudy(p.caseStudy) ? p.caseStudy : undefined, gallery: p.gallery ?? [] }))
  .sort((a, b) => a.order - b.order);
