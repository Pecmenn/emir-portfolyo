// Sitedeki tüm içerik src/content/ altındaki JSON dosyalarında durur ve /admin panelinden düzenlenir.
// Bu dosya yalnızca türleri tanımlar ve içeriği bileşenlere dağıtır.
// Her metin { tr, en } çiftidir; dil seçicisi ikisi arasında geçiş yapar.

import aboutData from './content/about.json';
import contactData from './content/contact.json';
import expertiseData from './content/expertise.json';
import siteData from './content/site.json';
import uiData from './content/ui.json';
import workData from './content/work.json';

export type Lang = 'tr' | 'en';
export type Text = { tr: string; en: string };

export type GalleryBlock =
  // Yan yana iki eşit görsel
  | { type: 'pair'; image1: string; image2: string }
  // Bir metin ve bir görsel yan yana; side görselin hangi tarafta olduğunu belirler
  | { type: 'text-image'; text: Text; image: string; side: 'left' | 'right' }
  // Sayfa genişliğinde görsel (kendi oranında), altında isteğe bağlı büyük bir cümle
  | { type: 'full'; image: string; quote?: Text }
  // Sessiz, döngüde, ekranda görününce oynayan video. full: tam genişlik; değilse ortada daha dar
  | { type: 'video'; video: string; full: boolean }
  // Bölüm başlığı ve açıklaması
  | { type: 'text'; title: Text; text: Text }
  // Numaralı bölüm açılışı (01, 02 ...); numara bloğun sırasından otomatik gelir
  | { type: 'chapter'; title: Text; text: Text }
  // Fare hareketine göre 3 boyutlu eğilen tek görsel (ör. saydam zeminli cihaz görseli)
  | { type: 'showcase'; image: string }
  // Fareyle ya da parmakla yatayda sürüklenen görsel şeridi
  | { type: 'strip'; images: string[] };

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
  // İsteğe bağlı kapak videosu (yüklenen dosya /videos/... ya da doğrudan .mp4/.webm bağlantısı).
  // Varsa kapak görselinin yerine oynar; görsel, video yüklenene kadar ve geçiş animasyonunda kullanılır.
  coverVideo?: string;
  summary: Text;
  client: string;
  role: Text;
  services: Text;
  intro: Text;
  // UI/UX ve pazarlama projelerinde vaka çalışması bölümü gösterilir; marka ve motion projelerinde boş bırakılır
  caseStudy?: CaseStudy;
  gallery: GalleryBlock[];
  featured?: boolean;
  // Künye ve galeri koyu zeminde gösterilir (koyu tonlu sunumlar için)
  dark?: boolean;
  // İsteğe bağlı zemin rengi (ör. #131814). Sunum görsellerinin zeminiyle aynı renk verilirse görseller
  // sayfayla kesintisiz bir yüzey oluşturur
  canvas?: string;
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
export const manifesto = aboutData;
export const work = workData as { slogans: { tr: string[]; en: string[] }[] };
export const expertise = expertiseData;
export const contact = contactData;

// Panelde boş bırakılan vaka çalışması alanları sayfada bölüm olarak görünmesin
function hasCaseStudy(cs: CaseStudy | undefined): cs is CaseStudy {
  return !!cs && !!(cs.challenge?.tr || cs.process?.tr || cs.result?.tr || cs.metrics?.length);
}

const projectFiles = import.meta.glob<Project>('./content/projects/*.json', { eager: true, import: 'default' });

export const projects: Project[] = Object.values(projectFiles)
  .map((p) => ({ ...p, caseStudy: hasCaseStudy(p.caseStudy) ? p.caseStudy : undefined, gallery: p.gallery ?? [] }))
  .sort((a, b) => a.order - b.order);
