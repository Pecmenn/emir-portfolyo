// Sitedeki tüm içerik src/content/ altındaki JSON dosyalarında durur ve /admin panelinden düzenlenir.
// Bu dosya yalnızca türleri tanımlar ve içeriği bileşenlere dağıtır.
// Her metin { tr, en } çiftidir; dil seçicisi ikisi arasında geçiş yapar.

import aboutData from './content/about.json';
import contactData from './content/contact.json';
import expertiseData from './content/expertise.json';
import playData from './content/play.json';
import siteData from './content/site.json';
import uiData from './content/ui.json';
import workData from './content/work.json';

export type Lang = 'tr' | 'en';
export type Text = { tr: string; en: string };

// alt: ekran okuyucu için görsel açıklaması (isteğe bağlı); boşsa görsel dekoratif sayılır
export type GalleryBlock =
  // Yan yana iki eşit görsel
  | { type: 'pair'; image1: string; image2: string; alt?: Text }
  // Bir metin ve bir görsel yan yana; side görselin hangi tarafta olduğunu belirler
  | { type: 'text-image'; text: Text; image: string; side: 'left' | 'right'; alt?: Text }
  // Sayfa genişliğinde görsel (kendi oranında), altında isteğe bağlı büyük bir cümle
  | { type: 'full'; image: string; quote?: Text; alt?: Text }
  // Sessiz, döngüde, ekranda görününce oynayan video. full: tam genişlik; değilse ortada daha dar
  | { type: 'video'; video: string; full: boolean }
  // Bölüm başlığı ve açıklaması
  | { type: 'text'; title: Text; text: Text }
  // Numaralı bölüm açılışı (01, 02 ...); numara bloğun sırasından otomatik gelir
  | { type: 'chapter'; title: Text; text: Text }
  // Fare hareketine göre 3 boyutlu eğilen tek görsel (ör. saydam zeminli cihaz görseli)
  | { type: 'showcase'; image: string; alt?: Text }
  // Fareyle ya da parmakla yatayda sürüklenen görsel şeridi
  | { type: 'strip'; images: string[]; alt?: Text }
  // Bölüm ekranda sabit kalır; kaydırdıkça saydam zeminli parçalar (ör. kaykaylar, karakterler) tek tek uçarak
  // gelip yelpaze (fan) ya da ızgara (grid) biçiminde dizilir
  | { type: 'flock'; title: Text; text: Text; images: string[]; layout: 'fan' | 'grid'; alt?: Text }
  // Bölüm ekranda sabit kalır; kaydırdıkça taslak görselin üstünden son hâli açılır. İki görsel aynı boyutta olmalı
  | { type: 'compare'; before: string; after: string; beforeLabel: Text; afterLabel: Text; alt?: Text }
  // Bölüm ekranda sabit kalır; sayfa aşağı kaydıkça görseller yatayda akar (ör. uygulama ekranları)
  | { type: 'pan'; title: Text; text: Text; images: string[]; alt?: Text };

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
  // Dar ekranda (telefon) kapağın yatayda hangi bölümü görünür: 0 sol kenar, 50 orta (varsayılan), 100 sağ kenar
  coverFocus?: number;
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
  // Pasif proje sitede hiçbir yerde gösterilmez (giriş, işler listesi, sonraki proje, proje sayfası); panelde kalır
  hidden?: boolean;
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
// CV bağlantısı yalnızca içerikte bir yol tanımlıysa gösterilir (boşsa düğmeler gizlenir)
export const cvUrl = (site.cv ?? '').trim();
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

// Sitede yalnızca aktif projeler kullanılır
export const projects: Project[] = Object.values(projectFiles)
  .filter((p) => !p.hidden)
  .map((p) => ({ ...p, caseStudy: hasCaseStudy(p.caseStudy) ? p.caseStudy : undefined, gallery: p.gallery ?? [] }))
  .sort((a, b) => a.order - b.order);

// Pasif projeler dahil tüm başlıklar: oyun alanındaki parçaların etiketinde kullanılır
export const projectTitles: Record<string, string> = Object.fromEntries(Object.values(projectFiles).map((p) => [p.slug, p.title]));

// Yeni ana sayfa prototipi (/yeni): oyun alanı, proje indeksi ve hizmetler
// h: parçanın geniş ekrandaki yüksekliği (px); dar ekranda oranla küçülür
export type Sticker = { src: string; slug: string; h: number };
export type Play = {
  hello: Text;
  statement: { tr: string[]; en: string[] };
  text: Text;
  ctaWork: Text;
  ctaContact: Text;
  hint: Text;
  hintTouch: Text;
  open: Text;
  workTitle: Text;
  all: Text;
  servicesTitle: Text;
  services: { title: Text; text: Text; example: string }[];
  exampleLabel: Text;
  stickers: Sticker[];
};
export const play = playData as Play;
